/**
 * Admin portal — additional mock data: revenue, programs, subjects,
 * role management grids, batches, academic calendar, module analytics,
 * question bank, scholarships, CMS, API config and data tools.
 */

export const adminRevenue = {
  kpis: [
    { label: 'Revenue (FY 26-27)', value: '₹86.4 Cr', delta: '+11.2%', up: true, sub: 'vs FY 25-26' },
    { label: 'Collected to date', value: '₹61.8 Cr', delta: '71.5% of budget', up: true, sub: 'FY target ₹86.4 Cr' },
    { label: 'Outstanding', value: '₹4.7 Cr', delta: '−₹0.8 Cr', up: true, sub: 'vs last quarter' },
    { label: 'Scholarships disbursed', value: '₹2.9 Cr', delta: '1,240 students', up: true, sub: 'FY 26-27' },
  ],
  revenueTrend: [
    { month: 'Apr', revenue: 420, target: 460 }, { month: 'May', revenue: 510, target: 500 },
    { month: 'Jun', revenue: 690, target: 640 }, { month: 'Jul', revenue: 610, target: 580 },
    { month: 'Aug', revenue: 470, target: 620 }, { month: 'Sep', revenue: 0, target: 700 },
  ],
  bySource: [
    { name: 'Tuition', value: 61, color: '#6366f1' },
    { name: 'Hostel & Mess', value: 18, color: '#14b8a6' },
    { name: 'Labs & Fees', value: 9, color: '#10b981' },
    { name: 'AI & Digital Services', value: 7, color: '#8b5cf6' },
    { name: 'Other', value: 5, color: '#f59e0b' },
  ],
  byDept: [
    { dept: 'CSE', revenue: 18.2 }, { dept: 'ECE', revenue: 14.6 }, { dept: 'ME', revenue: 12.1 },
    { dept: 'EE', revenue: 10.8 }, { dept: 'MBA', revenue: 13.9 }, { dept: 'CE', revenue: 8.2 },
    { dept: 'DES', revenue: 5.4 }, { dept: 'MATH', revenue: 3.2 },
  ],
  invoices: [
    { id: 'inv1', student: 'Aarav Sharma', dept: 'CSE', item: 'Tuition — 2nd installment', amount: 25000, due: '2026-09-15', status: 'Pending', method: '—' },
    { id: 'inv2', student: 'Rohan Verma', dept: 'CSE', item: 'Tuition — balance', amount: 48000, due: '2026-08-01', status: 'Overdue', method: '—' },
    { id: 'inv3', student: 'Divya Krishnan', dept: 'CSE', item: 'Tuition — 1st installment', amount: 70000, due: '2026-07-15', status: 'Paid', method: 'UPI' },
    { id: 'inv4', student: 'Sneha Patil', dept: 'CSE', item: 'Hostel & Mess — Sem 5', amount: 62000, due: '2026-06-30', status: 'Paid', method: 'Net Banking' },
    { id: 'inv5', student: 'Karan Mehta', dept: 'CSE', item: 'Tuition — balance', amount: 125000, due: '2026-07-15', status: 'Overdue', method: '—' },
    { id: 'inv6', student: 'Kavya Menon', dept: 'CSE', item: 'Coding Lab AI subscription', amount: 24000, due: '2026-06-30', status: 'Paid', method: 'UPI' },
  ],
}

export const adminPrograms = [
  { id: 'ap1', name: 'B.Tech — Computer Science', dept: 'CSE', duration: '4 yrs', students: 2480, intake: 600, fee: '₹4.2L/yr', accreditations: ['NBA', 'AICTE'], placements: 96.2, status: 'Active' },
  { id: 'ap2', name: 'B.Tech — Electronics & Communication', dept: 'ECE', duration: '4 yrs', students: 1930, intake: 480, fee: '₹3.8L/yr', accreditations: ['NBA', 'AICTE'], placements: 91.8, status: 'Active' },
  { id: 'ap3', name: 'B.Tech — Mechanical', dept: 'ME', duration: '4 yrs', students: 1640, intake: 420, fee: '₹3.5L/yr', accreditations: ['NBA'], placements: 86.4, status: 'Active' },
  { id: 'ap4', name: 'B.Tech — Electrical', dept: 'EE', duration: '4 yrs', students: 1420, intake: 360, fee: '₹3.6L/yr', accreditations: ['NBA'], placements: 89.1, status: 'Active' },
  { id: 'ap5', name: 'MBA — General Management', dept: 'MBA', duration: '2 yrs', students: 1240, intake: 360, fee: '₹6.5L/yr', accreditations: ['AACSB (candidate)'], placements: 93.5, status: 'Active' },
  { id: 'ap6', name: 'B.Des — Design & Media', dept: 'DES', duration: '4 yrs', students: 730, intake: 180, fee: '₹4.0L/yr', accreditations: ['AICTE'], placements: 88.2, status: 'Active' },
  { id: 'ap7', name: 'B.Tech — Civil', dept: 'CE', duration: '4 yrs', students: 1180, intake: 300, fee: '₹3.4L/yr', accreditations: ['NBA'], placements: 78.6, status: 'Active' },
  { id: 'ap8', name: 'M.Sc — Data Science', dept: 'MATH', duration: '2 yrs', students: 860, intake: 240, fee: '₹3.2L/yr', accreditations: ['UGC'], placements: 84.9, status: 'Active' },
]

