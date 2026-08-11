/**
 * Faculty portal — additional mock data: course overview, quiz builder,
 * timetable, announcements, AI content studio and weak-student detection.
 */

export const facultyCourses = [
  {
    id: 'CS501', code: 'CS501', title: 'Data Structures & Algorithms', section: 'Sec A · B · C', students: 142,
    lecturesDone: 24, lecturesTotal: 30, progress: 80, avgScore: 81, passRate: 94, atRisk: 6,
    assignments: 4, quizzes: 3, color: '#6366f1', coordinator: 'Dr. Meera Krishnan', credits: 4,
    outcomes: [
      { co: 'CO1', desc: 'Analyse algorithm complexity', attainment: 88 },
      { co: 'CO2', desc: 'Design graph algorithms', attainment: 84 },
      { co: 'CO3', desc: 'Apply DP techniques', attainment: 79 },
      { co: 'CO4', desc: 'Evaluate NP-complete problems', attainment: 71 },
    ],
  },
  {
    id: 'CS503', code: 'CS503', title: 'Operating Systems', section: 'Sec B', students: 68,
    lecturesDone: 22, lecturesTotal: 30, progress: 73, avgScore: 74, passRate: 88, atRisk: 11,
    assignments: 3, quizzes: 2, color: '#f59e0b', coordinator: 'Dr. Meera Krishnan', credits: 4,
    outcomes: [
      { co: 'CO1', desc: 'Explain process & thread models', attainment: 85 },
      { co: 'CO2', desc: 'Apply scheduling policies', attainment: 78 },
      { co: 'CO3', desc: 'Analyse memory management', attainment: 72 },
      { co: 'CO4', desc: 'Compare synchronisation primitives', attainment: 66 },
    ],
  },
  {
    id: 'CS505', code: 'CS505', title: 'Machine Learning', section: 'Sec A · B', students: 142,
    lecturesDone: 25, lecturesTotal: 32, progress: 78, avgScore: 78, passRate: 91, atRisk: 8,
    assignments: 3, quizzes: 2, color: '#8b5cf6', coordinator: 'Dr. Priya Nair', credits: 4,
    outcomes: [
      { co: 'CO1', desc: 'Apply supervised learning', attainment: 87 },
      { co: 'CO2', desc: 'Evaluate model performance', attainment: 82 },
      { co: 'CO3', desc: 'Build neural networks', attainment: 76 },
    ],
  },
]

export const facultyTimetable = [
  { day: 'Monday', slots: [
    { time: '09:00–10:00', course: 'CS501 DSA', room: 'LT-201', section: 'Sec A', type: 'Lecture' },
    { time: '11:00–12:00', course: 'CS503 OS', room: 'LT-103', section: 'Sec B', type: 'Lecture' },
    { time: '15:00–17:00', course: 'CS501 DSA Lab', room: 'Lab 4', section: 'Sec C', type: 'Lab' },
  ]},
  { day: 'Tuesday', slots: [
    { time: '09:00–10:00', course: 'CS501 DSA', room: 'LT-201', section: 'Sec A', type: 'Lecture' },
    { time: '14:00–15:00', course: 'CS503 OS', room: 'LT-103', section: 'Sec B', type: 'Lecture' },
    { time: '16:00–17:00', course: 'Office Hours', room: 'CSE-214', section: 'All', type: 'Office' },
  ]},
  { day: 'Wednesday', slots: [
    { time: '09:00–10:00', course: 'CS505 ML', room: 'LT-305', section: 'Sec A', type: 'Lecture' },
    { time: '11:00–12:00', course: 'CS503 OS', room: 'LT-103', section: 'Sec B', type: 'Lecture' },
    { time: '15:00–17:00', course: 'CS505 ML Lab', room: 'Lab 2', section: 'Sec B', type: 'Lab' },
  ]},
  { day: 'Thursday', slots: [
    { time: '09:00–10:00', course: 'CS501 DSA', room: 'LT-201', section: 'Sec A', type: 'Lecture' },
    { time: '11:00–12:00', course: 'CS501 DSA', room: 'LT-201', section: 'Sec B', type: 'Lecture' },
    { time: '14:00–15:00', course: 'CS505 ML', room: 'LT-305', section: 'Sec B', type: 'Lecture' },
  ]},
  { day: 'Friday', slots: [
    { time: '09:00–10:00', course: 'CS501 DSA', room: 'LT-201', section: 'Sec A', type: 'Lecture' },
    { time: '11:00–12:00', course: 'CS505 ML', room: 'LT-305', section: 'Sec A', type: 'Lecture' },
    { time: '15:00–16:00', course: 'Research Lab Meeting', room: 'CSE-301', section: 'PhD', type: 'Meeting' },
  ]},
  { day: 'Saturday', slots: [
    { time: '10:00–12:00', course: 'AI & Systems Lab — Mentoring', room: 'CSE-301', section: 'Lab team', type: 'Mentoring' },
  ]},
  { day: 'Sunday', slots: [] },
]

