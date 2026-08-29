/**
 * Student portal deterministic dataset — academics, performance, attendance, courses,
 * events, tests, exams and analytics.
 *
 * NOTE (Student Intelligence Foundation): the student identity no longer
 * lives here — `studentProfile` and `studentAcademicProfile` are derived
 * from the master profile in src/intelligence/master-profile.js so the
 * whole Student module shares ONE source of truth.
 */

import { masterStudentProfile, studentAcademicProfile as academicProfileView } from '@/intelligence/master-profile'
import {
  attendance as intelAttendance, attendanceAnalytics as intelAttAnalytics,
  courses as intelCourses, subjects as intelSubjects, assignments as intelAssignments,
} from '@/intelligence/datasets/academics.js'
import { studyStatistics, practiceSessions } from '@/intelligence/datasets/learning.js'
import { quizResults } from '@/intelligence/datasets/examinations.js'
import { academicDnaInputs } from '@/intelligence/datasets/signals.js'
import { computeSubjectMastery } from '@/intelligence/engine/scores.js'

export const studentProfile = masterStudentProfile

/* Compact academic identity for the dashboard Academic Information Card. */
export const studentAcademicProfile = academicProfileView

/* Short display names used by the legacy student pages (single source: master profile). */
const SUBJECT_SHORT = { CS501: 'DSA', CS502: 'DBMS', CS503: 'OS', CS504: 'Networks', CS505: 'ML', CS506: 'ToC' }

/* Dashboard — KPI values, weekly activity and subject mastery are DERIVED from the
   Student Intelligence Foundation (single source of truth). Presentation text
   (deltas, subtitles) stays here. */
export const studentDashboard = {
  kpis: [
    { id: 'cgpa', label: 'CGPA', value: String(masterStudentProfile.cgpa), delta: '+0.14', up: true, sub: 'vs last semester', icon: 'GraduationCap', gradient: 'from-indigo-500 to-blue-500' },
    { id: 'attendance', label: 'Attendance', value: `${intelAttendance.overall}%`, delta: '+1.8%', up: true, sub: 'This semester', icon: 'CalendarCheck2', gradient: 'from-emerald-500 to-teal-500' },
    { id: 'assignments', label: 'Assignments', value: String(intelAssignments.filter((a) => a.status === 'Pending').length), delta: '2 due', up: false, sub: '8 submitted on time', icon: 'FileText', gradient: 'from-amber-500 to-orange-500' },
    { id: 'streak', label: 'Study streak', value: String(studyStatistics.streakDays), delta: '🔥', up: true, sub: 'days — keep it up!', icon: 'Flame', gradient: 'from-rose-500 to-fuchsia-500' },
  ],
  weeklyActivity: studyStatistics.weeklyActivity,
  subjectMastery: intelSubjects.map((sbj) => ({
    subject: SUBJECT_SHORT[sbj.code] ?? sbj.name,
    mastery: computeSubjectMastery(sbj.code, { subjects: intelSubjects, attendance: intelAttendance, quizResults, practiceSessions, academicDnaInputs }),
  })),
  todaySchedule: [
    { time: '09:00', title: 'Data Structures & Algorithms', type: 'Lecture', room: 'LT-201', subject: 'CS501' },
    { time: '11:00', title: 'Machine Learning Lab', type: 'Lab', room: 'Lab 4', subject: 'CS505' },
    { time: '14:00', title: 'DBMS — Query Optimization', type: 'Lecture', room: 'LT-104', subject: 'CS502' },
    { time: '17:30', title: 'Coding Club — Graph Contest', type: 'Club', room: 'Online', subject: 'Club' },
  ],
  upcomingDeadlines: [
    { id: 'as1', title: 'DSA Assignment 4 — Graph Algorithms', subject: 'CS501', due: '2026-08-06T23:59:00', status: 'Pending', priority: 'High', progress: 40 },
    { id: 'as2', title: 'ML Mini-Project — Sentiment Analysis', subject: 'CS505', due: '2026-08-11T23:59:00', status: 'Pending', priority: 'High', progress: 25 },
    { id: 'as3', title: 'DBMS Quiz 3 — Transactions', subject: 'CS502', due: '2026-08-14T18:00:00', status: 'Upcoming', priority: 'Medium', progress: 0 },
  ],
  recentGrades: [
    { id: 'g1', title: 'OS Assignment 3 — Scheduling', subject: 'CS503', score: '17/20', date: '2026-07-29', grade: 'A' },
    { id: 'g2', title: 'DSA Quiz 2 — Trees', subject: 'CS501', score: '9.5/10', date: '2026-07-27', grade: 'A+' },
    { id: 'g3', title: 'CN Lab Record 5', subject: 'CS504', score: '18/20', date: '2026-07-24', grade: 'A' },
    { id: 'g4', title: 'ToC Test 1 — Automata', subject: 'CS506', score: '12/20', date: '2026-07-22', grade: 'B' },
  ],
  aiInsight: {
    title: 'AI Weekly Insight',
    body: 'Your mastery in Computer Networks trails your other subjects by 12 points. Two focused sessions this week — on TCP congestion control and subnetting — would close the gap before the midsem. Your ML progress is excellent; consider spending saved time on DSA practice.',
    actions: ['Open weak-topic practice', 'Ask AI Tutor about congestion control'],
  },
}