export const adminSubjects = [
  { id: 'as1', code: 'CS501', name: 'Data Structures & Algorithms', program: 'B.Tech CSE', semester: 'Sem 5', credits: 4, courses: 4, faculty: 'Dr. Meera Krishnan', passRate: 94, status: 'Active' },
  { id: 'as2', code: 'CS502', name: 'Database Management Systems', program: 'B.Tech CSE', semester: 'Sem 5', credits: 3, courses: 3, faculty: 'Dr. Arvind Kulkarni', passRate: 91, status: 'Active' },
  { id: 'as3', code: 'CS503', name: 'Operating Systems', program: 'B.Tech CSE', semester: 'Sem 5', credits: 4, courses: 3, faculty: 'Dr. Meera Krishnan', passRate: 88, status: 'Active' },
  { id: 'as4', code: 'CS504', name: 'Computer Networks', program: 'B.Tech CSE', semester: 'Sem 5', credits: 3, courses: 3, faculty: 'Prof. Vikram Rao', passRate: 87, status: 'Active' },
  { id: 'as5', code: 'CS505', name: 'Machine Learning', program: 'B.Tech CSE', semester: 'Sem 5', credits: 4, courses: 4, faculty: 'Dr. Priya Nair', passRate: 92, status: 'Active' },
  { id: 'as6', code: 'CS506', name: 'Theory of Computation', program: 'B.Tech CSE', semester: 'Sem 5', credits: 3, courses: 2, faculty: 'Dr. Arvind Kulkarni', passRate: 83, status: 'Active' },
  { id: 'as7', code: 'EC301', name: 'Signals & Systems', program: 'B.Tech ECE', semester: 'Sem 5', credits: 3, courses: 2, faculty: 'Prof. Vikram Rao', passRate: 89, status: 'Active' },
  { id: 'as8', code: 'ME201', name: 'Thermodynamics', program: 'B.Tech ME', semester: 'Sem 3', credits: 4, courses: 3, faculty: 'Prof. Sunita Bose', passRate: 84, status: 'Active' },
  { id: 'as9', code: 'MBA401', name: 'Strategic Management', program: 'MBA', semester: 'Sem 4', credits: 3, courses: 2, faculty: 'Dr. Ritu Agarwal', passRate: 93, status: 'Active' },
  { id: 'as10', code: 'CS601', name: 'Compiler Design', program: 'B.Tech CSE', semester: 'Sem 6', credits: 4, courses: 2, faculty: 'Dr. Arvind Kulkarni', passRate: 89, status: 'Active' },
  { id: 'as11', code: 'EE401', name: 'Power Systems', program: 'B.Tech EE', semester: 'Sem 5', credits: 4, courses: 2, faculty: 'Dr. Farhan Ali', passRate: 86, status: 'Active' },
  { id: 'as12', code: 'DES201', name: 'Design Thinking Studio', program: 'B.Des', semester: 'Sem 3', credits: 3, courses: 3, faculty: 'Prof. Aditi Sen', passRate: 96, status: 'Active' },
]

