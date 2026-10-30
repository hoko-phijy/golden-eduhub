# 03 — Data Model

Target: PostgreSQL 16 + Prisma 6. This is the proposed schema for the MVP. It is a design,
not a committed migration — the real file lands in `prisma/schema.prisma` in Phase 1.

## Principles

1. **Soft-delete the things that carry history.** Courses, users, enrolments and assessments
   get `archivedAt` rather than deletion. Grades must remain explainable five years later.
2. **Scores are stored, not only computed.** A `grade` row holds the authoritative score so a
   later change to a rubric cannot silently rewrite history. Course totals are cached in
   `gradeSnapshot` and recomputed on demand.
3. **One assessment engine, two flavours.** Quizzes and exams are the same tables with a
   `kind` discriminator. Two parallel implementations would double every grading bug.
4. **Positions, not linked lists.** Ordering uses an integer `position` per parent.
5. **Every consequential write is attributable.** `createdById` / `updatedById` plus the audit
   table.

## Naming conventions

- Tables are `snake_case` via `@@map`, models are `PascalCase`.
- Every table has `id String @id @default(cuid())` — cuid2 is URL-safe and collision-free
  without exposing sequential counts.
- Every table has `createdAt` and `updatedAt`.
- Enums are Postgres enums, named in `PascalCase`.

---

## Identity & tenancy

```prisma
enum Role {
  ADMIN
  INSTRUCTOR
  STUDENT
}

model Academy {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  contactEmail    String?
  logoText        String?
  timezone        String   @default("Africa/Cairo")
  defaultLocale   String   @default("en")
  // guardrails the admin sets, which instructors operate inside
  defaultPassingScore   Int      @default(60)   // percent
  maxUploadMb           Int      @default(25)
  allowLateSubmissions  Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  users           User[]
  courses         Course[]

  @@map("academy")
}
```

There is exactly one `Academy` row today. It exists as a table — rather than as constants in
the code — because the admin needs to edit settings, and because adding a real
`academyId` scope later becomes a column addition instead of a refactor.

```prisma
model User {
  id                 String    @id @default(cuid())
  email              String    @unique
  passwordHash       String
  name               String
  phone              String?
  role               Role
  avatarUrl          String?
  isActive           Boolean   @default(true)
  mustChangePassword Boolean   @default(true)
  lastLoginAt        DateTime?
  academyId          String
  academy            Academy   @relation(fields: [academyId], references: [id])

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  sessions           Session[]
  passwordResets     PasswordReset[]
  coursesOwned       Course[]           @relation("CourseOwner")
  courseStaff        CourseInstructor[]
  enrolments         Enrollment[]
  submissions        Submission[]
  attempts           Attempt[]
  grades             Grade[]            @relation("GradeStudent")
  gradedBy           Grade[]            @relation("GradeGrader")
  notifications      Notification[]
  auditEvents        AuditEvent[]
  filesUploaded      FileObject[]       @relation("FileUploader")

  @@index([role, isActive])
  @@map("user")
}
```

`courseStaff` is the co-instructor join table. It exists in MVP even though only one primary
instructor is exposed in the UI, because adding it later would mean rewriting every course
query.

```prisma
model Session {
  id           String   @id @default(cuid())
  tokenHash    String   @unique      // sha256 of the opaque cookie token
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt    DateTime
  ip           String?
  userAgent    String?
  createdAt    DateTime @default(now())
  lastUsedAt   DateTime @default(now())

  @@index([userId])
  @@map("session")
}

model PasswordReset {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([userId])
  @@map("password_reset")
}
```

---

## Courses

