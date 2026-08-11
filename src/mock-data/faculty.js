/**
 * Faculty portal mock data — dashboard, attendance, assignments, question
 * bank, student analytics, research, lecture planner, exam builder, reports.
 */

/* NOTE (Faculty Intelligence Foundation): the faculty identity no longer
   lives here — `facultyProfile` derives from the master profile in
   src/intelligence/faculty/master-profile.js (single source of truth). */
import { facultyProfileView } from '@/intelligence/faculty/master-profile.js'

export const facultyProfile = facultyProfileView

export const facultyDashboard = {
  kpis: [
    { id: 'fk1', label: 'Courses this term', value: '3', delta: '1 new', up: true, sub: 'DSA · OS · Theory Lab', icon: 'BookOpen', gradient: 'from-indigo-500 to-blue-500' },
    { id: 'fk2', label: 'Students mentored', value: '312', delta: '+28', up: true, sub: 'across 4 sections', icon: 'Users', gradient: 'from-emerald-500 to-teal-500' },
    { id: 'fk3', label: 'Pending grading', value: '34', delta: '12 due today', up: false, sub: 'AI drafted 21/34', icon: 'ClipboardCheck', gradient: 'from-amber-500 to-orange-500' },
    { id: 'fk4', label: 'Class average', value: '74.2%', delta: '+3.1%', up: true, sub: 'vs last term', icon: 'TrendingUp', gradient: 'from-rose-500 to-fuchsia-500' },
  ],
  todayLectures: [
    { id: 'tl1', time: '09:00', course: 'CS501 — DSA', room: 'LT-201', topic: 'Network flows: max-flow/min-cut', section: 'Sec A (72)' },
    { id: 'tl2', time: '11:00', course: 'CS503 — OS', room: 'LT-103', topic: 'Memory management: paging', section: 'Sec B (68)' },
    { id: 'tl3', time: '15:00', course: 'CS501 — DSA Lab', room: 'Lab 4', topic: 'Graph contest — live judge', section: 'Sec C (70)' },
  ],
  classTrend: [
    { week: 'W1', avg: 68 }, { week: 'W2', avg: 71 }, { week: 'W3', avg: 69 }, { week: 'W4', avg: 73 },
    { week: 'W5', avg: 74 }, { week: 'W6', avg: 72 }, { week: 'W7', avg: 76 }, { week: 'W8', avg: 78 },
    { week: 'W9', avg: 77 }, { week: 'W10', avg: 79 }, { week: 'W11', avg: 80 }, { week: 'W12', avg: 81 },
  ],
  atRisk: [
    { id: 's3', name: 'Rohan Verma', roll: '21CS102', cgpa: 7.4, attendance: 84.2, risk: 76, flag: 'Attendance dropping 3 weeks straight' },
    { id: 's5', name: 'Karan Mehta', roll: '21CS104', cgpa: 6.8, attendance: 78.5, risk: 88, flag: 'Missed 2 assignments; quiz scores declining' },
    { id: 's9', name: 'Nikhil Joshi', roll: '21CS108', cgpa: 6.2, attendance: 74.6, risk: 93, flag: 'High risk — AI recommends immediate outreach' },
    { id: 's15', name: 'Sanjay Patel', roll: '21CS115', cgpa: 6.9, attendance: 79.8, risk: 81, flag: 'Lab performance below cohort median' },
  ],
  recentSubmissions: [
    { id: 'sub1', student: 'Ishita Gupta', assignment: 'DSA Assignment 4', submitted: '2h ago', status: 'AI pre-graded', score: '18/20' },
    { id: 'sub2', student: 'Divya Krishnan', assignment: 'DSA Assignment 4', submitted: '3h ago', status: 'AI pre-graded', score: '19/20' },
    { id: 'sub3', student: 'Sneha Patil', assignment: 'DSA Assignment 4', submitted: '5h ago', status: 'Pending review', score: '—' },
    { id: 'sub4', student: 'Karan Mehta', assignment: 'DSA Assignment 4', submitted: '8h ago', status: 'Plagiarism flagged', score: '—' },
  ],
  aiAssistStats: { hoursSaved: 11.4, questionsGenerated: 148, lessonsDrafted: 6, gradedAutomated: 312 },
}

