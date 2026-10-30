# 06 — Server Surface

Every mutation and every non-page endpoint, grouped by domain. This is the contract the
frontend builds against, so it is worth fixing before either side is written.

Conventions for every Server Action:

```ts
"use server"
// 1. guard first — always
// 2. Zod-parse the input
// 3. do the work in a transaction if it touches more than one table
// 4. write an AuditEvent if the action is consequential
// 5. revalidatePath the affected routes
// 6. return a discriminated result: { ok: true, data } | { ok: false, error, fieldErrors? }
```

Actions never throw to the client for expected failures (validation, permission, policy). They
return a result the form renders. Unexpected exceptions are logged and reported, and the user
sees a generic message.

---

## auth

| Action | Guard | Input | Effect |
|--------|-------|-------|--------|
| `signIn` | none | email, password | Verify Argon2id hash, create session, set cookie. Rate-limited per IP+email. Generic failure message |
| `signOut` | session | — | Delete session row, clear cookie |
| `signOutEverywhere` | session | — | Delete all sessions for the user |
| `requestPasswordReset` | none | email | Create token, email link. Always returns success |
| `resetPassword` | token | token, newPassword | Validate token, set hash, revoke all sessions |
| `changeOwnPassword` | session | current, new | Verify current, set new, clear `mustChangePassword` |
| `updateOwnProfile` | session | name, phone | Update own record |

## admin — users

| Action | Guard | Effect |
|--------|-------|--------|
| `createInstructor` | ADMIN | Create user with role INSTRUCTOR, temp password, `mustChangePassword` |
| `createStudent` | ADMIN | Same, role STUDENT |
| `updateUser` | ADMIN | Name, email, phone. Email change requires uniqueness check |
| `deactivateUser` | ADMIN | `isActive = false`, revoke sessions |
| `reactivateUser` | ADMIN | `isActive = true` |
| `resetUserPassword` | ADMIN | Generate temp password, force change, revoke sessions, audit |
| `changeUserRole` | ADMIN | Audited. Guarded against demoting the last admin |
| `importStudentsCsv` | ADMIN | Parse, validate, preview, then create in a transaction; returns per-row report |

## admin — academy

| Action | Guard | Effect |
|--------|-------|--------|
| `updateAcademySettings` | ADMIN | Name, contact, timezone, locale, defaults, upload cap, late policy |
| `lockCourseWeights` | ADMIN | Prevents instructors editing weights on a course |
| `reassignCourseOwner` | ADMIN | Change `ownerId`, audit with before/after |

## courses

| Action | Guard | Effect |
|--------|-------|--------|
| `createCourse` | ADMIN | Title, slug (auto from title, editable), owner, status |
| `updateCourse` | `requireCourseAccess(id,"teach")` | Title, summary, description, cover |
| `publishCourse` | teach | `status = PUBLISHED`, `publishedAt`, notify enrolled students |
| `unpublishCourse` | teach | Back to DRAFT; students lose access |
| `archiveCourse` | ADMIN | `status = ARCHIVED`, `archivedAt` |
| `deleteCourse` | ADMIN | Hard delete with typed confirmation; blocked if graded submissions exist unless forced |
| `updateCourseGrading` | teach or ADMIN | Passing score, weights. Validates weights sum to 100. Blocked if admin locked |
| `addCoInstructor` | ADMIN | v1.1 UI, action exists |
| `removeCoInstructor` | ADMIN | |

## content

| Action | Guard | Effect |
|--------|-------|--------|
| `createModule` / `updateModule` / `deleteModule` | teach | Delete cascades lessons; requires confirmation |
| `reorderModules` | teach | Accepts ordered id array, writes `position` in a transaction |
| `createLesson` / `updateLesson` / `deleteLesson` | teach | Markdown body, publish flag |
| `reorderLessons` | teach | Within a module |
| `toggleLessonPublished` | teach | |

## resources & files

| Action | Guard | Effect |
|--------|-------|--------|
| `createLinkResource` | teach | Title, url, description, lessonId?, visibility |
| `attachFileResource` | teach | `fileId` from the upload flow, title, visibility |
| `updateResource` | teach | Title, description, visibility, lesson attachment |
| `deleteResource` | teach | Removes the row; the `FileObject` is garbage-collected by a later sweep |
| `reorderResources` | teach | |
| `deleteFile` | uploader or ADMIN | Only if unreferenced |

Route handlers: `POST /api/uploads/sign`, `POST /api/uploads/complete`, `GET /api/files/[id]`.

## enrolments

| Action | Guard | Effect |
|--------|-------|--------|
| `enrollStudent` | teach | Create `Enrollment`, notify student |
| `enrollStudentsBulk` | teach or ADMIN | Array of studentIds; skips existing; returns report |
| `unenrollStudent` | teach | `status = WITHDRAWN` (not deleted — grades must survive) |
| `markCourseCompleted` | teach | `status = COMPLETED`, `completedAt` |

## assignments