export const adminBatches = [
  { id: 'ab1', name: 'CSE-2021', program: 'B.Tech CSE', intake: 220, students: 214, coordinator: 'Dr. Meera Krishnan', semester: 'Sem 5', avgCgpa: 8.1, status: 'Active' },
  { id: 'ab2', name: 'CSE-2022', program: 'B.Tech CSE', intake: 230, students: 228, coordinator: 'Dr. Arvind Kulkarni', semester: 'Sem 3', avgCgpa: 7.9, status: 'Active' },
  { id: 'ab3', name: 'CSE-2023', program: 'B.Tech CSE', intake: 240, students: 236, coordinator: 'Dr. Priya Nair', semester: 'Sem 1', avgCgpa: 7.6, status: 'Active' },
  { id: 'ab4', name: 'ECE-2021', program: 'B.Tech ECE', intake: 180, students: 174, coordinator: 'Prof. Vikram Rao', semester: 'Sem 5', avgCgpa: 7.8, status: 'Active' },
  { id: 'ab5', name: 'MBA-2025', program: 'MBA', intake: 180, students: 176, coordinator: 'Dr. Ritu Agarwal', semester: 'Sem 1', avgCgpa: 7.7, status: 'Active' },
  { id: 'ab6', name: 'ME-2021', program: 'B.Tech ME', intake: 160, students: 152, coordinator: 'Prof. Sunita Bose', semester: 'Sem 5', avgCgpa: 7.4, status: 'Active' },
  { id: 'ab7', name: 'CSE-2020', program: 'B.Tech CSE', intake: 210, students: 208, coordinator: 'Dr. Meera Krishnan', semester: 'Sem 7', avgCgpa: 8.3, status: 'Active' },
  { id: 'ab8', name: 'DES-2023', program: 'B.Des', intake: 90, students: 86, coordinator: 'Prof. Aditi Sen', semester: 'Sem 1', avgCgpa: 8.0, status: 'Active' },
]

export const adminAcademicCalendar = [
  { id: 'ac1', date: '2026-08-06', title: 'DSA Assignment 4 due', type: 'Deadline', scope: 'CSE Sem 5' },
  { id: 'ac2', date: '2026-08-08', title: 'Smart Campus Hackathon', type: 'Event', scope: 'All' },
  { id: 'ac3', date: '2026-08-14', title: 'DBMS Quiz 3', type: 'Exam', scope: 'CSE Sem 5' },
  { id: 'ac4', date: '2026-08-15', title: 'Midsem timetable release', type: 'Academic', scope: 'All' },
  { id: 'ac5', date: '2026-08-16', title: 'Mid-term progress reports', type: 'Academic', scope: 'All' },
  { id: 'ac6', date: '2026-08-18', title: 'Microsoft placement drive', type: 'Placement', scope: 'Final year' },
  { id: 'ac7', date: '2026-08-19', title: 'Midsem examinations begin', type: 'Exam', scope: 'All' },
  { id: 'ac8', date: '2026-08-23', title: 'Midsem examinations end', type: 'Exam', scope: 'All' },
  { id: 'ac9', date: '2026-08-24', title: 'Parent–Teacher Meeting', type: 'Event', scope: 'All' },
  { id: 'ac10', date: '2026-08-28', title: 'Research symposium abstracts due', type: 'Research', scope: 'Faculty' },
  { id: 'ac11', date: '2026-09-01', title: 'Semester break begins', type: 'Academic', scope: 'All' },
  { id: 'ac12', date: '2026-09-15', title: 'Fee — 2nd installment due', type: 'Finance', scope: 'All' },
]

export const adminAttendanceAnalytics = {
  overall: 91.2,
  trend: [
    { month: 'Mar', pct: 90.1 }, { month: 'Apr', pct: 89.4 }, { month: 'May', pct: 90.8 },
    { month: 'Jun', pct: 91.5 }, { month: 'Jul', pct: 91.9 }, { month: 'Aug', pct: 91.2 },
  ],
  byDept: [
    { dept: 'CSE', pct: 92.1 }, { dept: 'ECE', pct: 91.4 }, { dept: 'ME', pct: 89.6 },
    { dept: 'EE', pct: 90.2 }, { dept: 'MBA', pct: 93.8 }, { dept: 'CE', pct: 88.4 },
    { dept: 'DES', pct: 94.1 }, { dept: 'MATH', pct: 90.7 },
  ],
  belowThreshold: [
    { name: 'Nikhil Joshi', roll: '21CS108', dept: 'CSE', attendance: 74.6, classesMissed: 6 },
    { name: 'Karan Mehta', roll: '21CS104', dept: 'CSE', attendance: 78.5, classesMissed: 4 },
    { name: 'Sanjay Patel', roll: '21CS115', dept: 'CSE', attendance: 79.8, classesMissed: 3 },
    { name: 'Rohan Verma', roll: '21CS102', dept: 'CSE', attendance: 84.2, classesMissed: 2 },
    { name: 'Arjun Nair', roll: '21CS112', dept: 'CSE', attendance: 86.4, classesMissed: 2 },
  ],
  weekly: [
    { week: 'W1', pct: 91 }, { week: 'W2', pct: 90 }, { week: 'W3', pct: 92 }, { week: 'W4', pct: 89 },
    { week: 'W5', pct: 91 }, { week: 'W6', pct: 93 }, { week: 'W7', pct: 90 }, { week: 'W8', pct: 92 },
  ],
}

