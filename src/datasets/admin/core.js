/**
 * Admin portal mock data — institution dashboard, users, departments,
 * courses, analytics, performance, placements, research, governance.
 */

export const adminDashboard = {
  kpis: [
    { id: 'ak1', label: 'Total students', value: 12480, delta: '+6.2%', up: true, sub: 'vs last term', icon: 'Users', gradient: 'from-indigo-500 to-blue-500', spark: [42, 48, 45, 52, 58, 61, 64] },
    { id: 'ak2', label: 'Faculty', value: 640, delta: '+18', up: true, sub: 'new hires this year', icon: 'GraduationCap', gradient: 'from-emerald-500 to-teal-500', spark: [30, 32, 31, 35, 36, 38, 40] },
    { id: 'ak3', label: 'Courses live', value: 214, delta: '+23', up: true, sub: 'this semester', icon: 'BookOpen', gradient: 'from-blue-500 to-sky-500', spark: [20, 24, 26, 28, 30, 31, 33] },
    { id: 'ak4', label: 'Fee collection', value: '₹48.2 Cr', delta: '+8.4%', up: true, sub: 'FY 2025–26', icon: 'Wallet', gradient: 'from-amber-500 to-orange-500', spark: [60, 58, 62, 65, 68, 70, 73] },
  ],
  enrollmentTrend: [
    { term: '2022-1', students: 8420 }, { term: '2022-2', students: 8910 }, { term: '2023-1', students: 9480 },
    { term: '2023-2', students: 10120 }, { term: '2024-1', students: 10840 }, { term: '2024-2', students: 11560 },
    { term: '2025-1', students: 12140 }, { term: '2025-2', students: 12480 },
  ],
  deptDistribution: [
    { name: 'CSE', value: 2480, color: '#6366f1' },
    { name: 'ECE', value: 1930, color: '#3b82f6' },
    { name: 'ME', value: 1640, color: '#14b8a6' },
    { name: 'EE', value: 1420, color: '#10b981' },
    { name: 'CE', value: 1180, color: '#f59e0b' },
    { name: 'MBA', value: 1240, color: '#f43f5e' },
    { name: 'Others', value: 2590, color: '#94a3b8' },
  ],
  alerts: [
    { id: 'al1', severity: 'High', title: 'CSE Sec B attendance below threshold', text: '3-week average at 86.4% — 14 students flagged', time: '2h ago' },
    { id: 'al2', severity: 'Medium', title: 'Fee collection: 342 invoices pending >45 days', text: 'Concentrated in MBA (44%) and ECE (31%)', time: '5h ago' },
    { id: 'al3', severity: 'Info', title: 'New AI model update available', text: 'MediXO LLM v4.2 improves grading accuracy by 3.1%', time: '1d ago' },
    { id: 'al4', severity: 'Low', title: 'Server load healthy', text: 'Peak API latency at 210ms — well within SLA', time: '1d ago' },
  ],
  activityFeed: [
    { id: 'af1', user: 'Dr. Meera Krishnan', action: 'published exam', target: 'Midsem — DSA (Paper A)', time: '28 min ago' },
    { id: 'af2', user: 'Registrar Office', action: 'admitted', target: '38 students (MBA cohort)', time: '1 hr ago' },
    { id: 'af3', user: 'Prof. Vikram Rao', action: 'marked attendance', target: 'CN Lab — 61/68 present', time: '3 hrs ago' },
    { id: 'af4', user: 'Placement Cell', action: 'scheduled drive', target: 'Microsoft — Aug 18', time: '5 hrs ago' },
    { id: 'af5', user: 'System', action: 'completed nightly backup', target: '7.2 TB · 14 min', time: '8 hrs ago' },
  ],
}

