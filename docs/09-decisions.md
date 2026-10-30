# 09 — Decisions

The calls that were made, and what was rejected. Recorded because the reasoning is worth more
than the conclusion, and because "why is it like this?" is the question that arrives in month
four.

---

## D1 — One Next.js app, not a separate backend

**Decision:** Next.js App Router does frontend, server actions and route handlers. One
deployable.

**Rejected:** Next.js + NestJS/Express API on two Railway services.

**Why:** The brief requires one-project deployment. Beyond that, a separate API means CORS
configuration, a second auth boundary, an API client, and two things to deploy — for one web
client and one academy. The permission check and the database query live in the same file here,
which materially reduces the chance of a forgotten guard.

**Cost accepted:** one process, so no long-running background work. Handled by the sweep
pattern in `06-server-surface.md`; a cron service can be added to the same Railway project later
without changing the architecture.

---

## D2 — "Multi-tenant" means course-scoped ownership, not a database per instructor

**Decision:** One application, one database. Instructors are isolated by a course-ownership
boundary enforced in code.

**Rejected:** Database-per-instructor, or schema-per-instructor.

**Why:** Instructors are staff of one academy, not separate customers. Per-instructor databases
multiply backups, migrations and deploys by the number of instructors while removing the
owner's ability to report across courses — which is the reason the admin exists in this system.
The commercial tenant boundary is the academy, and it is respected.

**Cost accepted:** a bug in the guard could expose another instructor's course. Mitigated by
centralising every check in `lib/auth/guard.ts`, making the guard the first line of every action,
and writing automated tests that assert cross-course access returns 404.

**Reversible?** Yes. `academyId` already exists on `Course` and `User`; a real per-academy SaaS
would add the scope to the guard helpers and the where-clauses. Documented in `03-data-model.md`.

---

## D3 — PostgreSQL + Prisma over a document store

**Decision:** Postgres 16, Prisma 6.

**Rejected:** MongoDB, Firebase, Supabase-as-ORM.

**Why:** The domain is deeply relational — enrolments, attempts, answers, grades. Grades must be
explainable through foreign keys, and a weighted course total must be computed in a transaction
that sees a consistent snapshot. A document store makes the grade model a nest of arrays that
cannot be joined or constrained. Prisma also generates a fully typed client, which is most of
the benefit of TypeScript end to end.

**Railway fit:** Postgres is a one-click plugin in the same project, on the private network.
That is the simplest possible thing to operate.

---

## D4 — Custom session auth instead of NextAuth

**Decision:** Opaque session token in an HttpOnly cookie, `session` table server-side, Argon2id
hashing.

**Rejected:** NextAuth/Auth.js with a credentials provider.

**Why:** The academy provisions accounts; there is no self-registration, no OAuth in MVP, no
email-link magic. NextAuth's value is in the provider zoo, and here it would be a dependency
whose internals we would need to understand anyway to enforce server-side revocation and forced
password change. A `session` table also makes "revoke all sessions when an admin resets a
password" trivial, which matters for an admin-controlled system.

**Escape hatch:** `better-auth` fits the same cookie/session contract if the custom code becomes
a maintenance burden. Nothing outside `lib/auth/` would change.

**Non-negotiable inside this decision:** Argon2id, not bcrypt at a low cost factor, and never a
hand-rolled hash.

---

## D5 — Direct-to-storage uploads with presigned URLs

**Decision:** Browser gets a presigned PUT, uploads directly to the bucket, then tells the server
it is done.

**Rejected:** Streaming the file through a Next.js route handler.

**Why:** Proxying 25 MB PDFs through the app process burns container memory, counts against
request body limits, and ties up a Node slot for the duration. Direct upload keeps the app thin —
which matters on the cheapest Railway plan.

**Cost accepted:** two endpoints instead of one, and the server must verify the object
independently (`HeadObject`) rather than trusting what the client claims about size and type.

---

## D6 — Quizzes and exams share one engine

**Decision:** One `assessment` table with a `kind` discriminator; one question table; one
attempt/answer model. Two UI experiences, one data path.

**Rejected:** Separate `quiz` and `exam` tables and separate builders.

**Why:** A quiz is an exam with fewer settings: practice mode, more attempts, no window. Building
them twice means two grading implementations, two sets of bugs, and two places to fix partial
credit. The differences that are real — window, duration, attempt limits, whether the result
counts — are a handful of nullable columns, not a different system.