export const facultyAnnouncements = [
  { id: 'fa1', title: 'Midsem timetable released — Aug 19–23', audience: 'All sections', date: '2026-08-03', pinned: true, body: 'The midsem schedule for CS501, CS503 and CS505 is live. Please review the seating plan and share any clash reports by Aug 5.', attachments: ['midsem-schedule.pdf'] },
  { id: 'fa2', title: 'DSA Assignment 4 deadline extended to Aug 7, 11:59 PM', audience: 'Sec A · B · C', date: '2026-08-01', pinned: false, body: 'Given the hackathon weekend, the submission deadline for Assignment 4 (Graph Algorithms) is extended by 24 hours. Late penalty (10%/day) applies after.', attachments: [] },
  { id: 'fa3', title: 'Guest lecture: Graph Neural Networks in Production', audience: 'All CSE', date: '2026-07-29', pinned: false, body: 'Dr. Ritu Sharma (ex-Google Research) joins us online on Aug 12, 4 PM. Attendance counts toward the seminar series component.', attachments: ['gnn-abstract.pdf'] },
  { id: 'fa4', title: 'Lab records — CS501: submission format reminder', audience: 'Sec C', date: '2026-07-25', pinned: false, body: 'Lab records must follow the new template (header, aim, observation tables, conclusion). Incomplete records will be returned.', attachments: ['lab-record-template.docx'] },
  { id: 'fa5', title: 'Course feedback window opens Aug 14', audience: 'All sections', date: '2026-07-22', pinned: false, body: 'Anonymous feedback for Term 5 courses opens Aug 14 and closes Aug 20. Your responses directly shape next term.', attachments: [] },
]

export const facultyQuizBuilder = {
  quizzes: [
    { id: 'qz1', title: 'Quiz 2 — Trees', course: 'CS501', questions: 10, duration: 15, status: 'Published', window: 'Jul 27, 6–8 PM', published: '2026-07-27', avgScore: 8.1, participants: 138 },
    { id: 'qz2', title: 'Quiz 3 — Transactions', course: 'CS502', questions: 10, duration: 15, status: 'Scheduled', window: 'Aug 14, 6–8 PM', published: null, avgScore: null, participants: 0 },
    { id: 'qz3', title: 'Quiz 1 — Regression', course: 'CS505', questions: 10, duration: 15, status: 'Published', window: 'Jul 20, 6–8 PM', published: '2026-07-20', avgScore: 7.6, participants: 141 },
    { id: 'qz4', title: 'Quick check — Scheduling policies', course: 'CS503', questions: 5, duration: 8, status: 'Draft', window: '—', published: null, avgScore: null, participants: 0 },
  ],
  analytics: [
    { quiz: 'Quiz 2 — Trees', avgScore: 8.1, highest: 10, lowest: 3, median: 8.5, attempts: 138, completionRate: 97 },
    { quiz: 'Quiz 1 — Regression', avgScore: 7.6, highest: 10, lowest: 2, median: 8, attempts: 141, completionRate: 99 },
  ],
  questionDistribution: [
    { difficulty: 'Easy', pct: 30 }, { difficulty: 'Medium', pct: 50 }, { difficulty: 'Hard', pct: 20 },
  ],
}

