# 11 — Environment Variables

Reference for every environment variable the application reads. Copy this block into `.env` for
local development; in production these live in Railway service variables.

> Note: the file is documented here rather than shipped as a literal `.env.example` at the repo
> root so it cannot be confused with a real environment file. Create `.env` from this block.

```bash
# --- Database ---
# Local: postgres://postgres:postgres@localhost:5432/golden_eduhub
# Railway: reference the plugin, e.g. ${{Postgres.DATABASE_URL}}
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/golden_eduhub?schema=public"

# --- Auth ---
# 32+ random bytes, base64. Generate with: openssl rand -base64 32
AUTH_SECRET=""

# --- App ---
# Used for absolute links in emails. No trailing slash.
APP_URL="http://localhost:3000"
NODE_ENV="development"

# --- File storage ---
# s3    = any S3-compatible bucket (Cloudflare R2, MinIO, Railway object storage)
# local = writes to LOCAL_STORAGE_PATH; development only, never in production
STORAGE_DRIVER="local"
LOCAL_STORAGE_PATH="./.data/uploads"

# Only needed when STORAGE_DRIVER="s3"
S3_ENDPOINT=""                 # R2: https://<account-id>.r2.cloudflarestorage.com
S3_REGION="auto"
S3_BUCKET=""                   # must be a PRIVATE bucket
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_FORCE_PATH_STYLE="true"

# --- Email ---
# console = prints to terminal (development). resend or smtp in production.
EMAIL_DRIVER="console"
EMAIL_FROM="Golden Academy <no-reply@localhost>"
RESEND_API_KEY=""
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""

# --- Cron / internal jobs ---
# Shared secret checked by /api/cron/* route handlers.
CRON_SECRET=""

# --- Error tracking (optional) ---
SENTRY_DSN=""
```

## Required in production

| Variable | Required | Consequence if missing |
|----------|----------|------------------------|
| `DATABASE_URL` | yes | App will not start |
| `AUTH_SECRET` | yes | Sessions cannot be signed; sign-in fails |
| `APP_URL` | yes | Password-reset emails link to localhost |
| `STORAGE_DRIVER` | yes | Uploads fail |
| `S3_*` (when driver is `s3`) | yes | Uploads fail |
| `EMAIL_DRIVER` + provider creds | yes | Password reset is broken |
| `CRON_SECRET` | recommended | Cron endpoints refuse all calls (safe default) |
| `SENTRY_DSN` | optional | Errors only reach logs |

## Rules

1. `.env` is gitignored. It is never committed, in any branch.
2. `AUTH_SECRET` is generated per environment. Sharing one between staging and production
   invalidates session isolation.
3. `APP_URL` must exactly match the deployed domain, including scheme, with no trailing slash.
4. Rotating `AUTH_SECRET` signs every user out. That is the intended emergency lever.
5. `STORAGE_DRIVER=local` in production is a data-loss bug waiting to happen — the Railway
   container filesystem is ephemeral.