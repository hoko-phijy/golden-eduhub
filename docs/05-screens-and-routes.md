# 05 — Screens & Routes

Every URL in the application, what it shows, and who can reach it. Route groups keep the
three experiences separate without three separate apps.

```
app/
├── (auth)/            sign-in, password reset — no session required
├── (student)/         student experience
├── (teach)/           instructor experience
├── (admin)/           admin experience
└── api/               route handlers (files, uploads, health, cron)
```

Access is enforced server-side in each layout and page, not by the folder name. The folder
name is organisation, not security.

---

## Public / auth

| Route | Screen | Notes |
|-------|--------|-------|
| `/` | Landing page | Academy name, short pitch, "Sign in". No course catalogue publicly — enrolment is admin-controlled |
| `/sign-in` | Email + password form | Rate-limited; generic error message (never "no such user") |
| `/forgot-password` | Request reset link | Always reports success, whether or not the email exists |
| `/reset-password?token=` | Set new password | Token single-use, 60-minute expiry |
| `/change-password` | Forced first-login change | Redirect target when `mustChangePassword` is true |

After sign-in, redirect by role: admin → `/admin`, instructor → `/teach`, student → `/my`.

---

## Student experience — `(student)`

Prefix `/my`. Layout: top bar with academy name, notification bell, profile menu; left nav
with Courses, Calendar, Grades.

| Route | Screen | Contents |
|-------|--------|----------|
| `/my` | Dashboard | Due soon (next 7 days), recently graded, enrolled course cards, unread announcements |
| `/my/courses` | My courses | Cards with progress (lessons completed / total — completion is v1.1, so MVP shows lesson count) |
| `/my/courses/[courseSlug]` | Course home | Syllabus (modules → lessons), upcoming work, resources, announcements |
| `/my/courses/[courseSlug]/lessons/[lessonId]` | Lesson | Markdown content, attached resources, prev/next lesson |
| `/my/courses/[courseSlug]/resources` | Course files | Filterable list of student-visible resources; download buttons |
| `/my/courses/[courseSlug]/assignments` | Assignments | List with status chips: not submitted / submitted / late / graded |
| `/my/courses/[courseSlug]/assignments/[id]` | Assignment detail | Instructions, brief download, due date, submission form, own submission + grade + feedback |
| `/my/courses/[courseSlug]/quizzes` | Quizzes | Practice and graded quizzes, attempts used |
| `/my/courses/[courseSlug]/quizzes/[id]` | Quiz intro | Instructions, attempts remaining, "Start" |
| `/my/courses/[courseSlug]/quizzes/[id]/attempt/[attemptId]` | Quiz taking | One question at a time or all-at-once; autosave; timer if limited |
| `/my/courses/[courseSlug]/quizzes/[id]/result/[attemptId]` | Quiz result | Score, per-question review if `showAnswers` |
| `/my/courses/[courseSlug]/exams` | Exams | Open/upcoming/closed, with window and duration |
| `/my/courses/[courseSlug]/exams/[id]` | Exam intro | Window, duration, single-attempt warning, "Begin exam" confirm |
| `/my/courses/[courseSlug]/exams/[id]/attempt/[attemptId]` | Exam taking | Server-enforced deadline, countdown, autosave, submit confirmation |
| `/my/courses/[courseSlug]/exams/[id]/result/[attemptId]` | Exam result | Only if results released; otherwise "Not yet released" |
| `/my/grades` | My grades | Per-course breakdown: item, weight, score, contribution, course total |
| `/my/notifications` | Notifications | List, mark read |
| `/my/profile` | Profile | Name, phone, password change |

**Exam-taking page details that matter:** the countdown is client-side display only. On mount
the page receives `expiresAt` from the server and renders the remaining time. Every answer
save posts to the server, which rejects writes past `expiresAt`. If the student's clock is
wrong, the server wins. A `beforeunload` warning discourages accidental navigation.

---

## Instructor experience — `(teach)`

Prefix `/teach`. Layout: same shell, nav shows only courses the instructor owns.

| Route | Screen | Contents |
|-------|--------|----------|
| `/teach` | Dashboard | Grading queue count, upcoming deadlines, per-course health (submissions pending, avg score), recent activity |
| `/teach/courses` | My courses | Owned courses with status |
| `/teach/courses/[courseId]` | Course overview | Tabs: Content, Students, Assignments, Quizzes, Exams, Gradebook, Resources, Settings |
| `/teach/courses/[courseId]/content` | Content builder | Modules and lessons, drag to reorder, inline edit, publish toggles |
| `/teach/courses/[courseId]/content/[lessonId]` | Lesson editor | Markdown editor with preview, resource attachments |
| `/teach/courses/[courseId]/students` | Roster | Enrolled students, enrol/remove, per-student quick view |
| `/teach/courses/[courseId]/students/[studentId]` | Student detail | Their submissions, attempts, grades in this course |
| `/teach/courses/[courseId]/assignments` | Assignments list | Create, publish, due dates, submission counts |
| `/teach/courses/[courseId]/assignments/new` | Create assignment | Form |
| `/teach/courses/[courseId]/assignments/[id]` | Edit assignment | Form + submissions tab |
| `/teach/courses/[courseId]/assignments/[id]/submissions` | Submission inbox | Table: student, status, submitted at, score; filters; bulk open |
| `/teach/courses/[courseId]/assignments/[id]/submissions/[submissionId]` | Grade submission | Student work (text + file preview), score input, feedback, return-for-revision |
| `/teach/courses/[courseId]/quizzes` | Quizzes list | |
| `/teach/courses/[courseId]/quizzes/new` | Create quiz | |
| `/teach/courses/[courseId]/quizzes/[id]` | Quiz builder | Questions, choices, points, correct answers, settings |
| `/teach/courses/[courseId]/quizzes/[id]/results` | Quiz results | Per-student scores, per-question stats |
| `/teach/courses/[courseId]/exams` | Exams list | |
| `/teach/courses/[courseId]/exams/new` | Create exam | |
| `/teach/courses/[courseId]/exams/[id]` | Exam builder | Same builder, exam settings (window, duration, attempts, shuffle) |
| `/teach/courses/[courseId]/exams/[id]/results` | Exam results | Scores, release results button |
| `/teach/courses/[courseId]/exams/[id]/grading` | Manual grading queue | Essay answers awaiting a score, one at a time |
| `/teach/courses/[courseId]/gradebook` | Gradebook | Students × items matrix, editable cells, CSV export |
| `/teach/courses/[courseId]/resources` | Resources | All course files and links |
| `/teach/courses/[courseId]/settings` | Course settings | Title, description, cover, passing score, weights (if unlocked) |
| `/teach/profile` | Profile | |