export const adminCourses = [
  { id: 'ac1', code: 'CS501', title: 'Data Structures & Algorithms', dept: 'CSE', credits: 4, enrolled: 142, faculty: 'Dr. Meera Krishnan', semester: 'Sem 5', passRate: 94, status: 'Active' },
  { id: 'ac2', code: 'CS502', title: 'Database Management Systems', dept: 'CSE', credits: 3, enrolled: 128, faculty: 'Dr. Arvind Kulkarni', semester: 'Sem 5', passRate: 91, status: 'Active' },
  { id: 'ac3', code: 'CS505', title: 'Machine Learning', dept: 'CSE', credits: 4, enrolled: 142, faculty: 'Dr. Priya Nair', semester: 'Sem 5', passRate: 92, status: 'Active' },
  { id: 'ac4', code: 'EC301', title: 'Signals & Systems', dept: 'ECE', credits: 3, enrolled: 118, faculty: 'Prof. Vikram Rao', semester: 'Sem 5', passRate: 87, status: 'Active' },
  { id: 'ac5', code: 'ME201', title: 'Thermodynamics', dept: 'ME', credits: 4, enrolled: 132, faculty: 'Prof. Sunita Bose', semester: 'Sem 3', passRate: 84, status: 'Active' },
  { id: 'ac6', code: 'MBA401', title: 'Strategic Management', dept: 'MBA', credits: 3, enrolled: 96, faculty: 'Dr. Ritu Agarwal', semester: 'Sem 4', passRate: 93, status: 'Active' },
  { id: 'ac7', code: 'CS601', title: 'Compiler Design', dept: 'CSE', credits: 4, enrolled: 108, faculty: 'Dr. Arvind Kulkarni', semester: 'Sem 6', passRate: 89, status: 'Active' },
  { id: 'ac8', code: 'EE401', title: 'Power Systems', dept: 'EE', credits: 4, enrolled: 94, faculty: 'Dr. Farhan Ali', semester: 'Sem 5', passRate: 86, status: 'Active' },
  { id: 'ac9', code: 'DES201', title: 'Design Thinking Studio', dept: 'DES', credits: 3, enrolled: 76, faculty: 'Prof. Aditi Sen', semester: 'Sem 3', passRate: 96, status: 'Active' },
  { id: 'ac10', code: 'CE301', title: 'Structural Analysis', dept: 'CE', credits: 4, enrolled: 88, faculty: 'Prof. James Thomas', semester: 'Sem 5', passRate: 82, status: 'Archived' },
]

export const adminAnalytics = {
  retention: [
    { year: '2022', first: 91.2, overall: 88.4 },
    { year: '2023', first: 92.1, overall: 89.2 },
    { year: '2024', first: 93.4, overall: 90.8 },
    { year: '2025', first: 94.8, overall: 92.1 },
  ],
  genderSplit: [
    { name: 'Male', value: 58, color: '#6366f1' },
    { name: 'Female', value: 42, color: '#14b8a6' },
  ],
  semesterWise: [
    { sem: 'Sem 1', cgpa: 7.2 }, { sem: 'Sem 2', cgpa: 7.4 }, { sem: 'Sem 3', cgpa: 7.5 },
    { sem: 'Sem 4', cgpa: 7.7 }, { sem: 'Sem 5', cgpa: 7.8 }, { sem: 'Sem 6', cgpa: 7.9 },
    { sem: 'Sem 7', cgpa: 8.0 }, { sem: 'Sem 8', cgpa: 8.1 },
  ],
  feeCollection: [
    { month: 'Apr', collected: 82 }, { month: 'May', collected: 88 }, { month: 'Jun', collected: 91 },
    { month: 'Jul', collected: 93 }, { month: 'Aug', collected: 95 },
  ],
  aiUsage: [
    { month: 'Mar', sessions: 42000 }, { month: 'Apr', sessions: 51000 }, { month: 'May', sessions: 58400 },
    { month: 'Jun', sessions: 47200 }, { month: 'Jul', sessions: 66000 }, { month: 'Aug', sessions: 71000 },
  ],
  satisfaction: { teaching: 4.3, infrastructure: 4.1, digital: 4.6, overall: 4.4 },
}

