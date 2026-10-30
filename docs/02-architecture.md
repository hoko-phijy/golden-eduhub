# 02 — Architecture

## Guiding constraint

> The backend and the frontend must deploy as **one project** on Railway.

That single sentence eliminates a whole category of architectures. No separate Express
server, no second service for the API, no static frontend host pointed at a separate API
domain. One build, one process, one URL.

## The stack

| Layer | Choice | Why this one |
|-------|--------|--------------|
| Framework | **Next.js 15, App Router** | Frontend and backend in one codebase and one deployable. Server Components let pages query the database directly; `"use server"` actions are the mutation layer; route handlers cover file download and webhooks. |
| Language | **TypeScript, strict** | Required by the brief. `strict: true`, no `any` in application code. |
| Runtime | **Node.js 22 LTS** | Native `fetch`, stable ESM, first-class on Railway. |
| Database | **PostgreSQL 16** | Railway offers it as a one-click service on the same project. Relational integrity matters here: grades, enrolments and submissions must not drift. |
| ORM | **Prisma 6** | Typed client generated from one schema file, real migrations, and it works out of the box on Railway. |
| Auth | **Custom session auth** (`better-auth` if it fits, otherwise ~200 lines of our own) | See the auth section below. |
| Validation | **Zod** | One schema per input, used by both the client form and the server action. |
| UI | **Tailwind CSS + shadcn/ui** | Components are copied into the repo, so there is no runtime dependency to keep in sync and no vendor lock-in on styling. |
| Forms | **react-hook-form + Zod resolver** | Client-side ergonomics, server-side authority. |
| Tables | **TanStack Table** | Gradebooks, submission inboxes and admin lists are all the same shape of problem. |
| Rich text | **Markdown** (`react-markdown` + `remark-gfm`, sanitised) | Avoids a heavy WYSIWYG. Lesson content and instructions only need headings, lists, code, links. |
| Files | **S3-compatible object storage** (Cloudflare R2 free tier or Railway volume-backed bucket) | Private bucket, signed URLs. Explained below. |
| Email | **Resend** (or any SMTP via Nodemailer) | Password resets and notifications. One provider interface, swappable. |
| Testing | **Vitest** (unit) + **Playwright** (end-to-end smoke) | Enough to protect the grading logic and the permission boundaries. |

Deliberately **not** used, and why:

- **tRPC** — server actions already give typesafe RPC inside Next.js; adding tRPC is a second
  routing layer for no gain here.
- **A separate Express/Nest API** — breaks the single-deploy requirement and doubles the
  surface to secure.
- **GraphQL** — nothing in this app needs query flexibility; it costs a resolver layer.
- **Firebase / Supabase as the primary database** — the relational grade model wants real
  foreign keys and transactions. Postgres on Railway is also the simplest thing to deploy
  next to the app.
- **A CSS-in-JS runtime** — Tailwind compiles away.

## Deployment topology on Railway

```
Railway project: golden-eduhub
├── service: web          ← the Next.js app (Dockerfile or Nixpacks)
│     build:  npm ci && npx prisma generate && next build
│     start:  npx prisma migrate deploy && next start
├── service: postgres     ← Railway Postgres plugin (same project, private network)
└── bucket:  R2 (external) or a Railway volume mounted at /data
```

Two services in **one project**. The web service reaches Postgres over Railway's private
network using `DATABASE_URL`, which Railway injects automatically. Migrations run as part of
the release command, so a deploy that changes the schema cannot go live against an old one.

Details, env vars and the first-deploy checklist: `08-deployment-railway.md`.

## Why one Next.js app is the right call here

The alternative people reach for is "Next.js frontend + NestJS API". It is a good
architecture for a large team with a mobile client. This is a single academy with a
handful of instructors and one web client. One Next.js app means:

- One `package.json`, one lockfile, one CI pipeline, one deploy.
- No CORS, no API base URL config, no token passing between two processes.
- The permission check and the query live in the same file, which makes it much harder to
  forget the check.
- Bundled: server components ship nearly no client JS for read-heavy pages (gradebooks,
  course lists), which matters on cheap hosting.

The cost is that the app is one process, so long-running background work cannot live inside
it. That is acceptable because MVP has no such work — see "Background jobs" below.

## Rendering strategy

| Page type | Strategy | Reason |
|-----------|----------|--------|
| Dashboards, gradebooks, course pages | Server Components (dynamic, per-request) | Always fresh, no client data fetching, minimal JS |
| Lesson content, course landing | Server Components, `revalidate` on edit | Read-heavy |
| Exam attempt page | Server Component shell + client timer component | The timer must be client-side; the deadline check is server-side |
| Forms (create/edit everything) | Client components with `useActionState` | Progressive enhancement, validation feedback |
| File downloads | Route handler `GET /api/files/[id]` → 302 to signed URL | Never stream private files through the app |

No global client state library. Server Components plus form actions cover what Redux/Zustand
would otherwise do, and the browser timer on the exam page is local `useState`.

## Auth design

The brief says the academy provisions accounts — there is no open registration. That makes a
custom session auth the clean fit, and it keeps the dependency surface small.

- Passwords hashed with **Argon2id** (`@node-rs/argon2`, native and fast) — never bcrypt-with-
  a-low-cost, never hand-rolled hashing.