export const facultyAttendance = {
  classes: [
    { id: 'ca1', course: 'CS501 — DSA', section: 'Sec A', date: '2026-08-01', total: 72, present: 68, pct: 94.4, status: 'Marked', topic: 'Network flows' },
    { id: 'ca2', course: 'CS503 — OS', section: 'Sec B', date: '2026-07-31', total: 68, present: 61, pct: 89.7, status: 'Marked', topic: 'Deadlocks' },
    { id: 'ca3', course: 'CS501 — DSA', section: 'Sec A', date: '2026-07-30', total: 72, present: 70, pct: 97.2, status: 'Marked', topic: 'Bellman-Ford' },
    { id: 'ca4', course: 'CS501 — DSA Lab', section: 'Sec C', date: '2026-07-29', total: 70, present: 64, pct: 91.4, status: 'Marked', topic: 'Contest round 4' },
    { id: 'ca5', course: 'CS503 — OS', section: 'Sec B', date: '2026-07-28', total: 68, present: 59, pct: 86.8, status: 'Marked', topic: 'Synchronisation' },
  ],
  weeklyTrend: [
    { week: 'W1', pct: 92 }, { week: 'W2', pct: 90 }, { week: 'W3', pct: 93 }, { week: 'W4', pct: 89 },
    { week: 'W5', pct: 91 }, { week: 'W6', pct: 94 }, { week: 'W7', pct: 90 }, { week: 'W8', pct: 92 },
  ],
  summary: { avgAttendance: 91.8, lowestClass: 'CS503 — Sec B', highestClass: 'CS501 — Sec A', studentsBelow75: 14 },
  studentsBelowThreshold: [
    { name: 'Karan Mehta', roll: '21CS104', attendance: 78.5, classes: 4 },
    { name: 'Nikhil Joshi', roll: '21CS108', attendance: 74.6, classes: 6 },
    { name: 'Sanjay Patel', roll: '21CS115', attendance: 79.8, classes: 3 },
    { name: 'Rohan Verma', roll: '21CS102', attendance: 84.2, classes: 2 },
  ],
  /* Class-wise weekly attendance (W1–W8) — feeds class-wise trend + heatmap. */
  byClassTrend: [
    { label: 'CS501 — Sec A', course: 'CS501', section: 'Sec A', weeks: [96, 94, 95, 93, 94, 95, 94, 94.4] },
    { label: 'CS501 — Sec B', course: 'CS501', section: 'Sec B', weeks: [93, 92, 94, 91, 92, 93, 92, 93] },
    { label: 'CS501 — Sec C', course: 'CS501', section: 'Sec C', weeks: [95, 93, 94, 92, 91, 92, 91, 91.4] },
    { label: 'CS503 — Sec B', course: 'CS503', section: 'Sec B', weeks: [92, 90, 91, 88, 89, 87, 86, 89.7] },
    { label: 'CS501 — DSA Lab · Sec C', course: 'CS501-LAB', section: 'Sec C', weeks: [90, 89, 88, 87, 88, 86, 85, 87] },
  ],
  /* Attendance vs performance correlation buckets. */
  attendanceVsPerformance: [
    { bucket: '90–100%', avgScore: 84 },
    { bucket: '75–89%', avgScore: 76 },
    { bucket: 'Below 75%', avgScore: 63 },
  ],
  /* Students missing consecutive classes. */
  consecutiveMissing: [
    { name: 'Nikhil Joshi', roll: '21CS108', course: 'CS503', consecutive: 3, lastPresent: '2026-08-01', attendance: 74.6 },
    { name: 'Karan Mehta', roll: '21CS104', course: 'CS501', consecutive: 2, lastPresent: '2026-07-30', attendance: 78.5 },
    { name: 'Vivek Kumar', roll: '21CS110', course: 'CS503', consecutive: 2, lastPresent: '2026-07-28', attendance: 81.3 },
  ],
}