/**
 * Deterministic monthly attendance calendar (current month).
 * Sundays + national holidays are Holiday; a few days are Absent/Leave;
 * future days are Upcoming so the calendar stays truthful.
 */
function buildAttendanceCalendar() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-based
  const today = now.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const iso = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const ABSENT = [4, 13, 22]
  const LEAVE = [7, 18]
  const NATIONAL_HOLIDAYS = { 7: 'Independence Day' } // Aug 15 — national holiday
  const out = []
  for (let d = 1; d <= daysInMonth; d += 1) {
    const dow = new Date(year, month, d).getDay()
    let status = 'Present'
    let note = ''
    if (d > today) { status = 'Upcoming' }
    else if (dow === 0) { status = 'Holiday'; note = 'Weekly off' }
    else if (NATIONAL_HOLIDAYS[d]) { status = 'Holiday'; note = NATIONAL_HOLIDAYS[d] }
    else if (ABSENT.includes(d)) { status = 'Absent' }
    else if (LEAVE.includes(d)) { status = 'Leave' }
    out.push({ date: iso(d), day: d, weekday: dow, status, note })
  }
  return out
}

export const studentAttendance = {
  /* Core numeric fields derived from the intelligence attendance dataset. */
  overall: intelAttendance.overall,
  required: intelAttendance.required,
  buffer: intelAttendance.buffer,
  calendar: buildAttendanceCalendar(),
  weeklySummary: intelAttAnalytics.weeklySummary,
  trend: intelAttAnalytics.monthlyTrend,
  bySubject: intelAttendance.bySubject.map((s) => ({
    subject: SUBJECT_SHORT[s.subjectCode] ?? s.subject,
    pct: s.pct, present: s.present, total: s.total, color: s.color,
  })),
  weekly: [
    { week: 'W1', pct: 94 }, { week: 'W2', pct: 90 }, { week: 'W3', pct: 96 }, { week: 'W4', pct: 88 },
    { week: 'W5', pct: 92 }, { week: 'W6', pct: 95 }, { week: 'W7', pct: 90 }, { week: 'W8', pct: 93 },
    { week: 'W9', pct: 97 }, { week: 'W10', pct: 91 }, { week: 'W11', pct: 89 }, { week: 'W12', pct: 94 },
  ],
  heatmap: Array.from({ length: 13 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const v = ((w * 7 + d) * 13) % 101
      return { date: `2026-08-${String(d + 1).padStart(2, '0')}`, value: v }
    })
  ),
  history: [
    { date: '2026-08-05', subject: 'DBMS', type: 'Lecture', status: 'Present' },
    { date: '2026-08-04', subject: 'Networks', type: 'Lecture', status: 'Absent' },
    { date: '2026-08-03', subject: 'DSA', type: 'Lecture', status: 'Present' },
    { date: '2026-08-01', subject: 'DSA', type: 'Lab', status: 'Present' },
    { date: '2026-07-31', subject: 'ML Lab', type: 'Lab', status: 'Present' },
    { date: '2026-07-30', subject: 'Networks', type: 'Lecture', status: 'Absent' },
    { date: '2026-07-29', subject: 'OS', type: 'Lecture', status: 'Present' },
    { date: '2026-07-28', subject: 'DBMS', type: 'Lecture', status: 'Leave' },
    { date: '2026-07-27', subject: 'ToC', type: 'Tutorial', status: 'Present' },
    { date: '2026-07-26', subject: 'DSA', type: 'Lecture', status: 'Present' },
    { date: '2026-07-25', subject: 'ML', type: 'Lecture', status: 'Present' },
    { date: '2026-07-24', subject: 'OS Lab', type: 'Lab', status: 'Present' },
  ],
  recent: [
    { date: '2026-08-01', subject: 'DSA', status: 'Present' },
    { date: '2026-07-31', subject: 'ML Lab', status: 'Present' },
    { date: '2026-07-30', subject: 'Networks', status: 'Absent' },
    { date: '2026-07-29', subject: 'OS', status: 'Present' },
    { date: '2026-07-28', subject: 'DBMS', status: 'Leave' },
    { date: '2026-07-27', subject: 'ToC', status: 'Present' },
    { date: '2026-07-26', subject: 'DSA', status: 'Present' },
  ],
  insights: [
    { id: 'i1', tone: 'positive', title: 'Networks is your only risk subject', body: 'At 86% you are 11 points above the 75% floor, but two more absences this month would tighten the buffer to ~9 points before midsems.' },
    { id: 'i2', tone: 'neutral', title: 'Mondays are your weakest day', body: 'Your attendance dips most on Mondays — 3 of your 4 absences this semester were Monday lectures. A recurring Monday alarm could fix this.' },
    { id: 'i3', tone: 'positive', title: 'ML & DSA are rock solid', body: '98% and 96% attendance — you have a full absence allowance in both subjects, freeing schedule space for revision.' },
    { id: 'i4', tone: 'warning', title: 'Leave usage is healthy', body: '2 sanctioned leaves this semester (well under the 6 allowed). No action needed, but keep the register updated via the support desk.' },
  ],
  aiSuggestions: [
    { id: 'a1', topic: 'Weekly buffer tracker', body: 'Set a weekly alert on Sundays — if your overall attendance ever drops below 88%, MediXO Mentor will schedule a make-up class reminder for you.', impact: 'High' },
    { id: 'a2', topic: 'Networks recovery plan', body: 'Attend the next 3 Networks lectures without fail and your subject attendance returns to 90%+. The AI planner has blocked 3 reminders this week.', impact: 'High' },
    { id: 'a3', topic: 'Leave policy reminder', body: 'Sanctioned leave requires a 24-hour prior intimation on the support desk. File your next leave before Friday 5 PM to keep records clean.', impact: 'Medium' },
  ],
}

