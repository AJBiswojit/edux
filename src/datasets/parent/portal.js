/**
 * Parent portal — additional mock data: assignments/homework, fee summary,
 * behaviour reports, calendar, downloads, notifications and settings.
 */

export const parentAssignments = [
  { id: 'pa1', title: 'DSA Assignment 4 — Graph Algorithms', subject: 'CS501', due: '2026-08-06T23:59:00', status: 'Pending', progress: 40, teacher: 'Dr. Meera Krishnan', weight: 10, description: 'Implement Dijkstra, Bellman-Ford and Floyd-Warshall with complexity analysis.' },
  { id: 'pa2', title: 'ML Mini-Project — Sentiment Analysis', subject: 'CS505', due: '2026-08-11T23:59:00', status: 'Pending', progress: 25, teacher: 'Dr. Priya Nair', weight: 15, description: 'Sentiment classifier with baseline comparison and report.' },
  { id: 'pa3', title: 'DBMS Quiz 3 — Transactions', subject: 'CS502', due: '2026-08-14T18:00:00', status: 'Upcoming', progress: 0, teacher: 'Dr. Arvind Kulkarni', weight: 5, description: 'ACID, isolation levels, 2PL, deadlocks.' },
  { id: 'pa4', title: 'OS Assignment 3 — CPU Scheduling', subject: 'CS503', due: '2026-07-30T23:59:00', status: 'Graded', progress: 100, score: 17, maxScore: 20, grade: 'A', teacher: 'Dr. Meera Krishnan', weight: 10, feedback: 'Excellent analysis of starvation in SJF. One Gantt chart error in round-robin.' },
  { id: 'pa5', title: 'CN Lab Record 5 — Socket Programming', subject: 'CS504', due: '2026-07-28T23:59:00', status: 'Graded', progress: 100, score: 18, maxScore: 20, grade: 'A', teacher: 'Prof. Vikram Rao', weight: 10, feedback: 'Clean TCP implementation. Add partial-read handling next time.' },
  { id: 'pa6', title: 'ToC Problem Set 2 — Regular Languages', subject: 'CS506', due: '2026-07-24T23:59:00', status: 'Graded', progress: 100, score: 15, maxScore: 20, grade: 'B+', teacher: 'Dr. Arvind Kulkarni', weight: 10, feedback: 'Pumping lemma proofs need more rigour — review module 4 examples.' },
]

export const parentFees = {
  summary: { totalDue: 214500, totalPaid: 189500, outstanding: 25000, nextDue: '2026-09-15', installment: '2nd installment — Tuition' },
  breakdown: [
    { item: 'Tuition — Semester 5', amount: 95000, paid: 70000, status: 'Partial', due: '2026-07-15' },
    { item: 'Hostel & Mess — Semester 5', amount: 62000, paid: 62000, status: 'Paid', due: '2026-06-30' },
    { item: 'Lab & Examination Fees', amount: 18500, paid: 18500, status: 'Paid', due: '2026-06-30' },
    { item: 'Coding Lab Subscription (AI)', amount: 24000, paid: 24000, status: 'Paid', due: '2026-06-30' },
    { item: 'Caution Deposit (refundable)', amount: 15000, paid: 15000, status: 'Held', due: '—' },
  ],
  transactions: [
    { id: 'tx1', date: '2026-06-28', item: 'Sem 5 — full payment (hostel + fees)', method: 'UPI · HDFC Bank', amount: 119500, status: 'Success', receipt: 'RCP-2026-0881' },
    { id: 'tx2', date: '2026-07-15', item: 'Tuition — 1st installment', method: 'Net Banking · ICICI', amount: 70000, status: 'Success', receipt: 'RCP-2026-0942' },
    { id: 'tx3', date: '2026-05-20', item: 'Caution deposit', method: 'UPI · HDFC Bank', amount: 15000, status: 'Success', receipt: 'RCP-2026-0701' },
    { id: 'tx4', date: '2026-08-01', item: 'Tuition — 2nd installment', method: '—', amount: 25000, status: 'Pending', receipt: '—' },
  ],
  scholarshipApplied: { name: 'Merit Scholarship — Dean\'s List', amount: 20000, status: 'Sanctioned', credited: '2026-08-20' },
}

export const parentBehavior = {
  summary: { rating: 4.6, attendanceBehaviour: 'Consistent', incidents: 0, commendations: 3, flags: 0 },
  reports: [
    { id: 'br1', period: 'July 2026', rating: 4.7, incidents: 0, commendations: 1, teacher: 'Dr. Meera Krishnan', summary: 'Focused, participates actively in class discussions. Respectful in group work. No behavioural concerns.', flags: [] },
    { id: 'br2', period: 'June 2026', rating: 4.5, incidents: 0, commendations: 1, teacher: 'Dr. Priya Nair', summary: 'Consistent engagement. One late lab submission, promptly rectified after a gentle reminder.', flags: ['Late lab submission (Jun 12)'] },
    { id: 'br3', period: 'May 2026', rating: 4.6, incidents: 0, commendations: 1, teacher: 'Prof. Vikram Rao', summary: 'Good collaborator; peers look to him in lab sessions. Maintains a positive tone even under deadline pressure.', flags: [] },
  ],
  commendations: [
    { id: 'cm1', date: '2026-07-24', teacher: 'Dr. Meera Krishnan', text: 'Helped two classmates debug their graph assignment during office hours.' },
    { id: 'cm2', date: '2026-06-10', teacher: 'Dr. Priya Nair', text: 'Presented the group\'s ML findings clearly and fielded questions well.' },
    { id: 'cm3', date: '2026-05-28', teacher: 'Placement Cell', text: 'Volunteered as student coordinator for the campus hiring drive.' },
  ],
  trend: [
    { month: 'Mar', rating: 4.4 }, { month: 'Apr', rating: 4.5 }, { month: 'May', rating: 4.6 },
    { month: 'Jun', rating: 4.5 }, { month: 'Jul', rating: 4.7 },
  ],
}