export const adminPerformance = {
  gradeDistribution: [
    { grade: 'A+', count: 12.4 }, { grade: 'A', count: 24.8 }, { grade: 'B+', count: 27.6 },
    { grade: 'B', count: 19.2 }, { grade: 'C', count: 11.3 }, { grade: 'D/F', count: 4.7 },
  ],
  deptPassRates: [
    { dept: 'CSE', pass: 93.1 }, { dept: 'ECE', pass: 89.4 }, { dept: 'ME', pass: 85.2 },
    { dept: 'EE', pass: 87.8 }, { dept: 'CE', pass: 82.6 }, { dept: 'MBA', pass: 94.2 },
    { dept: 'DES', pass: 96.1 }, { dept: 'MATH', pass: 88.9 },
  ],
  atRiskTrend: [
    { month: 'Mar', atRisk: 8.4 }, { month: 'Apr', atRisk: 7.9 }, { month: 'May', atRisk: 7.1 },
    { month: 'Jun', atRisk: 6.8 }, { month: 'Jul', atRisk: 6.2 },
  ],
  topStudents: [
    { name: 'Divya Krishnan', dept: 'CSE', cgpa: 9.3 }, { name: 'Ishita Gupta', dept: 'CSE', cgpa: 9.1 },
    { name: 'Kavya Menon', dept: 'CSE', cgpa: 9.0 }, { name: 'Aditi Rao', dept: 'MBA', cgpa: 8.9 },
    { name: 'Sneha Patil', dept: 'CSE', cgpa: 8.9 }, { name: 'Rahul Iyer', dept: 'ECE', cgpa: 8.8 },
  ],
  interventionImpact: { flagged: 214, recovered: 168, recoveryRate: 78.5, avgWeeks: 4.2 },
}

export const adminPlacements = {
  kpis: [
    { label: 'Placement rate', value: '92.4%', delta: '+3.8 pts', up: true },
    { label: 'Average CTC', value: '₹11.8 LPA', delta: '+9.2%', up: true },
    { label: 'Offers made', value: 1240, delta: '+142', up: true },
    { label: 'Top recruiters', value: 86, delta: '+14', up: true },
  ],
  companyWise: [
    { company: 'Google', offers: 14, ctc: '₹42 LPA' },
    { company: 'Microsoft', offers: 18, ctc: '₹36 LPA' },
    { company: 'Amazon', offers: 32, ctc: '₹28 LPA' },
    { company: 'Goldman Sachs', offers: 12, ctc: '₹26 LPA' },
    { company: 'Flipkart', offers: 24, ctc: '₹24 LPA' },
    { company: 'Tata Consultancy', offers: 210, ctc: '₹7.5 LPA' },
    { company: 'Infosys', offers: 184, ctc: '₹6.8 LPA' },
    { company: 'Wipro', offers: 152, ctc: '₹6.2 LPA' },
  ],
  branchWise: [
    { branch: 'CSE', placed: 96.2 }, { branch: 'ECE', placed: 91.8 }, { branch: 'MBA', placed: 93.5 },
    { branch: 'EE', placed: 89.1 }, { branch: 'ME', placed: 86.4 }, { branch: 'DES', placed: 88.2 },
    { branch: 'CE', placed: 78.6 }, { branch: 'MATH', placed: 84.9 },
  ],
  salaryTrend: [
    { year: '2021', avg: '₹6.4 LPA' }, { year: '2022', avg: '₹7.8 LPA' }, { year: '2023', avg: '₹8.9 LPA' },
    { year: '2024', avg: '₹10.2 LPA' }, { year: '2025', avg: '₹11.8 LPA' },
  ],
  drives: [
    { id: 'dr1', company: 'Microsoft', role: 'SWE Intern', date: '2026-08-18', positions: 20, stage: 'Scheduled' },
    { id: 'dr2', company: 'Flipkart', role: 'SDE-1', date: '2026-08-22', positions: 15, stage: 'Scheduled' },
    { id: 'dr3', company: 'Deutsche Bank', role: 'Technology Analyst', date: '2026-08-25', positions: 12, stage: 'Scheduled' },
    { id: 'dr4', company: 'Qrate Analytics', role: 'ML Engineer', date: '2026-08-27', positions: 8, stage: 'Scheduled' },
  ],
}

export const adminResearch = {
  kpis: [
    { label: 'Active grants', value: 86, delta: '+12', up: true },
    { label: 'Publications (FY26)', value: 1240, delta: '+18%', up: true },
    { label: 'Total citations', value: '42.8K', delta: '+11%', up: true },
    { label: 'Patents filed', value: 32, delta: '+6', up: true },
  ],
  grantTrend: [
    { year: '2021', amount: 18.4 }, { year: '2022', amount: 24.2 }, { year: '2023', amount: 31.6 },
    { year: '2024', amount: 38.9 }, { year: '2025', amount: 47.3 }, { year: '2026', amount: 52.8 },
  ],
  byDept: [
    { dept: 'CSE', pubs: 342 }, { dept: 'ECE', pubs: 268 }, { dept: 'ME', pubs: 196 },
    { dept: 'EE', pubs: 174 }, { dept: 'MATH', pubs: 128 }, { dept: 'MBA', pubs: 132 },
  ],
  topProjects: [
    { title: 'AI for Equitable Learning at Scale', pi: 'Dr. Meera Krishnan', funding: '₹1.8 Cr', status: 'Active' },
    { title: '6G Beamforming Testbed', pi: 'Prof. Vikram Rao', funding: '₹2.4 Cr', status: 'Active' },
    { title: 'Green Manufacturing Analytics', pi: 'Prof. Sunita Bose', funding: '₹96 L', status: 'Active' },
  ],
}