```prisma
enum CourseStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Course {
  id              String       @id @default(cuid())
  academyId       String
  academy         Academy      @relation(fields: [academyId], references: [id])
  title           String
  slug            String
  code            String?      // e.g. "MATH-101"
  summary         String?
  description     String?      // Markdown
  coverFileId     String?
  coverFile       FileObject?  @relation("CourseCover", fields: [coverFileId], references: [id])
  status          CourseStatus @default(DRAFT)
  ownerId         String
  owner           User         @relation("CourseOwner", fields: [ownerId], references: [id])
  passingScore    Int?         // null = inherit academy default
  // grade weights, must sum to 100 when set
  weightAssignments Int?
  weightQuizzes     Int?
  weightExams       Int?
  publishedAt     DateTime?
  archivedAt      DateTime?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  staff           CourseInstructor[]
  modules         Module[]
  enrolments      Enrollment[]
  assignments     Assignment[]
  assessments     Assessment[]
  resources       Resource[]
  grades          Grade[]
  announcements   Announcement[]

  @@unique([academyId, slug])
  @@index([ownerId, status])
  @@map("course")
}

model CourseInstructor {
  id         String   @id @default(cuid())
  courseId   String
  course     Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  canGrade   Boolean  @default(true)
  canEditCourse Boolean @default(true)
  createdAt  DateTime @default(now())

  @@unique([courseId, userId])
  @@map("course_instructor")
}

model Module {
  id        String   @id @default(cuid())
  courseId  String
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title     String
  summary   String?
  position  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  lessons   Lesson[]

  @@index([courseId, position])
  @@map("module")
}

model Lesson {
  id          String   @id @default(cuid())
  moduleId    String
  module      Module   @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  title       String
  contentMd   String?          // Markdown body
  position    Int
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  resources   Resource[]

  @@index([moduleId, position])
  @@map("lesson")
}

model Enrollment {
  id          String    @id @default(cuid())
  courseId    String
  course      Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  studentId   String
  student     User      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  status      EnrollmentStatus @default(ACTIVE)
  enrolledById String?
  enrolledAt  DateTime  @default(now())
  completedAt DateTime?

  @@unique([courseId, studentId])
  @@index([studentId, status])
  @@map("enrollment")
}

enum EnrollmentStatus {
  ACTIVE
  COMPLETED
  WITHDRAWN
}
```

---

## Files & resources

```prisma
enum FileKind {
  PDF
  IMAGE
  DOCUMENT     // docx, xlsx, pptx
  OTHER
}

model FileObject {
  id           String   @id @default(cuid())
  // storage adapter key, e.g. R2 object key or /data/uploads/<key>
  storageKey   String   @unique
  originalName String
  mimeType     String
  sizeBytes    Int
  kind         FileKind
  uploadedById String?
  uploadedBy   User?    @relation("FileUploader", fields: [uploadedById], references: [id])
  createdAt    DateTime @default(now())

  resourceFiles   Resource[]  @relation("ResourceFile")
  submissionFiles SubmissionFile[]
  courseCovers    Course[]    @relation("CourseCover")
  assignmentBriefs Assignment[] @relation("AssignmentBrief")

  @@map("file_object")
}

enum ResourceType {
  LINK
  FILE
}

model Resource {
  id           String       @id @default(cuid())
  courseId     String
  course       Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessonId     String?      // optional: attached to a specific lesson
  lesson       Lesson?      @relation(fields: [lessonId], references: [id], onDelete: SetNull)
  title        String
  description  String?
  type         ResourceType
  url          String?      // for LINK
  files        ResourceFile[]
  visibility   ResourceVisibility @default(STUDENTS)
  position     Int          @default(0)
  createdById  String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  @@index([courseId, position])
  @@map("resource")
}

model ResourceFile {
  resourceId String
  resource   Resource   @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  fileId     String
  file       FileObject @relation("ResourceFile", fields: [fileId], references: [id])

  @@id([resourceId, fileId])
  @@map("resource_file")
}

enum ResourceVisibility {
  STUDENTS      // enrolled students + course staff + admin
  STAFF         // course staff + admin only
}
```

A `Resource` is a link **or** a set of files. Keeping them one table means the UI has one
list, one ordering, one permission check.

---

## Assignments

```prisma
enum LatePolicy {
  BLOCK          // submissions closed at due date
  ALLOW_FLAG     // accepted, marked late
  ALLOW_UNTIL    // accepted until lateUntil, marked late
}

enum SubmissionStatus {
  NOT_STARTED
  SUBMITTED
  LATE
  GRADED
  RETURNED       // graded and released to the student
}

model Assignment {
  id            String     @id @default(cuid())
  courseId      String
  course        Course     @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title         String
  instructionsMd String?
  briefFileId   String?
  briefFile     FileObject? @relation("AssignmentBrief", fields: [briefFileId], references: [id])
  maxPoints     Int        @default(100)
  dueAt         DateTime?
  latePolicy    LatePolicy @default(ALLOW_FLAG)
  lateUntil     DateTime?
  allowText     Boolean    @default(true)
  allowFiles    Boolean    @default(true)
  maxFiles      Int        @default(5)
  isPublished   Boolean    @default(false)
  weight        Int        @default(0)   // contribution inside the assignments category
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  submissions   Submission[]

  @@index([courseId, dueAt])
  @@map("assignment")
}

model Submission {
  id           String           @id @default(cuid())
  assignmentId String
  assignment   Assignment       @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  studentId    String
  student      User             @relation(fields: [studentId], references: [id], onDelete: Cascade)
  attemptNo    Int              @default(1)   // resubmissions increment; latest wins
  textAnswer   String?
  status       SubmissionStatus @default(SUBMITTED)
  submittedAt  DateTime         @default(now())
  files        SubmissionFile[]
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  @@unique([assignmentId, studentId, attemptNo])
  @@index([assignmentId, status])
  @@map("submission")
}

model SubmissionFile {
  submissionId String
  submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  fileId       String
  file         FileObject @relation(fields: [fileId], references: [id])

  @@id([submissionId, fileId])
  @@map("submission_file")
}
```