export const parentCalendarEvents = [
  { id: 'pce1', title: 'DSA Assignment 4 due', date: '2026-08-06', type: 'deadline', subject: 'CS501' },
  { id: 'pce2', title: 'ML Mini-Project due', date: '2026-08-11', type: 'deadline', subject: 'CS505' },
  { id: 'pce3', title: 'DBMS Quiz 3', date: '2026-08-14', type: 'exam', subject: 'CS502' },
  { id: 'pce4', title: 'Midsem examinations begin', date: '2026-08-19', type: 'exam', subject: 'All' },
  { id: 'pce5', title: 'Parent–Teacher Meeting (virtual)', date: '2026-08-24', type: 'meeting', subject: 'CSE HOD' },
  { id: 'pce6', title: 'Fee — 2nd installment due', date: '2026-09-15', type: 'fee', subject: 'Accounts' },
  { id: 'pce7', title: 'Hackathon — Smart Campus', date: '2026-08-08', type: 'event', subject: 'Club' },
  { id: 'pce8', title: 'Mid-term progress report issued', date: '2026-08-16', type: 'report', subject: 'Academics' },
]

export const parentDownloads = [
  { id: 'pd1', name: 'Progress Report — Term 4 (End-term)', type: 'PDF', size: '1.2 MB', date: '2025-12-22', category: 'Reports' },
  { id: 'pd2', name: 'Attendance Certificate — 2025-26', type: 'PDF', size: '640 KB', date: '2025-05-10', category: 'Certificates' },
  { id: 'pd3', name: 'Fee receipts — FY 2025-26 (combined)', type: 'PDF', size: '2.8 MB', date: '2026-03-31', category: 'Finance' },
  { id: 'pd4', name: 'Admit card — Midsem Aug 2026', type: 'PDF', size: '380 KB', date: '2026-08-15', category: 'Exams' },
  { id: 'pd5', name: 'Ward achievement summary — 2025-26', type: 'PDF', size: '910 KB', date: '2026-04-20', category: 'Reports' },
  { id: 'pd6', name: 'Insurance & medical records', type: 'PDF', size: '1.6 MB', date: '2025-08-02', category: 'Records' },
]

export const parentNotifications = [
  { id: 'pn1', icon: 'ClipboardCheck', title: 'DSA Quiz 2 — top 8% of class', text: 'Aarav scored 9.5/10 on the Trees quiz.', time: '2026-08-01T10:00:00', unread: true, category: 'Academics' },
  { id: 'pn2', icon: 'Flame', title: '12-day study streak', text: 'Longest streak this academic year — consistency is paying off.', time: '2026-08-01T08:00:00', unread: true, category: 'Progress' },
  { id: 'pn3', icon: 'CalendarClock', title: 'Midsems begin Aug 19', text: '5 papers in 5 days. Timetable released Aug 15.', time: '2026-07-28T09:00:00', unread: true, category: 'Exams' },
  { id: 'pn4', icon: 'Wallet', title: 'Fee — 2nd installment due Sep 15', text: '₹25,000 outstanding. Pay online before the due date.', time: '2026-07-25T12:00:00', unread: false, category: 'Finance' },
  { id: 'pn5', icon: 'HeartHandshake', title: 'Teacher commendation', text: 'Dr. Krishnan praised Aarav\'s peer support in office hours.', time: '2026-07-24T16:30:00', unread: false, category: 'Behaviour' },
  { id: 'pn6', icon: 'MessageSquare', title: 'Dr. Priya Nair replied', text: 'Re: Mini-project baseline question — approved with suggestions.', time: '2026-07-28T15:00:00', unread: false, category: 'Communication' },
  { id: 'pn7', icon: 'Trophy', title: 'Merit scholarship sanctioned', text: '₹20,000 credited — Dean\'s List scholarship for Term 4.', time: '2026-07-20T11:00:00', unread: false, category: 'Finance' },
  { id: 'pn8', icon: 'CalendarDays', title: 'Parent–Teacher Meeting booked', text: 'Aug 24, virtual — with CSE HOD.', time: '2026-07-15T10:00:00', unread: false, category: 'Communication' },
]

export const parentSettings = {
  profile: { name: 'Rajesh Sharma', email: 'rajesh.sharma@medixoedux.edu', phone: '+91 98111 22334', occupation: 'Sr. Engineering Manager, Infosys', preferredLanguage: 'English', timezone: 'IST (UTC+5:30)' },
  preferences: {
    weeklyDigest: true,
    gradeAlerts: true,
    attendanceAlerts: true,
    feeReminders: true,
    teacherMessages: true,
    aiInsightsMonthly: true,
    behaviouralFlags: true,
    meetingReminders: true,
  },
  privacy: { shareWithInstitution: true, showWardInLeaderboards: true, receivePromotions: false },
}
