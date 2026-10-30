# 08 — Railway Deployment

The requirement: backend and frontend deploy as **one project**. Here is exactly how.

---

## 1. Why this shape works

Next.js server actions and route handlers run in the same Node process as the pages. There is
no second service to deploy, no API URL to configure, no CORS to open. The Railway project is:

```
Railway project: golden-eduhub
├── web       (Node service, from this repo)
├── postgres  (Railway Postgres plugin, private network)
└── (optional) minio   — only if R2 is unavailable
```

---

## 2. Build & start commands

Set in the Railway service settings:

**Build**
```
npm ci
npx prisma generate
npm run build
```

**Start**
```
npx prisma migrate deploy
npm run start
```

`prisma migrate deploy` runs before the server boots. This is the single most important line in
the deployment: it means a schema change cannot go live against a database that has not been
migrated. Never use `migrate dev` or `db push` in production.

If a migration fails, the container exits non-zero, Railway keeps the previous deployment
serving, and you get the failure in the deploy logs. That is the behaviour you want.

**Railway specifics:** register the start command as the service's *Custom Start Command*, or
put both lines in a `start:prod` npm script so the platform runs one command.

---

## 3. Environment variables

| Variable | Example / notes |
|----------|-----------------|
| `DATABASE_URL` | Injected by the Postgres plugin. Reference it as `${{Postgres.DATABASE_URL}}` in the web service |
| `DIRECT_URL` | Same as `DATABASE_URL` on Railway (needed if connection pooling is ever added) |
| `AUTH_SECRET` | 32+ random bytes, base64. Signs session cookies. Generate per environment |
| `APP_URL` | Public Railway domain, e.g. `https://golden-eduhub-production.up.railway.app`. Used in emails and absolute links |
| `NODE_ENV` | `production` |
| `STORAGE_DRIVER` | `s3` or `local` |
| `S3_ENDPOINT` | R2: `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_REGION` | R2: `auto` |
| `S3_BUCKET` | Private bucket name |
| `S3_ACCESS_KEY_ID` | |
| `S3_SECRET_ACCESS_KEY` | |
| `S3_FORCE_PATH_STYLE` | `true` for R2 and MinIO |
| `EMAIL_DRIVER` | `resend` or `smtp` or `console` (dev) |
| `EMAIL_FROM` | e.g. `Golden Academy <no-reply@yourdomain>` |
| `RESEND_API_KEY` | if using Resend |
| `SENTRY_DSN` | optional |
| `CRON_SECRET` | shared secret for `/api/cron/*` |

`.env.example` in the repo lists all of these with blank values and a comment each. `.env` is
gitignored.

**Never** commit a real key. Railway environment variables are the only place production secrets
live.

---

## 4. First deployment, step by step

1. **Push the repo.** Railway builds from `main`.
2. **Create the project.** Railway dashboard → New Project → Deploy from GitHub repo →
   `hoko-phijy/golden-eduhub`.
3. **Add Postgres.** In the same project: New → Database → PostgreSQL. Railway provisions it and
   exposes `DATABASE_URL` on the private network.
4. **Link the variable.** Web service → Variables → add `DATABASE_URL` as
   `${{Postgres.DATABASE_URL}}`. This keeps them in sync automatically.
5. **Add the rest of the env vars** from the table above.
6. **Set build and start commands** (§2).
7. **Set the health check path** to `/api/health`.
8. **Deploy.** Watch the build logs. The first deploy will fail on
   `prisma migrate deploy` if there are no committed migrations yet — that is expected until
   Phase 1 creates the first one; commit the initial migration with the schema.
9. **Generate the domain.** Settings → Networking → Generate Domain. Put it in `APP_URL`.
10. **Seed once.** Run `npx prisma db seed` from the Railway shell (or a one-off job) to create
    the admin account. Change that password immediately on first sign-in.

---

## 5. Continuous deployment

Railway deploys on push to `main` by default. Recommended practice:

- Work on branches; open PRs. GitHub Actions runs typecheck, lint and unit tests.
- Merge to `main` only when green. Railway then deploys automatically.
- Enable **"Wait for CI"** if available on the plan, so a red build never deploys.
- Keep production and staging as separate Railway environments if the plan allows; a staging
  environment catching a bad migration is worth the setup.

---

## 6. Migrations

Locally, while building:

```
npx prisma migrate dev --name add_assignments
```

This writes a SQL migration file under `prisma/migrations/`. **Commit it.** Production applies it
with `migrate deploy`.

Rules that prevent the classic disasters:

- Every migration must be reversible in principle; if it drops a column, take a backup first.
- Additive migrations (new nullable column, new table) are safe. Destructive ones (rename, drop)
  need a two-deploy dance: deploy code that handles both shapes, then migrate, then clean up.
- Never edit a migration file that has been applied anywhere.
- Review the generated SQL before committing. Prisma sometimes drops and re-adds columns to
  change a default, which loses data.

---

## 7. Storage on Railway

Railway containers have an **ephemeral filesystem**. Anything written to disk is gone on the next
deploy. Therefore:

- **Preferred:** Cloudflare R2 (10 GB free, no egress fees) or any S3-compatible bucket. The app
  only needs the endpoint, key, secret and bucket name.
- **Fallback with a Railway volume:** attach a volume mounted at `/data` and set
  `STORAGE_DRIVER=local`. Files survive deploys because the volume persists. This works, but it
  ties the data to one service instance and makes migration harder later.
- **Never** write uploads to the container filesystem without a volume. They will vanish, and the
  first you hear about it is a student complaining that a PDF 404s.

Whichever is chosen, the storage adapter interface means switching later is a config change plus
a one-off copy of objects.

---

## 8. Email

Password resets are the one flow that is broken without email, so this is not optional in MVP.

- **Resend** is the least friction: one API key, a verified sending domain, generous free tier.
- **SMTP via Nodemailer** if the academy already has a mail host.
- `EMAIL_DRIVER=console` in development prints the email to the terminal so the reset link is
  still testable without a provider.

Domain setup: verify the sending domain (SPF + DKIM records) or deliverability will be poor and
reset emails will land in spam — which reads to users as "the app is broken".

---

## 9. Backups and restore

Railway's Postgres backups depend on plan level. Whatever is available, the rule is:

- Enable automated backups.
- **Perform a restore into a scratch database once, early**, and write down the steps. An
  untested backup is a hope, not a backup.
- Additionally, a simple weekly logical dump costs almost nothing:
  `pg_dump "$DATABASE_URL" > backup-$(date).sql` from a scheduled job or your own machine.

Files live in the bucket, which has its own versioning/lifecycle options. Enable object
versioning if the provider offers it.

---

## 10. Cost expectation on Railway

At academy scale (a few hundred students, a few dozen instructors, resource files in the
low gigabytes):

- **Web service:** the smallest plan that keeps memory comfortable. Next.js with a couple of
  concurrent users is light; the ceiling is `next build` memory, not runtime.
- **Postgres:** the smallest instance is sufficient. Data volume is small — text, not media.
- **Egress:** the reason to prefer R2 is that file downloads do not count against egress.

Set a billing alert on the project. The failure mode nobody wants is a surprise invoice from a
runaway log or a crawler hitting dynamic pages.

---

## 11. Health check and observability wiring

`/api/health` returns:

```json
{ "status": "ok", "version": "0.1.0", "db": "up", "time": "2026-10-30T12:00:00Z" }
```

It must be cheap: one `SELECT 1`. It must not require auth. Railway's health check uses it to
decide whether a deployment is live, which is what makes rolling deploys safe.

---

## 12. Load-bearing deployment rules, summarised

1. One service. Frontend and backend together.
2. `prisma migrate deploy` in the start command, always.
3. No uploads to the ephemeral filesystem.
4. Secrets in Railway variables only.
5. Health check wired.
6. Backups enabled and a restore rehearsed.
7. Never `db push` against production.
8. `APP_URL` must match the real domain, or emailed links point at localhost.