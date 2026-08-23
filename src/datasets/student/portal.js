/**
 * Student portal deterministic dataset: programs, notes, forum,
 * support tickets and admit cards.
 */

export const studentPrograms = {
  current: {
    id: 'prog1',
    name: 'B.Tech — Computer Science & Engineering',
    code: 'B.TECH-CSE',
    institution: 'Meridian Institute of Technology',
    duration: '4 years (8 semesters)',
    started: '2021-07-19',
    expectedEnd: '2025-06-30',
    status: 'In Progress',
    totalCredits: 160,
    earnedCredits: 118,
    cgpa: 8.72,
    accredited: 'AICTE · NBA Tier-1',
    specializations: [
      { name: 'Machine Learning & AI', status: 'Active', courses: 4, progress: 82 },
      { name: 'Systems & Networking', status: 'Active', courses: 3, progress: 61 },
      { name: 'Data Engineering', status: 'Optional', courses: 2, progress: 0 },
    ],
    semesters: [
      { sem: 'Sem 1', credits: 20, cgpa: 7.8, status: 'Completed', courses: 6 },
      { sem: 'Sem 2', credits: 20, cgpa: 8.1, status: 'Completed', courses: 6 },
      { sem: 'Sem 3', credits: 21, cgpa: 8.3, status: 'Completed', courses: 7 },
      { sem: 'Sem 4', credits: 21, cgpa: 8.6, status: 'Completed', courses: 7 },
      { sem: 'Sem 5', credits: 21, cgpa: null, status: 'In Progress', courses: 6 },
      { sem: 'Sem 6', credits: 19, cgpa: null, status: 'Upcoming', courses: 0 },
      { sem: 'Sem 7', credits: 19, cgpa: null, status: 'Upcoming', courses: 0 },
      { sem: 'Sem 8', credits: 19, cgpa: null, status: 'Upcoming', courses: 0 },
    ],
    requirements: [
      { item: 'Core credits (min 118)', earned: 118, required: 118, met: true },
      { item: 'Open electives (min 12)', earned: 8, required: 12, met: false },
      { item: 'Industrial internship', earned: 1, required: 1, met: true },
      { item: 'Capstone project', earned: 0, required: 1, met: false },
      { item: 'Community service (40 hrs)', earned: 36, required: 40, met: false },
    ],
  },
  others: [
    { name: 'Minor — Data Science', institution: 'Meridian Institute of Technology', credits: 18, status: 'Declared' },
    { name: 'Honors — Advanced AI', institution: 'Meridian Institute of Technology', credits: 20, status: 'Eligible' },
  ],
}

export const forumTopics = [
  { id: 'ft1', title: 'Doubt: why does Dijkstra fail with negative edges?', forum: 'CS501 — DSA', author: 'Rohan Verma', replies: 14, views: 342, likes: 28, lastActivity: '2026-08-03T09:12:00', solved: true, tags: ['graphs', 'algorithms'], snippet: 'I understand the greedy argument but the counter-example with a negative edge still feels unintuitive…' },
  { id: 'ft2', title: 'Notes sharing — Transactions & Concurrency (Unit 4)', forum: 'CS502 — DBMS', author: 'Ishita Gupta', replies: 8, views: 218, likes: 41, lastActivity: '2026-08-02T22:40:00', solved: true, tags: ['notes', 'dbms'], snippet: 'Condensed all lectures into 6 pages with the isolation-level table. Happy to answer questions!' },
  { id: 'ft3', title: 'Midsem strategy thread — how are you all planning?', forum: 'CS501 — DSA', author: 'Sneha Patil', replies: 32, views: 890, likes: 67, lastActivity: '2026-08-03T08:20:00', solved: false, tags: ['midsem', 'planning'], snippet: '5 papers in 5 days. My plan: 2 days per subject, graph algorithms first…' },
  { id: 'ft4', title: 'Is the ML mini-project rubric strict on the BERT baseline?', forum: 'CS505 — ML', author: 'Aditya Singh', replies: 9, views: 176, likes: 12, lastActivity: '2026-08-02T15:05:00', solved: false, tags: ['project', 'ml'], snippet: 'The rubric says "meaningful baseline comparison" — does logistic regression count?' },
  { id: 'ft5', title: 'Study group — Networks, Saturdays 4 PM (Library R3)', forum: 'CS504 — Networks', author: 'Divya Krishnan', replies: 21, views: 410, likes: 53, lastActivity: '2026-08-01T19:30:00', solved: false, tags: ['study-group'], snippet: '4 of us so far. Focus: congestion control + subnetting drills.' },
  { id: 'ft6', title: 'Previous year midsem papers — CS501, CS503, CS505', forum: 'CS501 — DSA', author: 'Kavya Menon', replies: 17, views: 521, likes: 74, lastActivity: '2026-07-31T13:00:00', solved: true, tags: ['papers', 'midsem'], snippet: 'Uploaded 2019–2024 papers with answer sketches. Check the resources tab!' },
]