export const facultyAssignments = [
  { id: 'fa1', title: 'DSA Assignment 4 — Graph Algorithms', course: 'CS501', due: '2026-08-06', published: '2026-07-27', submissions: 138, total: 142, graded: 96, status: 'Open', maxScore: 20, weight: 10, avgScore: 16.4, lateCount: 6, failureRate: 9, commonMistakes: ['Wrong complexity analysis of Dijkstra variants', 'Off-by-one in heap decrease-key', 'Negative-weight edges ignored in Bellman-Ford'] },
  { id: 'fa2', title: 'ML Mini-Project — Sentiment Analysis', course: 'CS505', due: '2026-08-11', published: '2026-07-25', submissions: 64, total: 142, graded: 0, status: 'Open', maxScore: 50, weight: 15, avgScore: null, lateCount: 0, failureRate: null, commonMistakes: [] },
  { id: 'fa3', title: 'OS Assignment 3 — CPU Scheduling', course: 'CS503', due: '2026-07-30', published: '2026-07-16', submissions: 132, total: 136, graded: 132, status: 'Graded', maxScore: 20, weight: 10, avgScore: 15.8, lateCount: 4, failureRate: 7, commonMistakes: ['Round-robin quantum confusion', 'Priority inversion not discussed'] },
  { id: 'fa4', title: 'DSA Problem Set 3 — Trees', course: 'CS501', due: '2026-07-20', published: '2026-07-08', submissions: 141, total: 142, graded: 141, status: 'Graded', maxScore: 15, weight: 5, avgScore: 12.6, lateCount: 3, failureRate: 5, commonMistakes: ['AVL rotation applied on the wrong node'] },
  { id: 'fa5', title: 'ToC Problem Set 2 — Regular Languages', course: 'CS506', due: '2026-07-24', published: '2026-07-12', submissions: 118, total: 124, graded: 118, status: 'Graded', maxScore: 20, weight: 10, avgScore: 16.1, lateCount: 5, failureRate: 11, commonMistakes: ['Pumping-lemma proof structure', 'Regular expression ambiguity'] },
]