export const adminAssignmentAnalytics = {
  kpis: [
    { label: 'Assignments this term', value: 184, delta: '+12', up: true },
    { label: 'Submission rate', value: '93.2%', delta: '+1.8 pts', up: true },
    { label: 'On-time rate', value: '87.6%', delta: '+2.4 pts', up: true },
    { label: 'AI-graded share', value: '64%', delta: '+9 pts', up: true },
  ],
  byDept: [
    { dept: 'CSE', submitted: 96 }, { dept: 'ECE', submitted: 92 }, { dept: 'ME', submitted: 89 },
    { dept: 'EE', submitted: 91 }, { dept: 'MBA', submitted: 97 }, { dept: 'CE', submitted: 87 },
    { dept: 'DES', submitted: 95 }, { dept: 'MATH', submitted: 90 },
  ],
  monthly: [
    { month: 'Mar', assignments: 28 }, { month: 'Apr', assignments: 34 }, { month: 'May', assignments: 30 },
    { month: 'Jun', assignments: 22 }, { month: 'Jul', assignments: 38 }, { month: 'Aug', assignments: 32 },
  ],
  plagiarismFlags: { total: 24, resolved: 19, underReview: 5, trend: '-12% vs last term' },
}

export const adminExamAnalytics = {
  kpis: [
    { label: 'Exams this term', value: 42, delta: '+6', up: true },
    { label: 'Average score', value: '71.4%', delta: '+2.1 pts', up: true },
    { label: 'Pass rate', value: '89.7%', delta: '+1.4 pts', up: true },
    { label: 'Malpractice cases', value: 3, delta: '-5', up: true },
  ],
  scoreDistribution: [
    { range: '90–100', count: 14.2 }, { range: '80–89', count: 26.8 }, { range: '70–79', count: 28.4 },
    { range: '60–69', count: 15.6 }, { range: 'Below 60', count: 15.0 },
  ],
  bySubject: [
    { subject: 'DSA', avg: 81 }, { subject: 'DBMS', avg: 76 }, { subject: 'OS', avg: 74 },
    { subject: 'Networks', avg: 71 }, { subject: 'ML', avg: 78 }, { subject: 'ToC', avg: 64 },
  ],
  upcoming: [
    { title: 'Midsem — DSA', date: '2026-08-19', students: 142, status: 'Ready' },
    { title: 'Midsem — ML', date: '2026-08-20', students: 142, status: 'Ready' },
    { title: 'Midsem — OS', date: '2026-08-21', students: 136, status: 'In Review' },
    { title: 'Midsem — DBMS', date: '2026-08-22', students: 128, status: 'Drafting' },
    { title: 'Midsem — Networks', date: '2026-08-23', students: 118, status: 'Drafting' },
  ],
}

export const adminQuestionBank = {
  summary: { total: 8420, aiGenerated: 3210, approved: 7680, flagged: 46, byType: { MCQ: 4120, Subjective: 2410, Numerical: 1240, Case: 650 } },
  questions: [
    { id: 'aq1', code: 'Q-CS501-2214', subject: 'CS501', topic: 'Graphs', type: 'MCQ', difficulty: 'Easy', usage: 34, status: 'Approved', lastUsed: '2026-07-25' },
    { id: 'aq2', code: 'Q-CS503-0892', subject: 'CS503', topic: 'Scheduling', type: 'MCQ', difficulty: 'Medium', usage: 41, status: 'Approved', lastUsed: '2026-07-28' },
    { id: 'aq3', code: 'Q-CS505-3310', subject: 'CS505', topic: 'Regression', type: 'Numerical', difficulty: 'Medium', usage: 52, status: 'Approved', lastUsed: '2026-07-21' },
    { id: 'aq4', code: 'Q-CS506-0044', subject: 'CS506', topic: 'Automata', type: 'Subjective', difficulty: 'Hard', usage: 9, status: 'Flagged', lastUsed: '2026-07-22' },
    { id: 'aq5', code: 'Q-CS502-1187', subject: 'CS502', topic: 'Transactions', type: 'MCQ', difficulty: 'Medium', usage: 27, status: 'Approved', lastUsed: '2026-07-19' },
    { id: 'aq6', code: 'Q-CS501-3102', subject: 'CS501', topic: 'Dynamic Programming', type: 'MCQ', difficulty: 'Medium', usage: 38, status: 'Approved', lastUsed: '2026-07-18' },
    { id: 'aq7', code: 'Q-MBA-0521', subject: 'MBA401', topic: 'Strategy', type: 'Case', difficulty: 'Hard', usage: 12, status: 'Review', lastUsed: '2026-07-15' },
    { id: 'aq8', code: 'Q-CS504-2098', subject: 'CS504', topic: 'TCP/IP', type: 'MCQ', difficulty: 'Easy', usage: 46, status: 'Approved', lastUsed: '2026-07-14' },
  ],
}