| Action | Guard | Effect |
|--------|-------|--------|
| `createAssignment` | teach | Title, instructions, brief file, due date, policy, points, submission options |
| `updateAssignment` | teach | Same fields |
| `publishAssignment` | teach | `isPublished = true`, notify enrolled students |
| `unpublishAssignment` | teach | |
| `deleteAssignment` | teach | Blocked if submissions exist unless forced (audited) |
| `submitAssignment` | student enrolled | Validate window and late policy, create `Submission` with `attemptNo = max+1` |
| `gradeSubmission` | teach | Score, feedback. Creates/updates `Grade`, recomputes snapshot, notifies student |
| `returnSubmission` | teach | `status = RETURNED`, student may resubmit if policy allows |
| `reopenSubmission` | teach | Allows a new attempt after the deadline (audited) |

## assessments — quizzes and exams

| Action | Guard | Effect |
|--------|-------|--------|
| `createAssessment` | teach | `kind`, title, instructions |
| `updateAssessment` | teach | Settings: practice, attempts, window, duration, shuffle, partial credit, show answers |
| `publishAssessment` | teach | Notify enrolled students |
| `deleteAssessment` | teach | Blocked if attempts exist unless forced |
| `addQuestion` | teach | Type, prompt, points, position |
| `updateQuestion` | teach | Blocked if any submitted attempt exists — otherwise it would rewrite history. Editing after attempts requires cloning the assessment |
| `deleteQuestion` | teach | Same restriction |
| `reorderQuestions` | teach | |
| `setQuestionChoices` | teach | Replace the choice set for a choice-based question |
| `startAttempt` | student enrolled | **Server-side checks:** published, inside window, attempts remaining, no in-progress attempt. Creates `Attempt` with `expiresAt` |
| `saveAnswer` | attempt owner | Reject if past `expiresAt` or attempt not `IN_PROGRESS`. Upsert `Answer` |
| `submitAttempt` | attempt owner | Grade objective answers, mark `requiresManualGrading` if essays, finalise status |
| `gradeEssayAnswer` | teach | Set `awardedPoints` + feedback on one `Answer` |
| `finaliseAttemptGrade` | teach | Recompute attempt score from answers, write `Grade` |
| `releaseResults` | teach | Set `resultsReleasedAt`, notify students |
| `overrideAttemptScore` | teach or ADMIN | Manual score with mandatory reason, audited |

## grades

| Action | Guard | Effect |
|--------|-------|--------|
| `overrideGrade` | teach (own course) or ADMIN | Score + mandatory reason, `isOverride = true`, audit with before/after |
| `recomputeCourseGrades` | teach or ADMIN | Rebuild all `GradeSnapshot` rows for a course |
| `releaseGrade` | teach | Set `releasedAt` so the student can see it |

Route handlers: `GET /api/gradebook/[courseId]/export`, `GET /api/transcript/export`.

## notifications

| Action | Guard | Effect |
|--------|-------|--------|
| `markNotificationRead` | owner | |
| `markAllRead` | owner | |
| `sendAnnouncement` | teach (course) or ADMIN (all) | v1.1 for broadcast; course announcements in MVP |

## The grading engine — pure functions, unit tested

```ts
// lib/grading/objective.ts
export function gradeAnswer(question: Question, answer: Answer): number
export function gradeAttempt(assessment: AssessmentWithQuestions, attempt: Attempt): AttemptGrade

// lib/grading/course.ts
export function computeCourseTotal(input: {
  weights: { assignments: number; quizzes: number; exams: number };
  grades: GradeWithKind[];
}): { percent: number; letter: string | null; isPassing: boolean }
```

These take plain data and return plain data. No database access, no `async`. That is what makes
them testable, and grading is the part of this application that must not be wrong.

Test cases that must exist before Phase 4 is done:

- Single choice correct / incorrect.
- Multiple choice: all correct, partial, one wrong selection cancels a correct one, all wrong.
- Short text: exact, case-insensitive, whitespace-padded, accent variant, unaccepted variant.
- Essay: returns "needs manual grading", never zero.
- Weighted total with zero-weight categories, with missing grades (treated as excluded, not
  zero — this is a real decision, documented in `09-decisions.md`).
- Passing threshold boundary: exactly at the threshold passes.

## Validation schemas

One Zod schema per input, in `lib/validation/`, imported by both the form and the action. The
form uses it for instant feedback; the action uses it as the authority. Never trust the client
copy — the server always re-parses.

## Error taxonomy

| Kind | Rendered as |
|------|-------------|
| `VALIDATION` | Field-level messages under inputs |
| `FORBIDDEN` | 403 page or a toast if in-place |
| `NOT_FOUND` | 404 page |
| `POLICY` | Inline explanation ("Submissions closed at …") |
| `CONFLICT` | "This was changed by someone else — reload" |
| `UNEXPECTED` | Generic message + reported to error tracking |

## Revalidation map

| Mutation | Revalidates |
|----------|-------------|
| Course publish | `/my/courses`, `/my`, course page |
| Content edit | course page, lesson page |
| Submission graded | student's assignment page, `/my/grades`, instructor inbox |
| Attempt submitted | attempt result, instructor results, gradebook |
| Grade override | gradebook, student grades, audit |