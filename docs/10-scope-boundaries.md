# 10 — Scope Boundaries & Risks

What is deliberately not being built, and what could go wrong. Both lists are here so they are
decisions rather than surprises.

---

## Part 1 — Deliberately excluded

### Video, entirely

No video upload, no transcoding, no streaming, no live conferencing. This is per instruction and
it is also the right call for an MVP:

- Video hosting is a different product. Transcoding pipelines, adaptive bitrate, CDN contracts,
  storage in terabytes. It would dominate the infrastructure budget and the engineering time.
- Live conferencing is a third product again: WebRTC signalling, TURN servers, recording,
  attendance. Zoom or Meet already do it better and free.
- The teaching loop — material, assignments, exams, grades — is where the value is, and it works
  with PDFs, images and links.

**If video is wanted later:** embed external YouTube/Vimeo links in a lesson (v1.1, cheap), and
integrate Zoom/Meet for live sessions by storing a meeting link on a lesson (v1.1, also cheap).
Neither requires hosting video. That is the recommended path.

### Also excluded from MVP

| Excluded | Why | If needed later |
|----------|-----|-----------------|
| Payments / subscriptions | The academy bills students outside the system | Stripe integration, v2 |
| Chat / messaging | Support burden, moderation, and it duplicates WhatsApp which the academy already uses | v2 |
| Mobile apps | The web app is responsive and installable as a PWA | PWA manifest, v1.1 |
| Native push notifications | Needs app infrastructure | Web push, v2 |
| Certificates with QR verification | Nice-to-have, not core | v1.1 — a generated PDF |
| SCORM / LTI / xAPI | Interop standards for content authored elsewhere; nothing to interoperate with yet | v2 |
| Public API for third parties | No consumer yet | v2 |
| Plagiarism detection | Real vendor cost per submission | v2 |
| Proctoring / lockdown browser | Cannot be honestly delivered by a web app; false confidence is worse than none | never promise it |
| Self-registration | The academy provisions accounts; open signup invites spam and unenrolled users | v1.1 with admin approval |
| Multi-academy SaaS | This is one academy's system | different product; schema is ready |

---

## Part 2 — Risks, ranked by how much they would hurt

### R1 — A permission bug exposes another instructor's course or another student's grades

**Severity:** high. **Likelihood:** medium without discipline.

This is the risk that matters most, because the admin's entire reason for commissioning the
system is control. A single action that accepts a `courseId` and forgets the guard is enough.

**Mitigations, all mandatory:**
- Every action begins with a guard call that returns the authorised entity.
- Guards that scope to a student filter by `studentId` in the query, so a missing check returns
  nothing rather than someone else's row.
- An automated test suite asserts 404/403 for every cross-role access path. It runs on every PR.
- Phase 6 includes a route-by-route review against the permission matrix.

### R2 — Exam integrity is weaker than it appears

**Severity:** high. **Likelihood:** certain, to some degree.

A web app cannot stop a student from opening another tab, using a phone, or sharing questions.
Anyone who claims otherwise is selling something.

**What the system does guarantee:**
- Correct answers are never sent to the browser before release.
- The deadline is enforced server-side; a modified client gains no time.
- Attempts are single-use where configured, and every attempt is recorded with timestamps.
- Editing a question after attempts exist is blocked, so history cannot be rewritten.

**What it does not guarantee:** that the person sitting the exam is the enrolled student.

**Recommendation:** be explicit with the academy that this is an assessment tool, not a proctoring
tool. If high-stakes exams need more, that is an invigilated in-person exam or a paid proctoring
service — not a feature to bolt on here.

### R3 — Ephemeral filesystem silently loses uploaded files

**Severity:** high. **Likelihood:** high if the storage decision is deferred.

Railway containers are ephemeral. Uploads written to disk vanish on the next deploy, and the
failure is silent until a student opens a dead link.

**Mitigation:** object storage from Phase 2, never a local path in production. The storage adapter
makes the driver a config value; the deployment doc says it twice because it is the single most
common way this class of app breaks.

### R4 — Scope creep into video or live classes mid-build

**Severity:** medium-high. **Likelihood:** medium.

The moment instructors see the app, someone will ask for live classes. Adding video mid-MVP would
add weeks and change the hosting economics.

**Mitigation:** the exclusion is documented with a cheap alternative (embed links, meeting URLs).
If it is genuinely needed, it is a v1.1 feature that costs a day, not a rewrite.

### R5 — Grading logic has an edge case that produces wrong grades

**Severity:** high. **Likelihood:** medium.

Wrong grades are worse than a down app — they are a trust failure and they are hard to notice.

**Mitigation:** the grading engine is pure functions with no database access, covered by the unit
test list in `06-server-surface.md`, including partial credit, short-text normalisation, essays,
weighted totals with missing items, and threshold boundaries. Grade overrides are always audited
with before/after values.

### R6 — Migration on deploy breaks production

**Severity:** high. **Likelihood:** low with process.

**Mitigation:** `prisma migrate deploy` in the start command (fails the deploy rather than
half-applying), migrations reviewed before commit, destructive changes done as two deploys,
backups enabled, and a restore rehearsed in Phase 6.

### R7 — Email deliverability

**Severity:** medium. **Likelihood:** medium.

Password reset is the one flow that is completely broken without email. Unverified sending domain
means reset links land in spam, which users read as "the app is broken".

**Mitigation:** verify the sending domain with SPF and DKIM in Phase 1, not Phase 6. Test with a
real Gmail and a real Outlook address before launch.

### R8 — Timezone bugs on deadlines

**Severity:** medium. **Likelihood:** medium.

A 23:59 deadline that a student experiences as 21:59 generates support tickets and disputes.

**Mitigation:** UTC storage, academy timezone for display, server-side deadline checks, and a
test that asserts a deadline renders correctly in the academy's timezone.

### R9 — Single developer, no bus factor

**Severity:** medium. **Likelihood:** certain.

**Mitigation:** these documents. The decisions, the permission matrix and the deployment steps are
written down precisely so the system can be handed over or picked up after a gap. That is a large
part of why this planning phase exists.

### R10 — Railway cost or plan limits surprise

**Severity:** low-medium. **Likelihood:** low.

**Mitigation:** billing alert on the project, object storage off-platform (R2 has no egress fees),
health check wired so a broken deploy does not loop, and log volume kept sane.

---

## Part 3 — Assumptions this plan makes

If any of these is wrong, the affected document needs revisiting:

1. The academy has **one owner/admin** today, possibly two later. Not a multi-academy SaaS.
2. Instructors are **staff**, not independent sellers. They do not need their own branding.
3. Students are **provisioned**, not self-registered.
4. Courses are **term-based and finite**, not open MOOCs with thousands of learners.
5. Files are **lightweight** — PDFs, images, office documents. Not media.
6. The primary language is **English or Arabic**; the UI is built to support either.
7. Hosting is **Railway** now, with the option to move to another Node host later.
8. There is **no existing data** to migrate, or it is small enough for CSV import.

---

## Part 4 — What "done" means for the MVP

Not "the features exist". Specifically:

- An instructor can run a full course cycle without contacting the admin.
- A student can answer "what do I owe this week" from one screen.
- The admin can answer "how is every course doing" from one screen, and can trace any grade to
  who set it and when.
- A permission test suite proves that no role can reach another role's data.
- A deploy is `git push`, and a failed migration cannot reach production.
- A backup has been restored successfully at least once.

Everything else is a later release.