export const studentAssignments = [
  { id: 'as1', title: 'DSA Assignment 4 — Graph Algorithms', subject: 'CS501', course: 'Data Structures & Algorithms', type: 'Problem Set', due: '2026-08-06T23:59:00', status: 'Pending', progress: 40, maxScore: 20, weight: '10% of internals', description: 'Implement Dijkstra, Bellman-Ford and Floyd-Warshall; analyse complexity; solve the 4 given application problems.' },
  { id: 'as2', title: 'ML Mini-Project — Sentiment Analysis', subject: 'CS505', course: 'Machine Learning', type: 'Project', due: '2026-08-11T23:59:00', status: 'Pending', progress: 25, maxScore: 50, weight: '15% of internals', description: 'Build a sentiment classifier on product reviews. Compare logistic regression vs BERT-tiny. Submit report + notebook.' },
  { id: 'as3', title: 'DBMS Quiz 3 — Transactions & Concurrency', subject: 'CS502', course: 'Database Management Systems', type: 'Quiz', due: '2026-08-14T18:00:00', status: 'Upcoming', progress: 0, maxScore: 10, weight: '5% of internals', description: 'ACID properties, isolation levels, conflict serializability, 2PL, deadlock handling.' },
  { id: 'as4', title: 'OS Assignment 3 — CPU Scheduling', subject: 'CS503', course: 'Operating Systems', type: 'Problem Set', due: '2026-07-30T23:59:00', status: 'Graded', progress: 100, maxScore: 20, score: 17, grade: 'A', weight: '10% of internals', feedback: 'Excellent analysis of starvation in SJF. Recheck Gantt chart for round-robin with time quantum 3 — one preemption misplaced.' },
  { id: 'as5', title: 'CN Lab Record 5 — Socket Programming', subject: 'CS504', course: 'Computer Networks', type: 'Lab Record', due: '2026-07-28T23:59:00', status: 'Graded', progress: 100, maxScore: 20, score: 18, grade: 'A', weight: '10% of internals', feedback: 'Clean TCP chat implementation. Add error handling for partial reads in the next record.' },
  { id: 'as6', title: 'DSA Quiz 2 — Trees', subject: 'CS501', course: 'Data Structures & Algorithms', type: 'Quiz', due: '2026-07-27T18:00:00', status: 'Graded', progress: 100, maxScore: 10, score: 9.5, grade: 'A+', weight: '5% of internals', feedback: 'Top 8% of class. Great work on the AVL question.' },
  { id: 'as7', title: 'ToC Problem Set 2 — Regular Languages', subject: 'CS506', course: 'Theory of Computation', type: 'Problem Set', due: '2026-07-24T23:59:00', status: 'Graded', progress: 100, maxScore: 20, score: 15, grade: 'B+', weight: '10% of internals', feedback: 'Pumping lemma proofs need more rigour. Review worked examples in module 4.' },
  { id: 'as8', title: 'ML Quiz 1 — Regression', subject: 'CS505', course: 'Machine Learning', type: 'Quiz', due: '2026-07-20T18:00:00', status: 'Graded', progress: 100, maxScore: 10, score: 8.5, grade: 'A', weight: '5% of internals', feedback: 'Solid. Revisit gradient descent convergence criteria.' },
]

