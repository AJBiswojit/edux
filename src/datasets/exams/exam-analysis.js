/**
 * AI Exam Analysis (Student) — filter option metadata + engine logic shell.
 *
 * Phase 11 (Complete Physical Mock-Shim Removal): the seeded per-exam
 * ANALYSIS records (`examAnalysis` + `examAnalysisVariants` — hero scores,
 * subject breakdowns, question reviews, predictions) were backend-owned
 * entity data and are REMOVED. The Student · AI Exam Analysis page receives
 * its analysis from the service layer (backend).
 *
 * What is preserved is legitimate frontend question metadata / filter
 * configuration (subject · pattern · exam family · exam type · subjects per
 * exam) so the feature's cascade stays isolated (University / JEE / NEET)
 * and never infers a family from a subject name.
 */

/* Seeded per-exam analysis was removed — neutral shell. */
export const examAnalysis = {
  meta: {},
  hero: {},
  questionIntelligence: {},
  subjects: [],
  comparison: {},
  prediction: {},
  questionReview: [],
  chapters: [],
}

export const examAnalysisOptions = [
  {
    id: 'ATS-JEE-2026-07',
    category: 'Competitive',
    name: 'All India Test Series — JEE Main Pattern',
    shortName: 'ATS 4 · JEE Main',
    date: '2026-08-01',
    pattern: 'JEE Main (Paper 1)',
    totalMarks: 300,
    status: 'Analysed',
    subjects: ['All Subjects', 'Physics', 'Chemistry', 'Mathematics'],
  },
  {
    id: 'ATS-JEE-2026-06',
    category: 'Competitive',
    name: 'All India Test Series — JEE Main Pattern',
    shortName: 'ATS 3 · JEE Main',
    date: '2026-07-18',
    pattern: 'JEE Main (Paper 1)',
    totalMarks: 300,
    status: 'Analysed',
    subjects: ['All Subjects', 'Physics', 'Chemistry', 'Mathematics'],
  },
  {
    id: 'MOCK-NEET-2026-07',
    category: 'Competitive',
    name: 'NEET Pattern — Full Syllabus Mock',
    shortName: 'NEET Mock · July',
    date: '2026-07-05',
    pattern: 'NEET (UG)',
    totalMarks: 720,
    status: 'Analysed',
    subjects: ['All Subjects', 'Physics', 'Chemistry', 'Biology'],
  },
  {
    id: 'SECTIONAL-PHY-2026-06',
    category: 'Competitive',
    name: 'Sectional Test — Physics (Mechanics + Optics)',
    shortName: 'Physics Sectional',
    date: '2026-06-20',
    pattern: 'Sectional',
    totalMarks: 100,
    status: 'Analysed',
    subjects: ['All Subjects', 'Physics'],
  },
]

/* Seeded per-exam variants were removed — neutral shell. */
export const examAnalysisVariants = {}