export const forumCategories = [
  { id: 'CS501', name: 'CS501 — DSA', topics: 48 },
  { id: 'CS502', name: 'CS502 — DBMS', topics: 31 },
  { id: 'CS503', name: 'CS503 — OS', topics: 26 },
  { id: 'CS504', name: 'CS504 — Networks', topics: 22 },
  { id: 'CS505', name: 'CS505 — ML', topics: 35 },
  { id: 'CS506', name: 'CS506 — ToC', topics: 14 },
  { id: 'CAREER', name: 'Career & Placements', topics: 58 },
  { id: 'GENERAL', name: 'Campus Life', topics: 92 },
]

export const supportTickets = [
  { id: 'st1', title: 'Cannot upload assignment file — 403 error', category: 'Technical', status: 'Resolved', priority: 'High', created: '2026-07-26T10:00:00', updated: '2026-07-26T14:30:00', messages: 6, satisfaction: 5 },
  { id: 'st2', title: 'Attendance record correction — Jul 30, Networks', category: 'Records', status: 'In Progress', priority: 'Medium', created: '2026-08-01T09:20:00', updated: '2026-08-02T11:00:00', messages: 3, satisfaction: null },
  { id: 'st3', title: 'How do I export my certificate PDF?', category: 'How-to', status: 'Resolved', priority: 'Low', created: '2026-07-18T16:00:00', updated: '2026-07-18T16:45:00', messages: 2, satisfaction: 5 },
  { id: 'st4', title: 'AI tutor response in Hindi not rendering properly', category: 'Technical', status: 'Open', priority: 'Low', created: '2026-08-03T07:30:00', updated: '2026-08-03T07:30:00', messages: 1, satisfaction: null },
]

export const admitCard = {
  id: 'admit-2026-midsem-21CS114',
  name: 'Aarav Sharma',
  rollNo: '21CS114',
  program: 'B.Tech — CSE',
  semester: 'Semester 5',
  examName: 'Mid-Semester Examinations — Aug 2026',
  issueDate: '2026-08-15',
  photo: null,
  signature: 'Registrar, Meridian Institute of Technology',
  instructions: [
    'Report 30 minutes before the exam start time.',
    'Carry this admit card and a government photo ID (Aadhaar / College ID).',
    'Electronic devices, smartwatches and bags are not allowed inside the hall.',
    'Answer sheets must be returned before leaving the hall.',
  ],
  schedule: [
    { date: '2026-08-19', time: '10:00 AM – 1:00 PM', subject: 'CS501 — DSA', room: 'LT-201', seat: 'A-42' },
    { date: '2026-08-20', time: '10:00 AM – 1:00 PM', subject: 'CS505 — ML', room: 'LT-305', seat: 'C-18' },
    { date: '2026-08-21', time: '10:00 AM – 1:00 PM', subject: 'CS503 — OS', room: 'LT-103', seat: 'B-27' },
    { date: '2026-08-22', time: '10:00 AM – 1:00 PM', subject: 'CS502 — DBMS', room: 'LT-104', seat: 'A-63' },
    { date: '2026-08-23', time: '10:00 AM – 1:00 PM', subject: 'CS504 — Networks', room: 'LT-207', seat: 'D-11' },
  ],
}
