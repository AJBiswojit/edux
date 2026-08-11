/**
 * Parent portal mock data — dashboard, progress, attendance, performance,
 * exam results, teacher communication, AI insights and reports.
 */

export const parentProfile = {
  id: 'u_par_001',
  name: 'Rajesh Sharma',
  ward: { name: 'Aarav Sharma', rollNo: '21CS114', program: 'B.Tech — Computer Science', semester: 'Semester 5' },
  institution: 'Meridian Institute of Technology',
}

export const parentDashboard = {
  ward: {
    name: 'Aarav Sharma',
    rollNo: '21CS114',
    program: 'B.Tech — Computer Science',
    semester: 'Semester 5',
  },
  kpis: [
    { id: 'pk1', label: 'CGPA', value: '8.72', delta: '+0.14', up: true, sub: 'vs last semester', icon: 'GraduationCap', gradient: 'from-indigo-500 to-blue-500' },
    { id: 'pk2', label: 'Attendance', value: '92.4%', delta: '+1.8%', up: true, sub: 'This semester', icon: 'CalendarCheck2', gradient: 'from-emerald-500 to-teal-500' },
    { id: 'pk3', label: 'Class rank', value: '#14', delta: 'top 7%', up: true, sub: 'of 220 students', icon: 'Medal', gradient: 'from-amber-500 to-orange-500' },
    { id: 'pk4', label: 'Study consistency', value: '84%', delta: '+6%', up: true, sub: 'focus score this month', icon: 'Flame', gradient: 'from-rose-500 to-fuchsia-500' },
  ],
  aiMonthlyInsight: {
    title: 'August insight — for you, from MediXO EduX',
    strengths: ['Aarav’s consistency is at its best this year — a 12-day study streak and 84% focus score.', 'His ML and DSA mastery are class-leading (82–86).'],
    watch: ['Computer Networks mastery trails other subjects by ~12 points.', 'Theory of Computation flagged: internal score 64 — the only subject below 70.'],
    suggestions: ['A gentle check-in about Networks after Aug 14 would be well-timed (DBMS quiz week).', 'He has 2 assignments due Aug 6–11; avoid scheduling family travel that weekend.'],
    tone: 'Confident · Steady',
  },
  recentAlerts: [
    { id: 'pa1', severity: 'Info', title: 'DSA Quiz 2 — top 8% of class', text: 'Aarav scored 9.5/10.', time: '2 days ago' },
    { id: 'pa2', severity: 'Info', title: '12-day study streak', text: 'Longest streak this academic year.', time: '3 days ago' },
    { id: 'pa3', severity: 'Warning', title: '1 absence flagged', text: 'Networks class, Jul 30. Within healthy range.', time: '4 days ago' },
    { id: 'pa4', severity: 'Info', title: 'Midsems begin Aug 19', text: '3-hour papers. Timetable released Aug 15.', time: '1 week ago' },
  ],
  upcoming: [
    { id: 'pu1', title: 'DSA Assignment 4 due', date: '2026-08-06', type: 'deadline' },
    { id: 'pu2', title: 'ML Mini-Project due', date: '2026-08-11', type: 'deadline' },
    { id: 'pu3', title: 'DBMS Quiz 3', date: '2026-08-14', type: 'exam' },
    { id: 'pu4', title: 'Midsem examinations begin', date: '2026-08-19', type: 'exam' },
  ],
}