export const questionBank = {
  summary: { total: 1254, bySubject: { CS501: 418, CS503: 286, CS506: 214, CS505: 336 }, aiGenerated: 418, usedThisTerm: 902, flagged: 12 },
  questions: [
    { id: 'q1', bloom: 'Remember', accuracy: 78, tags: ['High-Yield', 'Conceptual'], chapter: 'Graph Algorithms', subject: 'CS501', topic: 'Graphs', type: 'MCQ', difficulty: 'Easy', usage: 34, lastUsed: '2026-07-25', source: 'Manual', status: 'Approved', text: 'Which algorithm finds the shortest path in a graph with negative edge weights?', pyqFrequency: 14, appearedIn: [2019, 2020, 2021, 2022, 2023, 2024, 2025], pyqTopics: ['Dijkstra & shortest paths', 'Network flows'] },
    { id: 'q2', bloom: 'Evaluate', accuracy: 62, tags: ['Proof-based', 'Frequently Missed'], chapter: 'Graph Algorithms', subject: 'CS501', topic: 'Graphs', type: 'Subjective', difficulty: 'Hard', usage: 12, lastUsed: '2026-07-25', source: 'AI', status: 'Approved', text: 'Prove that Dijkstra fails with negative edges and give a correct alternative.', pyqFrequency: 8, appearedIn: [2018, 2020, 2022, 2024], pyqTopics: ['Dijkstra & shortest paths'] },
    { id: 'q3', bloom: 'Understand', accuracy: 84, tags: ['High-Yield', 'Conceptual'], chapter: 'CPU Scheduling', subject: 'CS503', topic: 'Scheduling', type: 'MCQ', difficulty: 'Medium', usage: 41, lastUsed: '2026-07-28', source: 'Manual', status: 'Approved', text: 'Which scheduling policy minimises average waiting time for preemptive systems?', pyqFrequency: 16, appearedIn: [2016, 2017, 2019, 2020, 2022, 2023, 2024, 2025], pyqTopics: ['Scheduling policies'] },
    { id: 'q4', bloom: 'Apply', accuracy: 71, tags: ['Numerical', 'Formula-based'], chapter: 'Memory Management', subject: 'CS503', topic: 'Memory', type: 'Numerical', difficulty: 'Medium', usage: 27, lastUsed: '2026-07-28', source: 'AI', status: 'Approved', text: 'Given a 4KB page size and 32-bit addresses, compute the page offset bits and number of pages.', pyqFrequency: 12, appearedIn: [2017, 2018, 2019, 2021, 2023, 2025], pyqTopics: ['Paging & segmentation'] },
    { id: 'q5', bloom: 'Understand', accuracy: 82, tags: ['Conceptual', 'Formula-based'], chapter: 'Regression', subject: 'CS505', topic: 'Regression', type: 'MCQ', difficulty: 'Easy', usage: 52, lastUsed: '2026-07-21', source: 'AI', status: 'Approved', text: 'Ridge regression adds which penalty to the loss function?', pyqFrequency: 12, appearedIn: [2018, 2019, 2020, 2022, 2023, 2025], pyqTopics: ['Ridge & Lasso'] },
    { id: 'q6', bloom: 'Create', accuracy: 55, tags: ['Proof-based', 'Frequently Missed'], chapter: 'Automata', subject: 'CS506', topic: 'Automata', type: 'Subjective', difficulty: 'Hard', usage: 9, lastUsed: '2026-07-22', source: 'Manual', status: 'Flagged', text: 'Construct a PDA for the language of balanced parentheses with at most two nesting levels.', pyqFrequency: 6, appearedIn: [2017, 2019, 2021, 2023], pyqTopics: ['Pumping lemma', 'CFL properties'] },
    { id: 'q7', bloom: 'Apply', accuracy: 80, tags: ['High-Yield', 'Conceptual'], chapter: 'Dynamic Programming', subject: 'CS501', topic: 'DP', type: 'MCQ', difficulty: 'Medium', usage: 38, lastUsed: '2026-07-19', source: 'AI', status: 'Approved', text: 'Which of the following problems exhibits optimal substructure?', pyqFrequency: 11, appearedIn: [2020, 2021, 2022, 2023, 2025], pyqTopics: ['0/1 Knapsack', 'LCS & edit distance'] },
    { id: 'q8', bloom: 'Understand', accuracy: 74, tags: ['Conceptual', 'New Pattern'], chapter: 'Neural Networks', subject: 'CS505', topic: 'Neural Networks', type: 'Subjective', difficulty: 'Medium', usage: 16, lastUsed: '2026-07-18', source: 'AI', status: 'Review', text: 'Explain vanishing gradients and two techniques to mitigate them.', pyqFrequency: 7, appearedIn: [2019, 2021, 2023, 2025], pyqTopics: ['Backpropagation'] },
    /* PYQ-mapped additions (question bank ↔ PYQ integration) */
    { id: 'q9', bloom: 'Apply', accuracy: 69, tags: ['Numerical', 'High-Yield'], chapter: 'Graph Algorithms', subject: 'CS501', topic: 'Graphs', type: 'Subjective', difficulty: 'Hard', usage: 21, lastUsed: '2026-08-02', source: 'AI', status: 'Approved', text: 'Trace Dijkstra\'s algorithm on a 5-vertex graph and compute all shortest paths from the source.', pyqFrequency: 14, appearedIn: [2019, 2020, 2021, 2022, 2023, 2024, 2025], pyqTopics: ['Dijkstra & shortest paths'] },
    { id: 'q10', bloom: 'Apply', accuracy: 73, tags: ['Numerical', 'High-Yield'], chapter: 'Graph Algorithms', subject: 'CS501', topic: 'Graphs', type: 'Subjective', difficulty: 'Medium', usage: 18, lastUsed: '2026-08-02', source: 'AI', status: 'Approved', text: 'Construct the MST using Kruskal\'s and Prim\'s algorithms on a given weighted graph.', pyqFrequency: 12, appearedIn: [2019, 2020, 2022, 2023, 2024, 2025], pyqTopics: ['MST (Kruskal/Prim)'] },
    { id: 'q11', bloom: 'Analyze', accuracy: 70, tags: ['Numerical', 'High-Yield'], chapter: 'Dynamic Programming', subject: 'CS501', topic: 'DP', type: 'Subjective', difficulty: 'Medium', usage: 15, lastUsed: '2026-08-01', source: 'AI', status: 'Approved', text: 'Solve the 0/1 knapsack problem for 4 items with capacity 8 using a DP table.', pyqFrequency: 11, appearedIn: [2020, 2021, 2022, 2023, 2025], pyqTopics: ['0/1 Knapsack'] },
    { id: 'q12', bloom: 'Apply', accuracy: 76, tags: ['Numerical'], chapter: 'Trees & Heaps', subject: 'CS501', topic: 'Trees', type: 'Subjective', difficulty: 'Medium', usage: 14, lastUsed: '2026-07-30', source: 'Manual', status: 'Approved', text: 'Insert nodes into an AVL tree and perform the required single/double rotations.', pyqFrequency: 10, appearedIn: [2019, 2021, 2022, 2024, 2025], pyqTopics: ['AVL rotations'] },
    { id: 'q13', bloom: 'Apply', accuracy: 83, tags: ['Numerical', 'High-Yield'], chapter: 'Complexity Analysis', subject: 'CS501', topic: 'Complexity', type: 'MCQ', difficulty: 'Easy', usage: 26, lastUsed: '2026-07-29', source: 'AI', status: 'Approved', text: 'The recurrence T(n) = 2T(n/2) + n has which time complexity?', pyqFrequency: 13, appearedIn: [2019, 2020, 2021, 2023, 2024, 2025], pyqTopics: ['Big-O analysis', 'Recurrences & Master theorem'] },
    { id: 'q14', bloom: 'Analyze', accuracy: 58, tags: ['Frequently Missed', 'New Pattern'], chapter: 'String Algorithms', subject: 'CS501', topic: 'Strings', type: 'MCQ', difficulty: 'Hard', usage: 8, lastUsed: '2026-07-27', source: 'AI', status: 'Review', text: 'For KMP string matching, the failure function of a pattern is used to…', pyqFrequency: 6, appearedIn: [2018, 2020, 2022, 2024], pyqTopics: ['KMP string matching'] },
  ],
}