**Cost accepted:** a table with columns that only apply to one kind. `timeLimitMins` is meaningless
for a practice quiz. That is a cheap price for one grading engine.

---

## D7 — Markdown for content, not a WYSIWYG editor

**Decision:** Lesson content and instructions are Markdown, rendered server-side and sanitised.

**Rejected:** TipTap/ProseMirror rich text with HTML storage.

**Why:** It is headings, lists, links, code and emphasis. A WYSIWYG means sanitising stored HTML
(a genuine XSS surface), a heavier client bundle, and a serialisation format to migrate. Markdown
is diffable, greppable and safe by default once sanitised.

**Cost accepted:** instructors must learn a little Markdown. Mitigated by a toolbar with bold,
list, link and heading buttons, plus a live preview — so nobody has to type syntax if they would
rather not.

---

## D8 — Score snapshots alongside computed grades

**Decision:** Store the authoritative score per graded item in `grade`, and cache the course total
in `grade_snapshot`.

**Rejected:** Compute everything on read.

**Why:** A gradebook page for 40 students × 12 items is 480 computed rows per view if computed
live, with weights applied per student. Caching the total means one indexed read. More
importantly, a stored score survives a later rubric change — history stays explainable, which is
the entire reason a grade override writes an audit row.

**Cost accepted:** the snapshot must be recomputed whenever a component grade changes. One
function, called from every grade-writing path, covered by the unit tests.

---

## D9 — Missing grades are excluded from the total, not counted as zero

**Decision:** An ungraded or unsubmitted item is omitted from the weighted total; weights are
renormalised over the items that exist.

**Rejected:** Treating missing work as zero.

**Why:** Counting missing work as zero means every student's displayed grade is artificially low
all term, instructors get complaints, and the number changes meaning depending on when you look
at it. Excluding it gives "current standing on graded work", which is what an interim grade
should mean. A separate "overall including missing" figure can be shown if the academy wants it.

**This is a policy call that belongs to the admin** — it will be exposed as a setting. Recorded
here because it is contentious and someone will ask.

---

## D10 — Due dates stored as UTC, displayed in academy timezone

**Decision:** All timestamps are `timestamptz`/UTC. `Academy.timezone` drives display and
deadline computation.

**Why:** The classic bug is a 23:59 deadline that a student in another timezone experiences as
21:59. Storing UTC and rendering in the academy's timezone is the only defensible model. The exam
deadline check runs on the server against UTC, so a client clock never affects entitlement.

---

## D11 — Mailto-style "notifications" as rows, not websockets

**Decision:** `notification` rows, a bell with polling, and email for events that matter.

**Rejected:** Real-time sockets.

**Why:** At academy concurrency, a 30-second poll is indistinguishable from real-time and costs
nothing to operate. Websockets on a single Railway container introduce connection-count limits
and reconnection handling for no user-visible benefit.

---

## D12 — Soft-delete over cascade-delete for historical entities

**Decision:** Users deactivate; courses archive; enrolments withdraw. Hard delete is reserved for
content with no history (a lesson, a resource).

**Why:** A deleted student orphans grades; a deactivated one preserves them. Five years later the
academy will be asked "what grade did this person get", and the answer must exist.

---

## D13 — Tailwind + shadcn/ui over a component library

**Decision:** Tailwind for styling, shadcn/ui components vendored into the repo.

**Rejected:** MUI, Chakra, Ant Design.

**Why:** No runtime style engine, no version-coupled theming API, and the components live in the
repo where they can be changed without fighting the library. It also makes the light, table-heavy
admin aesthetic straightforward.

**Cost accepted:** more initial markup per component, and the team must actually edit the vendored
components rather than expecting a prop to exist.

---

## Open questions for the client

These are the things the plan assumes and that should be confirmed before Phase 2:

1. **Language.** English-first UI with RTL plumbing ready, or Arabic-first from day one? The plan
   builds the plumbing either way; this decides the default copy.
2. **Grade visibility.** Should students see individual scores as they are graded, or only at the
   end of term? MVP assumes they see each item once released, which is more transparent.
3. **Late policy.** Is the default "allow and flag", or "block at deadline"? MVP defaults to
   allow-and-flag, and the admin can restrict what instructors may choose.
4. **Who enrols students.** Admin only, or instructors for their own courses? Plan assumes both.
5. **Number of instructors and students expected in year one.** This decides whether the CSV
   import and bulk operations are generous enough, and whether pagination matters.
6. **Existing data to migrate.** If there are spreadsheets of current students and grades, an
   import path is cheaper now than after launch.