export const parentProgress = {
  cgpaTrend: [
    { sem: 'Sem 1', cgpa: 7.8 }, { sem: 'Sem 2', cgpa: 8.1 }, { sem: 'Sem 3', cgpa: 8.3 },
    { sem: 'Sem 4', cgpa: 8.6 }, { sem: 'Sem 5', cgpa: 8.7 },
  ],
  milestones: [
    { id: 'pm1', title: 'Completed 29/42 DSA lessons', date: '2026-07-30', type: 'Course' },
    { id: 'pm2', title: 'Certified — ML Specialisation', date: '2026-05-14', type: 'Certificate' },
    { id: 'pm3', title: 'SIH 2025 National Finalist', date: '2025-12-18', type: 'Award' },
    { id: 'pm4', title: 'Dean’s List — Sem 4', date: '2025-07-01', type: 'Honour' },
    { id: 'pm5', title: 'Cleared 3★ CodeChef', date: '2025-03-09', type: 'Skill' },
  ],
  subjectMastery: [
    { subject: 'DSA', mastery: 86 }, { subject: 'ML', mastery: 82 }, { subject: 'DBMS', mastery: 78 },
    { subject: 'OS', mastery: 74 }, { subject: 'Networks', mastery: 69 }, { subject: 'ToC', mastery: 64 },
  ],
}

export const parentAttendance = {
  overall: 92.4,
  trend: [
    { month: 'Mar', pct: 91.2 }, { month: 'Apr', pct: 89.8 }, { month: 'May', pct: 90.5 },
    { month: 'Jun', pct: 92.1 }, { month: 'Jul', pct: 93.0 }, { month: 'Aug', pct: 92.4 },
  ],
  bySubject: [
    { subject: 'DSA', pct: 96 }, { subject: 'DBMS', pct: 90 }, { subject: 'OS', pct: 88 },
    { subject: 'Networks', pct: 86 }, { subject: 'ML', pct: 98 }, { subject: 'ToC', pct: 92 },
  ],
  absences: [
    { date: '2026-07-30', subject: 'Computer Networks', reason: 'Unreported', duration: '1 class' },
    { date: '2026-07-28', subject: 'DBMS', reason: 'Medical (leave approved)', duration: '1 class' },
    { date: '2026-05-12', subject: 'OS', reason: 'Medical (leave approved)', duration: '1 class' },
  ],
}

export const parentPerformance = {
  internals: [
    { subject: 'DSA', internal: 86, classAvg: 71 }, { subject: 'DBMS', internal: 78, classAvg: 68 },
    { subject: 'OS', internal: 74, classAvg: 66 }, { subject: 'Networks', internal: 69, classAvg: 63 },
    { subject: 'ML', internal: 82, classAvg: 70 }, { subject: 'ToC', internal: 64, classAvg: 61 },
  ],
  comparison: [
    { subject: 'DSA', student: 86, class: 71 }, { subject: 'DBMS', student: 78, class: 68 },
    { subject: 'OS', student: 74, class: 66 }, { subject: 'Networks', student: 69, class: 63 },
    { subject: 'ML', student: 82, class: 70 }, { subject: 'ToC', student: 64, class: 61 },
  ],
  remarks: 'Consistently above class average in every subject. ToC (64) and Networks (69) are the two areas where the gap to his own average is largest — both have direct action plans in the AI study planner.',
}

export const parentExamResults = [
  { id: 'per1', title: 'End-Sem 2025 — DSA', subject: 'CS501', date: '2025-12-10', score: 84, max: 100, grade: 'A', classAvg: 62, rank: '18/142' },
  { id: 'per2', title: 'End-Sem 2025 — ML', subject: 'CS505', date: '2025-12-14', score: 88, max: 100, grade: 'A', classAvg: 65, rank: '12/142' },
  { id: 'per3', title: 'End-Sem 2025 — OS', subject: 'CS503', date: '2025-12-16', score: 72, max: 100, grade: 'B+', classAvg: 61, rank: '34/136' },
  { id: 'per4', title: 'Mid-Sem 2025 — DSA', subject: 'CS501', date: '2025-10-11', score: 38, max: 50, grade: 'A', classAvg: 31, rank: '21/142' },
  { id: 'per5', title: 'Mid-Sem 2025 — Networks', subject: 'CS504', date: '2025-10-14', score: 32, max: 50, grade: 'B+', classAvg: 29, rank: '29/118' },
]

