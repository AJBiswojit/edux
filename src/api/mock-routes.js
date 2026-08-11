/**
 * Mock API route registrations. Every endpoint mirrors the future REST API
 * contract — services are written against `request()` and never touch this
 * file directly, so switching to a real backend requires zero code changes.
 */
import { mockRoute, setMockLatency } from './mock-server'
import { MOCK_USERS, STUDENT_ROSTER, FACULTY_LIST, ADMIN_USERS, DEPARTMENTS } from '@/mock-data/users'
import { REGISTRATION_OPTIONS } from '@/mock-data/registration'
import {
  studentProfile, studentDashboard, studentAttendance, studentAssignments,
  studentCourses, courseDetail, studentSubjects, calendarEvents,
  mockTests, exams,
} from '@/mock-data/student-academics'
import { studentSettings } from '@/mock-data/student-growth'
import {
  facultyProfile, facultyDashboard, facultyAttendance, facultyAssignments, questionBank,
  facultyStudentAnalytics, facultyResearch, facultyLecturePlanner, facultyExamBuilder,
  facultyReports, facultySettings,
} from '@/mock-data/faculty'
import {
  adminDashboard, adminCourses, adminAnalytics, adminPerformance, adminPlacements,
  adminResearch, adminRoles, adminPermissions, adminAuditLogs, adminAiConfig, adminSettings,
} from '@/mock-data/admin'
import {
  parentProfile, parentDashboard, parentProgress, parentAttendance, parentPerformance,
  parentExamResults, parentCommunication, parentAIInsights, parentReports,
} from '@/mock-data/parent'
import {
  aiTutorThreads, aiTutorQuickPrompts, copilotSuggestions, aiTeachingAssistantThreads,
  learningPath, aiRecommendations, aiWeaknesses, aiPrediction,
  graphSearch, aiConversationStats, quizGeneratorSample, examGeneratorSample,
} from '@/mock-data/ai'
import { generateAssistantReply } from './mock-assistant-reply'
import {
  TESTIMONIALS, PRICING_PLANS, FAQS, BLOG_POSTS, CAREERS, CASE_STUDIES, PLATFORM_STATS, CONTACT_INFO,
} from '@/mock-data/platform'

setMockLatency([320, 640])

/* ---------------- Auth ---------------- */
mockRoute('post', '/auth/forgot-password', ({ body }) => ({
  ok: true,
  message: 'If an account exists for that email, a reset link has been sent.',
  verificationId: 'otp_demo_4821',
  demoOtp: '482193',
}))
mockRoute('post', '/auth/verify-otp', ({ body }) => {
  if (String(body?.otp) !== '482193') {
    const err = new Error('Invalid OTP. Check the code and try again.')
    err.response = { status: 400, data: { message: err.message } }
    throw err
  }
  return { ok: true, token: 'otp_verified' }
})
mockRoute('post', '/auth/reset-password', () => ({ ok: true, message: 'Password updated. You can now sign in.' }))
mockRoute('post', '/auth/verify-email', ({ body }) => {
  if (String(body?.otp) !== '731205') {
    const err = new Error('Verification code incorrect.')
    err.response = { status: 400, data: { message: err.message } }
    throw err
  }
  return { ok: true, verified: true }
})
mockRoute('post', '/auth/resend-otp', () => ({ ok: true, message: 'OTP re-sent.', demoOtp: '731205' }))
mockRoute('post', '/auth/profile-setup', ({ body }) => ({ ok: true, user: { ...MOCK_USERS[0], ...body } }))

/* ---------------- Registration (Phase 28) ----------------
   Deterministic prototype flow: register -> OTP (482193) -> profile -> session.
   Persistence follows the existing pattern: the AuthContext writes the user
   to localStorage (APP_CONFIG.USER_KEY); the registered identity is stored
   under the dedicated aurora_registered_students key (prototype registry,
   NOT a second auth architecture). Duplicate email/phone are validated
   against the mock directory + the in-browser registry. */