/* Courses derived from the intelligence courses dataset (one source of truth). */
export const studentCourses = intelCourses.map((c) => ({
  id: c.id, code: c.code, title: c.title, instructor: c.faculty, progress: c.progress,
  credits: c.credits, lessons: c.lessons, completed: c.completed, grade: c.grade,
  color: c.color, enrolled: '2026-01-05', description: c.description,
}))
export const courseDetail = {
  id: 'CS501',
  code: 'CS501',
  title: 'Data Structures & Algorithms',
  instructor: 'Dr. Meera Krishnan',
  description: 'Advanced data structures, graph algorithms, complexity analysis and problem-solving at scale. This course builds the algorithmic thinking used in competitive programming and technical interviews.',
  progress: 68,
  credits: 4,
  grade: 'A',
  color: '#6366f1',
  stats: { lessonsCompleted: '29/42', avgScore: 84, hoursSpent: 62, mastery: 86 },
  modules: [
    {
      id: 'm1', title: 'Module 1 — Foundations & Complexity', progress: 100,
      lessons: [
        { id: 'l1', title: 'Asymptotic analysis & Big-O', duration: '38 min', done: true, type: 'Video' },
        { id: 'l2', title: 'Recurrences & Master Theorem', duration: '45 min', done: true, type: 'Video' },
        { id: 'l3', title: 'Problem set: complexity classes', duration: '30 min', done: true, type: 'Practice' },
      ],
    },
    {
      id: 'm2', title: 'Module 2 — Trees & Heaps', progress: 100,
      lessons: [
        { id: 'l4', title: 'AVL trees & rotations', duration: '42 min', done: true, type: 'Video' },
        { id: 'l5', title: 'Segment trees & Fenwick trees', duration: '51 min', done: true, type: 'Video' },
        { id: 'l6', title: 'Heaps & priority queues', duration: '34 min', done: true, type: 'Video' },
        { id: 'l7', title: 'Quiz 2 — Trees (scored 9.5/10)', duration: '25 min', done: true, type: 'Quiz' },
      ],
    },
    {
      id: 'm3', title: 'Module 3 — Graph Algorithms', progress: 55,
      lessons: [
        { id: 'l8', title: 'BFS, DFS & topological sort', duration: '48 min', done: true, type: 'Video' },
        { id: 'l9', title: 'Dijkstra & Bellman-Ford', duration: '44 min', done: true, type: 'Video' },
        { id: 'l10', title: 'Union-Find & MST (Kruskal, Prim)', duration: '39 min', done: true, type: 'Video' },
        { id: 'l11', title: 'Network flows & max-flow/min-cut', duration: '52 min', done: false, type: 'Video' },
        { id: 'l12', title: 'Practice: graph contest problems', duration: '40 min', done: false, type: 'Practice' },
      ],
    },
    {
      id: 'm4', title: 'Module 4 — Advanced Topics', progress: 10,
      lessons: [
        { id: 'l13', title: 'String algorithms (KMP, Z, suffix arrays)', duration: '55 min', done: false, type: 'Video' },
        { id: 'l14', title: 'Dynamic programming patterns', duration: '60 min', done: false, type: 'Video' },
        { id: 'l15', title: 'NP-completeness & reductions', duration: '47 min', done: false, type: 'Video' },
      ],
    },
  ],
  resources: [
    { id: 'r1', title: 'CLRS — Introduction to Algorithms, 4th Ed.', type: 'Book', size: '—' },
    { id: 'r2', title: 'Lecture slides — Module 3 (PDF)', type: 'PDF', size: '4.2 MB' },
    { id: 'r3', title: 'Graph algorithms cheat sheet', type: 'PDF', size: '840 KB' },
    { id: 'r4', title: 'Contest archive — past 5 years', type: 'Zip', size: '18 MB' },
  ],
}

