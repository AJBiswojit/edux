# PHASE 3 — SERVICE & API DEDUPLICATION REPORT

**Date:** 2026-08-23 · **Base:** Phase 2 (`5316043`) · **Scope:** service → API → data cleanup, no UI refactor, no backend integration.

---

## 1. Audit Summary

A machine-readable dependency map was rebuilt over the current tree (static imports, dynamic/lazy imports, barrel exports, route registrations, feature flags, raw endpoint-string search, service↔endpoint cross-reference, handler-interdependency inspection, mutation-store inspection):

- **179 hooks → 136 hooks** (−43) across 11 service files (11 files kept, none deleted).
- **184 mock endpoint registrations → 141** (−43). One-to-one with the removed hooks — every removed endpoint had exactly one removed (zero-consumer) hook.
- **0 datasets removed.** No component, page, engine or route file modified. No service file deleted.
- Contract closed: every remaining service path resolves to a live mock handler; every remaining mock endpoint has a consumer (question-studio `${action}` template ↔ its 5 concrete action routes, plus the 3 documented keeps).
- All data still flows **Canonical Data → Intelligence Engine → Derived Snapshot → Service/API → UI**; University/JEE/NEET isolation and Phase 1 behavior untouched.

Classification of every hook (A–F per phase rules) was performed; deleted hooks are category **D (UNUSED HOOK + UNUSED ENDPOINT)**, with several category **B/C consolidations** (intelligence view-projections folded into their canonical `/summary` snapshot).

## 2. Active Services

11 service modules remain active: `index.js` (portal CRUD reads + AI), `extra.js` (portals-extra + exam analysis + PYQ + paper generator), `auth.js` (auth + registration + platform), `intelligence.js` (student intelligence snapshot + master profile + canonical attempts/DNA reads), `faculty-intelligence.js` (ONE canonical faculty snapshot), `admin-intelligence.js` (ONE canonical admin snapshot), `faculty-students.js` (directory + 360 + weak-topic + attempt analysis), `faculty-interventions.js` (similar issues + full intervention lifecycle), `question-studio.js` (studio sources/sessions/actions), `exam-agent.js` (exam agent), `query.js` (helper).

Keystone canonical services (all ACTIVE + UNIQUE):