- Session = opaque random token in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie. The
  `session` table holds a SHA-256 hash of the token, `userId`, `expiresAt`, `createdAt`,
  `userAgent`, `ip`. Server-side sessions mean revocation actually works.
- Every request resolves the session once in a `requireUser()` helper that every page and
  action calls. There is no middleware-only auth: middleware in Next.js cannot safely be the
  authority for database-backed permissions, so it is used only for cheap redirects.
- First-login forced password change: `mustChangePassword` flag on the user.

If `better-auth` is adopted instead, it fits the same cookie/session contract and the rest of
this document is unaffected. The decision is recorded as a "try it, fall back" in `09-decisions.md`.

## The permission layer

The single most important piece of engineering in this application. `04-roles-and-permissions.md`
defines the rules; here is how they are enforced mechanically.

```ts
// lib/auth/guard.ts  (shape, not final code)
export async function requireCourseAccess(
  courseId: string,
  level: "view" | "teach" | "admin",
): Promise<{ user: User; course: Course }>
```

- `view`  — admin, the owning instructor, enrolled students.
- `teach` — admin, the owning instructor. (Grading, publishing, editing content.)
- `admin` — admin only. (Deleting a course, changing weights, overriding any grade.)

Every server action starts by calling one of these and using the returned, already-authorised
entity. **No action ever accepts an ID and trusts it.** Reads that pass through Prisma from a
Server Component still go through an access helper, because a Server Component can be
triggered by anyone who guesses a URL.

Rule: if an action does not begin with a guard call, it does not merge.

## File storage

Requirements: PDFs, images, office documents, student submissions, course cover images.
Sizes are "lightweight" — capped at 25 MB per file by default and configurable.

Design:

1. Uploads go **directly to object storage** from the browser using a **presigned PUT URL**
   issued by `POST /api/uploads/sign`. The file never passes through the Next.js process,
   which keeps the container small and avoids Railway memory limits on big PDFs.
2. The client then calls `POST /api/uploads/complete` with the object key; the server
   verifies the object exists, checks its size and declared type, and writes the `file` row.
3. Downloads are a `GET /api/files/[id]` route handler that authorises the request, then
   redirects to a **short-lived presigned GET URL** (60 seconds, `Content-Disposition:
   attachment`).
4. The bucket is private. No public bucket policies, ever.

Provider: **Cloudflare R2** if a card is available (10 GB free, no egress fees), otherwise a
Railway volume is not a valid S3 substitute on its own — in that case use a small
self-hosted **MinIO** service in the Railway project pointing at a volume, or fall back to
Railway's S3-compatible object storage if the plan includes it. The storage adapter is behind
one interface (`lib/storage/index.ts`) with `s3` and `local` implementations so the choice can
change without touching call sites. The `local` implementation (writes to a mounted volume,
serves via route handler) is the zero-dependency fallback for development.

## Grading engine

Objective grading is pure, deterministic, and unit-tested:

```ts
gradeAttempt(attempt: AttemptWithAnswers, assessment: Assessment): GradeResult
```

- Single choice / true-false: exact match, points or zero.
- Multiple choice: proportional partial credit — `points * (correct_selected - incorrect_selected) / correct_total`,
  floored at zero. Configurable per assessment, default proportional.
- Short text: normalised comparison (trim, case-insensitive, optional accent folding) against
  an accepted-answers list. Never fuzzy-matching anything that awards points automatically.
- Essay: returns `requiresManualGrading: true`; the score is filled later.

Course totals are computed from weighted categories, with weights validated to sum to 100.

## Background jobs

MVP has none that require a durable queue. The two time-based concerns are handled without
a scheduler:

- **Exam auto-submit**: the attempt row stores `expiresAt`. Any request touching the attempt
  after that time finalises it. A student who closes the tab leaves an attempt that gets
  finalised the next time it is read — including by the instructor's grading list, which
  explicitly sweeps stale attempts.
- **Email sending**: notification emails are sent inline after the transaction commits,
  through a small fire-and-forget helper with a retry and a `notificationEmailStatus`
  column so failures are visible. At academy volume this is fine.

If a real scheduler is needed later (digest emails, nightly snapshots), Railway supports a
cron service in the same project hitting a protected route with a shared secret. The design
does not preclude it.

## Observability

- `GET /api/health` — returns `{ status, version, db: "up" }`, used by Railway's health check.
- Structured JSON logs to stdout (Railway collects them).
- Error tracking through one `reportError()` helper; Sentry if a DSN is configured, console
  otherwise.
- A `/admin/audit` page is the human-facing counterpart: consequential actions are queryable.

## Accessibility and RTL, decided now, not later

The academy is likely to serve Arabic-speaking users. Even if MVP ships English, these
rules are cheap now and expensive to retrofit:

- No hardcoded user-facing strings in components — all through a `messages` catalogue.
- Tailwind logical properties (`ps-*`, `pe-*`, `ms-*`, `me-*`) instead of `pl/pr/ml/mr`.
- `<html dir>` driven by locale, not hardcoded.
- Semantic landmarks, labelled form controls, visible focus rings, keyboard-reachable
  everything. Students include people who need this.