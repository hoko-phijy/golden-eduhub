# Golden Edu Hub

Multi-tenant learning platform for **Golden Academy** — courses, resources, assignments,
quizzes and exams, with full administrative control for the academy owner and scoped
control for each instructor.

- **Stack:** TypeScript end to end — Next.js (App Router) + Node.js + PostgreSQL + Prisma
- **Deployment:** one Railway project, one service, one Postgres. Backend and frontend ship together by design.
- **Status:** frontend scaffolded. Routing, theme, i18n and UI components are in place; data layer lands in Phase 1.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

To preview the three role shells before auth lands, set a role and restart:

```powershell
$env:GOLDEN_DEV_PREVIEW_ROLE="ADMIN"   # or INSTRUCTOR / STUDENT
npm run dev
```

That switch is development-only and inert in production. It exists so the UI can be
reviewed before Phase 1 builds real sessions.

## Repository layout (current)

```
src/app          Routes: (admin) (teach) (student) (auth) + api
src/components   ui (shadcn), shell, theme, brand
src/i18n         Locale resolution and message loading
src/lib          auth guard, roles, utils
src/messages     en.json, ar.json
docs             Product, architecture, data, permissions and delivery plans
```

Everything lives in a single Next.js application. There is no separate backend service —
server actions and route handlers *are* the backend, which is what makes the one-project
deployment possible.

## Read the plans in this order

| # | Document | What it answers |
|---|----------|-----------------|
| 00 | [Product brief](docs/00-product-brief.md) | Who uses this, what problem it solves, what success looks like |
| 01 | [Feature catalog](docs/01-feature-catalog.md) | Every feature, marked MVP or post-MVP |
| 02 | [Architecture](docs/02-architecture.md) | Stack choices, tenancy model, storage, rendering strategy |
| 03 | [Data model](docs/03-data-model.md) | The full Prisma schema and why each table exists |
| 04 | [Roles & permissions](docs/04-roles-and-permissions.md) | Exactly who can do what, as a matrix |
| 05 | [Screens & routes](docs/05-screens-and-routes.md) | Every URL in the app and what it shows |
| 06 | [Server surface](docs/06-server-surface.md) | Server actions and route handlers, grouped by domain |
| 07 | [MVP roadmap](docs/07-roadmap-mvp.md) | Six phases, each with a definition of done |
| 08 | [Railway deployment](docs/08-deployment-railway.md) | Step-by-step deploy, env vars, migrations, backups |
| 09 | [Decisions](docs/09-decisions.md) | The calls that were made and the alternatives rejected |
| 10 | [Scope boundaries & risks](docs/10-scope-boundaries.md) | What is deliberately excluded, and what could bite |
| 11 | [Environment variables](docs/11-environment-variables.md) | Every config value, and what breaks without it |

## Product in one paragraph

Golden Academy runs courses taught by multiple instructors. Today that means scattered
files, WhatsApp threads and spreadsheets of grades. Golden Edu Hub puts each course in one
place: modules and lessons, downloadable resources (PDFs, images, links), assignments with
file submissions, and quizzes and exams with auto-grading for objective questions and
manual grading for written ones. The academy owner is the tenant administrator and can see
and change anything. Instructors operate inside the courses they are assigned to and cannot
reach beyond them. Students see only what they are enrolled in.