export const universityExamOptions = [
  {
    id: 'UNI-MID-CS501-2026', category: 'University', examType: 'Mid Semester Examination',
    name: 'Mid Semester Examination — CS501 · Data Structures & Algorithms',
    shortName: 'Mid Sem · CS501', course: 'CS501 — Data Structures & Algorithms',
    subject: 'Data Structures & Algorithms', faculty: 'Dr. Meera Krishnan',
    semester: 'Semester 5', academicYear: '2026–27', date: '2026-08-19',
    duration: '3 hrs', venue: 'Main Academic Block', hallNumber: 'LT-201', seatNumber: 'A-42',
    maxMarks: 50, passingMarks: 20, status: 'Completed', admitCard: 'Issued', resultStatus: 'Declared',
    pattern: 'University', totalMarks: 50,
    subjects: ['All Subjects', 'Data Structures & Algorithms'],
  },
  {
    id: 'UNI-END-CSE-S5-2026', category: 'University', examType: 'End Semester Examination',
    name: 'End Semester Examination — Semester 5 (CSE)',
    shortName: 'End Sem · CSE S5', course: 'B.Tech CSE — Semester 5',
    subject: 'All courses', faculty: 'Department of CSE', semester: 'Semester 5',
    academicYear: '2026–27', date: '2025-12-16', duration: '3 hrs per paper',
    venue: 'Main Academic Block', hallNumber: 'LT-201 / LT-207', seatNumber: 'A-42 / D-11',
    maxMarks: 600, passingMarks: 240, status: 'Completed', admitCard: 'Issued', resultStatus: 'Declared',
    pattern: 'University', totalMarks: 600,
    subjects: ['All Subjects', 'Data Structures & Algorithms', 'Database Management Systems', 'Operating Systems', 'Computer Networks', 'Machine Learning', 'Theory of Computation'],
  },
  {
    id: 'UNI-IA1-CS503-2026', category: 'University', examType: 'Internal Assessment',
    name: 'Internal Assessment 1 — CS503 · Operating Systems',
    shortName: 'IA-1 · CS503', course: 'CS503 — Operating Systems',
    subject: 'Operating Systems', faculty: 'Dr. Meera Krishnan',
    semester: 'Semester 5', academicYear: '2026–27', date: '2026-07-28',
    duration: '1 hr', venue: 'CSE Block', hallNumber: 'CR-12', seatNumber: 'B-07',
    maxMarks: 20, passingMarks: 8, status: 'Completed', admitCard: 'Issued', resultStatus: 'Declared',
    pattern: 'University', totalMarks: 20,
    subjects: ['All Subjects', 'Operating Systems'],
  },
  {
    id: 'UNI-PRAC-CS501-2026', category: 'University', examType: 'Practical Examination',
    name: 'Practical Examination — CS501 · DSA Lab',
    shortName: 'Practical · CS501', course: 'CS501 — DSA Lab',
    subject: 'Data Structures & Algorithms', faculty: 'Dr. Meera Krishnan',
    semester: 'Semester 5', academicYear: '2026–27', date: '2026-08-05',
    duration: '2 hrs', venue: 'Computing Lab 4', hallNumber: 'Lab 4', seatNumber: 'W-09',
    maxMarks: 25, passingMarks: 10, status: 'Completed', admitCard: 'Issued', resultStatus: 'Declared',
    pattern: 'University', totalMarks: 25,
    subjects: ['All Subjects', 'Data Structures & Algorithms'],
  },
  {
    id: 'UNI-LAB-CS505-2026', category: 'University', examType: 'Lab Examination',
    name: 'Lab Examination — CS505 · Machine Learning Lab',
    shortName: 'Lab · CS505', course: 'CS505 — ML Lab',
    subject: 'Machine Learning', faculty: 'Dr. Priya Nair',
    semester: 'Semester 5', academicYear: '2026–27', date: '2026-08-06',
    duration: '2 hrs', venue: 'AI Lab 2', hallNumber: 'Lab 2', seatNumber: 'C-03',
    maxMarks: 15, passingMarks: 6, status: 'Completed', admitCard: 'Issued', resultStatus: 'Declared',
    pattern: 'University', totalMarks: 15,
    subjects: ['All Subjects', 'Machine Learning'],
  },
  {
    id: 'UNI-VIVA-CS502-2026', category: 'University', examType: 'Viva Examination',
    name: 'Viva Examination — CS502 · Database Management Systems',
    shortName: 'Viva · CS502', course: 'CS502 — Database Management Systems',
    subject: 'Database Management Systems', faculty: 'Dr. Arvind Kulkarni',
    semester: 'Semester 5', academicYear: '2026–27', date: '2026-08-07',
    duration: '30 min per student', venue: 'CSE Faculty Block', hallNumber: 'CR-06', seatNumber: 'Panel 3',
    maxMarks: 20, passingMarks: 8, status: 'Completed', admitCard: 'Issued', resultStatus: 'Declared',
    pattern: 'University', totalMarks: 20,
    subjects: ['All Subjects', 'Database Management Systems'],
  },
  {
    id: 'UNI-IMP-CS506-2026', category: 'University', examType: 'Improvement Examination',
    name: 'Improvement Examination — CS506 · Theory of Computation',
    shortName: 'Improvement · CS506', course: 'CS506 — Theory of Computation',
    subject: 'Theory of Computation', faculty: 'Dr. Arvind Kulkarni',
    semester: 'Semester 5', academicYear: '2026–27', date: '2026-08-09',
    duration: '3 hrs', venue: 'Main Academic Block', hallNumber: 'LT-108', seatNumber: 'E-14',
    maxMarks: 50, passingMarks: 20, status: 'Scheduled', admitCard: 'Issued', resultStatus: 'Awaiting Result',
    pattern: 'University', totalMarks: 50,
    subjects: ['All Subjects', 'Theory of Computation'],
  },
  {
    id: 'UNI-SUP-CS504-2026', category: 'University', examType: 'Supplementary Examination',
    name: 'Supplementary Examination — CS504 · Computer Networks',
    shortName: 'Supplementary · CS504', course: 'CS504 — Computer Networks',
    subject: 'Computer Networks', faculty: 'Prof. Vikram Rao',
    semester: 'Semester 5', academicYear: '2026–27', date: '2026-08-12',
    duration: '3 hrs', venue: 'Main Academic Block', hallNumber: 'LT-112', seatNumber: 'F-21',
    maxMarks: 50, passingMarks: 20, status: 'Scheduled', admitCard: 'Available', resultStatus: 'Awaiting Result',
    pattern: 'University', totalMarks: 50,
    subjects: ['All Subjects', 'Computer Networks'],
  },
]
