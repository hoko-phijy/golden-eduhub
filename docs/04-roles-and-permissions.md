# 04 — Roles & Permissions

The rule the whole application hangs on: **the admin has full control; instructors have
scoped control inside their own courses; students see only themselves.**

Legend: ✅ allowed · ⚠️ allowed with a restriction · ❌ denied

---

## 1. The three scopes

An instructor's authority is derived from `Course.ownerId` and `CourseInstructor`. There is no
global "instructor" power. An instructor who owns no courses can do nothing but edit their own
profile.

Admin authority is global. It is not "instructor plus extras" — the admin can act on courses
they do not own, including courses owned by instructors.

---

## 2. Accounts & identity

| Action | Admin | Instructor | Student |
|--------|-------|-----------|---------|
| Sign in | ✅ | ✅ | ✅ |
| Edit own profile / password | ✅ | ✅ | ✅ |
| Create instructor accounts | ✅ | ❌ | ❌ |
| Create student accounts | ✅ | ❌ | ❌ |
| Edit any user's name/email | ✅ | ❌ | ❌ |
| Reset another user's password | ✅ | ❌ | ❌ |
| Deactivate a user | ✅ | ❌ | ❌ |
| Change a user's role | ✅ | ❌ | ❌ |
| Delete a user | ❌ (deactivate only) | ❌ | ❌ |
| View the user directory | ✅ | ⚠️ only students enrolled in their courses | ❌ |
| Bulk CSV import of students | ✅ | ❌ | ❌ |

Deletion is deliberately absent. A deleted student orphans submissions and grades; a
deactivated one does not. The UI offers "Deactivate", never "Delete".

## 3. Courses

| Action | Admin | Instructor (owner) | Instructor (not owner) | Student (enrolled) |
|--------|-------|--------------------|------------------------|--------------------|
| View course | ✅ | ✅ | ❌ | ✅ |
| Create a course | ✅ | ❌ | ❌ | ❌ |
| Edit title/description/cover | ✅ | ✅ | ❌ | ❌ |
| Publish / unpublish | ✅ | ✅ | ❌ | ❌ |
| Archive | ✅ | ⚠️ request only — admin archives | ❌ | ❌ |
| Delete a course | ✅ | ❌ | ❌ | ❌ |
| Change the owning instructor | ✅ | ❌ | ❌ | ❌ |
| Add/remove co-instructors | ✅ | ❌ | ❌ | ❌ |
| Set grade weights | ✅ | ⚠️ only if admin has not locked them | ❌ | ❌ |
| Set passing score | ✅ | ⚠️ within academy bounds | ❌ | ❌ |
| View course roster | ✅ | ✅ | ❌ | ❌ |
| Enrol / unenrol students | ✅ | ✅ | ❌ | ❌ |
| See draft (unpublished) course | ✅ | ✅ | ❌ | ❌ |

**Why instructors cannot create courses:** the academy's catalogue is an administrative
asset. Instructors teach what they are assigned. If that becomes friction, the admin can grant
it later — the reverse (revoking a power people already used) is harder.

**Why instructors cannot archive or delete:** archiving removes a course from students' view
and deletion destroys grade history. Both are owner-level decisions.

## 4. Content — modules, lessons, resources

| Action | Admin | Instructor (owner) | Student (enrolled) |
|--------|-------|--------------------|--------------------|
| Create/edit/delete modules | ✅ | ✅ | ❌ |
| Create/edit/delete lessons | ✅ | ✅ | ❌ |
| Reorder modules and lessons | ✅ | ✅ | ❌ |
| Write lesson Markdown | ✅ | ✅ | ❌ |
| Publish/unpublish a lesson | ✅ | ✅ | ❌ |
| Upload resources (PDF/image/doc) | ✅ | ✅ | ❌ |
| Add links | ✅ | ✅ | ❌ |
| Delete a resource | ✅ | ✅ | ❌ |
| Set resource visibility (students/staff) | ✅ | ✅ | ❌ |
| View student-visible resources | ✅ | ✅ | ✅ |
| View staff-only resources | ✅ | ✅ | ❌ |
| Download files | ✅ | ✅ | ⚠️ only student-visible resources |
| Upload video | ❌ | ❌ | ❌ |

Uploads are capped by `Academy.maxUploadMb` (default 25 MB) and restricted to an allow-list of
MIME types, checked server-side after the object lands in storage.

## 5. Assignments & submissions

| Action | Admin | Instructor (owner) | Student |
|--------|-------|--------------------|---------|
| Create/edit/delete an assignment | ✅ | ✅ | ❌ |
| Publish an assignment | ✅ | ✅ | ❌ |
| Set due date and late policy | ✅ | ⚠️ cannot choose a policy the admin disabled | ❌ |
| View all submissions for an assignment | ✅ | ✅ | ❌ |
| View another student's submission | ✅ | ✅ | ❌ |
| Submit / resubmit own work | ❌ | ❌ | ✅ before deadline per policy |
| Download a submission file | ✅ | ✅ | ⚠️ only their own |
| Grade a submission | ✅ | ✅ | ❌ |
| Change a grade they already gave | ✅ | ✅ (audited) | ❌ |
| Change a grade another instructor gave | ✅ | ❌ | ❌ |
| Return for revision | ✅ | ✅ | ❌ |
| See their own grade and feedback | ❌ | ❌ | ✅ once released |