export const adminScholarships = [
  { id: 'sch1', name: 'Merit Scholarship — Dean\'s List', type: 'Merit', amount: 20000, awarded: 312, budget: 6200000, eligibility: 'CGPA ≥ 8.5', status: 'Open' },
  { id: 'sch2', name: 'Means-cum-Merit Scholarship', type: 'Need-based', amount: 50000, awarded: 148, budget: 7400000, eligibility: 'CGPA ≥ 7.0 · family income < ₹8L', status: 'Open' },
  { id: 'sch3', name: 'Girl Child Technical Education', type: 'Merit', amount: 30000, awarded: 86, budget: 2580000, eligibility: 'Female · CGPA ≥ 8.0', status: 'Open' },
  { id: 'sch4', name: 'Sports Excellence Award', type: 'Sports', amount: 15000, awarded: 42, budget: 630000, eligibility: 'State/National level', status: 'Open' },
  { id: 'sch5', name: 'Research Fellowship — UG', type: 'Research', amount: 40000, awarded: 24, budget: 960000, eligibility: 'Selected by research office', status: 'Closed' },
  { id: 'sch6', name: 'Indigenous Language Scholars', type: 'Cultural', amount: 10000, awarded: 38, budget: 380000, eligibility: 'Language program enrolment', status: 'Closed' },
]

export const adminCms = {
  pages: [
    { id: 'cm1', title: 'About the Institute', slug: '/about', status: 'Published', updated: '2026-07-20', author: 'Communications', views: 12400 },
    { id: 'cm2', title: 'Admissions 2026-27', slug: '/admissions', status: 'Published', updated: '2026-08-01', author: 'Admissions Office', views: 48200 },
    { id: 'cm3', title: 'Placements Overview', slug: '/placements', status: 'Draft', updated: '2026-07-28', author: 'Placement Cell', views: 0 },
    { id: 'cm4', title: 'Campus Life', slug: '/campus-life', status: 'Published', updated: '2026-06-15', author: 'Student Council', views: 8900 },
    { id: 'cm5', title: 'Fee Structure 2026-27', slug: '/fees', status: 'Published', updated: '2026-07-05', author: 'Accounts', views: 31000 },
    { id: 'cm6', title: 'International Collaborations', slug: '/global', status: 'In Review', updated: '2026-07-30', author: 'Dean International', views: 0 },
  ],
  banners: [
    { id: 'bn1', title: 'Admissions Open — 2026-27', placement: 'Homepage hero', status: 'Active', clicks: 18200, ends: '2026-09-30' },
    { id: 'bn2', title: 'Midsem reminders', placement: 'Student portal', status: 'Active', clicks: 9400, ends: '2026-08-23' },
    { id: 'bn3', title: 'Research symposium — call for abstracts', placement: 'Faculty portal', status: 'Scheduled', clicks: 0, ends: '2026-08-28' },
  ],
  announcements: [
    { id: 'an1', title: 'Holiday — Independence Day (Aug 15)', audience: 'All', status: 'Scheduled', date: '2026-08-15' },
    { id: 'an2', title: 'Library extended hours during midsems', audience: 'All', status: 'Published', date: '2026-08-12' },
    { id: 'an3', title: 'Canteen revamp — new menu from Sep 1', audience: 'Hostel residents', status: 'Draft', date: '2026-08-25' },
  ],
}