export const adminRoles = [
  { id: 'role1', name: 'Super Admin', members: 4, description: 'Full platform access including AI configuration and billing', color: 'from-rose-500 to-pink-500' },
  { id: 'role2', name: 'Institution Admin', members: 12, description: 'Users, departments, courses, analytics and governance', color: 'from-indigo-500 to-blue-500' },
  { id: 'role3', name: 'HOD', members: 18, description: 'Department scope: courses, faculty, student analytics', color: 'from-violet-500 to-purple-500' },
  { id: 'role4', name: 'Faculty', members: 640, description: 'Teaching tools, own courses, question bank, research', color: 'from-teal-500 to-emerald-500' },
  { id: 'role5', name: 'Student', members: 12480, description: 'Learning, AI tutor, career tools, own data only', color: 'from-blue-500 to-sky-500' },
  { id: 'role6', name: 'Parent', members: 8640, description: 'Ward progress, insights, teacher communication', color: 'from-emerald-500 to-lime-500' },
  { id: 'role7', name: 'Placement Officer', members: 6, description: 'Placement drives, offers, employer relations', color: 'from-amber-500 to-orange-500' },
  { id: 'role8', name: 'Auditor (Read-only)', members: 3, description: 'Read-only access to all modules, full audit trail', color: 'from-slate-500 to-slate-600' },
]

export const adminPermissions = [
  { module: 'Dashboard & Analytics', admin: ['read', 'export'], hod: ['read'], faculty: ['read'], student: ['read'], parent: ['read'] },
  { module: 'User Management', admin: ['read', 'create', 'update', 'delete'], hod: ['read', 'update'], faculty: [], student: [], parent: [] },
  { module: 'Courses & Curriculum', admin: ['read', 'create', 'update', 'delete', 'approve'], hod: ['read', 'create', 'update'], faculty: ['read', 'update'], student: ['read'], parent: ['read'] },
  { module: 'Question Bank', admin: ['read', 'manage_ai'], hod: ['read', 'create'], faculty: ['read', 'create', 'update', 'delete'], student: [], parent: [] },
  { module: 'AI Configuration', admin: ['read', 'manage_ai'], hod: [], faculty: [], student: [], parent: [] },
  { module: 'Placements', admin: ['read', 'create', 'update', 'export'], hod: ['read'], faculty: [], student: ['read'], parent: ['read'] },
  { module: 'Audit Logs', admin: ['read', 'export'], hod: [], faculty: [], student: [], parent: [] },
  { module: 'Billing & Invoicing', admin: ['read', 'create', 'update'], hod: [], faculty: [], student: ['read'], parent: ['read'] },
]

