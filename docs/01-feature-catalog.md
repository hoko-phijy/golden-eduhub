# 01 — Feature Catalog

Every feature the application will have, marked **MVP** or **Later**. "Later" items are
recorded so the MVP schema and routes do not accidentally make them expensive.

Legend: `MVP` ships in the first release. `v1.1` / `v2` are sequenced, not promised.

---

## 1. Identity & accounts

| # | Feature | Release | Notes |
|---|---------|---------|-------|
| 1.1 | Email + password sign-in (credentials) | MVP | Argon2id hashing via a maintained library; never hand-rolled |
| 1.2 | Session management (HTTP-only cookie, server-side session record) | MVP | Revocable; "sign out everywhere" for admin |
| 1.3 | Role assignment (admin / instructor / student) | MVP | Single role per user in MVP |
| 1.4 | Admin-created accounts with forced password reset on first login | MVP | The academy provisions accounts; no open self-registration |
| 1.5 | Profile (name, email, phone, avatar initial) | MVP | No avatar upload in MVP — initials only |
| 1.6 | Password reset via emailed link | MVP | Requires an email provider (see 02-architecture) |
| 1.7 | Account deactivation (soft) | MVP | Deactivated users cannot sign in; records are preserved |
| 1.8 | Google / Microsoft OAuth sign-in | v1.1 | Wanted by many academies; needs provider setup per deployment |
| 1.9 | Two-factor authentication | v2 | Sensible for admin accounts specifically |
| 1.10 | Self-service student registration with admin approval | v1.1 | MVP keeps provisioning admin-only |

## 2. Tenant & academy administration (admin only)

| # | Feature | Release | Notes |
|---|---------|---------|-------|
| 2.1 | Academy profile (name, logo text, contact email, timezone, locale) | MVP | One row. Timezone matters for due dates |
| 2.2 | Instructor management (create, edit, deactivate, reset password) | MVP | |
| 2.3 | Student management (create, edit, deactivate, reset password) | MVP | |
| 2.4 | Bulk student import from CSV | MVP | Upload CSV, preview, confirm. Academy-sized lists make this worth it |
| 2.5 | Course catalogue administration (create, archive, reassign instructor) | MVP | Admin can own a course directly too |
| 2.6 | Enrolment administration (add/remove student on any course) | MVP | |
| 2.7 | Academy settings: default passing score, quiz/exam policy defaults, file size caps | MVP | These are the guardrails instructors operate inside |
| 2.8 | Audit log viewer with filters (actor, action, entity, date) | MVP | Append-only |
| 2.9 | Dashboard: academy-wide KPIs | MVP | Active courses, students, submissions awaiting grading, avg score |
| 2.10 | Impersonation ("view as student") | v1.1 | Needs loud banner + audit entry; valuable for support |
| 2.11 | Announcement broadcast to all users | v1.1 | |
| 2.12 | Multiple admins / co-owner accounts | v1.1 | Schema should allow it from day one (role on user, not a singleton flag) |
| 2.13 | Data export (per course, per student) | v1.1 | GDPR-ish courtesy; CSV/JSON bundle |

## 3. Courses

| # | Feature | Release | Notes |
|---|---------|---------|-------|
| 3.1 | Course with title, slug, short description, long description | MVP | |
| 3.2 | Course cover image (upload) | MVP | Single image, size-capped |
| 3.3 | Course status: draft → published → archived | MVP | Students only see published |
| 3.4 | Course ownership: one primary instructor | MVP | |
| 3.5 | Co-instructors on a course | v1.1 | Schema supports it in MVP; UI deferred |
| 3.6 | Modules (ordered sections) | MVP | |
| 3.7 | Lessons (ordered, inside modules) | MVP | |
| 3.8 | Lesson content: rich text (Markdown) | MVP | Markdown avoids a WYSIWYG dependency; renders safely |
| 3.9 | Drag-and-drop reordering of modules and lessons | MVP | Sortable list; persist integer `position` |
| 3.10 | Course syllabus view (auto-generated from modules) | MVP | |
| 3.11 | Prerequisites / course sequencing | v2 | |
| 3.12 | Course cloning | v1.1 | Real time-saver per term; schema just needs clean FKs |

## 4. Resources & files