/* Subjects derived from the intelligence subjects dataset (one source of truth). */
export const studentSubjects = intelSubjects
export const calendarEvents = [
  { id: 'ev1', title: 'DSA Lecture — Network Flows', date: '2026-08-03T09:00:00', end: '2026-08-03T10:00:00', type: 'class', subject: 'CS501' },
  { id: 'ev2', title: 'ML Lab — Model evaluation', date: '2026-08-03T11:00:00', end: '2026-08-03T13:00:00', type: 'lab', subject: 'CS505' },
  { id: 'ev3', title: 'DSA Assignment 4 due', date: '2026-08-06T23:59:00', type: 'deadline', subject: 'CS501' },
  { id: 'ev4', title: 'Hackathon — Smart Campus', date: '2026-08-08T09:00:00', end: '2026-08-09T18:00:00', type: 'event', subject: 'Club' },
  { id: 'ev5', title: 'ML Mini-Project due', date: '2026-08-11T23:59:00', type: 'deadline', subject: 'CS505' },
  { id: 'ev6', title: 'DBMS Quiz 3 — Transactions', date: '2026-08-14T18:00:00', type: 'exam', subject: 'CS502' },
  { id: 'ev7', title: 'ToC Tutorial — Pumping lemma', date: '2026-08-05T10:00:00', type: 'class', subject: 'CS506' },
  { id: 'ev8', title: 'Coding Contest — CodeChef Starters', date: '2026-08-06T20:00:00', type: 'event', subject: 'Club' },
  { id: 'ev9', title: 'Career Talk — Google engineers', date: '2026-08-12T17:00:00', type: 'event', subject: 'Career' },
  { id: 'ev10', title: 'OS Lecture — Virtual memory', date: '2026-08-04T09:00:00', type: 'class', subject: 'CS503' },
  { id: 'ev11', title: 'Midsem timetable release', date: '2026-08-15T09:00:00', type: 'event', subject: 'Academics' },
  { id: 'ev12', title: 'Mock Interview — Technical round', date: '2026-08-10T16:00:00', type: 'event', subject: 'Career' },
]