export const adminApiConfig = {
  endpoints: [
    { id: 'ep1', name: 'Student Records API', method: 'GET/PUT', path: '/v1/students', usage: '42.1K calls/day', latency: 180, status: 'Healthy', version: 'v1.4' },
    { id: 'ep2', name: 'Attendance API', method: 'GET/POST', path: '/v1/attendance', usage: '18.6K calls/day', latency: 120, status: 'Healthy', version: 'v1.2' },
    { id: 'ep3', name: 'Exam Results API', method: 'GET', path: '/v1/results', usage: '9.8K calls/day', latency: 210, status: 'Healthy', version: 'v2.0' },
    { id: 'ep4', name: 'Fee & Invoice API', method: 'GET/POST', path: '/v1/finance', usage: '6.2K calls/day', latency: 240, status: 'Degraded', version: 'v1.1' },
    { id: 'ep5', name: 'AI Tutor Gateway', method: 'POST', path: '/v1/ai/tutor', usage: '31.4K calls/day', latency: 480, status: 'Healthy', version: 'v3.2' },
  ],
  webhooks: [
    { id: 'wh1', name: 'Result published → ERP sync', url: 'https://erp.meridian.edu/hooks/results', events: ['result.published'], status: 'Active', lastDelivery: '2026-08-02T14:00:00' },
    { id: 'wh2', name: 'Fee paid → Finance portal', url: 'https://finance.meridian.edu/hooks/payments', events: ['invoice.paid'], status: 'Active', lastDelivery: '2026-08-03T09:12:00' },
    { id: 'wh3', name: 'At-risk flag → Counsellor inbox', url: 'https://wellness.meridian.edu/medixoedux/flags', events: ['student.at_risk'], status: 'Inactive', lastDelivery: '—' },
  ],
  keys: [
    { id: 'ak1', name: 'Production — MediXO Gateway', key: 'aur_live_••••••••••••8f2k', scopes: ['students:read', 'attendance:write'], created: '2025-04-12', lastUsed: '2026-08-03', status: 'Active' },
    { id: 'ak2', name: 'Staging — Integration Tests', key: 'aur_test_••••••••••••11ab', scopes: ['*:read'], created: '2026-01-20', lastUsed: '2026-08-02', status: 'Active' },
    { id: 'ak3', name: 'Legacy — LMS Sync (deprecated)', key: 'aur_live_••••••••••••77ce', scopes: ['courses:read'], created: '2024-09-01', lastUsed: '2026-06-30', status: 'Revoked' },
  ],
}

export const adminDataTools = {
  exports: [
    { id: 'dx1', name: 'Full student directory', format: 'CSV', rows: 12480, generated: '2026-08-01', size: '18.2 MB', status: 'Ready' },
    { id: 'dx2', name: 'Attendance — Term 5 (all depts)', format: 'XLSX', rows: 42000, generated: '2026-07-31', size: '6.8 MB', status: 'Ready' },
    { id: 'dx3', name: 'Exam results — End-Sem 2025', format: 'XLSX', rows: 11800, generated: '2026-01-10', size: '4.1 MB', status: 'Ready' },
    { id: 'dx4', name: 'Fee ledger — FY 2025-26', format: 'CSV', rows: 32400, generated: '2026-04-01', size: '9.4 MB', status: 'Ready' },
    { id: 'dx5', name: 'Question bank — full export', format: 'JSON', rows: 8420, generated: '—', size: '—', status: 'Queued' },
    { id: 'dx6', name: 'AI usage analytics', format: 'CSV', rows: 24000, generated: '—', size: '—', status: 'Queued' },
  ],
  imports: [
    { id: 'im1', name: 'Batch 2026 admissions upload', format: 'CSV', rows: 620, uploaded: '2026-07-28', status: 'Completed', errors: 3 },
    { id: 'im2', name: 'Faculty directory update', format: 'XLSX', rows: 640, uploaded: '2026-07-15', status: 'Completed', errors: 0 },
    { id: 'im3', name: 'Midsem seating plan', format: 'CSV', rows: 2400, uploaded: '2026-08-01', status: 'Processing', errors: null },
    { id: 'im4', name: 'ERP fee sync — July', format: 'CSV', rows: 8100, uploaded: '2026-08-02', status: 'Failed', errors: 12 },
  ],
  templates: [
    { name: 'student_bulk_upload.csv', desc: 'Students: name, email, roll, program, batch, guardian' },
    { name: 'faculty_bulk_upload.csv', desc: 'Faculty: name, email, dept, designation, specialisation' },
    { name: 'attendance_import.csv', desc: 'Attendance: roll, date, course, status, marked_by' },
  ],
}
