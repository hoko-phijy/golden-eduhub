# 07 — MVP Roadmap

Six phases. Each phase ends with something demonstrable and a definition of done that is
testable, not aspirational. Phases 1–5 are the MVP; Phase 6 is hardening before real students
touch it.

Estimates assume one developer working steadily. They are ranges, not commitments.

---

## Phase 0 — Foundation (½ day)

**Build:** repository scaffold, tooling, CI, first deploy.

- `create-next-app` with TypeScript, Tailwind, App Router, `src/` off, import alias `@/*`.
- ESLint + Prettier, `strict: true`, `noUncheckedIndexedAccess`.
- Prisma initialised, `DATABASE_URL` wired.
- Railway project created: web service + Postgres, first deploy of the landing page.
- `GET /api/health` returning DB status.
- GitHub Actions: typecheck + lint + unit tests on PR.

**Done when:** `git push` to `main` produces a live Railway URL showing the landing page, and
`/api/health` reports the database is up.

---

## Phase 1 — Identity, tenancy, and the permission spine (3–4 days)

**Build:** the part everything else depends on.

- Prisma schema: `Academy`, `User`, `Session`, `PasswordReset`, `AuditEvent`.
- Argon2id password hashing, session cookies, `requireUser` / `requireRole`.
- Sign-in, sign-out, forced first-login password change, forgot/reset password.
- Admin: create/deactivate instructors and students, reset passwords, change roles.
- Academy settings page.
- Seed script: academy, admin, 2 instructors, 10 students.
- Role-based redirect after sign-in; three empty shells (`/my`, `/teach`, `/admin`).

**Done when:**
- Each role signs in and lands on its own shell.
- A student cannot reach `/admin` or `/teach` — verified by an automated test, not by clicking.
- Password reset email arrives and the link works once.
- Every admin user action writes an `AuditEvent`.

---

## Phase 2 — Courses, content, and files (5–6 days)

**Build:** the teaching material layer.

- Prisma: `Course`, `CourseInstructor`, `Module`, `Lesson`, `Enrollment`, `FileObject`,
  `Resource`, `ResourceFile`.
- Admin course CRUD, owner assignment, publish/archive.
- Instructor content builder: modules, lessons, Markdown editor with preview, drag-to-reorder.
- Upload pipeline: presign → direct upload → complete → `FileObject`; private bucket; signed
  download route.
- Resources: links and files, visibility, attach to lessons.
- Enrolment: single and bulk.
- Student course list, course home, lesson view, resources list.

**Done when:**
- A course can be created, filled with two modules and four lessons, given a PDF and a link,
  published, and enrolled with students — entirely through the UI.
- A student sees only their enrolled courses; a non-enrolled student gets 404 on the course URL.
- An instructor cannot open another instructor's course by ID — tested.
- Uploading a 30 MB file is rejected server-side even if the browser is tricked.
- A signed download URL expires and stops working.

---

## Phase 3 — Assignments and grading (4–5 days)

**Build:** the first half of the assessment loop.

- Prisma: `Assignment`, `Submission`, `SubmissionFile`, `Grade`, `GradeSnapshot`.
- Assignment CRUD, publish, due dates, late policies.
- Student submission: text, files, resubmission, late flagging.
- Instructor submission inbox with filters.
- Grading: score, feedback, return for revision.
- Gradebook matrix, weights, computed totals, CSV export.
- Student grades view.
- Notification rows + email on "graded".

**Done when:**
- A student submits before the deadline; the instructor sees it, grades it, and the student sees
  the score and feedback.
- A submission after a `BLOCK` deadline is rejected; under `ALLOW_FLAG` it is accepted and marked
  late.
- Resubmission supersedes the previous attempt and the old one remains in the database.
- Gradebook totals are correct against a hand-computed fixture.
- An instructor cannot grade a submission in a course they do not own — tested.
- Grade override writes an audit row with before/after.

---

## Phase 4 — Quizzes and exams (6–7 days)