export const adminAuditLogs = [
  { id: 'log1', actor: 'Ananya Iyer', action: 'UPDATE', module: 'Users', target: 'u_stu_001 · status → Active', ip: '10.24.8.14', time: '2026-08-03T11:32:00', result: 'Success' },
  { id: 'log2', actor: 'Dr. Meera Krishnan', action: 'PUBLISH', module: 'Exams', target: 'Midsem — DSA (Paper A)', ip: '10.24.4.92', time: '2026-08-03T10:05:00', result: 'Success' },
  { id: 'log3', actor: 'System', action: 'BACKUP', module: 'Infrastructure', target: 'Nightly backup · 7.2 TB', ip: 'internal', time: '2026-08-03T02:00:00', result: 'Success' },
  { id: 'log4', actor: 'Registrar Office', action: 'CREATE', module: 'Admissions', target: 'MBA cohort · 38 students', ip: '10.24.9.3', time: '2026-08-02T16:45:00', result: 'Success' },
  { id: 'log5', actor: 'Karan Mehta (student)', action: 'LOGIN_FAILED', module: 'Auth', target: '5 attempts · IP 203.0.113.44', ip: '203.0.113.44', time: '2026-08-02T14:12:00', result: 'Blocked' },
  { id: 'log6', actor: 'Ananya Iyer', action: 'UPDATE', module: 'AI Config', target: 'Grading strictness → Standard', ip: '10.24.8.14', time: '2026-08-01T12:20:00', result: 'Success' },
  { id: 'log7', actor: 'Prof. Vikram Rao', action: 'EXPORT', module: 'Reports', target: 'Attendance Summary — ECE', ip: '10.24.5.77', time: '2026-08-01T09:15:00', result: 'Success' },
  { id: 'log8', actor: 'System', action: 'SCALE', module: 'Infrastructure', target: 'Auto-scaled 4 → 8 workers', ip: 'internal', time: '2026-07-31T22:00:00', result: 'Success' },
  { id: 'log9', actor: 'Ananya Iyer', action: 'CREATE', module: 'Roles', target: 'Auditor (Read-only) · 3 members', ip: '10.24.8.14', time: '2026-07-31T11:00:00', result: 'Success' },
  { id: 'log10', actor: 'Dr. Priya Nair', action: 'DELETE', module: 'Question Bank', target: 'q_8821 · duplicate MCQ', ip: '10.24.4.31', time: '2026-07-30T15:40:00', result: 'Success' },
]

export const adminAiConfig = {
  models: [
    { id: 'm1', name: 'MediXO Tutor LLM', provider: 'MediXO Foundation', version: 'v4.2', role: 'AI Tutor & Copilot', latency: 480, tokens: '8K', status: 'Healthy', usage: 68 },
    { id: 'm2', name: 'Grading Assistant', provider: 'MediXO Foundation', version: 'v2.7', role: 'Auto-grading', latency: 620, tokens: '4K', status: 'Healthy', usage: 42 },
    { id: 'm3', name: 'GraphRAG Retriever', provider: 'MediXO Graph', version: 'v3.1', role: 'Knowledge search', latency: 350, tokens: '12K', status: 'Healthy', usage: 51 },
    { id: 'm4', name: 'Voice-to-Text (Hindi/EN)', provider: 'MediXO Speech', version: 'v1.9', role: 'Lecture transcription', latency: 410, tokens: '—', status: 'Degraded', usage: 22 },
  ],
  quotas: [
    { feature: 'AI Tutor sessions/student/day', limit: 30, current: 18.2, unit: 'sessions' },
    { feature: 'AI-generated questions/month', limit: 20000, current: 14680, unit: 'questions' },
    { feature: 'GraphRAG queries/day', limit: 50000, current: 31800, unit: 'queries' },
    { feature: 'Copilot messages/faculty/day', limit: 100, current: 61, unit: 'messages' },
  ],
  guardrails: { safeMode: true, filterHate: true, filterPlagiarism: true, requireCitations: true, allowMultilingual: true, allowVoice: true },
  prompts: [
    { id: 'p1', name: 'Tutor — explain', template: 'Explain {topic} for a {level} learner using a relatable analogy, a worked example and a self-check question.', updated: '2026-07-28' },
    { id: 'p2', name: 'Grading — feedback', template: 'Grade {submission} against {rubric}. Give a score, strengths (2), improvements (2), and a one-line encouraging close.', updated: '2026-07-20' },
    { id: 'p3', name: 'Parent insight', template: 'Summarise {ward_report} in 3 plain-language bullets for a parent. Lead with strengths. Flag only actionable concerns.', updated: '2026-07-15' },
  ],
}

export const adminSettings = {
  institution: { name: 'Meridian Institute of Technology', shortName: 'MIT-P', address: 'Knowledge Park, Pune 411044, Maharashtra', phone: '+91 20 4010 2200', email: 'info@meridian.edu.in', timezone: 'IST (UTC+5:30)', fiscalYear: 'Apr – Mar' },
  academics: { semesterSystem: 'Semester', currentTerm: 'Sem 5 · 2026-27', gradingScale: '10-point CGPA', attendanceThreshold: 75, passMark: 40 },
  features: { enableAiTutor: true, enableCodingLab: true, enableParentPortal: true, enablePlacements: true, enableResearch: true, enablePublicPortfolio: true },
  security: { ssoEnabled: false, ssoProvider: 'SAML 2.0', mfaRequired: true, sessionTimeout: 30, passwordPolicy: '8+ chars, upper + number', dataResidency: 'Mumbai, India' },
}