---

## Assessments — quizzes and exams on one engine

```prisma
enum AssessmentKind {
  QUIZ
  EXAM
}

enum QuestionType {
  SINGLE_CHOICE
  MULTIPLE_CHOICE
  TRUE_FALSE
  SHORT_TEXT
  ESSAY
}

enum AttemptStatus {
  IN_PROGRESS
  SUBMITTED
  EXPIRED       // auto-submitted by deadline
  GRADED
}

model Assessment {
  id             String         @id @default(cuid())
  courseId       String
  course         Course         @relation(fields: [courseId], references: [id], onDelete: Cascade)
  kind           AssessmentKind
  title          String
  instructionsMd String?
  isPublished    Boolean        @default(false)
  weight         Int            @default(0)  // inside its category

  // quiz behaviour
  isPractice     Boolean        @default(false)  // practice => ungraded, answers shown
  maxAttempts    Int?           // null = unlimited (quizzes); exams use 1
  showAnswers    Boolean        @default(false)
  passingScore   Int?           // percent, optional per assessment

  // scheduling & timing (mainly exams)
  opensAt        DateTime?
  closesAt       DateTime?
  timeLimitMins  Int?           // null = no limit
  shuffleQuestions Boolean      @default(false)

  // grading
  partialCredit  Boolean        @default(true)
  requiresManualGrading Boolean @default(false)  // derived, but stored for filtering
  resultsReleasedAt DateTime?

  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  questions      Question[]
  attempts       Attempt[]

  @@index([courseId, kind])
  @@map("assessment")
}

model Question {
  id           String       @id @default(cuid())
  assessmentId String
  assessment   Assessment   @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  type         QuestionType
  prompt       String
  points       Int          @default(1)
  position     Int
  // accepted answers for SHORT_TEXT (normalised comparison), plus model answer for ESSAY
  acceptedAnswers String[]  @default([])
  explanationMd   String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  choices      QuestionChoice[]
  answers      Answer[]

  @@index([assessmentId, position])
  @@map("question")
}

model QuestionChoice {
  id         String   @id @default(cuid())
  questionId String
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  label      String
  isCorrect  Boolean  @default(false)
  position   Int

  @@index([questionId, position])
  @@map("question_choice")
}

model Attempt {
  id           String        @id @default(cuid())
  assessmentId String
  assessment   Assessment    @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  studentId    String
  student      User          @relation(fields: [studentId], references: [id], onDelete: Cascade)
  attemptNo    Int           @default(1)
  status       AttemptStatus @default(IN_PROGRESS)
  startedAt    DateTime      @default(now())
  expiresAt    DateTime?     // startedAt + timeLimit, authoritative on the server
  submittedAt  DateTime?
  scorePoints  Int?          // null until graded
  maxPoints    Int?
  requiresManualGrading Boolean @default(false)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  answers      Answer[]

  @@unique([assessmentId, studentId, attemptNo])
  @@index([assessmentId, status])
  @@map("attempt")
}

model Answer {
  id          String        @id @default(cuid())
  attemptId   String
  attempt     Attempt       @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  questionId  String
  question    Question      @relation(fields: [questionId], references: [id], onDelete: Cascade)
  // selected choices for choice-based questions
  selectedChoiceIds String[] @default([])
  // free text for SHORT_TEXT and ESSAY
  textAnswer  String?
  awardedPoints Int?        // null = not yet graded (manual types)
  gradedById  String?
  gradedAt    DateTime?
  feedback    String?

  @@unique([attemptId, questionId])
  @@map("answer")
}
```

Notes on decisions inside this block:

- `Answer.awardedPoints` being nullable is what separates auto-graded from manual. The
  grading engine fills it for objective types; essay answers stay `null` until a human
  grades them. "Ungraded" is therefore a query, not a flag to maintain.