| # | Feature | Release | Notes |
|---|---------|---------|-------|
| 4.1 | Attach a **link** to a lesson or resource list | MVP | URL + label + optional description |
| 4.2 | Upload **PDF** resources | MVP | Size cap (default 25 MB, admin-configurable) |
| 4.3 | Upload **image** resources (PNG/JPG/WebP) | MVP | |
| 4.4 | Upload **DOCX/XLSX/PPTX** resources | MVP | Cheap to allow; the storage layer does not care |
| 4.5 | Download with signed, expiring URLs | MVP | Private bucket; never a public object URL |
| 4.6 | Resource list per course ("Course Files") | MVP | Filterable by type |
| 4.7 | Per-resource visibility (students / instructors only) | MVP | |
| 4.8 | Download tracking | v1.1 | Useful analytics; adds write load, so not MVP |
| 4.9 | **Video upload or streaming** | ❌ excluded | Out of scope by instruction; see 10-scope-boundaries |
| 4.10 | **Live video conferencing** | ❌ excluded | Out of scope by instruction |
| 4.11 | Embedded external video (YouTube/Vimeo link) | v1.1 | Costs nothing and sidesteps hosting entirely |
| 4.12 | Zip/bulk download of a course's resources | v1.1 | |

## 5. Assignments

| # | Feature | Release | Notes |
|---|---------|---------|-------|
| 5.1 | Assignment with title, instructions (Markdown), due date | MVP | |
| 5.2 | Attachment on the assignment itself (brief PDF etc.) | MVP | Reuses the resource pipeline |
| 5.3 | Max points and grading rubric as free text | MVP | Structured rubrics are v2 |
| 5.4 | Allow text submission, file submission, or both | MVP | Per-assignment setting |
| 5.5 | Student submits (text + up to N files) | MVP | |
| 5.6 | Resubmission before due date | MVP | Supersedes the previous submission; old one kept |
| 5.7 | Late submission policy: block / allow-and-flag / allow-until-date | MVP | Admin sets the allowed policies; instructor picks one |
| 5.8 | Instructor grading with score + written feedback | MVP | |
| 5.9 | Submission status: not submitted / submitted / late / graded / returned | MVP | The single most useful field in the app |
| 5.10 | Instructor submission inbox per assignment | MVP | Table with filters, bulk open |
| 5.11 | Return for revision (reopen submission) | MVP | |
| 5.12 | Inline preview of PDF and image submissions | MVP | Browser-native `<iframe>`/`<img>` on a signed URL |
| 5.13 | Plagiarism check | v2 | Real money and real vendors; not MVP |
| 5.14 | Peer review | v2 | |

## 6. Quizzes

| # | Feature | Release | Notes |
|---|---------|---------|-------|
| 6.1 | Quiz with title, instructions, time limit (optional) | MVP | |
| 6.2 | Question types: single choice, multiple choice, true/false, short text | MVP | |
| 6.3 | Points per question | MVP | |
| 6.4 | Explanations shown after submission | MVP | |
| 6.5 | Attempts: unlimited / N attempts / single | MVP | |
| 6.6 | Practice mode (ungraded, unlimited attempts, answers shown) | MVP | Distinguishes quizzes from exams |
| 6.7 | Auto-grading and immediate result | MVP | Objective questions only |
| 6.8 | Question bank reused across quizzes | v1.1 | Needs a `bank_question` concept on top of `question` |
| 6.9 | Randomised question order | v1.1 | |
| 6.10 | Randomised choice order | v1.1 | |
| 6.11 | Partial credit for multiple-select | MVP | Decide scoring rule up front (proportional) |
| 6.12 | Essay questions inside a quiz | v1.1 | Manual grading queue; belongs to exams in MVP |

## 7. Exams