/**
 * Phase 9 — Examination mock data removed.
 * mockTests and exams are now backend-only via GET /student/mock-tests and GET /student/exams
 * → VITE_API_BASE_URL → real DB. No seeded fallback.
 * This file retains non-examination academic data only.
 * Empty arrays preserve import chain for legacy code that may still reference them,
 * but MUST NOT be used as source of truth — backend unavailable → empty state.
 */
export const mockTests = []
export const exams = []

export const academicResources = [
  { id: 'ar1', course: 'CS501', title: 'CLRS — Introduction to Algorithms, 4th Ed.', type: 'Book', size: '—', updated: 'Jul 2026', color: '#6366f1' },
  { id: 'ar2', course: 'CS501', title: 'Lecture slides — Module 3 (Graphs)', type: 'PDF', size: '4.2 MB', updated: 'Jul 24, 2026', color: '#6366f1' },
  { id: 'ar3', course: 'CS501', title: 'Graph algorithms cheat sheet', type: 'PDF', size: '840 KB', updated: 'Jul 20, 2026', color: '#6366f1' },
  { id: 'ar4', course: 'CS502', title: 'DBMS — Transactions & Concurrency notes', type: 'Notes', size: '1.1 MB', updated: 'Aug 2, 2026', color: '#14b8a6' },
  { id: 'ar5', course: 'CS502', title: 'SQL query optimization workbook', type: 'PDF', size: '2.6 MB', updated: 'Jul 28, 2026', color: '#14b8a6' },
  { id: 'ar6', course: 'CS503', title: 'OS — Memory management slides', type: 'PDF', size: '3.4 MB', updated: 'Jul 30, 2026', color: '#f59e0b' },
  { id: 'ar7', course: 'CS504', title: 'TCP/IP illustrated (excerpts)', type: 'Book', size: '—', updated: 'Jun 2026', color: '#f43f5e' },
  { id: 'ar8', course: 'CS504', title: 'Networks previous year midsems 2019–2024', type: 'Zip', size: '12 MB', updated: 'Jul 31, 2026', color: '#f43f5e' },
  { id: 'ar9', course: 'CS505', title: 'ML — evaluation metrics cheatsheet', type: 'PDF', size: '620 KB', updated: 'Aug 1, 2026', color: '#8b5cf6' },
  { id: 'ar10', course: 'CS506', title: 'ToC — automata workbook', type: 'Notes', size: '1.8 MB', updated: 'Jul 22, 2026', color: '#0ea5e9' },
]

export const academicProgress = {
  overall: 58,
  courses: studentCourses.map((c) => ({
    id: c.id, code: c.code, title: c.title, color: c.color, progress: c.progress,
    lessons: `${c.completed}/${c.lessons}`, credits: c.credits, grade: c.grade,
  })),
  semesterTarget: 65,
  subjects: studentSubjects.map((s) => ({ code: s.code, name: s.name, color: s.color, syllabus: s.progress })),
}