## 6. Quizzes & exams

| Action | Admin | Instructor (owner) | Student |
|--------|-------|--------------------|---------|
| Create/edit/delete a quiz or exam | ✅ | ✅ | ❌ |
| Add/edit/delete questions and choices | ✅ | ✅ | ❌ |
| Set correct answers | ✅ | ✅ | ❌ |
| Publish / unpublish | ✅ | ✅ | ❌ |
| Set open/close window | ✅ | ✅ | ❌ |
| Set time limit | ✅ | ✅ | ❌ |
| Set attempt limit | ✅ | ⚠️ cannot exceed academy max | ❌ |
| Shuffle questions | ✅ | ✅ | ❌ |
| Start an attempt | ❌ | ❌ | ✅ within window, if attempts remain |
| View own attempt result | ❌ | ❌ | ✅ if released or practice |
| View all attempts for an assessment | ✅ | ✅ | ❌ |
| See correct answers before release | ✅ | ✅ | ❌ |
| Release results | ✅ | ✅ | ❌ |
| Manually grade essay answers | ✅ | ✅ | ❌ |
| Override an attempt score | ✅ | ✅ (audited) | ❌ |
| Delete a submitted attempt | ✅ (audited) | ❌ | ❌ |

**The exam integrity rules, stated plainly:**

1. A student may only start an attempt inside `opensAt..closesAt`, and only if
   `attemptsUsed < maxAttempts`.
2. `expiresAt` is computed server-side at start. Every subsequent write checks it. A client
   that stops sending heartbeats does not get extra time.
3. Questions are served without `isCorrect` on choices. Correct answers are not in the payload
   the browser receives — not hidden in HTML, not in a JSON blob. This is a server-render
   decision, not a CSS trick.
4. Submitting after `expiresAt` is rejected; the attempt is finalised as `EXPIRED` with
   whatever answers were saved.
5. Scores are withheld from students until `resultsReleasedAt` is set.
6. Editing an assessment does not alter any attempt already started, because answers are
   snapshotted per attempt.

## 7. Grades

| Action | Admin | Instructor (owner) | Student |
|--------|-------|--------------------|---------|
| View a course gradebook | ✅ | ✅ | ❌ |
| View own grades | ❌ | ❌ | ✅ |
| Override any grade, any course | ✅ | ❌ | ❌ |
| Override a grade in own course | ✅ | ✅ with mandatory reason | ❌ |
| Change course weights | ✅ | ⚠️ if unlocked | ❌ |
| Export gradebook CSV | ✅ | ✅ | ❌ |
| Export own transcript | ❌ | ❌ | ✅ |
| View grade change history | ✅ | ✅ own courses | ⚠️ own grades only |

Every grade override writes an `AuditEvent` with `{ before, after, reason }`. There is no path
in the application that changes a `Grade` row without writing one.

## 8. Administration surfaces

| Surface | Admin | Instructor | Student |
|---------|-------|-----------|---------|
| Academy settings | ✅ | ❌ | ❌ |
| Audit log | ✅ | ❌ | ❌ |
| Academy-wide dashboard | ✅ | ❌ | ❌ |
| Instructor dashboard | ✅ (any course) | ✅ own courses | ❌ |
| Student dashboard | ❌ | ❌ | ✅ |
| Email/notification settings | ✅ | ❌ | ❌ |
| Impersonate a user | ⚠️ v1.1, audited | ❌ | ❌ |

## 9. Enforcement — how these rules are actually applied

Permissions are not enforced in the UI. Hiding a button is a courtesy, not a control. The
authority lives in one module:

```ts
// lib/auth/guard.ts
requireUser()                                  // any signed-in, active user
requireRole("ADMIN")                           // admin only
requireCourseAccess(courseId, "view"|"teach"|"admin")
requireAssignmentAccess(assignmentId, level)
requireAssessmentAccess(assessmentId, level)
requireSubmissionAccess(submissionId, level)   // student may only reach their own
requireAttemptAccess(attemptId, level)
```

Rules of the codebase:

- Every Server Action and Route Handler begins with a guard call. No exceptions.
- The guard returns the authorised entity. Actions use that entity, never a re-fetch by ID.
- Server Components that read data call a guard too — a URL is user input.
- A student-scoped guard filters by `studentId = session.user.id` in the query itself, so a
  forgotten check returns nothing rather than someone else's data.
- Integration tests assert that each role gets 403/redirect on the routes it should not reach.
  That test file is part of the definition of done for every phase.

## 10. The one asymmetry worth naming

The admin can do everything an instructor can, plus more — but the admin is **not** enrolled in
courses and does **not** submit work or sit exams. Admin power is administrative: create,
configure, correct, audit. It is not a participation role.

This matters for the UI: the admin's course page shows an administrative view (roster, gradebook,
settings, audit) rather than a student's learning view. If the admin needs to see the student
experience, that is what impersonation (v1.1) is for.