export const parentCommunication = {
  teachers: [
    { id: 'pt1', name: 'Dr. Meera Krishnan', role: 'Professor — DSA, OS', responseTime: '~4 hrs', contactable: true, thread: [
      { id: 'm1', from: 'them', text: 'Namaste Mr. Sharma — Aarav is doing very well. His DSA quiz scores are in the top decile.', time: '2026-07-28T10:00:00' },
      { id: 'm2', from: 'me', text: 'Thank you ma’am! We’re very proud. Is there anything we can support at home?', time: '2026-07-28T18:30:00' },
      { id: 'm3', from: 'them', text: 'Encourage the 20-min daily coding practice — it compounds. Also ensure rest before Aug 19 midsems.', time: '2026-07-28T19:02:00' },
    ] },
    { id: 'pt2', name: 'Dr. Priya Nair', role: 'Assistant Professor — ML', responseTime: '~8 hrs', contactable: true, thread: [] },
    { id: 'pt3', name: 'Dr. Arvind Kulkarni', role: 'Professor — DBMS, ToC', responseTime: '~1 day', contactable: true, thread: [] },
    { id: 'pt4', name: 'Prof. Vikram Rao', role: 'Associate Professor — Networks', responseTime: '~6 hrs', contactable: true, thread: [] },
  ],
  meetingSlots: [
    { id: 'ms1', teacher: 'Dr. Meera Krishnan', slot: 'Wed, Aug 5 · 3:30 PM', status: 'Available' },
    { id: 'ms2', teacher: 'Dr. Priya Nair', slot: 'Thu, Aug 6 · 11:00 AM', status: 'Available' },
    { id: 'ms3', teacher: 'Prof. Vikram Rao', slot: 'Fri, Aug 7 · 4:00 PM', status: 'Available' },
  ],
}

export const parentAIInsights = [
  { id: 'pi1', date: '2026-08-01', tone: 'positive', title: 'Strong month — momentum is building', body: 'Aarav studied on 27 of the last 30 days, with focus score up 6 points. His DSA mastery crossed 86, and quiz results confirm it. The habit engine predicts his Sem 5 CGPA at 8.9 if current patterns hold.' },
  { id: 'pi2', date: '2026-07-15', tone: 'neutral', title: 'Two subjects need gentle attention', body: 'Networks and Theory of Computation trail his other subjects. Both are “in-progress” recoveries: the planner has scheduled 4 focused sessions this week. No action needed from you — consistency is doing the work.' },
  { id: 'pi3', date: '2026-06-30', tone: 'positive', title: 'Backlog-free semester confirmed', body: 'Aarav has cleared every course in Sem 4 with a CGPA of 8.6 — his best yet. The Dean’s List honour was auto-verified by the registrar. Next milestone: end-semester results in December.' },
  { id: 'pi4', date: '2026-06-01', tone: 'warning', title: 'Exam-week dip detected', body: 'Study hours dropped 40% during the last week of May, concentrated around the Network’s lab. A 2-day dip is within healthy range; the planner auto-rebalanced. If dips repeat for 2+ weeks, the platform will notify you directly.' },
]

export const parentReports = [
  { id: 'pr1', title: 'Progress Report — Term 5 (Mid-term)', period: 'Aug 2026', issued: '2026-08-16', status: 'Upcoming' },
  { id: 'pr2', title: 'Progress Report — Term 4 (End-term)', period: 'Dec 2025', issued: '2025-12-22', status: 'Available', summary: 'CGPA 8.6 · Dean’s List · No backlogs' },
  { id: 'pr3', title: 'Progress Report — Term 3 (Mid-term)', period: 'Oct 2025', issued: '2025-10-20', status: 'Available', summary: 'CGPA 8.4 · All subjects above class average' },
  { id: 'pr4', title: 'Attendance Certificate — 2025-26', period: 'Annual', issued: '2025-05-10', status: 'Available', summary: '91.2% overall attendance' },
]