| Hook | Endpoint | Consumers |
|---|---|---|
| useStudentIntelligence | /intelligence/summary | 14 student pages |
| useMasterStudentProfile | /intelligence/profile | ExamAgent, Examinations, Interventions |
| useFacultyIntelligence | /faculty-intelligence/summary | 6 faculty pages/components |
| useAdminIntelligence | /admin-intelligence/summary | 4 admin pages |
| useFacultyStudents / useFacultyStudent360 | /faculty/students · /faculty/students/:id/360 | MyStudents, StudentProfile |
| useInterventions (+ lifecycle mutations) | /faculty/interventions… | intervention center, issues tabs, student pages |
| useQuestionBank / usePYQ* / usePaperGenerator | /faculty/question-bank · pyq-analysis · paper-generator | Assessment Intelligence surfaces |
| useExamAgent* | /student/exam-agent/* | ExamAgent, Examinations |

## 3. Duplicate Services Found

| Duplicate | Canonical | Resolution |
|---|---|---|
| `useStudentIntelligenceDerived` / `useStudentIntelligenceDatasets` (+/derived, /datasets endpoints) | `useStudentIntelligence` → `/intelligence/summary` (embeds profile+datasets+derived) | View-projections removed (B→A) |
| `useAdminIntelligenceDerived` / `useAdminIntelligenceDatasets` / `useMasterInstitutionProfile` | `useAdminIntelligence` → `/admin-intelligence/summary` | Same consolidation; admin + faculty contracts now identical (ONE snapshot route) |
| `useAdminDashboard` (+/admin/dashboard) | `useAdminIntelligence` (admin Dashboard migrated in earlier phases) | Removed (D) |
| `useStudentDashboard`/`useStudentAttendance`/`useStudentAssignments`/`useStudentCourses`/`useCourseDetail`/`useStudentSubjects`/`useCalendarEvents`/`useStudentProfile` | `useStudentIntelligence` (pages migrated earlier) | Removed (D) |
| `useAdminAnalytics`/`useAdminPerformance`/`useAdminPlacements` + `useAdminAttendanceAnalytics`/`useAdminAssignmentAnalytics`/`useAdminExamAnalytics` | Institution Intelligence engines read the same datasets directly | Removed (D; Phase 2 deleted the pages) |
| `usePerformanceAccuracy`, `useAcademicProfile`, `useAcademicResources`, `useAcademicProgress`, `useExamAnalysis` (base) | `useStudentIntelligence`; exam-analysis options+byId endpoints | Removed (D) |
| `useFacultyAiStudio` (GET) | AI Workspace = assistant threads/respond + save POST | Removed (D) |
| `usePaperShares` (GET list) | `usePaperShare` (action POST, kept) | Removed (D) |
| `useIssueGroup`, `useInterventionEffectiveness` | List/detail payloads already carry groups + effectiveness | Removed (D; lifecycle unchanged) |
| `useStudioSession`, `useStudioApproved` | `useStudioSessions` list + per-question actions (bank sync on approve) | Removed (D) |
| `useAITutorThread` | `useAITutorThreads` list payload | Removed (D) |
| `useAIRecommendations`/`useAIWeaknesses`/`useAIPrediction` | Student intelligence snapshot (recommendations/weaknesses derived) | Removed (D) |
| `useGenerateQuiz`/`useGenerateExam` | `/faculty/quiz-builder`, `/faculty/exam-builder` services | Removed (D) |
| `useTestimonials`/`usePricingPlans`/`useFaqs`/`usePlatformStats` | Landing reads canonical `@/mock-data/platform` directly | Removed (D) |
| `useProfileSetup`, `useRegistrationStatus` | AuthContext + register/OTP mutation flow | Removed (D) |

### Compared but NOT duplicates (kept)
- `/faculty/students` (canonical directory with attempt-derived status) vs `/faculty/roster` (16-identity roster for attendance/paper share pickers) — different source, shape and purpose.
- `/student/exams` (examination list) vs `/student/exam-agent/exams` (agent catalog) vs `/student/exam-analysis/options` (analysis option set incl. canonical attempts) — distinct purposes.
- `/faculty/question-bank` vs `/faculty/question-studio` vs `/admin/question-bank` — bank read, studio pipeline, admin bank view.
- `/intelligence/exam-attempts` vs `/faculty/students/:id/exams/:attemptId/analysis` — raw canonical read vs derived per-attempt analysis.

## 4. Duplicate Endpoints Found

Only projection-duplicate endpoint sets existed — the removed intelligence `/profile|/datasets|/derived` routes (admin) and `/datasets|/derived` (student), all byte-subsets of their `/summary` snapshots. No other same-data endpoint pairs found (see "Compared but NOT duplicates").

## 5. Services Deleted

**No service files deleted** (all 11 modules host active hooks). **43 hooks removed** across 7 files:

| Path (file → hook) | Reason | Previous consumers | Migration | Confidence |
|---|---|---|---|---|
| services/index.js → useStudentProfile, useStudentDashboard, useStudentAttendance, useStudentAssignments, useStudentCourses, useCourseDetail, useStudentSubjects, useCalendarEvents | D: zero consumers; pages use useStudentIntelligence | none (migrated in earlier phases) | none needed | 🟢 |
| services/index.js → useAdminDashboard, useAdminAnalytics, useAdminPerformance, useAdminPlacements | D: zero consumers (pages deleted/migrated) | none | none needed | 🟢 |
| services/index.js → useAITutorThread, useAIRecommendations, useAIWeaknesses, useAIPrediction, useGenerateQuiz, useGenerateExam | D: zero consumers | none | none needed | 🟢 |
| services/extra.js → useExamAnalysis, useAcademicProfile, useAcademicResources, useAcademicProgress, usePerformanceAccuracy | D: zero consumers | none | none needed | 🟢 |
| services/extra.js → useFacultyAiStudio, useAdminAttendanceAnalytics, useAdminAssignmentAnalytics, useAdminExamAnalytics, usePaperShares | D: zero consumers | none | none needed | 🟢 |
| services/auth.js → useRegistrationStatus, useProfileSetup, useTestimonials, usePricingPlans, useFaqs, usePlatformStats | D: zero consumers | none | none needed | 🟢 |
| services/intelligence.js → useStudentIntelligenceDerived, useStudentIntelligenceDatasets | B→A: projection of /summary | none | none needed | 🟢 |
| services/admin-intelligence.js → useAdminIntelligenceDerived, useAdminIntelligenceDatasets, useMasterInstitutionProfile | B→A: projections of /summary | none | none needed | 🟢 |
| services/faculty-interventions.js → useIssueGroup, useInterventionEffectiveness | D: zero consumers; data embedded in list payloads | none | none needed; default export object trimmed | 🟢 |
| services/question-studio.js → useStudioSession, useStudioApproved | D: zero consumers | none | none needed; default export object trimmed | 🟢 |

## 6. Endpoints Deleted (43)

| Endpoint(s) | Reason | Consumers checked | Confidence |
|---|---|---|---|
| /student/profile, /student/dashboard, /student/attendance, /student/assignments, /student/courses, /student/courses/:id, /student/subjects, /student/events | zero consumers after intelligence migration | hook, raw-string grep, route registry | 🟢 |
| /admin/dashboard, /admin/analytics, /admin/performance, /admin/placements | same | same | 🟢 |
| /admin/attendance-analytics, /admin/assignment-analytics, /admin/exam-analytics | pages removed Phase 2; engines read datasets | same | 🟢 |
| /intelligence/datasets, /intelligence/derived | projection of /summary | same | 🟢 |
| /admin-intelligence/profile, /admin-intelligence/datasets, /admin-intelligence/derived | projection of /summary | same | 🟢 |
| /student/exam-analysis (base), /student/academic-profile, /student/academic-resources, /student/academic-progress, /student/performance-accuracy | zero consumers (static examAnalysis dataset remains the :id fallback) | same | 🟢 |
| /faculty/ai-studio (GET) | superseded page fetch | save POST + threads verified live | 🟢 |
| /faculty/paper-generator/shares (GET) | unread list | share POST verified live | 🟢 |
| /faculty/similar-issues/:id | unread; list carries full groups | groupedPayload() unaffected | 🟢 |
| /faculty/interventions/:id/effectiveness | unread; effectiveness still computed into every intervention payload | lifecycle verified by new tests | 🟢 |
| /faculty/question-studio/sessions/:id (GET), /faculty/question-studio/approved (GET) | unread; bank sync happens via approve action | approve route verified live | 🟢 |
| /ai/tutor/threads/:id, /ai/recommendations, /ai/weaknesses, /ai/prediction | zero consumers | same | 🟢 |
| /ai/generate-quiz, /ai/generate-exam | zero consumers (builders use own services) | QuizBuilder/ExamBuilder verified | 🟢 |
| /platform/testimonials, /platform/pricing, /platform/faqs, /platform/stats | landing reads mock-data/platform directly | landing imports verified | 🟢 |
| /auth/profile-setup, /auth/registration/status | AuthContext-driven flow; register/verify handlers untouched | auth-context.jsx verified | 🟢 |

## 7. Services Consolidated

- Student Intelligence: `profile | datasets | derived | summary` → **`summary` (+ active `/profile`)**, mirroring the faculty contract. `/exam-attempts` and `/exam-dna-signals` retained (unique, non-projection data — see Manual Review).
- Admin Intelligence: `profile | datasets | derived | summary` → **`summary`** (contract now identical to faculty's ONE-snapshot pattern).
- Faculty Intelligence: already canonical (one `/summary`) — confirmed, unchanged.

## 8. Consumers Migrated

None required — every removed hook had **zero** consumers. No UI was touched; service contracts for all consumed hooks (`{ data, isLoading, isError, refetch }` / mutation APIs) are unchanged.

## 9. Caching/Recomputation Changes

- **Added lazy singleton memoization** at the mock-adapter layer for the two pure-engine snapshots: `/faculty-intelligence/summary` and `/admin-intelligence/summary` (verified: inputs are immutable module-level datasets; no localStorage/attempt-store coupling; no mock route mutates them). Runtime behavior identical; proven identical-payload by tests.
- **Intentionally NOT memoized**: `/intelligence/summary` — it re-derives `attemptSignals` evidence from the canonical attempt store on every call, and attempts change as the Exam Agent runs (freezing it would break Dashboard/DNA freshness).
- No new state libraries or cache frameworks introduced; React Query remains the client cache.

## 10. Manual Review Candidates (kept intentionally)

| Item | Why kept |
|---|---|
| `useIntelligenceExamAttempts` + `/intelligence/exam-attempts` | Phase-1 canonical attempt read path; unique non-projection data; zero consumers today but explicitly built as foundation API for future consumers. Class F. |
| `useIntelligenceExamDnaSignals` + `/intelligence/exam-dna-signals` | Phase-2 canonical DNA-evidence read; unique data; same rationale. Class F. |
| `useParentProfile` + `/parent/profile` | Parent portal is a preserved, feature-flagged vertical (product decision); deleting one hook of 16 would fragment it. Class F. |
| Service `default` export objects (faculty-students, faculty-interventions, question-studio, exam-agent) | Zero consumers, but they aggregate live hooks and serve as the modules' public façade; trimmed only the removed names. |

## 11. Before vs After Metrics

| Metric | Before | After | Δ |
|---|---|---|---|
| Service files | 11 | 11 | 0 |
| Service hooks (exported use*) | 179 | 136 | **−43** |
| Mock endpoint registrations | 184 | 141 | **−43** |
| API files (`src/api/*.js`) | 14 | 14 | 0 |
| Intelligence modules | 73 | 73 | 0 |
| Components | 187 | 187 | 0 |
| Pages | 106 | 106 | 0 |
| Datasets | 28 | 28 | 0 |
| Test files | 2 | 3 | +1 (service-surface suite) |
| Zero-consumer hooks remaining | 46 | 3 (all documented keeps) | −43 |

## 12. Automated Tests

`npm test` → **3 files, 69/69 pass**:
- `tests/intelligence/student-360-domain-isolation.test.js` (10, Phase 1 — untouched)
- `test/student-360-domain-isolation.test.js` (9, legacy — untouched)
- **NEW `tests/services/service-surface.test.js` (50)**: drives the real mock-server dispatch with zeroed latency; verifies canonical snapshots (student/faculty/admin), faculty directory + Student 360, exam-attempt University/JEE/NEET isolation with leak-free filtering, question bank/PYQ/competitive(JEE+NEET)/University-PYQ availability, paper generator+library, intervention lifecycle fields (status/baseline/effectiveness embedded), exam analysis options+byId — and asserts all 34 retired GET endpoints + 3 retired mutations now 404.

## 13. Build

`npm run build` → **pass** (Vite 5; zero unresolved imports/exports; only the pre-existing chunk-size warning).

## 14. Route Smoke

Production build served; all required routes return 200 app-shell (client-rendered):
- STUDENT ✓ /student/exam-analysis ✓ /student/performance-accuracy ✓ /student/exam-agent ✓ /student/interventions
- FACULTY ✓ /faculty/my-students ✓ /faculty/my-students/:studentId ✓ /faculty/question-intelligence (Question/PYQ/Paper-Generator/Paper-Library tabs) ✓ /faculty/paper-generator + /faculty/paper-library (LegacyFacultyRedirect → canonical tabs, as before) ✓ /faculty/assessment-intelligence (app-shell served; no such route — pre-existing behavior, canonical nav path is /faculty/question-intelligence)
- ADMIN ✓ /admin ✓ /admin/institution-intelligence ✓ /admin/reports ✓ /admin/ai-workspace

## 15. University/JEE/NEET Verification

- Phase-1 suites green (19/19) — classification and isolation engines untouched.
- New suite proves via the canonical attempt read API: JEE filter → only JEE; NEET filter → only NEET; University filter → only University; no cross-domain leakage; all three contexts present in seed + live attempts.
- Faculty snapshot still serves `competitiveQuestionIntelligence.pyqRecords` (JEE & NEET) and `universityPyq` (University) — one canonical dataset, no copies.
- Student 360 keeps `subjects.university` / `subjects.competitive.JEE` / `subjects.competitive.NEET` pools.

## 16. Regression Results

- Full test suite: 69/69 ✓ · Build ✓ · Route smoke 18 routes ✓
- Data integrity (section 22): University questions ✓ JEE questions ✓ NEET questions ✓ University PYQs ✓ JEE PYQs ✓ NEET PYQs ✓ student attempts ✓ Faculty Student 360 ✓ intervention lifecycle ✓ Paper Generator ✓ Paper Library — verified programmatically.
- Endpoint↔service contract: every service path has a live handler; mutation stores (attempts, studio sessions, paper shares, intervention status, registration) untouched.

## 17. Remaining Technical Debt

1. `test/` legacy duplicate suite (from Phase 2 manual-review) — consolidate into `tests/intelligence/`.
2. Service `default` export objects without consumers — decide façade policy in a service-layer conventions pass.
3. `/faculty/assessment-intelligence` has no route (nav uses `/faculty/question-intelligence`); legacy redirect map could gain an alias — behavior change, deferred.
4. Some pages fetch the full `/intelligence/summary` for narrow needs; field-level query contracts belong with real-backend design.
5. Parent vertical hooks remain untested end-to-end (portal flag off).

## 18. Recommended Phase 4

Stop here per phase rules. Candidates: (a) StudentProfile/Student360 UI consolidation; (b) InterventionCenter component dedup (4 variants) with prop-driven data passing (parent→child, section-10 concerns); (c) extract PYQ/AI-Studio content components out of page files; (d) decide on the 3 manual-review foundation hooks when their future consumers land; (e) attempt-derived freshness model: if/when faculty snapshot must reflect live attempts, introduce a versioned invalidation key instead of the current singleton.

---

# APPENDIX — FULL SERVICE INVENTORY (after Phase 3)

Classification: **A** = active+unique · **K** = documented keep (manual review). Mutation hooks show "(mutation)".

| Hook | Service file | Endpoint | Consumers / Status |
|---|---|---|---|
| useAdminIntelligence | services/admin-intelligence.js | /admin-intelligence/summary | pages/admin/AIWorkspace.jsx;pages/admin/Dashboard.jsx;pages/admin/InstitutionIntelligence.jsx;pages/admin/Reports.jsx |
| useForgotPassword | services/auth.js | (mutation) | pages/auth/ForgotPassword.jsx |
| useVerifyOtp | services/auth.js | (mutation) | pages/auth/OTPVerify.jsx |
| useResendOtp | services/auth.js | (mutation) | pages/auth/OTPVerify.jsx;pages/auth/VerifyEmail.jsx |
| useResetPassword | services/auth.js | (mutation) | pages/auth/ResetPassword.jsx |
| useVerifyEmail | services/auth.js | (mutation) | pages/auth/VerifyEmail.jsx |
| useRegistrationOptions | services/auth.js | (mutation) | pages/auth/Register.jsx |
| useRegister | services/auth.js | (mutation) | pages/auth/Register.jsx |
| useRegisterVerifyOtp | services/auth.js | (mutation) | pages/auth/OTPVerify.jsx |
| useBlogPosts | services/auth.js | (mutation) | pages/landing/Blog.jsx;pages/landing/BlogPost.jsx |
| useBlogPost | services/auth.js | (mutation) | pages/landing/BlogPost.jsx |
| useCareers | services/auth.js | (mutation) | pages/landing/Careers.jsx |
| useCaseStudies | services/auth.js | (mutation) | pages/landing/CaseStudies.jsx |
| useNewsletter | services/auth.js | (mutation) | components/landing/faq-blog.jsx |
| useContactForm | services/auth.js | (mutation) | pages/landing/Contact.jsx |
| useExamAgentExams | services/exam-agent.js | /student/exam-agent/exams | pages/student/ExamAgent.jsx;pages/student/Examinations.jsx |
| useExamAgentAttempts | services/exam-agent.js | /student/exam-agent/attempts | pages/student/ExamAgent.jsx |
| useExamAgentAttempt | services/exam-agent.js | /student/exam-agent/attempts/${id} | pages/student/ExamAgent.jsx |
| useSaveExamAgentAttempt | services/exam-agent.js | (mutation) | pages/student/ExamAgent.jsx |
| useStudentPrograms | services/extra.js | /student/programs | pages/student/Programs.jsx |
| useForum | services/extra.js | /student/forum | pages/student/Forum.jsx |
| useSupportTickets | services/extra.js | /student/support | pages/faculty/Support.jsx;pages/student/Support.jsx |
| useAdmitCard | services/extra.js | /student/admit-card | pages/student/Examinations.jsx;pages/student/Exams.jsx |
| useFacultyCourses | services/extra.js | /faculty/courses | pages/faculty/CourseOverview.jsx |
| useFacultyTimetable | services/extra.js | /faculty/timetable | pages/faculty/Timetable.jsx |
| useFacultyAnnouncements | services/extra.js | /faculty/announcements | pages/faculty/Announcements.jsx |
| useFacultyQuizBuilder | services/extra.js | /faculty/quiz-builder | pages/faculty/QuizBuilder.jsx |
| useParentAssignments | services/extra.js | /parent/assignments | pages/parent/Assignments.jsx |
| useParentFees | services/extra.js | /parent/fees | pages/parent/Fees.jsx |
| useParentBehavior | services/extra.js | /parent/behavior | pages/parent/Behavior.jsx |
| useParentEvents | services/extra.js | /parent/events | pages/parent/CalendarPage.jsx |
| useParentDownloads | services/extra.js | /parent/downloads | pages/parent/Downloads.jsx |
| useParentNotifications | services/extra.js | /parent/notifications | pages/parent/Notifications.jsx |
| useParentSettings | services/extra.js | /parent/settings | pages/parent/Settings.jsx |
| useAdminRevenue | services/extra.js | /admin/revenue | pages/admin/Revenue.jsx |
| useAdminPrograms | services/extra.js | /admin/programs | pages/admin/Programs.jsx |
| useAdminSubjects | services/extra.js | /admin/subjects | pages/admin/Subjects.jsx |
| useAdminBatches | services/extra.js | /admin/batches | pages/admin/Batches.jsx |
| useAdminCalendar | services/extra.js | /admin/calendar | pages/admin/AcademicCalendar.jsx |
| useAdminQuestionBank | services/extra.js | /admin/question-bank | pages/admin/QuestionBank.jsx |
| useAdminScholarships | services/extra.js | /admin/scholarships | pages/admin/Scholarships.jsx |
| useAdminCms | services/extra.js | /admin/cms | pages/admin/Cms.jsx |
| useAdminApiConfig | services/extra.js | /admin/api-config | pages/admin/ApiConfig.jsx |
| useAdminDataTools | services/extra.js | /admin/data-tools | pages/admin/DataTools.jsx |
| useExamAnalysisOptions | services/extra.js | /student/exam-analysis/options | pages/student/ExamAnalysis.jsx |
| useExamAnalysisById | services/extra.js | /student/exam-analysis/${id} | pages/student/ExamAnalysis.jsx |
| useMentorWorkspace | services/extra.js | /student/mentor/workspace | pages/student/Mentor.jsx |
| usePaperGenerator | services/extra.js | /faculty/paper-generator | components/assessment-workspace/paper-generator-tab.jsx;components/assessment-workspace/paper-library-tab.jsx |
| useAdminStudents | services/extra.js | /admin/students | pages/admin/Students.jsx |
| useAdminFaculty | services/extra.js | /admin/faculty | pages/admin/Faculty.jsx |
| usePYQAnalysis | services/extra.js | /faculty/pyq-analysis | components/assessment-workspace/pyq-intelligence-tab.jsx;pages/faculty/PYQAnalysis.jsx;pages/faculty/QuestionIntelligence.jsx |
| usePYQFilters | services/extra.js | /faculty/pyq-analysis/filters | pages/faculty/PYQAnalysis.jsx;pages/faculty/QuestionIntelligence.jsx |
| usePYQPatterns | services/extra.js | /faculty/pyq-analysis/patterns | pages/faculty/PYQAnalysis.jsx |
| usePYQAnalytics | services/extra.js | /faculty/pyq-analysis/analytics | pages/faculty/PYQAnalysis.jsx |
| useCreateSupportTicket | services/extra.js | (mutation) | pages/faculty/Support.jsx;pages/student/Support.jsx |
| useUpdateParentSettings | services/extra.js | (mutation) | pages/parent/Settings.jsx |
| usePaperDelete | services/extra.js | (mutation) | components/assessment-workspace/paper-generator-tab.jsx;components/assessment-workspace/paper-library-tab.jsx |
| usePaperDuplicate | services/extra.js | (mutation) | components/assessment-workspace/paper-generator-tab.jsx;components/assessment-workspace/paper-library-tab.jsx |
| usePaperCreate | services/extra.js | (mutation) | components/assessment-workspace/paper-generator-tab.jsx |
| usePaperRegenerate | services/extra.js | (mutation) | components/assessment-workspace/paper-generator-tab.jsx |
| usePaperArchive | services/extra.js | (mutation) | components/assessment-workspace/paper-generator-tab.jsx;components/assessment-workspace/paper-library-tab.jsx |
| useCreateReport | services/extra.js | (mutation) | components/reports-workspace/generate-tab.jsx |
| useDeleteReport | services/extra.js | (mutation) | components/reports-workspace/library-tab.jsx |
| useArchiveReport | services/extra.js | (mutation) | components/reports-workspace/library-tab.jsx |
| usePaperShare | services/extra.js | (mutation) | components/assessment-workspace/paper-parts.jsx |
| useSaveStudioItem | services/extra.js | (mutation) | components/ai-studio/content-studio-tab.jsx;components/ai-studio/evaluation-tab.jsx;components/ai-studio/lesson-planner-tab.jsx |
| useFacultyIntelligence | services/faculty-intelligence.js | /faculty-intelligence/summary | components/institution-workspace/faculty-tab.jsx;pages/faculty/AITeachingAssistant.jsx;pages/faculty/Dashboard.jsx;pages/faculty/QuestionIntelligence.jsx;pages/faculty/Reports.jsx;pages/faculty/TeachingWorkspace.jsx |
| useSimilarIssues | services/faculty-interventions.js | /faculty/similar-issues | components/students-workspace/student-issues-tabs.jsx |
| useInterventions | services/faculty-interventions.js | /faculty/interventions | components/students-workspace/intervention-center.jsx;components/students-workspace/student-issues-tabs.jsx |
| useIntervention | services/faculty-interventions.js | /faculty/interventions/${id} | components/students-workspace/intervention-center.jsx |
| useInterventionPractice | services/faculty-interventions.js | /faculty/interventions/${id}/practice | components/students-workspace/intervention-center.jsx |
| useRelatedResources | services/faculty-interventions.js | /faculty/interventions/related-resources | components/students-workspace/student-issues-tabs.jsx |
| useStudentInterventions | services/faculty-interventions.js | /student/interventions | pages/student/Examinations.jsx;pages/student/Interventions.jsx |
| useStudentInterventionPractice | services/faculty-interventions.js | /student/interventions/${id}/practice | pages/student/Interventions.jsx |
| useStudentInterventionRetest | services/faculty-interventions.js | /student/interventions/${id}/retest | pages/student/Interventions.jsx |
| useFacultyStudentInterventions | services/faculty-interventions.js | /faculty/students/${studentId}/interventions | pages/faculty/StudentProfile.jsx |
| useInterventionStatus | services/faculty-interventions.js | (mutation) | components/students-workspace/intervention-center.jsx;components/students-workspace/student-issues-tabs.jsx |
| useInterventionModify | services/faculty-interventions.js | (mutation) | components/students-workspace/intervention-center.jsx |
| useInterventionAssign | services/faculty-interventions.js | (mutation) | components/students-workspace/intervention-center.jsx |
| useCreateRetest | services/faculty-interventions.js | (mutation) | components/students-workspace/intervention-center.jsx |
| useSubmitInterventionAttempt | services/faculty-interventions.js | (mutation) | pages/student/Interventions.jsx |
| useFacultyStudents | services/faculty-students.js | /faculty/students | pages/faculty/MyStudents.jsx |
| useFacultyStudent360 | services/faculty-students.js | /faculty/students/${id}/360 | pages/faculty/StudentProfile.jsx |
| useWeakTopicQuestions | services/faculty-students.js | /faculty/students/weak-topic-questions | components/students-workspace/student-360-panels.jsx |
| useFacultyAttemptAnalysis | services/faculty-students.js | /faculty/students/${studentId}/exams/${attemptId}/analysis | pages/faculty/FacultyAttemptAnalysis.jsx |
| useMockTests | services/index.js | /student/mock-tests | components/exam-workspace/mock-tests-content.jsx |
| useExams | services/index.js | /student/exams | pages/student/Exams.jsx |
| useStudentSettings | services/index.js | /student/settings | pages/student/Settings.jsx |
| useFacultyAttendance | services/index.js | /faculty/attendance | pages/faculty/Attendance.jsx |
| useFacultyAssignments | services/index.js | /faculty/assignments | pages/faculty/Assignments.jsx |
| useQuestionBank | services/index.js | /faculty/question-bank | pages/faculty/PYQAnalysis.jsx;pages/faculty/QuestionIntelligence.jsx |
| useFacultyResearch | services/index.js | /faculty/research | pages/faculty/Research.jsx |
| useFacultyLecturePlanner | services/index.js | /faculty/lecture-planner | pages/faculty/LecturePlanner.jsx |
| useFacultyExamBuilder | services/index.js | /faculty/exam-builder | pages/faculty/ExamBuilder.jsx |
| useFacultyReports | services/index.js | /faculty/reports | components/reports-workspace/library-tab.jsx |
| useFacultySettings | services/index.js | /faculty/settings | pages/faculty/Settings.jsx |
| useFacultyRoster | services/index.js | /faculty/roster | components/assessment-workspace/paper-parts.jsx;pages/faculty/Attendance.jsx |
| useAdminUsers | services/index.js | /admin/users | pages/admin/Users.jsx |
| useAdminDepartments | services/index.js | /admin/departments | pages/admin/Departments.jsx;pages/admin/Faculty.jsx |
| useAdminCourses | services/index.js | /admin/courses | pages/admin/Courses.jsx |
| useAdminResearch | services/index.js | /admin/research | pages/admin/Research.jsx |
| useAdminRoles | services/index.js | /admin/roles | pages/admin/Roles.jsx |
| useAdminPermissions | services/index.js | /admin/permissions | pages/admin/Permissions.jsx |
| useAdminAuditLogs | services/index.js | /admin/audit-logs | pages/admin/AuditLogs.jsx |
| useAdminAiConfig | services/index.js | /admin/ai-config | pages/admin/AiConfig.jsx |
| useAdminSettings | services/index.js | /admin/settings | pages/admin/Settings.jsx |
| useParentProfile | services/index.js | /parent/profile | — |
| useParentDashboard | services/index.js | /parent/dashboard | pages/parent/Dashboard.jsx |
| useParentProgress | services/index.js | /parent/progress | pages/parent/Progress.jsx |
| useParentAttendance | services/index.js | /parent/attendance | pages/parent/Attendance.jsx |
| useParentPerformance | services/index.js | /parent/performance | pages/parent/Performance.jsx |
| useParentExamResults | services/index.js | /parent/exam-results | pages/parent/ExamResults.jsx |
| useParentCommunication | services/index.js | /parent/communication | pages/parent/Communication.jsx |
| useParentAIInsights | services/index.js | /parent/ai-insights | pages/parent/AIInsights.jsx |
| useParentReports | services/index.js | /parent/reports | pages/parent/Reports.jsx |
| useAITutorThreads | services/index.js | /ai/tutor/threads | pages/student/AITutor.jsx |
| useCopilotSuggestions | services/index.js | /ai/copilot/suggestions | components/layout/ai-copilot.jsx |
| useLearningPath | services/index.js | /ai/learning-path | pages/student/LearningPath.jsx |
| useAIAssistantThreads | services/index.js | /ai/assistant/threads | components/ai-studio/assistant-tab.jsx |
| useAIStats | services/index.js | /ai/stats | pages/student/AITutor.jsx |
| useUpdateStudentSettings | services/index.js | (mutation) | pages/student/Settings.jsx |
| useAITutorRespond | services/index.js | (mutation) | components/layout/ai-copilot.jsx;pages/student/AICopilot.jsx;pages/student/AITutor.jsx |
| useGraphSearch | services/index.js | (mutation) | pages/student/AICopilot.jsx |
| useAIAssistantRespond | services/index.js | (mutation) | components/ai-studio/assistant-tab.jsx |
| useStudentIntelligence | services/intelligence.js | /intelligence/summary | pages/student/Academics.jsx;pages/student/Assignments.jsx;pages/student/Attendance.jsx;pages/student/CalendarPage.jsx;pages/student/CourseDetail.jsx;pages/student/Courses.jsx;pages/student/Dashboard.jsx;pages/student/ExamAgent.jsx;pages/student/Examinations.jsx;pages/student/Mentor.jsx;pages/student/PerformanceAccuracy.jsx;pages/student/Portfolio.jsx;pages/student/ProgressReport.jsx;pages/student/Subjects.jsx |
| useMasterStudentProfile | services/intelligence.js | /intelligence/profile | pages/student/ExamAgent.jsx;pages/student/Examinations.jsx;pages/student/Interventions.jsx |
| useIntelligenceExamAttempts | services/intelligence.js | /intelligence/exam-attempts | — |
| useIntelligenceExamDnaSignals | services/intelligence.js | /intelligence/exam-dna-signals | — |
| useQuestionStudioSummary | services/question-studio.js | /faculty/question-studio | pages/faculty/AIQuestionStudio.jsx |
| useQuestionStudioSources | services/question-studio.js | /faculty/question-studio/sources | components/question-studio/source-library.jsx;components/question-studio/studio-workflow.jsx |
| useQuestionStudioSource | services/question-studio.js | /faculty/question-studio/sources/${id} | components/question-studio/source-library.jsx;components/question-studio/studio-workflow.jsx |
| useStudioSessions | services/question-studio.js | /faculty/question-studio/sessions | pages/faculty/AIQuestionStudio.jsx |
| useAnalyzeSource | services/question-studio.js | (mutation) | components/question-studio/source-library.jsx;components/question-studio/studio-workflow.jsx |
| useUploadSource | services/question-studio.js | (mutation) | pages/faculty/AIQuestionStudio.jsx |
| useGenerateStudioQuestions | services/question-studio.js | (mutation) | components/question-studio/studio-workflow.jsx |
| useStudioQuestionAction | services/question-studio.js | (mutation) | components/question-studio/studio-workflow.jsx |
| === MOCK ENDPOINTS WITHOUT ANY SERVICE PATH MATCH === |  |  |  |