The quiz builder and exam builder are **the same component** with a `kind` prop. Two builders
would drift within a month.

---

## Admin experience — `(admin)`

Prefix `/admin`. Layout: wider nav, includes everything the instructor has plus administration.

| Route | Screen | Contents |
|-------|--------|----------|
| `/admin` | Academy dashboard | Active courses, total students, submissions awaiting grading, avg score across courses, recent audit events, quick actions |
| `/admin/courses` | All courses | Every course, any instructor; filter by status/instructor; create course |
| `/admin/courses/new` | Create course | Assign owner, set status |
| `/admin/courses/[courseId]` | Course admin view | **All instructor tabs, plus** Settings with owner reassignment, weights lock, archive, delete |
| `/admin/courses/[courseId]/...` | All course sub-routes | Same screens as `/teach/courses/[courseId]/...` — implemented once, mounted under both prefixes |
| `/admin/instructors` | Instructors | List, create, edit, deactivate, reset password, see their courses |
| `/admin/instructors/[id]` | Instructor detail | Profile, assigned courses, activity |
| `/admin/students` | Students | List, search, create, edit, deactivate, reset password |
| `/admin/students/[id]` | Student detail | Profile, enrolments, grades across courses |
| `/admin/students/import` | CSV import | Upload, preview mapping, confirm, report |
| `/admin/enrolments` | Enrolment manager | Add students to courses in bulk |
| `/admin/gradebook` | Academy gradebook | Cross-course view, any student, any grade; override with reason |
| `/admin/audit` | Audit log | Filter by actor, action, entity, date range; diff viewer |
| `/admin/settings` | Academy settings | Name, contact, timezone, locale, passing score default, upload cap, late-submission policy, email settings |
| `/admin/notifications` | Broadcast | Send an announcement to all users (v1.1) |

**Implementation note on shared course screens:** the course management screens are built once
as a component tree that takes `courseId` and a permission context. `/teach/courses/[id]/*` and
`/admin/courses/[id]/*` both render it. The admin version shows extra controls (owner
reassignment, archive, delete, weights lock) based on the permission context. This avoids
maintaining two copies of a gradebook.

---

## API route handlers

Only what cannot be a Server Action.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/health` | GET | Platform health check: app up, DB reachable |
| `/api/uploads/sign` | POST | Issue a presigned PUT URL after authorising the uploader and checking size/type |
| `/api/uploads/complete` | POST | Verify the object exists, write the `FileObject` row |
| `/api/files/[fileId]` | GET | Authorise, then 302 to a short-lived presigned GET URL |
| `/api/gradebook/[courseId]/export` | GET | Stream a CSV of the gradebook |
| `/api/transcript/export` | GET | Student's own grades as CSV |
| `/api/cron/sweep-attempts` | POST | Finalise expired attempts; protected by a shared secret header |
| `/api/auth/sign-out-all` | POST | Revoke all sessions for the current user |

Everything else — creating courses, grading, enrolling, publishing — is a Server Action. They
are colocated with the form that calls them, they get the session for free, and they cannot be
called cross-origin.

---

## Shared UI components worth naming up front

| Component | Used by | Note |
|-----------|---------|------|
| `CourseShell` | every course page | Header, tabs, breadcrumb, permission-aware nav |
| `DataTable` | rosters, inboxes, gradebooks, admin lists | TanStack Table wrapper: sort, filter, paginate, column visibility |
| `GradeCell` | gradebooks | Inline edit, optimistic update, audit on save |
| `QuestionEditor` | quiz + exam builders | Per-type form, correct-answer selection, points |
| `AttemptRunner` | quiz + exam taking | Question navigation, autosave, timer, submit |
| `FileUploader` | resources, submissions, covers | Presigned direct upload, progress, type/size validation |
| `MarkdownEditor` | lessons, instructions | Textarea + live preview, sanitised render |
| `StatusChip` | everywhere | One vocabulary for draft/published/late/graded/etc. |
| `EmptyState` | everywhere | "No courses yet" + the action that fixes it |
| `ConfirmDialog` | destructive actions | Requires typing the entity name for deletes |

---

## Navigation by role

- **Student:** Dashboard · My Courses · Grades · Notifications · Profile
- **Instructor:** Dashboard · My Courses · Grading Queue · Profile
- **Admin:** Dashboard · Courses · Instructors · Students · Gradebook · Audit · Settings

An instructor never sees the words "Instructors", "Audit" or "Settings" in their navigation.
Not because the routes are hidden — because the guard rejects them. Both, ideally.