**Build:** the harder half. This is the phase with the most edge cases.

- Prisma: `Assessment`, `Question`, `QuestionChoice`, `Attempt`, `Answer`.
- Shared builder UI for both kinds.
- Question types: single choice, multiple choice, true/false, short text, essay.
- Grading engine as pure functions, with the full unit-test suite listed in `06-server-surface.md`.
- Quiz taking: practice mode, attempt limits, immediate result, answer review.
- Exam taking: window enforcement, server-side deadline, autosave, auto-submit on expiry,
  shuffle.
- Manual grading queue for essays.
- Results release.
- Correct answers never sent to the browser before release — verified by inspecting the payload.

**Done when:**
- A quiz with all five question types grades correctly, including partial credit.
- An exam started at 10:00 with a 30-minute limit rejects a save at 10:31 and finalises as
  `EXPIRED`.
- Starting a second attempt beyond `maxAttempts` is refused.
- Starting before `opensAt` or after `closesAt` is refused.
- A student cannot see another student's attempt — tested.
- A student cannot see scores before `resultsReleasedAt`.
- The correct-answer flag is absent from the HTML and JSON served to a student mid-attempt.
- Essay answers appear in the grading queue and the attempt stays ungraded until they are scored.

---

## Phase 5 — Dashboards, notifications, and admin oversight (3–4 days)

**Build:** the layer that makes it feel finished.

- Student dashboard: due soon, recently graded, course cards.
- Instructor dashboard: grading queue, upcoming deadlines, per-course health.
- Admin dashboard: academy KPIs, recent audit events.
- Notification bell, list, mark read; email on key events.
- Audit log viewer with filters and a diff viewer.
- Admin cross-course gradebook with override.
- CSV student import with preview and per-row report.
- Empty states, loading states, error boundaries everywhere.

**Done when:**
- Each role's dashboard shows real, correct numbers from seeded data.
- The admin can find "who changed this grade and when" in under three clicks.
- CSV import of 50 students reports successes and failures per row.
- Every list page has a sensible empty state.

---

## Phase 6 — Hardening and launch (3–4 days)

**Build:** the unglamorous work that decides whether it survives contact with students.

- Accessibility pass: keyboard navigation, focus order, labels, contrast, screen-reader check on
  the exam page specifically.
- Rate limiting on sign-in, password reset, and submission endpoints.
- Security review against `04-roles-and-permissions.md`, route by route.
- End-to-end Playwright suite covering the three critical journeys:
  sign-in → submit → grade; sign-in → sit exam → release results; admin → create course → assign.
- Backups configured and **a restore actually performed** into a scratch database.
- Error tracking live; `/api/health` wired to the platform health check.
- Seed a demo course with realistic content for training instructors.
- Write the operator runbook: how to add an instructor, how to reset a password, how to restore.

**Done when:**
- The end-to-end suite passes against the deployed Railway environment, not just locally.
- A restore from backup has been performed and verified.
- A student who has never seen the app can submit an assignment without being told how.

---

## Total

Roughly **25–33 working days** for one developer, MVP complete. Phases 1 and 4 are the ones
that will overrun; both are load-bearing, so the buffer belongs there.

## Sequencing rules

- **Phase 1 before everything.** The permission spine is not a later refactor.
- **Phase 2 before 3 and 4.** Assignments and assessments both hang off courses and files.
- **Phase 3 before 4.** Assignments exercise the grading and gradebook machinery with simpler
  inputs. Doing exams first means debugging the gradebook and the attempt engine at once.
- **Phase 6 is not optional.** It is the difference between a demo and a system.

## What is deliberately deferred past MVP

Co-instructors UI, question banks, randomised order, OAuth, 2FA, impersonation, announcements
broadcast, calendar/.ics, certificates, i18n/RTL, item analysis, download tracking, course
cloning. All are listed with release tags in `01-feature-catalog.md`, and none of them require
schema changes that the MVP schema does not already accommodate.