export const facultyAiStudio = {
  contentTemplates: [
    { id: 'ct1', type: 'Lesson plan', name: '50-min lecture blueprint', uses: 42, rating: 4.8 },
    { id: 'ct2', type: 'Quiz', name: 'Auto-graded MCQ quiz', uses: 67, rating: 4.9 },
    { id: 'ct3', type: 'Worksheet', name: 'Practice worksheet w/ solutions', uses: 31, rating: 4.6 },
    { id: 'ct4', type: 'Case study', name: 'Real-world case study + prompts', uses: 18, rating: 4.7 },
    { id: 'ct5', type: 'Slides', name: 'Lecture slide outline', uses: 26, rating: 4.5 },
    { id: 'ct6', type: 'Announcement', name: 'Class announcement drafts', uses: 54, rating: 4.8 },
  ],
  rubricTemplates: [
    { id: 'rb1', name: 'Problem set — analytic rubric', criteria: ['Correctness', 'Complexity', 'Clarity', 'Edge cases'], levels: 4, uses: 38 },
    { id: 'rb2', name: 'Project report rubric', criteria: ['Content', 'Structure', 'Citations', 'Presentation'], levels: 4, uses: 27 },
    { id: 'rb3', name: 'Lab record rubric', criteria: ['Observations', 'Analysis', 'Conclusion'], levels: 3, uses: 44 },
    { id: 'rb4', name: 'Presentation rubric', criteria: ['Clarity', 'Depth', 'Engagement', 'Timing'], levels: 4, uses: 19 },
  ],
  generationHistory: [
    { id: 'gh1', type: 'Quiz', title: '10 MCQs — Network flows', course: 'CS501', generated: '2026-08-02T10:00:00', status: 'Approved', rating: 5 },
    { id: 'gh2', type: 'Lesson plan', title: 'Paging & segmentation (Sec B)', course: 'CS503', generated: '2026-08-01T18:20:00', status: 'Approved', rating: 4 },
    { id: 'gh3', type: 'Rubric', title: 'DSA Assignment 4 rubric', course: 'CS501', generated: '2026-07-30T09:15:00', status: 'Approved', rating: 5 },
    { id: 'gh4', type: 'Worksheet', title: 'Isolation levels worksheet', course: 'CS502', generated: '2026-07-29T14:00:00', status: 'Edited', rating: 4 },
  ],
}

export const weakStudentDetection = {
  model: { version: 'at-risk-v3.2', accuracy: 92, lastTrained: '2026-07-15', features: 24 },
  detections: [
    { id: 'wd1', name: 'Nikhil Joshi', roll: '21CS108', course: 'CS503', risk: 93, confidence: 97, signals: ['Attendance 74.6%', '2 missed assignments', 'Quiz scores declining'], recommended: 'Immediate 1:1 outreach', status: 'Active' },
    { id: 'wd2', name: 'Karan Mehta', roll: '21CS104', course: 'CS501', risk: 88, confidence: 95, signals: ['Attendance 78.5%', 'Plagiarism flag on A4', 'Lab scores below median'], recommended: 'Academic integrity review', status: 'Active' },
    { id: 'wd3', name: 'Sanjay Patel', roll: '21CS115', course: 'CS501', risk: 81, confidence: 91, signals: ['3-week score decline', 'Low participation'], recommended: 'Structured practice plan', status: 'Active' },
    { id: 'wd4', name: 'Rohan Verma', roll: '21CS102', course: 'CS501', risk: 76, confidence: 88, signals: ['Attendance dip 3 weeks', 'Sleep-pattern irregularity'], recommended: 'Attendance check-in', status: 'Active' },
    { id: 'wd5', name: 'Pooja Reddy', roll: '21CS107', course: 'CS505', risk: 64, confidence: 84, signals: ['Late submissions (3)', 'Quiz dip'], recommended: 'Time-management coaching', status: 'Monitoring' },
    { id: 'wd6', name: 'Vivek Kumar', roll: '21CS110', course: 'CS503', risk: 58, confidence: 81, signals: ['Lab absence (2)', 'Below-median internals'], recommended: 'Weekly progress review', status: 'Monitoring' },
    { id: 'wd7', name: 'Aditya Singh', roll: '21CS106', course: 'CS505', risk: 41, confidence: 77, signals: ['Inconsistent engagement'], recommended: 'No action — watchlist', status: 'Watchlist' },
    { id: 'wd8', name: 'Ananya Desai', roll: '21CS109', course: 'CS501', risk: 22, confidence: 72, signals: ['Minor late submission'], recommended: 'No action', status: 'Cleared' },
    { id: 'wd9', name: 'Arjun Nair', roll: '21CS113', course: 'CS503', risk: 69, confidence: 90, signals: ['Quiz scores dropped 30% in 3 weeks', 'Guessing pattern in last quiz'], recommended: 'Targeted quiz retake + concept clinic', status: 'Monitoring' },
  ],
  cohortTrend: [
    { month: 'Mar', atRisk: 8.4 }, { month: 'Apr', atRisk: 7.9 }, { month: 'May', atRisk: 7.1 },
    { month: 'Jun', atRisk: 6.8 }, { month: 'Jul', atRisk: 6.2 }, { month: 'Aug', atRisk: 5.9 },
  ],
}