| # | Feature | Release | Notes |
|---|---------|---------|-------|
| 7.1 | Exam built from the same question engine as quizzes | MVP | **One table, `assessment`, with a `kind` discriminator** — not two parallel systems |
| 7.2 | Exam is graded (counts toward the course grade) | MVP | |
| 7.3 | Open window: `opensAt` / `closesAt` | MVP | |
| 7.4 | Time limit enforced server-side with an attempt deadline | MVP | Client timer is display only; server is authoritative |
| 7.5 | Single attempt, auto-submitted when the deadline passes | MVP | |
| 7.6 | Shuffle questions (exam-level toggle) | MVP | Cheap and genuinely improves integrity |
| 7.7 | Essay / long-answer questions requiring manual grading | MVP | Exam-only |
| 7.8 | Results withheld until instructor releases them | MVP | Prevents students seeing scores mid-window |
| 7.9 | Manual grading queue for essay answers | MVP | |
| 7.10 | Grade override with reason (instructor or admin) | MVP | Always audited |
| 7.11 | Access code / password to start an exam | v1.1 | Proctoring-lite |
| 7.12 | IP or device restriction, lockdown browser | v2 | Cannot be honestly delivered by a web app alone |
| 7.13 | Multiple sections/groups with different papers | v2 | |
| 7.14 | Item analysis (per-question difficulty, discrimination) | v1.1 | Genuinely valuable, purely read-side, cheap to add later |

## 8. Grading & gradebook

| # | Feature | Release | Notes |
|---|---------|---------|-------|
| 8.1 | Course gradebook matrix (students × graded items) | MVP | |
| 8.2 | Weighted categories (assignments %, quizzes %, exams %) | MVP | Weights per course, sum-to-100 validated |
| 8.3 | Computed course total and letter/percentage grade | MVP | Computed on read, cached in a `grade_snapshot` row |
| 8.4 | Passing threshold per course (default inherited from academy) | MVP | |
| 8.5 | Student's own grade breakdown view | MVP | Item, weight, score, contribution |
| 8.6 | Export gradebook to CSV | MVP | |
| 8.7 | Grade change history | MVP | Any override writes an audit row; visible per grade |
| 8.8 | Admin override across any course | MVP | The point of admin control |
| 8.9 | Configurable grading scales (A/B/C, GPA, pass/fail) | v1.1 | |
| 8.10 | Curve adjustment tool | v2 | Dangerous; audited if built |

## 9. Notifications & dashboards

| # | Feature | Release | Notes |
|---|---------|---------|-------|
| 9.1 | In-app notification bell + list | MVP | Rows in `notification`, not real-time sockets |
| 9.2 | Notification events: new assignment, quiz/exam published, submission graded, exam released, enrolment added | MVP | |
| 9.3 | Student dashboard: "Due soon", "Recently graded", enrolled courses | MVP | |
| 9.4 | Instructor dashboard: grading queue, upcoming deadlines, course health | MVP | |
| 9.5 | Admin dashboard: academy KPIs, recent audit events | MVP | |
| 9.6 | Email notifications (digest or per-event) | MVP | One transactional provider; per-event is enough |
| 9.7 | Announcements / course feed posts | v1.1 | |
| 9.8 | Real-time push (websockets) | v2 | Polling every 30s is enough at academy scale |
| 9.9 | Calendar view of deadlines (.ics export) | v1.1 | Cheap and loved by students |

## 10. Security, integrity & operations

| # | Feature | Release | Notes |
|---|---------|---------|-------|
| 10.1 | Role + ownership checks on **every** server action and route handler | MVP | Central helper, not per-page discipline |
| 10.2 | Append-only audit log for admin actions and grade changes | MVP | |
| 10.3 | Rate limiting on sign-in and submission endpoints | MVP | DB or in-memory token bucket; academy scale |
| 10.4 | File type and size validation on upload, server-side | MVP | Never trust the browser's MIME |
| 10.5 | Signed URLs only; storage bucket is private | MVP | |
| 10.6 | Automated Postgres backups | MVP | Railway volume/backup + a documented restore drill |
| 10.7 | Health check endpoint for the platform | MVP | |
| 10.8 | Error tracking | MVP | Sentry-style; self-hosted optional |
| 10.9 | Structured request logging | MVP | |
| 10.10 | Accessibility pass (keyboard, contrast, labels) | MVP | Students include people who need it |
| 10.11 | i18n / Arabic-first UI with RTL | v1.1 | **Plan for it now**: no hardcoded strings, `dir` handled at the layout |

## 11. Explicitly excluded from the entire product (for now)

Video conferencing, video hosting/streaming/transcoding, live classes, chat/messaging
between users, payments and subscriptions, mobile store apps, certificates with QR
verification, SCORM/LTI/xAPI interoperability, and a public API for third parties.
Reasoning in `10-scope-boundaries.md`.