- `Attempt.expiresAt` is set once at start. Server checks compare `now()` to it on every
  write to an attempt. The client timer is cosmetic.
- Questions are copied into the attempt as `Answer` rows at start time, so editing the
  assessment afterwards cannot mutate a submitted attempt.

---

## Grades

```prisma
enum GradedItemKind {
  ASSIGNMENT
  QUIZ
  EXAM
}

model Grade {
  id           String         @id @default(cuid())
  courseId     String
  course       Course         @relation(fields: [courseId], references: [id], onDelete: Cascade)
  studentId    String
  student      User           @relation("GradeStudent", fields: [studentId], references: [id], onDelete: Cascade)
  kind         GradedItemKind
  assignmentId String?
  assessmentId String?
  scorePoints  Decimal?       @db.Decimal(7, 2)
  maxPoints    Decimal?       @db.Decimal(7, 2)
  percent      Decimal?       @db.Decimal(5, 2)
  isOverride   Boolean        @default(false)
  overrideReason String?
  gradedById   String?
  gradedBy     User?          @relation("GradeGrader", fields: [gradedById], references: [id])
  releasedAt   DateTime?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  @@unique([studentId, assignmentId])
  @@unique([studentId, assessmentId])
  @@index([courseId, studentId])
  @@map("grade")
}

model GradeSnapshot {
  id          String   @id @default(cuid())
  courseId    String
  studentId   String
  weightedPercent Decimal @db.Decimal(5,2)
  letterGrade String?
  isPassing   Boolean
  computedAt  DateTime @default(now())

  @@unique([courseId, studentId])
  @@map("grade_snapshot")
}
```

`Grade` is the per-item authoritative score. `GradeSnapshot` is a cache of the course total,
recomputed whenever any component grade changes. Keeping the cache means the gradebook page
for 40 students × 12 items is one query, not 480.

---

## Communication & audit

```prisma
enum NotificationType {
  ASSIGNMENT_POSTED
  ASSESSMENT_POSTED
  SUBMISSION_GRADED
  RESULTS_RELEASED
  ENROLLED
  ACCOUNT_CREATED
  ANNOUNCEMENT
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  body      String?
  linkUrl   String?
  readAt    DateTime?
  emailStatus EmailStatus     @default(PENDING)
  createdAt DateTime          @default(now())

  @@index([userId, readAt])
  @@map("notification")
}

enum EmailStatus {
  PENDING
  SENT
  FAILED
  SKIPPED
}

model Announcement {
  id        String   @id @default(cuid())
  courseId  String
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  authorId  String
  title     String
  bodyMd    String
  createdAt DateTime @default(now())

  @@index([courseId, createdAt])
  @@map("announcement")
}

model AuditEvent {
  id         String   @id @default(cuid())
  actorId    String?
  actor      User?    @relation(fields: [actorId], references: [id], onDelete: SetNull)
  action     String            // e.g. "grade.override", "course.publish"
  entityType String            // "Course", "Grade", "User"
  entityId   String
  diff       Json?             // { before, after } for consequential edits
  ip         String?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@index([actorId, createdAt])
  @@map("audit_event")
}
```

`AuditEvent` is append-only. No update or delete path exists in the application code; if a
mistake is recorded, a corrective event is recorded too. That is the point of an audit log.

---

## Where a real multi-academy SaaS would slot in

If Golden Edu Hub ever becomes a product sold to other academies, the change is:

1. `Academy` becomes a proper tenant with its own users, and `Course.academyId`,
   `User.academyId` become the isolation keys.
2. Every guard helper takes `academyId` from the session and adds it to every `where` clause.
3. Optionally, Postgres row-level security as a second belt.

Nothing in the current schema prevents this: `academyId` already exists on `Course` and
`User`. That cost — one redundant column today — is why it is there.

## Index strategy, briefly

The queries that will run most and their indexes:

| Query | Index |
|-------|-------|
| Student's course list | `enrollment(studentId, status)` |
| Course gradebook | `grade(courseId, studentId)` |
| Instructor's submission inbox | `submission(assignmentId, status)` |
| Grading queue for essays | `attempt(assessmentId, status)` + `attempt.requiresManualGrading` |
| Student's due-soon list | `assignment(courseId, dueAt)` |
| Audit viewer | `audit_event(actorId, createdAt)` |

## Seed data

`prisma/seed.ts` creates one academy, one admin, two instructors, ~10 students, two courses
with modules/lessons/resources, one assignment with submissions, one quiz, and one exam with
a mixed question set. Enough to demo the whole loop and to run the end-to-end tests against.