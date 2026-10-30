# 00 — Product Brief

## The client

**Golden Academy** is an educational academy. It employs (or contracts) several
**instructors**, each of whom teaches their own courses to their own groups of students.
The academy owner — the person commissioning this system — is the **administrator**.

## The problem

Course material, assignments and grades are spread across file shares, chat threads and
spreadsheets. There is no single page a student can open to see what is due, no reliable
record of who submitted what and when, and no way for the owner to see across all
instructors' courses without asking each one individually.

The owner also wants to *remain in control*. A system where instructors can quietly edit
grade boundaries, delete a question mid-exam, or add a student to a course without anyone
noticing is worse than the spreadsheets.

## The product

A single web application where:

- Every course belongs to exactly one instructor, and the academy owns the whole instance.
- Students enrol and consume: lessons, resources, assignments, quizzes, exams, grades.
- Instructors build and run their courses within guardrails the admin sets.
- The admin can see everything, edit everything, and reconfigure the guardrails — plus
  manage instructors and students academy-wide.

## Tenancy model — read this carefully

"Multi-tenant" here means **one deployment serves the whole academy**, and the isolation
boundary the instructors experience is a **course-level ownership boundary enforced by the
application**, not one database per instructor.

That is a deliberate decision, and it is the right one for this client:

- A separate database per instructor means separate backups, separate migrations, separate
  deploy steps, and no cross-course reporting for the owner. For a single academy with a
  handful to a few dozen instructors, that is pure operational tax with no safety benefit.
- The tenant boundary that matters commercially is **Golden Academy vs. the outside world**,
  not instructor A vs. instructor B. Instructors are staff of one organisation, not
  customers of a SaaS product.
- Course-scoped isolation ("an instructor can only touch courses they own") gives every
  practical guarantee a per-instructor silo would, and adds nothing to operate.

If this ever becomes a SaaS sold to *other* academies, that is a different product with a
different design — `03-data-model.md` notes exactly where the `academyId` scope would be
added, and nothing in the current model blocks it.

## The three roles

| Role | Who | Scope |
|------|-----|-------|
| **Admin** | The academy owner. Typically one, possibly a co-owner. | The whole instance. |
| **Instructor** | A teacher employed by the academy. | Only courses where they are the owner or a co-instructor. |
| **Student** | A learner. | Only courses they are enrolled in, and only their own records. |

The admin is not a separate "super user bolted on top". The admin is the tenant
administrator: same application, wider permission set, plus administrative surfaces
(instructors, students, catalogue, settings, audit) that no other role can see.

## What MVP is

A complete, usable teaching loop, with **no video**:

1. Admin creates instructors and students, creates courses and assigns instructors.
2. Instructor organises a course into modules and lessons, attaches resources
   (PDF, image, link — lightweight files only), publishes the course.
3. Admin or instructor enrols students. Students sign in and see their courses.
4. Instructor posts an assignment with a due date; students submit text and files;
   instructor grades with feedback.
5. Instructor builds a quiz (auto-graded, practice/ungraded) and an exam (graded,
   optionally scheduled and timed); students sit them; objective questions are graded
   automatically, written answers are graded by hand.
6. Students see a gradebook. Instructors see a course gradebook. Admin sees everything
   and can override any grade.
7. Every consequential action is written to an audit log the admin can read.

Explicitly **not** in MVP: live video classes, video upload, chat/messaging, payments,
mobile apps, native push notifications, certificates, SCORM/LTI, plagiarism detection.
See `10-scope-boundaries.md` for the full list and the reasoning.

## What success looks like

- An instructor can run a whole course — material, assignments, exams, grades — without
  asking the admin for anything.
- A student can answer "what do I owe this week?" from one screen.
- The admin can answer "how is every course performing?" from one screen.
- Deploying a change is `git push` → Railway builds and releases, with migrations applied
  automatically. No manual steps.
- Every grade in the system can be traced to who set it, when, and from what.

## Non-goals for the planning phase

This repository currently contains **plans only**. No application code, no schema file
committed to `prisma/`, no dependency installed. Phase 0 in `07-roadmap-mvp.md` is where the
scaffold lands.