export const facultyStudentAnalytics = {
  distribution: [
    { range: '90–100', count: 14 },
    { range: '80–89', count: 38 },
    { range: '70–79', count: 46 },
    { range: '60–69', count: 27 },
    { range: 'Below 60', count: 17 },
  ],
  byCourse: [
    { course: 'CS501 DSA', avg: 81, passRate: 94, atRisk: 6 },
    { course: 'CS503 OS', avg: 74, passRate: 88, atRisk: 11 },
    { course: 'CS505 ML', avg: 78, passRate: 91, atRisk: 8 },
  ],
  skillGaps: [
    { skill: 'Network flows', gap: 32, students: 44 },
    { skill: 'DP on trees', gap: 28, students: 39 },
    { skill: 'Synchronisation', gap: 22, students: 31 },
    { skill: 'Regularisation', gap: 18, students: 26 },
  ],
  topPerformers: [
    { name: 'Divya Krishnan', avg: 94, attendance: 98.2, trend: '+2.1' },
    { name: 'Ishita Gupta', avg: 91, attendance: 96.8, trend: '+1.4' },
    { name: 'Kavya Menon', avg: 90, attendance: 95.5, trend: '+3.0' },
    { name: 'Ananya Desai', avg: 89, attendance: 93.7, trend: '+0.8' },
  ],
}