mockRoute('get', '/auth/registration/options', () => REGISTRATION_OPTIONS)
mockRoute('post', '/auth/register', ({ body }) => {
  const email = String(body?.email ?? '').toLowerCase().trim()
  const phone = String(body?.phone ?? '').replace(/[^0-9]/g, '')

  const existing = MOCK_USERS.some((u) => u.email?.toLowerCase() === email)
  if (existing) {
    const err = new Error('An account already exists for this email — try signing in instead.')
    err.response = { status: 409, data: { message: err.message } }
    throw err
  }

  let registry = []
  try { registry = JSON.parse(window.localStorage.getItem('aurora_registered_students') || '[]') } catch { registry = [] }
  const dupEmail = registry.find((r) => r.email?.toLowerCase() === email)
  if (dupEmail) {
    const err = new Error(dupEmail.verified ? 'An account already exists for this email — try signing in instead.' : 'This email is already registered — verify the OTP we sent earlier, or use a different email.')
    err.response = { status: 409, data: { message: err.message } }
    throw err
  }
  if (registry.some((r) => String(r.phone || '').replace(/[^0-9]/g, '') === phone && phone)) {
    const err = new Error('This mobile number is already registered.')
    err.response = { status: 409, data: { message: err.message } }
    throw err
  }

  const draft = {
    id: `u_stu_${Date.now()}`,
    role: 'student',
    ...body,
    email,
    phone,
    verified: false,
    createdAt: new Date().toISOString(),
  }
  registry.push(draft)
  try { window.localStorage.setItem('aurora_registered_students', JSON.stringify(registry)) } catch { /* storage unavailable */ }

  return { ok: true, verificationId: 'otp_demo_4821', demoOtp: '482193', draftId: draft.id }
})
mockRoute('post', '/auth/register/verify', ({ body }) => {
  if (String(body?.otp) !== '482193') {
    const err = new Error('Invalid code. Use the demo OTP 482193.')
    err.response = { status: 400, data: { message: err.message } }
    throw err
  }
  const email = String(body?.email ?? '').toLowerCase().trim()
  let registry = []
  try { registry = JSON.parse(window.localStorage.getItem('aurora_registered_students') || '[]') } catch { registry = [] }
  const draft = registry.find((r) => r.email?.toLowerCase() === email)
  if (!draft) {
    const err = new Error('Registration session not found — please register again.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  draft.verified = true
  try { window.localStorage.setItem('aurora_registered_students', JSON.stringify(registry)) } catch { /* storage unavailable */ }
  return { ok: true, verified: true }
})
mockRoute('get', '/auth/registration/status', ({ params }) => {
  const email = String(params?.email ?? '').toLowerCase().trim()
  let registry = []
  try { registry = JSON.parse(window.localStorage.getItem('aurora_registered_students') || '[]') } catch { registry = [] }
  const draft = registry.find((r) => r.email?.toLowerCase() === email)
  if (!draft) return { registered: false }
  return { registered: true, verified: !!draft.verified }
})

/* ---------------- Platform (landing) ---------------- */
mockRoute('get', '/platform/testimonials', () => ({ items: TESTIMONIALS }))
mockRoute('get', '/platform/pricing', () => ({ plans: PRICING_PLANS }))
mockRoute('get', '/platform/faqs', () => ({ items: FAQS }))
mockRoute('get', '/platform/blog', () => ({ posts: BLOG_POSTS }))
mockRoute('get', '/platform/blog/:id', ({ params }) => ({ post: BLOG_POSTS.find((p) => String(p.id) === params.id) ?? BLOG_POSTS[0] }))
mockRoute('get', '/platform/careers', () => ({ roles: CAREERS }))
mockRoute('get', '/platform/case-studies', () => ({ studies: CASE_STUDIES }))
mockRoute('get', '/platform/stats', () => ({ stats: PLATFORM_STATS }))
mockRoute('get', '/platform/contact', () => CONTACT_INFO)
mockRoute('post', '/platform/newsletter', () => ({ ok: true, message: 'Subscribed! Watch your inbox for the next issue.' }))
mockRoute('post', '/platform/contact', () => ({ ok: true, message: 'Message received — our team will reply within one business day.' }))

/* ---------------- Student ---------------- */
mockRoute('get', '/student/profile', () => studentProfile)
mockRoute('get', '/student/dashboard', () => studentDashboard)
mockRoute('get', '/student/attendance', () => studentAttendance)
mockRoute('get', '/student/assignments', () => ({ items: studentAssignments }))
mockRoute('get', '/student/courses', () => ({ items: studentCourses }))
mockRoute('get', '/student/courses/:id', ({ params }) => ({ course: params.id === courseDetail.id ? courseDetail : { ...courseDetail, id: params.id, code: params.id, title: studentCourses.find((c) => c.id === params.id)?.title ?? 'Course' } }))
mockRoute('get', '/student/subjects', () => ({ items: studentSubjects }))
mockRoute('get', '/student/events', () => ({ items: calendarEvents }))
mockRoute('get', '/student/mock-tests', () => ({ items: mockTests }))
mockRoute('get', '/student/exams', () => ({ items: exams }))
mockRoute('get', '/student/settings', () => studentSettings)
mockRoute('patch', '/student/settings', ({ body }) => ({ ok: true, settings: { ...studentSettings, ...body } }))

/* ---------------- Faculty ---------------- */
mockRoute('get', '/faculty/profile', () => facultyProfile)
mockRoute('get', '/faculty/dashboard', () => facultyDashboard)
mockRoute('get', '/faculty/attendance', () => facultyAttendance)
mockRoute('get', '/faculty/assignments', () => ({ items: facultyAssignments }))
mockRoute('get', '/faculty/question-bank', () => questionBank)
mockRoute('get', '/faculty/student-analytics', () => facultyStudentAnalytics)
mockRoute('get', '/faculty/research', () => facultyResearch)
mockRoute('get', '/faculty/lecture-planner', () => ({ items: facultyLecturePlanner }))
mockRoute('get', '/faculty/exam-builder', () => facultyExamBuilder)
mockRoute('get', '/faculty/reports', () => ({ items: facultyReports }))
mockRoute('get', '/faculty/settings', () => facultySettings)
mockRoute('get', '/faculty/roster', () => ({ students: STUDENT_ROSTER }))

/* ---------------- Admin ---------------- */
mockRoute('get', '/admin/dashboard', () => adminDashboard)
mockRoute('get', '/admin/users', () => ({ users: ADMIN_USERS }))
mockRoute('get', '/admin/departments', () => ({ departments: DEPARTMENTS }))
mockRoute('get', '/admin/courses', () => ({ courses: adminCourses }))
mockRoute('get', '/admin/analytics', () => adminAnalytics)
mockRoute('get', '/admin/performance', () => adminPerformance)
mockRoute('get', '/admin/placements', () => adminPlacements)
mockRoute('get', '/admin/research', () => adminResearch)
mockRoute('get', '/admin/roles', () => ({ roles: adminRoles }))
mockRoute('get', '/admin/permissions', () => ({ modules: adminPermissions }))
mockRoute('get', '/admin/audit-logs', () => ({ logs: adminAuditLogs }))
mockRoute('get', '/admin/ai-config', () => adminAiConfig)
mockRoute('get', '/admin/settings', () => adminSettings)

/* ---------------- Parent ---------------- */
mockRoute('get', '/parent/profile', () => parentProfile)
mockRoute('get', '/parent/dashboard', () => parentDashboard)
mockRoute('get', '/parent/progress', () => parentProgress)
mockRoute('get', '/parent/attendance', () => parentAttendance)
mockRoute('get', '/parent/performance', () => parentPerformance)
mockRoute('get', '/parent/exam-results', () => ({ items: parentExamResults }))
mockRoute('get', '/parent/communication', () => parentCommunication)
mockRoute('get', '/parent/ai-insights', () => ({ items: parentAIInsights }))
mockRoute('get', '/parent/reports', () => ({ items: parentReports }))

/* ---------------- AI ---------------- */
mockRoute('get', '/ai/tutor/threads', () => ({ threads: aiTutorThreads, quickPrompts: aiTutorQuickPrompts }))
mockRoute('get', '/ai/tutor/threads/:id', ({ params }) => ({ thread: aiTutorThreads.find((t) => t.id === params.id) ?? aiTutorThreads[0] }))
mockRoute('post', '/ai/tutor/respond', ({ body }) => ({ reply: generateTutorReply(body?.text || ''), threadId: body?.threadId || 'new' }))
mockRoute('get', '/ai/copilot/suggestions', ({ params }) => ({
  suggestions: copilotSuggestions[params?.path] ?? copilotSuggestions['/student'],
}))
mockRoute('get', '/ai/learning-path', () => learningPath)
mockRoute('get', '/ai/recommendations', () => aiRecommendations)
mockRoute('get', '/ai/weaknesses', () => aiWeaknesses)
mockRoute('get', '/ai/prediction', () => aiPrediction)
mockRoute('get', '/ai/graph-search', ({ params }) => ({ ...graphSearch, query: params?.q || '' }))
mockRoute('get', '/ai/assistant/threads', () => ({ threads: aiTeachingAssistantThreads }))
/* Assistant replies are simulated (frontend-only prototype) — the reply
   generator is contextual and conversation messages persist into the
   shared dataset so history survives refetch/reload. */
mockRoute('post', '/ai/assistant/respond', ({ body }) => {
  const text = String(body?.text ?? '').trim()
  const reply = generateAssistantReply(text)
  const thread = aiTeachingAssistantThreads[0]
  if (thread) {
    thread.messages.push(
      { id: `u_${Date.now()}`, role: 'user', text, time: new Date().toISOString() },
      { id: `a_${Date.now()}`, role: 'assistant', text: reply, time: new Date().toISOString() }
    )
    thread.updated = 'just now'
  }
  return { reply }
})
mockRoute('post', '/ai/generate-quiz', ({ body }) => ({ quiz: { ...quizGeneratorSample, title: `Generated: ${body?.topic || 'General'} — ${body?.count || 5} questions` } }))
mockRoute('post', '/ai/generate-exam', ({ body }) => ({ exam: examGeneratorSample }))
mockRoute('get', '/ai/stats', () => aiConversationStats)

/* ---------------- Shared lookup ---------------- */
mockRoute('get', '/directory/faculty', () => ({ items: FACULTY_LIST }))
mockRoute('get', '/directory/students', () => ({ items: STUDENT_ROSTER }))
mockRoute('get', '/directory/users', () => ({ items: ADMIN_USERS }))

/* ---------------- AI reply generators ---------------- */

/* Exported so UI chat surfaces can fall back to the deterministic contextual
   engine instead of ever showing an "offline" state (Phase 27.1). */
export function generateTutorReply(question) {
  const q = question.toLowerCase()
  if (q.includes('dijkstra') || q.includes('shortest path')) {
    return 'Let’s work through Dijkstra together.\n\n**Intuition:** Dijkstra is *weighted BFS* — BFS spreads uniformly, Dijkstra always extends the currently-shortest known route (a min-heap does this in O(log V) per step).\n\n**Worked trace (A→E):**\n1. Settle A (0). Relax B:4, C:2.\n2. Settle C (2). Relax B:3 (improved!), D:10, E:12.\n3. Settle B (3). Relax D:8 (improved).\n4. Settle D (8). Relax E:10 (improved via D).\n5. Settle E (10). Done.\n\n**Key insight:** notice how B and E both *improved* — the algorithm never settles a node until its distance is final, which is exactly why negative edges break it.\n\n**Self-check:** why does a negative edge break “settle first”? *(Answer: a settled distance could later improve through the negative edge — the greedy invariant fails.)*\n\nWant 3 practice problems at your level?'
  }
  if (q.includes('tcp') || q.includes('congestion')) {
    return 'TCP congestion control — the AIMD “sawtooth” in one picture:\n\n- **Additive increase:** +1 MSS per RTT while no loss (slowly probe capacity).\n- **Multiplicative decrease:** ×½ on loss (react fast to congestion).\n- **Why half?** TCP can’t tell how severe congestion is, so it compromises — aggressive enough to relieve it, gentle enough to keep throughput.\n- **Modern variants:** CUBIC (Linux default) recovers faster on high-BDP links; BBR estimates bandwidth instead of reacting to loss.\n\n**Quick table:**\n| Variant | Growth | Response to loss |\n|---|---|---|\n| Reno | Linear | Halve |\n| CUBIC | Cubic | Halve |\n| BBR | Model-based | None (estimation) |\n\nI can draw the sawtooth step-by-step or quiz you — your call.'
  }
  if (q.includes('isolation') || q.includes('transaction')) {
    return 'Isolation levels, demystified:\n\n- **READ UNCOMMITTED** — dirty reads allowed (rarely used).\n- **READ COMMITTED** — only committed data; two reads may differ (non-repeatable read).\n- **REPEATABLE READ** — your reads are stable; phantom rows can still appear.\n- **SERIALIZABLE** — full isolation, usually via locks or snapshotting.\n\n**Memory hook:** each level removes exactly one anomaly (dirty read → non-repeatable → phantom). PostgreSQL’s REPEATABLE READ is stricter than the standard (snapshots prevent phantoms too).\n\nWant a 5-question quiz with explanations?'
  }
  if (q.includes('bias') || q.includes('variance')) {
    return 'Bias-variance with the dartboard analogy:\n\n- **High bias** — consistent but off-target aim (underfitting; linear model on curved data).\n- **High variance** — scattered throws (overfitting; deep tree that changes with any data wiggle).\n- **Total error** = bias² + variance + irreducible noise.\n\n**How to reduce:**\n- High bias → more features, more capacity, fewer constraints.\n- High variance → more data, regularisation, ensembles (bagging).\n- Find the sweet spot with **cross-validation**.\n\n**Hook:** BIAS = BLUNT aim; VARIANCE = VOLATILE results.'
  }
  if (q.includes('quiz') || q.includes('test me')) {
    return 'Here’s a 3-question mini-quiz on your current weak areas (Networks & DSA):\n\n**Q1.** In TCP, after a loss event, Reno sets cwnd to… *(a) 1 MSS (b) half — ✓ (c) unchanged (d) double)*\n\n**Q2.** Edmonds–Karp uses which traversal for augmenting paths? *(a) DFS (b) BFS — ✓ (c) Topological (d) Random)*\n\n**Q3.** Which isolation level permits phantoms? *(a) Serializable (b) Repeatable Read — ✓ (c) None (d) Read Uncommitted)*\n\nTell me your answers and I’ll grade with explanations — then we’ll target the one you miss.'
  }
  if (q.includes('plan') || q.includes('revision') || q.includes('midsem')) {
    return 'Here’s a **5-day midsem revision plan** tuned to your gaps (Networks 69, ToC 64):\n\n**Day 1 — Networks foundation (2 hrs):** TCP/IP stack, congestion control. *Goal: close the biggest gap first.*\n**Day 2 — DSA (2 hrs):** Graph algorithms sprint — Dijkstra, MST, flows. 20 problems on the coding lab.\n**Day 3 — ToC (1.5 hrs):** Pumping lemma proofs with worked examples; 10 drills.\n**Day 4 — DBMS + OS (2 hrs):** Transactions/isolation + scheduling; flashcards review.\n**Day 5 — Full mock (3 hrs):** Timed mock test, then targeted fixes.\n\nI’ve added these to your planner — say “adjust” to change any slot.'
  }
  if (q.includes('recursion')) {
    return 'Recursion — the mirror analogy:\n\nA function that calls itself is a mirror facing a mirror: each call is a *smaller* version of the same problem, until the base case ends the reflection.\n\n**The three laws:**\n1. **Base case** — the mirror stops (else: infinite loop).\n2. **Smaller step** — each call shrinks the problem.\n3. **Combine** — results build back up as calls return.\n\n**Worked example — factorial:**\n`fact(4) = 4 × fact(3) = 4 × 3 × fact(2) = 4 × 3 × 2 × fact(1) = 4 × 3 × 2 × 1`\n\nThe call stack is the mechanism: each call frames a shelf; the answer assembles as the shelves collapse.\n\nTry this: write `sum(n)` recursively for 1..n, then trace it for n=3. I’ll check your trace!'
  }
  return 'Great question — let’s unpack it step by step.\n\n**What we know:** I can see your recent performance data, so I’ll connect the concept to your current weak areas rather than giving a generic textbook answer.\n\n**Core explanation:** Let’s start with the intuition — the *why* behind the concept — then formalise it, then apply it to a concrete example you’ve seen in class.\n\n**Connecting to your profile:** your mastery data suggests this topic overlaps with areas you’ve flagged (Networks 69%, ToC 64%) — so I’ll keep the notation light and the examples heavy.\n\n**Where would you like to go from here?**\n1. Deeper explanation with a worked example\n2. A practice question to test understanding\n3. How this connects to the midsem syllabus\n4. A simpler / different analogy'
}