export const facultyResearch = {
  summary: { publications: 62, citations: 2140, hIndex: 24, grants: 4, phdStudents: 6, activeProjects: 5 },
  citationsTrend: [
    { year: '2021', citations: 280 }, { year: '2022', citations: 340 }, { year: '2023', citations: 412 },
    { year: '2024', citations: 498 }, { year: '2025', citations: 610 },
  ],
  publications: [
    { id: 'pub1', title: 'GraphRAG for Adaptive Assessments: A Case Study in CS Education', venue: 'IEEE TLT', year: 2026, citations: 24, status: 'Published', authors: 'M. Krishnan, A. Sharma, et al.' },
    { id: 'pub2', title: 'Early Prediction of Academic Risk Using Study-Behaviour Signals', venue: 'LAK 2026', year: 2026, citations: 18, status: 'Published', authors: 'M. Krishnan, P. Nair' },
    { id: 'pub3', title: 'Energy-aware Scheduling on Heterogeneous Edge Clusters', venue: 'IEEE TPDS', year: 2025, citations: 87, status: 'Published', authors: 'M. Krishnan, V. Rao' },
    { id: 'pub4', title: 'Attention Pruning for Efficient Transformer Inference', venue: 'Under review — NeurIPS', year: 2026, citations: 0, status: 'Under Review', authors: 'M. Krishnan, lab team' },
    { id: 'pub5', title: 'Fairness-aware Peer Assessment with LLM Mediation', venue: 'In preparation', year: 2026, citations: 0, status: 'Drafting', authors: 'M. Krishnan' },
  ],
  grants: [
    { id: 'g1', title: 'AI for Equitable Learning at Scale', agency: 'SERB (DST, Govt. of India)', amount: '₹1.8 Cr', period: '2025–2028', status: 'Active' },
    { id: 'g2', title: 'Responsible LLM Evaluation Suite', agency: 'Google Research India', amount: '$60K', period: '2026–2027', status: 'Active' },
    { id: 'g3', title: 'Edge Intelligence for Smart Campuses', agency: 'AICTE RPS', amount: '₹42 L', period: '2024–2026', status: 'Active' },
  ],
  collaborations: [
    { org: 'IIT Bombay — CSE', focus: 'LLM evaluation', since: 2022 },
    { org: 'CMU — HCI Institute', focus: 'Learning analytics', since: 2023 },
    { org: 'Tata Research Labs', focus: 'Edge scheduling', since: 2024 },
  ],
}

export const facultyLecturePlanner = [
  { id: 'lp1', week: 'Week 9', date: '2026-08-03', course: 'CS501', topic: 'Network flows & max-flow/min-cut', status: 'Upcoming', resources: ['Slides M3.4', 'CLRS ch.26'], prep: 90 },
  { id: 'lp2', week: 'Week 9', date: '2026-08-04', course: 'CS503', topic: 'Memory management: paging & segmentation', status: 'Upcoming', resources: ['OSDev notes', 'Lab worksheet'], prep: 70 },
  { id: 'lp3', week: 'Week 8', date: '2026-07-28', course: 'CS501', topic: 'Bellman-Ford & negative cycles', status: 'Completed', resources: ['Slides M3.3'], prep: 100 },
  { id: 'lp4', week: 'Week 8', date: '2026-07-27', course: 'CS503', topic: 'Deadlock detection & recovery', status: 'Completed', resources: ['Textbook ch.7'], prep: 100 },
  { id: 'lp5', week: 'Week 7', date: '2026-07-21', course: 'CS505', topic: 'Regularisation & validation', status: 'Completed', resources: ['ML slides 12'], prep: 100 },
]

export const facultyExamBuilder = {
  drafts: [
    { id: 'eb1', title: 'Midsem — DSA (Paper A)', course: 'CS501', questions: 24, totalMarks: 50, blueprint: 'Module 1–3', status: 'Draft', lastEdited: '2026-07-29', coverage: 92, difficulty: 'Balanced' },
    { id: 'eb2', title: 'Midsem — DSA (Paper B)', course: 'CS501', questions: 24, totalMarks: 50, blueprint: 'Module 1–3', status: 'In Review', lastEdited: '2026-07-30', coverage: 94, difficulty: 'Balanced' },
    { id: 'eb3', title: 'Quiz 3 — Transactions', course: 'CS502', questions: 10, totalMarks: 10, blueprint: 'Unit 4', status: 'Approved', lastEdited: '2026-07-26', coverage: 100, difficulty: 'Medium' },
    { id: 'eb4', title: 'Class Test — Memory Management', course: 'CS503', questions: 15, totalMarks: 20, blueprint: 'Unit 3', status: 'Draft', lastEdited: '2026-08-01', coverage: 85, difficulty: 'Easy' },
  ],
  blueprint: [
    { outcome: 'CO1 — Analyse algorithm complexity', weight: 20, current: 20 },
    { outcome: 'CO2 — Design graph algorithms', weight: 35, current: 33 },
    { outcome: 'CO3 — Apply DP techniques', weight: 25, current: 27 },
    { outcome: 'CO4 — Evaluate NP-complete problems', weight: 20, current: 20 },
  ],
}

export const facultyReports = [
  { id: 'fr1', title: 'Class Performance — CS501 (Week 1–9)', type: 'PDF', category: 'Academic', status: 'Ready', scope: 'CS501 · Sec A/B/C', period: 'Week 1–9', generated: '2026-08-01', size: '2.1 MB', pages: 14, downloads: 18, archived: false, summary: 'Class average 77.7% · pass rate 91% · +13-point 6-week trend', template: 'Class Performance' },
  { id: 'fr2', title: 'At-Risk Student Register — Term 5', type: 'XLSX', category: 'Students', status: 'Ready', scope: 'All courses', period: 'Term 5', generated: '2026-07-30', size: '640 KB', pages: 4, downloads: 12, archived: false, summary: '8 students flagged · 4 critical · avg risk 74%', template: 'At-Risk Register' },
  { id: 'fr3', title: 'Attendance Summary — All Courses', type: 'PDF', category: 'Academic', status: 'Ready', scope: 'All courses', period: 'Last 8 weeks', generated: '2026-07-28', size: '1.4 MB', pages: 9, downloads: 25, archived: false, summary: 'Overall 91.8% · 14 students below 75% · 3 missing consecutively', template: 'Attendance Summary' },
  { id: 'fr4', title: 'Question Bank Analytics', type: 'XLSX', category: 'Assessment', status: 'Ready', scope: 'All subjects', period: 'Term 5', generated: '2026-07-20', size: '380 KB', pages: 3, downloads: 9, archived: false, summary: '1254 questions · quality 67.5/100 · accuracy 72.5%', template: 'Question Bank Analytics' },
  { id: 'fr5', title: 'Gradebook Export — OS (Sec B)', type: 'CSV', category: 'Academic', status: 'Ready', scope: 'CS503 · Sec B', period: 'Term 5', generated: '2026-07-15', size: '210 KB', pages: 1, downloads: 31, archived: false, summary: '68 students · avg 74% · 11 at risk', template: 'Gradebook Export' },
  { id: 'fr6', title: 'Assessment Health Report', type: 'PDF', category: 'Assessment', status: 'Ready', scope: 'All courses', period: 'Current', generated: '2026-08-04', size: '1.1 MB', pages: 8, downloads: 6, archived: false, summary: 'Health 70.7/100 Good · weakest unit Dynamic Programming (11.5%)', template: 'Assessment Health' },
  { id: 'fr7', title: 'Student Engagement Report', type: 'PDF', category: 'Students', status: 'Ready', scope: 'All courses', period: 'Last 8 weeks', generated: '2026-08-03', size: '980 KB', pages: 7, downloads: 8, archived: false, summary: 'Composite 79.4% · 5 excellent · 3 need support', template: 'Student Engagement' },
]

export const facultySettings = {
  profile: { email: 'meera.krishnan@medixoedux.edu', phone: '+91 98220 11456', officeHours: 'Mon & Wed, 3:00 – 5:00 PM', room: 'CSE Block, Room 214' },
  teachingPrefs: { autoGradeWithAI: true, aiDraftLessons: true, notifyOnSubmission: true, weeklySummary: true, allowStudentPolls: true },
  aiSettings: { gradingStrictness: 'Standard', language: 'English', citationsRequired: true },
}
