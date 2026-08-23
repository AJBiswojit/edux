/**
 * AI Exam Analysis — JEE/NEET Academic Intelligence dataset.
 * Powers the flagship AI Exam Analysis module: executive summary,
 * question intelligence, subject/chapter/topic intelligence, mistake
 * classification, difficulty & time analysis, comparisons, AI
 * recommendations and predictions.
 */

export const examAnalysis = {
  meta: {
    examId: 'ATS-JEE-2026-07',
    examName: 'All India Test Series — JEE Main Pattern',
    course: 'JEE Main 2027 · Full Syllabus Mock',
    pattern: 'JEE Main (Paper 1)',
    student: 'Aarav Sharma',
    rollNo: '21CS114',
    date: '2026-08-01',
    totalMarks: 300,
    duration: '3 hrs',
    sections: ['Physics', 'Chemistry', 'Mathematics'],
  },
  hero: {
    score: 182,
    maxScore: 300,
    percentage: 60.7,
    grade: 'B+',
    rank: 2480,
    percentile: 91.4,
    batchRank: 12,
    cohortSize: 180,
    overallAccuracy: 68.3,
    overallSpeed: 4.1,
    confidenceIndex: 87,
    readinessScore: 78,
    healthScore: 82,
    badge: 'Top 10% — National',
    aiSummary: 'Strong conceptual grip in Physical Chemistry and Mechanics, with excellent speed in numericals. Accuracy dips in Mathematics (calculus-heavy set) and in assertion-reason questions under time pressure. 7 questions were left unattempted — an estimated +18 marks are recoverable with better time allocation and guess discipline. Overall a top-decile performance with clear headroom to 200+.',
  },
  questionIntelligence: {
    total: 75,
    attempted: 68,
    correct: 47,
    incorrect: 14,
    skipped: 7,
    negativeMarks: 5.25,
    guessAttempts: 6,
    accuracy: 69.1,
    successRate: 65.3,
    attemptRatio: 90.7,
  },
  subjects: [
    {
      name: 'Physics', maxMarks: 100, score: 64, accuracy: 71.4, time: 41, rank: 8,
      difficulty: 'Medium', attempted: 23, correct: 16, weakAreas: ['Ray Optics', 'Semiconductors'],
      strongAreas: ['Mechanics', 'Electrostatics', 'Modern Physics'],
    },
    {
      name: 'Chemistry', maxMarks: 100, score: 72, accuracy: 76.2, time: 38, rank: 4,
      difficulty: 'Easy', attempted: 24, correct: 18, weakAreas: ['Coordination Compounds (NCERT details)'],
      strongAreas: ['Physical Chemistry', 'Organic Reactions', 'Mole Concept'],
    },
    {
      name: 'Mathematics', maxMarks: 100, score: 46, accuracy: 54.3, time: 44, rank: 22,
      difficulty: 'Hard', attempted: 21, correct: 13, weakAreas: ['Integral Calculus', '3D Geometry', 'Probability'],
      strongAreas: ['Algebra', 'Coordinate Geometry', 'Matrices'],
    },
  ],
  chapters: [
    { chapter: 'Mechanics', subject: 'Physics', accuracy: 78, marks: 28, time: 9, attempted: 95, mastery: 'Strong' },
    { chapter: 'Electrostatics', subject: 'Physics', accuracy: 74, marks: 18, time: 6, attempted: 92, mastery: 'Strong' },
    { chapter: 'Modern Physics', subject: 'Physics', accuracy: 76, marks: 14, time: 5, attempted: 90, mastery: 'Strong' },
    { chapter: 'Ray Optics', subject: 'Physics', accuracy: 55, marks: 8, time: 4, attempted: 80, mastery: 'Weak' },
    { chapter: 'Physical Chemistry', subject: 'Chemistry', accuracy: 82, marks: 26, time: 8, attempted: 96, mastery: 'Strong' },
    { chapter: 'Organic Chemistry', subject: 'Chemistry', accuracy: 74, marks: 24, time: 7, attempted: 92, mastery: 'Average' },
    { chapter: 'Inorganic Chemistry', subject: 'Chemistry', accuracy: 64, marks: 14, time: 6, attempted: 85, mastery: 'Average' },
    { chapter: 'Coordination Compounds', subject: 'Chemistry', accuracy: 52, marks: 8, time: 5, attempted: 78, mastery: 'Weak' },
    { chapter: 'Algebra', subject: 'Mathematics', accuracy: 80, marks: 22, time: 8, attempted: 94, mastery: 'Strong' },
    { chapter: 'Coordinate Geometry', subject: 'Mathematics', accuracy: 76, marks: 16, time: 7, attempted: 90, mastery: 'Average' },
    { chapter: 'Calculus', subject: 'Mathematics', accuracy: 48, marks: 14, time: 10, attempted: 72, mastery: 'Critical' },
    { chapter: 'Probability & Stats', subject: 'Mathematics', accuracy: 45, marks: 8, time: 6, attempted: 68, mastery: 'Critical' },
  ],
  topics: [
    { topic: 'Newton\'s Laws & Friction', subject: 'Physics', mastery: 82, level: 'Strong' },
    { topic: 'Work-Energy-Power', subject: 'Physics', mastery: 78, level: 'Strong' },
    { topic: 'Electrostatics — Gauss Law', subject: 'Physics', mastery: 76, level: 'Average' },
    { topic: 'Thermodynamics (Physics)', subject: 'Physics', mastery: 72, level: 'Average' },
    { topic: 'Ray Optics — Lenses', subject: 'Physics', mastery: 55, level: 'Weak' },
    { topic: 'Semiconductors', subject: 'Physics', mastery: 50, level: 'Weak' },
    { topic: 'Mole Concept', subject: 'Chemistry', mastery: 88, level: 'Strong' },
    { topic: 'Chemical Bonding', subject: 'Chemistry', mastery: 66, level: 'Average' },
    { topic: 'Coordination Compounds', subject: 'Chemistry', mastery: 52, level: 'Weak' },
    { topic: 'Definite Integration', subject: 'Mathematics', mastery: 44, level: 'Critical' },
    { topic: '3D Geometry', subject: 'Mathematics', mastery: 46, level: 'Critical' },
    { topic: 'Probability', subject: 'Mathematics', mastery: 48, level: 'Weak' },
    { topic: 'Quadratic Equations', subject: 'Mathematics', mastery: 84, level: 'Strong' },
    { topic: 'Matrices & Determinants', subject: 'Mathematics', mastery: 80, level: 'Strong' },
  ],
  mistakes: [
    { category: 'Concept Error', count: 5 },
    { category: 'Calculation Error', count: 3 },
    { category: 'Formula Error', count: 2 },
    { category: 'NCERT Detail Error', count: 2 },
    { category: 'Silly Mistake', count: 1 },
    { category: 'Time Pressure', count: 1 },
    { category: 'Guess Attempt', count: 0 },
  ],
  mistakeList: [
    { q: 'Q14', subject: 'Mathematics', category: 'Concept Error', topic: 'Definite Integration', detail: 'Misapplied substitution — used u = x² instead of u = x²+1' },
    { q: 'Q23', subject: 'Physics', category: 'Calculation Error', topic: 'Electrostatics', detail: 'Decimal error in 1/r² computation' },
    { q: 'Q31', subject: 'Chemistry', category: 'NCERT Detail Error', topic: 'Coordination Compounds', detail: 'Confused magnetic moment values for d⁴ vs d⁵' },
    { q: 'Q47', subject: 'Mathematics', category: 'Formula Error', topic: '3D Geometry', detail: 'Wrong distance formula between skew lines' },
    { q: 'Q52', subject: 'Physics', category: 'Concept Error', topic: 'Ray Optics', detail: 'Sign convention error in lens formula' },
    { q: 'Q63', subject: 'Mathematics', category: 'Silly Mistake', topic: 'Probability', detail: 'Counted 36 outcomes instead of 36 — swapped total' },
    { q: 'Q71', subject: 'Chemistry', category: 'Time Pressure', topic: 'Organic — Reactions', detail: 'Rushed mechanism — skipped a step' },
  ],
  difficulty: [
    { level: 'Easy', questions: 30, accuracy: 82, attempted: 29, time: 3.1 },
    { level: 'Medium', questions: 30, accuracy: 66, attempted: 27, time: 4.4 },
    { level: 'Hard', questions: 15, accuracy: 41, attempted: 12, time: 6.2 },
  ],
  timeIntelligence: {
    avgTimePerQuestion: 4.1,
    fastestQuestion: { q: 'Q3 — Mole Concept', time: 0.8 },
    slowestQuestion: { q: 'Q58 — Definite Integration', time: 8.9 },
    navigationCount: 8,
    timeManagementScore: 76,
    distribution: [
      { section: 'Physics', allocated: 60, used: 52, efficiency: 115 },
      { section: 'Chemistry', allocated: 55, used: 47, efficiency: 117 },
      { section: 'Mathematics', allocated: 65, used: 71, efficiency: 92 },
    ],
  },
  comparison: {
    previousTest: { label: 'Previous test', score: 168, percentile: 87.2, grade: 'B' },
    previousMonth: { label: 'Previous month avg', score: 171, percentile: 88.1 },
    batchAverage: { label: 'Batch average', score: 154, percentile: 82.6 },
    instituteAverage: { label: 'Institute average', score: 149, percentile: 80.4 },
    topPerformer: { label: 'Top performer', score: 254, percentile: 99.6, name: 'Divya Krishnan' },
    deltas: [
      { label: 'vs previous test', value: '+14', up: true },
      { label: 'vs previous month', value: '+11', up: true },
      { label: 'vs batch average', value: '+28', up: true },
      { label: 'vs institute average', value: '+33', up: true },
    ],
  },
  recommendations: {
    weakChapters: ['Calculus (48%)', 'Probability & Stats (45%)', 'Ray Optics (55%)', 'Coordination Compounds (52%)'],
    weakTopics: ['Definite Integration', '3D Geometry', 'Ray Optics sign convention', 'Coordination compound properties'],
    priorityRevision: [
      { topic: 'Definite Integration — properties & substitution', priority: 'Critical', timeframe: '48 hours' },
      { topic: 'Ray Optics — lens & mirror sign conventions', priority: 'High', timeframe: '5 days' },
      { topic: 'Coordination Compounds — NCERT tables', priority: 'High', timeframe: '5 days' },
      { topic: 'Probability — Bayes & distributions', priority: 'Medium', timeframe: '7 days' },
    ],
    suggestedPYQs: [
      { title: 'JEE Main 2024 — Definite Integration (5 Qs)', source: 'PYQ Bank' },
      { title: 'JEE Main 2023 — Ray Optics (4 Qs)', source: 'PYQ Bank' },
      { title: 'JEE Advanced 2022 — Coordination Compounds', source: 'PYQ Bank' },
    ],
    practiceQuestions: [
      { title: '20-question drill — Integration by substitution', count: 20, difficulty: 'Medium' },
      { title: '10-question drill — Lens formula applications', count: 10, difficulty: 'Medium' },
    ],
    mockTests: [
      { title: 'Sectional mock — Mathematics (60 min)', mode: 'Sectional' },
      { title: 'Full syllabus mock — JEE Main pattern', mode: 'Full' },
    ],
    lectures: [
      { title: 'Integral Calculus — Masterclass (45 min)', type: 'Video' },
      { title: 'Ray Optics — Sign Convention Simplified', type: 'Video' },
    ],
  },
  prediction: {
    jeePercentile: 96.2,
    neetScore: null,
    expectedAIR: 11800,
    riskLevel: 'Low',
    expectedImprovement: '+4.2%',
    targetProbability: 84,
    trajectory: [
      { exam: 'ATS 1', score: 148 },
      { exam: 'ATS 2', score: 158 },
      { exam: 'ATS 3', score: 168 },
      { exam: 'ATS 4 (latest)', score: 182 },
      { exam: 'JEE Main (predicted)', score: 198 },
    ],
  },
  questionReview: [
    { q: 'Q1', subject: 'Physics', topic: 'Mechanics', type: 'MCQ', status: 'Correct', marks: 4, time: 2.1 },
    { q: 'Q2', subject: 'Physics', topic: 'Electrostatics', type: 'MCQ', status: 'Correct', marks: 4, time: 2.8 },
    { q: 'Q3', subject: 'Chemistry', topic: 'Mole Concept', type: 'Numerical', status: 'Correct', marks: 4, time: 0.8 },
    { q: 'Q5', subject: 'Chemistry', topic: 'Organic', type: 'Assertion Reason', status: 'Incorrect', marks: 0, time: 3.2 },
    { q: 'Q7', subject: 'Mathematics', topic: 'Algebra', type: 'MCQ', status: 'Correct', marks: 4, time: 3.0 },
    { q: 'Q14', subject: 'Mathematics', topic: 'Definite Integration', type: 'MCQ', status: 'Incorrect', marks: 0, time: 5.6 },
    { q: 'Q18', subject: 'Physics', topic: 'Ray Optics', type: 'MCQ', status: 'Skipped', marks: 0, time: 4.4 },
    { q: 'Q23', subject: 'Physics', topic: 'Electrostatics', type: 'Integer', status: 'Incorrect', marks: 0, time: 4.9 },
    { q: 'Q31', subject: 'Chemistry', topic: 'Coordination', type: 'MCQ', status: 'Incorrect', marks: 0, time: 3.8 },
    { q: 'Q44', subject: 'Mathematics', topic: 'Coordinate Geometry', type: 'MCQ', status: 'Correct', marks: 4, time: 4.0 },
    { q: 'Q47', subject: 'Mathematics', topic: '3D Geometry', type: 'Numerical', status: 'Incorrect', marks: 0, time: 5.4 },
    { q: 'Q58', subject: 'Mathematics', topic: 'Definite Integration', type: 'MCQ', status: 'Skipped', marks: 0, time: 8.9 },
    { q: 'Q63', subject: 'Mathematics', topic: 'Probability', type: 'MCQ', status: 'Incorrect', marks: 0, time: 4.2 },
    { q: 'Q71', subject: 'Chemistry', topic: 'Organic Reactions', type: 'MCQ', status: 'Incorrect', marks: 0, time: 3.6 },
  ],
}

/* =====================================================================
 * Workflow support — selectable exam list + per-exam analysis variants.
 * ===================================================================== */

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

function deepMerge(base, overrides) {
  if (Array.isArray(base) || Array.isArray(overrides)) return overrides ?? base
  if (typeof base !== 'object' || base === null) return overrides ?? base
  const out = { ...base }
  for (const key of Object.keys(overrides ?? {})) {
    const b = base[key]
    const o = overrides[key]
    out[key] = b && typeof b === 'object' && !Array.isArray(b) && o && typeof o === 'object' && !Array.isArray(o)
      ? deepMerge(b, o)
      : o
  }
  return out
}

/** Build an exam-analysis variant from the base dataset with targeted overrides. */
function buildVariant(overrides) {
  return deepMerge(examAnalysis, overrides)
}

export const examAnalysisVariants = {
  'ATS-JEE-2026-07': examAnalysis,
  'ATS-JEE-2026-06': buildVariant({
    meta: { examId: 'ATS-JEE-2026-06', examName: 'All India Test Series — JEE Main Pattern', date: '2026-07-18' },
    hero: {
      score: 168, maxScore: 300, percentage: 56.0, grade: 'B', rank: 3120, percentile: 87.2,
      batchRank: 21, cohortSize: 180, overallAccuracy: 64.8, overallSpeed: 4.4, confidenceIndex: 81,
      readinessScore: 72, healthScore: 78, badge: 'Top 15% — National',
      aiSummary: 'Solid progress in Physical Chemistry and Mechanics. Mathematics accuracy remained the bottleneck at 51%, with integration and probability questions eating 22 minutes. Recovered marks: ~14 from better time allocation. Consistent upward trajectory from the previous two test series.',
    },
    questionIntelligence: { total: 75, attempted: 64, correct: 43, incorrect: 14, skipped: 11, negativeMarks: 4.5, guessAttempts: 7, accuracy: 67.2, successRate: 61.4, attemptRatio: 85.3 },
    subjects: [
      { name: 'Physics', maxMarks: 100, score: 60, accuracy: 69.8, time: 43, rank: 12, difficulty: 'Medium', attempted: 22, correct: 15, weakAreas: ['Ray Optics', 'Waves'], strongAreas: ['Mechanics', 'Electrostatics'] },
      { name: 'Chemistry', maxMarks: 100, score: 66, accuracy: 73.1, time: 39, rank: 7, difficulty: 'Easy', attempted: 23, correct: 17, weakAreas: ['Coordination Compounds'], strongAreas: ['Physical Chemistry', 'Organic Reactions'] },
      { name: 'Mathematics', maxMarks: 100, score: 42, accuracy: 51.2, time: 47, rank: 26, difficulty: 'Hard', attempted: 19, correct: 11, weakAreas: ['Integral Calculus', 'Probability'], strongAreas: ['Algebra', 'Coordinate Geometry'] },
    ],
    comparison: {
      previousTest: { label: 'Previous test', score: 158, percentile: 84.9, grade: 'B' },
      previousMonth: { label: 'Previous month avg', score: 163, percentile: 86.0 },
      batchAverage: { label: 'Batch average', score: 150, percentile: 81.2 },
      instituteAverage: { label: 'Institute average', score: 146, percentile: 79.6 },
      topPerformer: { label: 'Top performer', score: 248, percentile: 99.4, name: 'Divya Krishnan' },
      deltas: [
        { label: 'vs previous test', value: '+10', up: true },
        { label: 'vs batch average', value: '+18', up: true },
        { label: 'vs institute average', value: '+22', up: true },
      ],
    },
    prediction: {
      jeePercentile: 94.8, expectedAIR: 15800, riskLevel: 'Medium', expectedImprovement: '+3.1%',
      targetProbability: 76,
      trajectory: [
        { exam: 'ATS 1', score: 148 }, { exam: 'ATS 2', score: 158 }, { exam: 'ATS 3', score: 168 },
        { exam: 'ATS 4 (latest)', score: 182 }, { exam: 'JEE Main (predicted)', score: 196 },
      ],
    },
    questionReview: [
      { q: 'Q1', subject: 'Physics', topic: 'Mechanics', type: 'MCQ', status: 'Correct', marks: 4, time: 2.4 },
      { q: 'Q6', subject: 'Chemistry', topic: 'Mole Concept', type: 'Numerical', status: 'Correct', marks: 4, time: 1.2 },
      { q: 'Q12', subject: 'Mathematics', topic: 'Integral Calculus', type: 'MCQ', status: 'Incorrect', marks: 0, time: 6.4 },
      { q: 'Q19', subject: 'Physics', topic: 'Ray Optics', type: 'MCQ', status: 'Incorrect', marks: 0, time: 4.7 },
      { q: 'Q28', subject: 'Mathematics', topic: 'Probability', type: 'MCQ', status: 'Skipped', marks: 0, time: 5.1 },
      { q: 'Q34', subject: 'Chemistry', topic: 'Coordination', type: 'MCQ', status: 'Incorrect', marks: 0, time: 3.9 },
      { q: 'Q52', subject: 'Mathematics', topic: 'Coordinate Geometry', type: 'MCQ', status: 'Correct', marks: 4, time: 4.2 },
      { q: 'Q61', subject: 'Physics', topic: 'Waves', type: 'MCQ', status: 'Incorrect', marks: 0, time: 3.5 },
    ],
  }),
  'MOCK-NEET-2026-07': buildVariant({
    meta: {
      examId: 'MOCK-NEET-2026-07', examName: 'NEET Pattern — Full Syllabus Mock', date: '2026-07-05',
      pattern: 'NEET (UG)', totalMarks: 720, sections: ['Physics', 'Chemistry', 'Biology'],
    },
    hero: {
      score: 486, maxScore: 720, percentage: 67.5, grade: 'A-', rank: 1240, percentile: 89.6,
      batchRank: 9, cohortSize: 150, overallAccuracy: 71.4, overallSpeed: 3.8, confidenceIndex: 84,
      readinessScore: 74, healthScore: 80, badge: 'Top 11% — National',
      aiSummary: 'Biology carried the paper (84% accuracy) while Physics numericals lagged. Chemistry NCERT-specific details cost 6 marks. Time management was excellent — only 4 questions unattempted. A focused revision of modern physics and chemical bonding tables should push you past 520.',
    },
    questionIntelligence: { total: 180, attempted: 176, correct: 128, incorrect: 26, skipped: 4, negativeMarks: 6.5, guessAttempts: 18, accuracy: 72.7, successRate: 70.3, attemptRatio: 97.8 },
    subjects: [
      { name: 'Physics', maxMarks: 180, score: 118, accuracy: 66.2, time: 52, rank: 14, difficulty: 'Medium', attempted: 43, correct: 29, weakAreas: ['Modern Physics', 'Thermodynamics'], strongAreas: ['Mechanics', 'Electrostatics'] },
      { name: 'Chemistry', maxMarks: 180, score: 122, accuracy: 68.4, time: 49, rank: 11, difficulty: 'Medium', attempted: 44, correct: 30, weakAreas: ['Chemical Bonding', 'Coordination Compounds'], strongAreas: ['Physical Chemistry', 'Organic'] },
      { name: 'Biology', maxMarks: 360, score: 246, accuracy: 84.1, time: 64, rank: 3, difficulty: 'Easy', attempted: 89, correct: 69, weakAreas: ['Genetics — Pedigree Analysis'], strongAreas: ['Human Physiology', 'Cell Biology', 'Ecology'] },
    ],
    chapters: [
      { chapter: 'Mechanics', subject: 'Physics', accuracy: 80, marks: 36, time: 10, attempted: 96, mastery: 'Strong' },
      { chapter: 'Modern Physics', subject: 'Physics', accuracy: 58, marks: 22, time: 11, attempted: 84, mastery: 'Weak' },
      { chapter: 'Thermodynamics', subject: 'Physics', accuracy: 55, marks: 18, time: 9, attempted: 80, mastery: 'Weak' },
      { chapter: 'Physical Chemistry', subject: 'Chemistry', accuracy: 84, marks: 40, time: 9, attempted: 97, mastery: 'Strong' },
      { chapter: 'Organic Chemistry', subject: 'Chemistry', accuracy: 72, marks: 34, time: 10, attempted: 92, mastery: 'Average' },
      { chapter: 'Chemical Bonding', subject: 'Chemistry', accuracy: 50, marks: 20, time: 9, attempted: 78, mastery: 'Critical' },
      { chapter: 'Cell Biology', subject: 'Biology', accuracy: 90, marks: 52, time: 12, attempted: 98, mastery: 'Strong' },
      { chapter: 'Human Physiology', subject: 'Biology', accuracy: 88, marks: 48, time: 13, attempted: 96, mastery: 'Strong' },
      { chapter: 'Genetics', subject: 'Biology', accuracy: 62, marks: 30, time: 12, attempted: 85, mastery: 'Average' },
      { chapter: 'Ecology', subject: 'Biology', accuracy: 86, marks: 26, time: 8, attempted: 95, mastery: 'Strong' },
    ],
    topics: [
      { topic: 'Newton\'s Laws', subject: 'Physics', mastery: 84, level: 'Strong' },
      { topic: 'Modern Physics — Dual Nature', subject: 'Physics', mastery: 55, level: 'Weak' },
      { topic: 'Thermodynamics (Physics)', subject: 'Physics', mastery: 52, level: 'Weak' },
      { topic: 'Mole Concept', subject: 'Chemistry', mastery: 90, level: 'Strong' },
      { topic: 'Chemical Bonding', subject: 'Chemistry', mastery: 48, level: 'Critical' },
      { topic: 'Coordination Compounds', subject: 'Chemistry', mastery: 58, level: 'Weak' },
      { topic: 'Cell — Structure & Function', subject: 'Biology', mastery: 92, level: 'Strong' },
      { topic: 'Human Physiology — Circulation', subject: 'Biology', mastery: 88, level: 'Strong' },
      { topic: 'Genetics — Pedigree Analysis', subject: 'Biology', mastery: 60, level: 'Average' },
      { topic: 'Ecology — Ecosystems', subject: 'Biology', mastery: 86, level: 'Strong' },
    ],
    prediction: {
      jeePercentile: null, neetScore: 645, expectedAIR: null, riskLevel: 'Low',
      expectedImprovement: '+2.8%', targetProbability: 81,
      trajectory: [
        { exam: 'NEET Mock 1', score: 452 }, { exam: 'NEET Mock 2', score: 471 },
        { exam: 'NEET Mock 3 (latest)', score: 486 }, { exam: 'NEET (predicted)', score: 502 },
      ],
    },
  }),
  'SECTIONAL-PHY-2026-06': buildVariant({
    meta: {
      examId: 'SECTIONAL-PHY-2026-06', examName: 'Sectional Test — Physics (Mechanics + Optics)', date: '2026-06-20',
      pattern: 'Sectional', totalMarks: 100, sections: ['Physics'],
    },
    hero: {
      score: 71, maxScore: 100, percentage: 71.0, grade: 'A-', rank: 18, percentile: 90.3,
      batchRank: 6, cohortSize: 120, overallAccuracy: 74.2, overallSpeed: 3.6, confidenceIndex: 86,
      readinessScore: 76, healthScore: 83, badge: 'Top 10% — Sectional',
      aiSummary: 'Mechanics fundamentals are exam-ready with 82% accuracy. Optics dragged the section down — sign conventions in lenses and mirrors caused 3 of the 5 incorrect answers. Fix optics and this section becomes a 85+ scorer.',
    },
    questionIntelligence: { total: 25, attempted: 23, correct: 18, incorrect: 5, skipped: 2, negativeMarks: 1.25, guessAttempts: 2, accuracy: 78.3, successRate: 74.5, attemptRatio: 92.0 },
    subjects: [
      { name: 'Physics', maxMarks: 100, score: 71, accuracy: 74.2, time: 34, rank: 18, difficulty: 'Medium', attempted: 23, correct: 18, weakAreas: ['Ray Optics'], strongAreas: ['Mechanics', 'Gravitation'] },
    ],
    chapters: [
      { chapter: 'Kinematics', subject: 'Physics', accuracy: 84, marks: 16, time: 5, attempted: 98, mastery: 'Strong' },
      { chapter: 'Newton\'s Laws', subject: 'Physics', accuracy: 82, marks: 18, time: 6, attempted: 96, mastery: 'Strong' },
      { chapter: 'Work-Energy-Power', subject: 'Physics', accuracy: 80, marks: 14, time: 5, attempted: 95, mastery: 'Strong' },
      { chapter: 'Gravitation', subject: 'Physics', accuracy: 78, marks: 12, time: 4, attempted: 92, mastery: 'Average' },
      { chapter: 'Ray Optics', subject: 'Physics', accuracy: 52, marks: 11, time: 7, attempted: 82, mastery: 'Critical' },
    ],
    topics: [
      { topic: 'Projectile Motion', subject: 'Physics', mastery: 88, level: 'Strong' },
      { topic: 'Friction & Constraints', subject: 'Physics', mastery: 82, level: 'Strong' },
      { topic: 'Gravitational Potential', subject: 'Physics', mastery: 74, level: 'Average' },
      { topic: 'Lens & Mirror Sign Conventions', subject: 'Physics', mastery: 50, level: 'Critical' },
      { topic: 'Prism & Dispersion', subject: 'Physics', mastery: 58, level: 'Weak' },
    ],
    comparison: {
      previousTest: { label: 'Previous sectional', score: 66, percentile: 86.4, grade: 'B+' },
      previousMonth: { label: 'Previous month avg', score: 64, percentile: 85.1 },
      batchAverage: { label: 'Batch average', score: 58, percentile: 78.2 },
      instituteAverage: { label: 'Institute average', score: 55, percentile: 76.0 },
      topPerformer: { label: 'Top performer', score: 94, percentile: 99.1, name: 'Ishita Gupta' },
      deltas: [
        { label: 'vs previous sectional', value: '+5', up: true },
        { label: 'vs batch average', value: '+13', up: true },
      ],
    },
    prediction: {
      jeePercentile: 95.1, expectedAIR: 12900, riskLevel: 'Low', expectedImprovement: '+4.0%',
      targetProbability: 86,
      trajectory: [
        { exam: 'Phy Sect. 1', score: 58 }, { exam: 'Phy Sect. 2', score: 64 },
        { exam: 'Phy Sect. 3 (latest)', score: 71 }, { exam: 'Full mock (predicted)', score: 190 },
      ],
    },
  }),
}

/* =====================================================================
 * University examination datasets — Mid Semester, End Semester, Internal
 * Assessment, Practical, Lab, Viva, Improvement and Supplementary exams.
 * Each carries the full university exam record (course, subject, faculty,
 * semester, academic year, date, duration, venue, hall, seat, max/passing
 * marks, exam status, admit card, result status) plus a full analysis
 * variant so the workflow demonstrates both competitive and university
 * examinations. The competitive JEE/NEET datasets above are untouched.
 * ===================================================================== */

const UNI_TIME_INTELLIGENCE = {
  avgTimePerQuestion: 3.1,
  fastestQuestion: { q: 'Q2 — MCQ', time: 0.6 },
  slowestQuestion: { q: 'Q18 — Long answer', time: 9.4 },
  navigationCount: 2,
  timeManagementScore: 84,
}

const UNI_MISTAKES = [
  { category: 'Concept Error', count: 3 },
  { category: 'Calculation Error', count: 2 },
  { category: 'Textbook Detail Error', count: 2 },
  { category: 'Formula Error', count: 1 },
  { category: 'Silly Mistake', count: 1 },
  { category: 'Time Pressure', count: 1 },
]

const UNI_DIFFICULTY = [
  { level: 'Easy', questions: 7, accuracy: 86, attempted: 7, time: 2.2 },
  { level: 'Medium', questions: 10, accuracy: 74, attempted: 9, time: 3.4 },
  { level: 'Hard', questions: 5, accuracy: 55, attempted: 4, time: 5.0 },
]

/** Compact chapter/topic helpers — subject-tagged so per-subject filtering works. */
const ch = (subject, chapter, accuracy, mastery) => ({ chapter, subject, accuracy, marks: 4, time: 3, attempted: 90, mastery })
const tp = (subject, topic, mastery, level) => ({ topic, subject, mastery, level })

/** Build a full university analysis variant from a compact spec. */
function universityVariant(cfg) {
  const {
    id, name, course, subject, faculty, semester, academicYear, date, duration,
    venue, hall, seat, maxMarks, passingMarks, examStatus, admitCard, resultStatus,
    score, grade, rank, batchRank, cohortSize, accuracy, summary,
    subjectsCards, chapters, topics, qi, timeDistribution, difficulty,
    comparison, recommendations, prediction, trajectory, review, mistakeList,
  } = cfg
  const percentage = Math.round((score / maxMarks) * 1000) / 10
  return buildVariant({
    meta: {
      examId: id, examName: name, course, pattern: 'University',
      student: 'Aarav Sharma', rollNo: '21CS114', date,
      totalMarks: maxMarks, duration, sections: subjectsCards.map((s) => s.name),
      faculty, semester, academicYear, venue, hallNumber: hall, seatNumber: seat,
      passingMarks, examStatus, admitCard, resultStatus,
    },
    hero: {
      score, maxScore: maxMarks, percentage, grade, rank, percentile: null,
      batchRank, cohortSize, overallAccuracy: accuracy, overallSpeed: 3.1,
      confidenceIndex: 85, readinessScore: 80, healthScore: 84,
      badge: grade === 'A' || grade === 'A+' ? 'Top of class' : grade === 'B+' ? 'Above class average' : 'Class average',
      aiSummary: summary,
    },
    questionIntelligence: qi,
    subjects: subjectsCards,
    chapters, topics,
    mistakes: UNI_MISTAKES,
    mistakeList,
    difficulty: difficulty ?? UNI_DIFFICULTY,
    timeIntelligence: { ...UNI_TIME_INTELLIGENCE, distribution: timeDistribution },
    comparison,
    recommendations,
    prediction: {
      university: true, jeePercentile: null, expectedAIR: null, neetScore: null,
      riskLevel: prediction.riskLevel,
      expectedImprovement: prediction.expectedImprovement,
      targetProbability: prediction.targetProbability,
      expectedCGPA: prediction.expectedCGPA,
      expectedGrade: prediction.expectedGrade,
      classRank: prediction.classRank,
      trajectory,
    },
    questionReview: review,
  })
}

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

/* University variants are merged into the existing variant registry so the
   competitive datasets stay untouched and one lookup serves both. */
Object.assign(examAnalysisVariants, {
  /* ---------------- Mid Semester — CS501 DSA ---------------- */
  'UNI-MID-CS501-2026': universityVariant({
    id: 'UNI-MID-CS501-2026', name: 'Mid Semester Examination — CS501 · Data Structures & Algorithms',
    course: 'CS501 — Data Structures & Algorithms', subject: 'Data Structures & Algorithms',
    faculty: 'Dr. Meera Krishnan', semester: 'Semester 5', academicYear: '2026–27',
    date: '2026-08-19', duration: '3 hrs', venue: 'Main Academic Block', hall: 'LT-201', seat: 'A-42',
    maxMarks: 50, passingMarks: 20, examStatus: 'Completed', admitCard: 'Issued', resultStatus: 'Declared',
    score: 42, grade: 'A', rank: 3, batchRank: 3, cohortSize: 68, accuracy: 81,
    summary: 'Strong performance across graph algorithms and AVL trees — 84% accuracy in the two highest-weightage chapters. String algorithms cost 6 marks; a focused revision of KMP and pattern matching would push this to a 46+. Question 17 (lazy segment tree) was the only hard miss. Overall a top-of-class mid-sem with a clear path to an A in the end-sem.',
    subjectsCards: [
      { name: 'Data Structures & Algorithms', maxMarks: 50, score: 42, accuracy: 81, time: 62, rank: 3, difficulty: 'Medium', attempted: 18, correct: 15, weakAreas: ['String Algorithms', 'Segment trees'], strongAreas: ['Graph Algorithms', 'Trees & Heaps'] },
    ],
    chapters: [
      ch('Data Structures & Algorithms', 'Graph Algorithms — MST & Shortest Paths', 84, 'Strong'),
      ch('Data Structures & Algorithms', 'Trees & Heaps — AVL, Segment Trees', 82, 'Strong'),
      ch('Data Structures & Algorithms', 'Sorting & Searching', 78, 'Strong'),
      ch('Data Structures & Algorithms', 'Dynamic Programming', 74, 'Average'),
      ch('Data Structures & Algorithms', 'String Algorithms — KMP, Tries', 62, 'Weak'),
    ],
    topics: [
      tp('Data Structures & Algorithms', 'Dijkstra & MST', 88, 'Strong'),
      tp('Data Structures & Algorithms', 'AVL rotations', 85, 'Strong'),
      tp('Data Structures & Algorithms', 'Quick sort analysis', 80, 'Strong'),
      tp('Data Structures & Algorithms', '0/1 Knapsack (DP)', 76, 'Average'),
      tp('Data Structures & Algorithms', 'KMP string matching', 58, 'Weak'),
      tp('Data Structures & Algorithms', 'Lazy segment trees', 52, 'Weak'),
    ],
    qi: { total: 22, attempted: 20, correct: 17, incorrect: 3, skipped: 2, negativeMarks: 0, guessAttempts: 1, accuracy: 81, successRate: 85, attemptRatio: 90.9 },
    timeDistribution: [{ section: 'Data Structures & Algorithms', allocated: 180, used: 158, efficiency: 114 }],
    comparison: {
      previousTest: { label: 'Unit test 1', score: 38, percentile: null, grade: 'A-' },
      previousMonth: { label: 'Previous assessment avg', score: 39, percentile: null },
      batchAverage: { label: 'Class average', score: 33, percentile: null },
      instituteAverage: { label: 'Section average', score: 31, percentile: null },
      topPerformer: { label: 'Topper', score: 46, percentile: null, name: 'Divya Krishnan' },
      deltas: [
        { label: 'vs unit test 1', value: '+4', up: true },
        { label: 'vs class average', value: '+9', up: true },
        { label: 'vs section average', value: '+11', up: true },
      ],
    },
    recommendations: {
      weakChapters: ['String Algorithms (62%)', 'Dynamic Programming (74%)'],
      weakTopics: ['KMP string matching', 'Lazy segment tree updates'],
      priorityRevision: [
        { topic: 'KMP failure function & pattern matching', priority: 'Critical', timeframe: '48 hours' },
        { topic: 'Segment tree with lazy propagation', priority: 'High', timeframe: '5 days' },
      ],
      suggestedPYQs: [
        { title: 'University PYQ — CS501 Midsem 2023–2025', source: 'Dept. question bank' },
        { title: 'End-sem 2024 — Trees & Hashing section', source: 'University PYQ bank' },
      ],
      practiceQuestions: [{ title: '10-question drill — String algorithms', count: 10, difficulty: 'Medium' }],
      mockTests: [{ title: 'Full-pattern CS501 mock (50 marks)', mode: 'University pattern' }],
      lectures: [{ title: 'Strings & Pattern Matching — Masterclass (40 min)', type: 'Video' }],
    },
    prediction: {
      riskLevel: 'Low', expectedImprovement: '+0.2 CGPA', targetProbability: 86,
      expectedCGPA: 8.9, expectedGrade: 'A', classRank: 4,
      trajectory: [
        { exam: 'Unit test 1', score: 36 }, { exam: 'Unit test 2', score: 38 },
        { exam: 'Mid sem (latest)', score: 42 }, { exam: 'End sem (predicted)', score: 46 },
      ],
    },
    review: [
      { q: 'Q1', subject: 'Data Structures & Algorithms', topic: 'Big-O analysis', type: 'MCQ', status: 'Correct', marks: 1, time: 1.2 },
      { q: 'Q5', subject: 'Data Structures & Algorithms', topic: 'AVL rotations', type: 'Short Answer', status: 'Correct', marks: 3, time: 4.1 },
      { q: 'Q11', subject: 'Data Structures & Algorithms', topic: 'Dijkstra', type: 'Short Answer', status: 'Correct', marks: 3, time: 3.8 },
      { q: 'Q14', subject: 'Data Structures & Algorithms', topic: '0/1 Knapsack', type: 'Long Answer', status: 'Correct', marks: 6, time: 8.2 },
      { q: 'Q17', subject: 'Data Structures & Algorithms', topic: 'Lazy segment trees', type: 'Long Answer', status: 'Incorrect', marks: 0, time: 9.4 },
      { q: 'Q19', subject: 'Data Structures & Algorithms', topic: 'KMP string matching', type: 'Short Answer', status: 'Incorrect', marks: 0, time: 4.6 },
      { q: 'Q21', subject: 'Data Structures & Algorithms', topic: 'Hashing', type: 'MCQ', status: 'Skipped', marks: 0, time: 2.0 },
    ],
    mistakeList: [
      { q: 'Q17', subject: 'Data Structures & Algorithms', category: 'Concept Error', topic: 'Lazy segment trees', detail: 'Pushed updates only on query path — missed sibling ranges' },
      { q: 'Q19', subject: 'Data Structures & Algorithms', category: 'Formula Error', topic: 'KMP', detail: 'Misapplied prefix-function construction for overlapping matches' },
      { q: 'Q21', subject: 'Data Structures & Algorithms', category: 'Time Pressure', topic: 'Hashing', detail: 'Skipped after spending 6 minutes on Q17' },
    ],
  }),

  /* ---------------- End Semester — CSE Semester 5 (6 subjects) ---------------- */
  'UNI-END-CSE-S5-2026': universityVariant({
    id: 'UNI-END-CSE-S5-2026', name: 'End Semester Examination — Semester 5 (CSE)',
    course: 'B.Tech CSE — Semester 5', subject: 'All courses', faculty: 'Department of CSE',
    semester: 'Semester 5', academicYear: '2026–27', date: '2025-12-16', duration: '3 hrs per paper',
    venue: 'Main Academic Block', hall: 'LT-201 / LT-207', seat: 'A-42 / D-11',
    maxMarks: 600, passingMarks: 240, examStatus: 'Completed', admitCard: 'Issued', resultStatus: 'Declared',
    score: 452, grade: 'A', rank: 9, batchRank: 9, cohortSize: 68, accuracy: 76,
    summary: 'A strong end-sem with 452/600 (75.3%). Machine Learning and DSA carried the semester at 84–86%, while Theory of Computation (64%) and Computer Networks (68%) pulled the average down. SGPA projection: 8.7. Focused revision of ToC automata constructions and CN transport-layer numericals is the highest-leverage gap before the improvement window.',
    subjectsCards: [
      { name: 'Data Structures & Algorithms', maxMarks: 100, score: 86, accuracy: 84, time: 118, rank: 5, difficulty: 'Medium', attempted: 38, correct: 33, weakAreas: ['String Algorithms'], strongAreas: ['Graphs', 'Trees'] },
      { name: 'Database Management Systems', maxMarks: 100, score: 78, accuracy: 78, time: 124, rank: 12, difficulty: 'Medium', attempted: 36, correct: 29, weakAreas: ['Query optimisation'], strongAreas: ['Normalisation', 'Transactions'] },
      { name: 'Operating Systems', maxMarks: 100, score: 72, accuracy: 74, time: 121, rank: 18, difficulty: 'Medium', attempted: 35, correct: 27, weakAreas: ['File systems'], strongAreas: ['Scheduling', 'Memory'] },
      { name: 'Computer Networks', maxMarks: 100, score: 68, accuracy: 71, time: 126, rank: 24, difficulty: 'Hard', attempted: 34, correct: 25, weakAreas: ['TCP congestion control'], strongAreas: ['IP addressing', 'Routing'] },
      { name: 'Machine Learning', maxMarks: 100, score: 84, accuracy: 83, time: 112, rank: 4, difficulty: 'Medium', attempted: 38, correct: 32, weakAreas: ['Regularisation intuition'], strongAreas: ['Regression', 'Neural nets'] },
      { name: 'Theory of Computation', maxMarks: 100, score: 64, accuracy: 67, time: 131, rank: 31, difficulty: 'Hard', attempted: 33, correct: 22, weakAreas: ['Pumping lemma proofs', 'Reductions'], strongAreas: ['DFA/NFA', 'CFGs'] },
    ],
    chapters: [
      ch('Data Structures & Algorithms', 'Graph Algorithms', 86, 'Strong'),
      ch('Data Structures & Algorithms', 'Trees & Heaps', 82, 'Strong'),
      ch('Database Management Systems', 'Transactions & Concurrency', 82, 'Strong'),
      ch('Database Management Systems', 'SQL & Query Optimisation', 72, 'Average'),
      ch('Operating Systems', 'CPU Scheduling & Memory', 78, 'Strong'),
      ch('Operating Systems', 'File Systems', 64, 'Weak'),
      ch('Computer Networks', 'Network Layer', 76, 'Average'),
      ch('Computer Networks', 'Transport Layer — TCP', 62, 'Weak'),
      ch('Machine Learning', 'Regression & Evaluation', 86, 'Strong'),
      ch('Machine Learning', 'Neural Networks', 80, 'Strong'),
      ch('Theory of Computation', 'Automata & Formal Languages', 72, 'Average'),
      ch('Theory of Computation', 'Decidability & Reductions', 58, 'Weak'),
    ],
    topics: [
      tp('Data Structures & Algorithms', 'MST & shortest paths', 88, 'Strong'),
      tp('Data Structures & Algorithms', 'AVL & heaps', 84, 'Strong'),
      tp('Database Management Systems', 'Isolation levels', 84, 'Strong'),
      tp('Database Management Systems', 'Query execution plans', 70, 'Average'),
      tp('Operating Systems', 'Page replacement', 80, 'Strong'),
      tp('Computer Networks', 'TCP congestion window', 60, 'Weak'),
      tp('Machine Learning', 'Gradient descent', 88, 'Strong'),
      tp('Theory of Computation', 'Pumping lemma', 55, 'Weak'),
    ],
    qi: { total: 120, attempted: 112, correct: 90, incorrect: 16, skipped: 8, negativeMarks: 0, guessAttempts: 5, accuracy: 76, successRate: 80.4, attemptRatio: 93.3 },
    timeDistribution: [
      { section: 'Data Structures & Algorithms', allocated: 180, used: 158, efficiency: 114 },
      { section: 'Database Management Systems', allocated: 180, used: 164, efficiency: 110 },
      { section: 'Operating Systems', allocated: 180, used: 161, efficiency: 112 },
      { section: 'Computer Networks', allocated: 180, used: 166, efficiency: 108 },
      { section: 'Machine Learning', allocated: 180, used: 152, efficiency: 118 },
      { section: 'Theory of Computation', allocated: 180, used: 171, efficiency: 105 },
    ],
    comparison: {
      previousTest: { label: 'Mid sem aggregate', score: 384, percentile: null, grade: 'A-' },
      previousMonth: { label: 'Previous sem (Sem 4)', score: 428, percentile: null },
      batchAverage: { label: 'Class average', score: 398, percentile: null },
      instituteAverage: { label: 'CSE batch average', score: 386, percentile: null },
      topPerformer: { label: 'Topper', score: 541, percentile: null, name: 'Ishita Gupta' },
      deltas: [
        { label: 'vs mid sem aggregate', value: '+68', up: true },
        { label: 'vs previous sem', value: '+24', up: true },
        { label: 'vs class average', value: '+54', up: true },
      ],
    },
    recommendations: {
      weakChapters: ['Decidability & Reductions (58%)', 'Transport Layer — TCP (62%)', 'File Systems (64%)'],
      weakTopics: ['Pumping lemma proofs', 'TCP congestion control', 'Query optimisation'],
      priorityRevision: [
        { topic: 'Pumping lemma & reduction proofs', priority: 'Critical', timeframe: '7 days' },
        { topic: 'TCP congestion control numericals', priority: 'High', timeframe: '7 days' },
      ],
      suggestedPYQs: [
        { title: 'University PYQ — ToC End-sem 2022–2025', source: 'Dept. question bank' },
        { title: 'CN transport-layer numerical pack', source: 'University PYQ bank' },
      ],
      practiceQuestions: [{ title: '12-question drill — Automata & decidability', count: 12, difficulty: 'Hard' }],
      mockTests: [{ title: 'ToC full-pattern mock (100 marks)', mode: 'University pattern' }],
      lectures: [{ title: 'Reductions & Undecidability — Workshop (50 min)', type: 'Video' }],
    },
    prediction: {
      riskLevel: 'Low', expectedImprovement: '+0.15 CGPA', targetProbability: 82,
      expectedCGPA: 8.7, expectedGrade: 'A', classRank: 11,
      trajectory: [
        { exam: 'Sem 4', score: 428 }, { exam: 'Mid sem (Sem 5)', score: 384 },
        { exam: 'End sem (latest)', score: 452 }, { exam: 'Sem 6 (predicted)', score: 470 },
      ],
    },
    review: [
      { q: 'Q3', subject: 'Data Structures & Algorithms', topic: 'Dijkstra', type: 'Short Answer', status: 'Correct', marks: 4, time: 3.6 },
      { q: 'Q9', subject: 'Database Management Systems', topic: 'Isolation levels', type: 'MCQ', status: 'Correct', marks: 2, time: 1.8 },
      { q: 'Q14', subject: 'Operating Systems', topic: 'Page replacement', type: 'Numerical', status: 'Correct', marks: 4, time: 5.2 },
      { q: 'Q21', subject: 'Computer Networks', topic: 'TCP congestion control', type: 'Numerical', status: 'Incorrect', marks: 0, time: 6.4 },
      { q: 'Q27', subject: 'Machine Learning', topic: 'Gradient descent', type: 'Short Answer', status: 'Correct', marks: 4, time: 3.1 },
      { q: 'Q33', subject: 'Theory of Computation', topic: 'Pumping lemma', type: 'Long Answer', status: 'Incorrect', marks: 0, time: 9.8 },
      { q: 'Q36', subject: 'Theory of Computation', topic: 'Reductions', type: 'Long Answer', status: 'Skipped', marks: 0, time: 6.0 },
      { q: 'Q40', subject: 'Database Management Systems', topic: 'Query optimisation', type: 'Long Answer', status: 'Incorrect', marks: 0, time: 8.1 },
    ],
    mistakeList: [
      { q: 'Q21', subject: 'Computer Networks', category: 'Calculation Error', topic: 'TCP congestion control', detail: 'cwnd halving computed with wrong threshold' },
      { q: 'Q33', subject: 'Theory of Computation', category: 'Concept Error', topic: 'Pumping lemma', detail: 'Chose the wrong string split for the proof' },
      { q: 'Q36', subject: 'Theory of Computation', category: 'Time Pressure', topic: 'Reductions', detail: 'Unattempted — time ran out after Q33' },
      { q: 'Q40', subject: 'Database Management Systems', category: 'Concept Error', topic: 'Query optimisation', detail: 'Confused cost model for hash vs nested-loop join' },
    ],
  }),

  /* ---------------- Internal Assessment — CS503 OS ---------------- */
  'UNI-IA1-CS503-2026': universityVariant({
    id: 'UNI-IA1-CS503-2026', name: 'Internal Assessment 1 — CS503 · Operating Systems',
    course: 'CS503 — Operating Systems', subject: 'Operating Systems',
    faculty: 'Dr. Meera Krishnan', semester: 'Semester 5', academicYear: '2026–27',
    date: '2026-07-28', duration: '1 hr', venue: 'CSE Block', hall: 'CR-12', seat: 'B-07',
    maxMarks: 20, passingMarks: 8, examStatus: 'Completed', admitCard: 'Issued', resultStatus: 'Declared',
    score: 17, grade: 'A', rank: 6, batchRank: 6, cohortSize: 68, accuracy: 80,
    summary: 'IA-1 covered scheduling, processes and memory basics. 17/20 with two clean numericals in FCFS/SJF and paging. The only miss was a multi-level queue trace — a minor concept slip, easily fixed before the midsem.',
    subjectsCards: [
      { name: 'Operating Systems', maxMarks: 20, score: 17, accuracy: 80, time: 22, rank: 6, difficulty: 'Medium', attempted: 9, correct: 7, weakAreas: ['Multilevel queues'], strongAreas: ['Scheduling', 'Paging'] },
    ],
    chapters: [
      ch('Operating Systems', 'CPU Scheduling', 86, 'Strong'),
      ch('Operating Systems', 'Processes & Threads', 82, 'Strong'),
      ch('Operating Systems', 'Memory Management', 78, 'Strong'),
      ch('Operating Systems', 'Multilevel Queues', 60, 'Weak'),
    ],
    topics: [
      tp('Operating Systems', 'FCFS / SJF / RR', 90, 'Strong'),
      tp('Operating Systems', 'Process states', 85, 'Strong'),
      tp('Operating Systems', 'Paging basics', 82, 'Strong'),
      tp('Operating Systems', 'Multilevel feedback queues', 58, 'Weak'),
    ],
    qi: { total: 10, attempted: 9, correct: 7, incorrect: 1, skipped: 1, negativeMarks: 0, guessAttempts: 0, accuracy: 80, successRate: 77.8, attemptRatio: 90 },
    timeDistribution: [{ section: 'Operating Systems', allocated: 60, used: 52, efficiency: 115 }],
    comparison: {
      previousTest: { label: 'Quiz 1', score: 15, percentile: null, grade: 'A-' },
      previousMonth: { label: 'Quiz average', score: 14, percentile: null },
      batchAverage: { label: 'Class average', score: 13, percentile: null },
      instituteAverage: { label: 'Section average', score: 12.5, percentile: null },
      topPerformer: { label: 'Topper', score: 19, percentile: null, name: 'Rohan Verma' },
      deltas: [
        { label: 'vs quiz 1', value: '+2', up: true },
        { label: 'vs class average', value: '+4', up: true },
      ],
    },
    recommendations: {
      weakChapters: ['Multilevel Queues (60%)'],
      weakTopics: ['Multilevel feedback queue scheduling'],
      priorityRevision: [{ topic: 'MLFQ scheduling trace problems', priority: 'High', timeframe: '3 days' }],
      suggestedPYQs: [{ title: 'University PYQ — OS scheduling numericals', source: 'Dept. question bank' }],
      practiceQuestions: [{ title: '8-question drill — Scheduling traces', count: 8, difficulty: 'Medium' }],
      mockTests: [{ title: 'OS IA-style mock (20 marks)', mode: 'University pattern' }],
      lectures: [{ title: 'Multilevel Queues — Simplified (25 min)', type: 'Video' }],
    },
    prediction: {
      riskLevel: 'Low', expectedImprovement: '+0.1 CGPA', targetProbability: 88,
      expectedCGPA: 8.8, expectedGrade: 'A', classRank: 6,
      trajectory: [
        { exam: 'Quiz 1', score: 15 }, { exam: 'IA-1 (latest)', score: 17 },
        { exam: 'Midsem (predicted)', score: 42 },
      ],
    },
    review: [
      { q: 'Q2', subject: 'Operating Systems', topic: 'SJF scheduling', type: 'Numerical', status: 'Correct', marks: 3, time: 4.2 },
      { q: 'Q5', subject: 'Operating Systems', topic: 'Process states', type: 'MCQ', status: 'Correct', marks: 1, time: 1.1 },
      { q: 'Q7', subject: 'Operating Systems', topic: 'Paging', type: 'Numerical', status: 'Correct', marks: 3, time: 5.0 },
      { q: 'Q8', subject: 'Operating Systems', topic: 'Multilevel feedback queues', type: 'Short Answer', status: 'Incorrect', marks: 0, time: 5.6 },
      { q: 'Q9', subject: 'Operating Systems', topic: 'Thread models', type: 'Short Answer', status: 'Skipped', marks: 0, time: 2.4 },
    ],
    mistakeList: [
      { q: 'Q8', subject: 'Operating Systems', category: 'Concept Error', topic: 'Multilevel queues', detail: 'Wrong promotion rule between queue levels' },
    ],
  }),

  /* ---------------- Practical — CS501 DSA Lab ---------------- */
  'UNI-PRAC-CS501-2026': universityVariant({
    id: 'UNI-PRAC-CS501-2026', name: 'Practical Examination — CS501 · DSA Lab',
    course: 'CS501 — DSA Lab', subject: 'Data Structures & Algorithms',
    faculty: 'Dr. Meera Krishnan', semester: 'Semester 5', academicYear: '2026–27',
    date: '2026-08-05', duration: '2 hrs', venue: 'Computing Lab 4', hall: 'Lab 4', seat: 'W-09',
    maxMarks: 25, passingMarks: 10, examStatus: 'Completed', admitCard: 'Issued', resultStatus: 'Declared',
    score: 21, grade: 'A', rank: 4, batchRank: 4, cohortSize: 68, accuracy: 78,
    summary: 'Practical exam: implement and test graph algorithms. Solved Dijkstra and MST tasks with clean complexity analysis. Lost 4 marks on the KMP implementation (off-by-one in the failure function) and a minor viva follow-up on heap vs segment tree.',
    subjectsCards: [
      { name: 'Data Structures & Algorithms', maxMarks: 25, score: 21, accuracy: 78, time: 88, rank: 4, difficulty: 'Hard', attempted: 11, correct: 9, weakAreas: ['KMP implementation'], strongAreas: ['Dijkstra', 'MST', 'Complexity analysis'] },
    ],
    chapters: [
      ch('Data Structures & Algorithms', 'Graph Algorithms — Lab Tasks', 88, 'Strong'),
      ch('Data Structures & Algorithms', 'Sorting & Searching — Lab Tasks', 80, 'Strong'),
      ch('Data Structures & Algorithms', 'String Algorithms — Lab Tasks', 64, 'Weak'),
    ],
    topics: [
      tp('Data Structures & Algorithms', 'Dijkstra implementation', 90, 'Strong'),
      tp('Data Structures & Algorithms', 'Kruskal/Prim implementation', 86, 'Strong'),
      tp('Data Structures & Algorithms', 'Merge sort with stability', 82, 'Strong'),
      tp('Data Structures & Algorithms', 'KMP failure function', 60, 'Weak'),
    ],
    qi: { total: 12, attempted: 11, correct: 9, incorrect: 1, skipped: 1, negativeMarks: 0, guessAttempts: 0, accuracy: 78, successRate: 81.8, attemptRatio: 91.7 },
    timeDistribution: [{ section: 'Data Structures & Algorithms', allocated: 120, used: 108, efficiency: 111 }],
    comparison: {
      previousTest: { label: 'Lab record average', score: 18, percentile: null, grade: 'A' },
      previousMonth: { label: 'Previous practical', score: 19, percentile: null },
      batchAverage: { label: 'Class average', score: 16, percentile: null },
      instituteAverage: { label: 'Section average', score: 15, percentile: null },
      topPerformer: { label: 'Topper', score: 24, percentile: null, name: 'Kavya Menon' },
      deltas: [
        { label: 'vs lab record average', value: '+3', up: true },
        { label: 'vs class average', value: '+5', up: true },
      ],
    },
    recommendations: {
      weakChapters: ['String Algorithms (64%)'],
      weakTopics: ['KMP failure function construction'],
      priorityRevision: [{ topic: 'KMP prefix-function coding drill', priority: 'High', timeframe: '4 days' }],
      suggestedPYQs: [{ title: 'Lab PYQ — pattern matching tasks', source: 'Dept. lab bank' }],
      practiceQuestions: [{ title: '5 coding tasks — Strings & pattern matching', count: 5, difficulty: 'Hard' }],
      mockTests: [{ title: 'DSA lab mock (25 marks, 2 hrs)', mode: 'University practical pattern' }],
      lectures: [{ title: 'KMP & Z-algorithm — Code Along (35 min)', type: 'Video' }],
    },
    prediction: {
      riskLevel: 'Low', expectedImprovement: '+0.05 CGPA', targetProbability: 85,
      expectedCGPA: 8.8, expectedGrade: 'A', classRank: 5,
      trajectory: [
        { exam: 'Lab record', score: 18 }, { exam: 'Practical (latest)', score: 21 },
        { exam: 'End sem practical (predicted)', score: 23 },
      ],
    },
    review: [
      { q: 'T1', subject: 'Data Structures & Algorithms', topic: 'Dijkstra implementation', type: 'Programming', status: 'Correct', marks: 5, time: 18 },
      { q: 'T3', subject: 'Data Structures & Algorithms', topic: 'MST (Kruskal)', type: 'Programming', status: 'Correct', marks: 5, time: 21 },
      { q: 'T5', subject: 'Data Structures & Algorithms', topic: 'Merge sort stability', type: 'Programming', status: 'Correct', marks: 4, time: 16 },
      { q: 'T7', subject: 'Data Structures & Algorithms', topic: 'KMP implementation', type: 'Programming', status: 'Incorrect', marks: 0, time: 24 },
      { q: 'T9', subject: 'Data Structures & Algorithms', topic: 'Heap vs segment tree viva', type: 'Viva', status: 'Skipped', marks: 0, time: 5 },
    ],
    mistakeList: [
      { q: 'T7', subject: 'Data Structures & Algorithms', category: 'Silly Mistake', topic: 'KMP', detail: 'Off-by-one in failure function — loop bound used len-1' },
    ],
  }),

  /* ---------------- Lab — CS505 ML Lab ---------------- */
  'UNI-LAB-CS505-2026': universityVariant({
    id: 'UNI-LAB-CS505-2026', name: 'Lab Examination — CS505 · Machine Learning Lab',
    course: 'CS505 — ML Lab', subject: 'Machine Learning',
    faculty: 'Dr. Priya Nair', semester: 'Semester 5', academicYear: '2026–27',
    date: '2026-08-06', duration: '2 hrs', venue: 'AI Lab 2', hall: 'Lab 2', seat: 'C-03',
    maxMarks: 15, passingMarks: 6, examStatus: 'Completed', admitCard: 'Issued', resultStatus: 'Declared',
    score: 12, grade: 'B+', rank: 14, batchRank: 14, cohortSize: 68, accuracy: 72,
    summary: 'Lab exam: train and evaluate a small classifier. Regression baseline and metrics were correct, but the regularisation comparison task was incomplete — L1 vs L2 effects on weights were explained, not demonstrated. 12/15 is a solid B+ with a clear path to full marks by practicing ablation runs.',
    subjectsCards: [
      { name: 'Machine Learning', maxMarks: 15, score: 12, accuracy: 72, time: 76, rank: 14, difficulty: 'Medium', attempted: 5, correct: 4, weakAreas: ['Regularisation comparison'], strongAreas: ['Linear regression', 'Metrics'] },
    ],
    chapters: [
      ch('Machine Learning', 'Regression — Lab Tasks', 84, 'Strong'),
      ch('Machine Learning', 'Model Evaluation — Lab Tasks', 78, 'Strong'),
      ch('Machine Learning', 'Regularisation — Lab Tasks', 60, 'Weak'),
    ],
    topics: [
      tp('Machine Learning', 'Gradient descent implementation', 86, 'Strong'),
      tp('Machine Learning', 'Precision/recall computation', 80, 'Strong'),
      tp('Machine Learning', 'L1 vs L2 regularisation', 58, 'Weak'),
    ],
    qi: { total: 6, attempted: 5, correct: 4, incorrect: 0, skipped: 1, negativeMarks: 0, guessAttempts: 0, accuracy: 72, successRate: 80, attemptRatio: 83.3 },
    timeDistribution: [{ section: 'Machine Learning', allocated: 120, used: 96, efficiency: 125 }],
    comparison: {
      previousTest: { label: 'Lab record average', score: 11, percentile: null, grade: 'B+' },
      previousMonth: { label: 'Previous lab exam', score: 10, percentile: null },
      batchAverage: { label: 'Class average', score: 10.5, percentile: null },
      instituteAverage: { label: 'Section average', score: 10, percentile: null },
      topPerformer: { label: 'Topper', score: 15, percentile: null, name: 'Ananya Desai' },
      deltas: [
        { label: 'vs lab record average', value: '+1', up: true },
        { label: 'vs class average', value: '+1.5', up: true },
      ],
    },
    recommendations: {
      weakChapters: ['Regularisation (60%)'],
      weakTopics: ['L1 vs L2 weight behaviour'],
      priorityRevision: [{ topic: 'Regularisation ablation experiment', priority: 'High', timeframe: '5 days' }],
      suggestedPYQs: [{ title: 'ML lab PYQ — evaluation tasks', source: 'Dept. lab bank' }],
      practiceQuestions: [{ title: '4 lab tasks — Regularisation & metrics', count: 4, difficulty: 'Medium' }],
      mockTests: [{ title: 'ML lab mock (15 marks, 2 hrs)', mode: 'University lab pattern' }],
      lectures: [{ title: 'L1 vs L2 Regularisation — Visualised (20 min)', type: 'Video' }],
    },
    prediction: {
      riskLevel: 'Low', expectedImprovement: '+0.05 CGPA', targetProbability: 80,
      expectedCGPA: 8.7, expectedGrade: 'A', classRank: 12,
      trajectory: [
        { exam: 'Lab record', score: 11 }, { exam: 'Lab exam (latest)', score: 12 },
        { exam: 'End sem lab (predicted)', score: 14 },
      ],
    },
    review: [
      { q: 'T1', subject: 'Machine Learning', topic: 'Linear regression', type: 'Programming', status: 'Correct', marks: 4, time: 16 },
      { q: 'T2', subject: 'Machine Learning', topic: 'Confusion matrix metrics', type: 'Programming', status: 'Correct', marks: 4, time: 18 },
      { q: 'T4', subject: 'Machine Learning', topic: 'Regularisation comparison', type: 'Viva + Task', status: 'Incomplete', marks: 1, time: 22 },
      { q: 'T5', subject: 'Machine Learning', topic: 'Cross-validation', type: 'Programming', status: 'Skipped', marks: 0, time: 8 },
    ],
    mistakeList: [
      { q: 'T4', subject: 'Machine Learning', category: 'Concept Error', topic: 'Regularisation', detail: 'Explained L1/L2 but skipped the required weight-table demonstration' },
    ],
  }),

  /* ---------------- Viva — CS502 DBMS ---------------- */
  'UNI-VIVA-CS502-2026': universityVariant({
    id: 'UNI-VIVA-CS502-2026', name: 'Viva Examination — CS502 · Database Management Systems',
    course: 'CS502 — Database Management Systems', subject: 'Database Management Systems',
    faculty: 'Dr. Arvind Kulkarni', semester: 'Semester 5', academicYear: '2026–27',
    date: '2026-08-07', duration: '30 min per student', venue: 'CSE Faculty Block', hall: 'CR-06', seat: 'Panel 3',
    maxMarks: 20, passingMarks: 8, examStatus: 'Completed', admitCard: 'Issued', resultStatus: 'Declared',
    score: 16, grade: 'A-', rank: 11, batchRank: 11, cohortSize: 68, accuracy: 75,
    summary: 'Viva covered normalisation, transactions and indexing. Strong on 3NF/BCNF decomposition and isolation levels; the panel noted hesitation on B+ tree deletion and deadlock detection details. 16/20 is a solid A- with room to polish advanced indexing topics.',
    subjectsCards: [
      { name: 'Database Management Systems', maxMarks: 20, score: 16, accuracy: 75, time: 26, rank: 11, difficulty: 'Medium', attempted: 9, correct: 7, weakAreas: ['B+ tree deletion', 'Deadlock detection'], strongAreas: ['Normalisation', 'Isolation levels'] },
    ],
    chapters: [
      ch('Database Management Systems', 'Relational Design — Normalisation', 88, 'Strong'),
      ch('Database Management Systems', 'Transactions & Concurrency', 82, 'Strong'),
      ch('Database Management Systems', 'Indexing — B+ Trees', 66, 'Weak'),
    ],
    topics: [
      tp('Database Management Systems', '3NF / BCNF decomposition', 90, 'Strong'),
      tp('Database Management Systems', 'Isolation levels', 85, 'Strong'),
      tp('Database Management Systems', 'B+ tree operations', 62, 'Weak'),
      tp('Database Management Systems', 'Deadlock detection', 60, 'Weak'),
    ],
    qi: { total: 10, attempted: 9, correct: 7, incorrect: 1, skipped: 1, negativeMarks: 0, guessAttempts: 1, accuracy: 75, successRate: 77.8, attemptRatio: 90 },
    timeDistribution: [{ section: 'Database Management Systems', allocated: 30, used: 26, efficiency: 115 }],
    comparison: {
      previousTest: { label: 'Quiz 2', score: 15, percentile: null, grade: 'A-' },
      previousMonth: { label: 'Viva (Sem 4)', score: 14, percentile: null },
      batchAverage: { label: 'Class average', score: 12.5, percentile: null },
      instituteAverage: { label: 'Section average', score: 12, percentile: null },
      topPerformer: { label: 'Topper', score: 19, percentile: null, name: 'Sneha Patil' },
      deltas: [
        { label: 'vs quiz 2', value: '+1', up: true },
        { label: 'vs class average', value: '+3.5', up: true },
      ],
    },
    recommendations: {
      weakChapters: ['Indexing — B+ Trees (66%)'],
      weakTopics: ['B+ tree deletion', 'Deadlock detection algorithms'],
      priorityRevision: [{ topic: 'B+ tree insert/delete traces', priority: 'High', timeframe: '6 days' }],
      suggestedPYQs: [{ title: 'University PYQ — Indexing questions', source: 'Dept. question bank' }],
      practiceQuestions: [{ title: '6-question drill — B+ trees & locking', count: 6, difficulty: 'Medium' }],
      mockTests: [{ title: 'DBMS viva-style mock Q&A (20 marks)', mode: 'University viva pattern' }],
      lectures: [{ title: 'B+ Trees — Insert & Delete Traces (30 min)', type: 'Video' }],
    },
    prediction: {
      riskLevel: 'Low', expectedImprovement: '+0.05 CGPA', targetProbability: 84,
      expectedCGPA: 8.7, expectedGrade: 'A', classRank: 10,
      trajectory: [
        { exam: 'Quiz 2', score: 15 }, { exam: 'Viva (latest)', score: 16 },
        { exam: 'End sem (predicted)', score: 80 },
      ],
    },
    review: [
      { q: 'V1', subject: 'Database Management Systems', topic: '3NF decomposition', type: 'Viva', status: 'Correct', marks: 3, time: 2.4 },
      { q: 'V3', subject: 'Database Management Systems', topic: 'Isolation levels', type: 'Viva', status: 'Correct', marks: 2, time: 1.8 },
      { q: 'V5', subject: 'Database Management Systems', topic: 'B+ tree deletion', type: 'Viva', status: 'Incorrect', marks: 0, time: 3.6 },
      { q: 'V7', subject: 'Database Management Systems', topic: 'Deadlock detection', type: 'Viva', status: 'Skipped', marks: 0, time: 2.1 },
      { q: 'V9', subject: 'Database Management Systems', topic: 'Query optimisation', type: 'Viva', status: 'Correct', marks: 2, time: 2.6 },
    ],
    mistakeList: [
      { q: 'V5', subject: 'Database Management Systems', category: 'Concept Error', topic: 'B+ trees', detail: 'Missed the borrow-from-sibling case during deletion' },
    ],
  }),

  /* ---------------- Improvement — CS506 ToC ---------------- */
  'UNI-IMP-CS506-2026': universityVariant({
    id: 'UNI-IMP-CS506-2026', name: 'Improvement Examination — CS506 · Theory of Computation',
    course: 'CS506 — Theory of Computation', subject: 'Theory of Computation',
    faculty: 'Dr. Arvind Kulkarni', semester: 'Semester 5', academicYear: '2026–27',
    date: '2026-08-09', duration: '3 hrs', venue: 'Main Academic Block', hall: 'LT-108', seat: 'E-14',
    maxMarks: 50, passingMarks: 20, examStatus: 'Scheduled', admitCard: 'Issued', resultStatus: 'Awaiting Result',
    score: 0, grade: '—', rank: null, batchRank: null, cohortSize: 68, accuracy: 0,
    summary: 'Improvement examination scheduled for 9 August 2026 — this attempt is yet to be written. The AI engine has pre-computed your expected performance from the last attempt (end-sem 64/100): a +8 mark improvement is projected if the pumping-lemma and reduction drills are completed first.',
    subjectsCards: [
      { name: 'Theory of Computation', maxMarks: 50, score: 0, accuracy: 0, time: 0, rank: null, difficulty: 'Hard', attempted: 0, correct: 0, weakAreas: ['Pumping lemma proofs', 'Reductions'], strongAreas: ['DFA/NFA construction', 'Context-free grammars'] },
    ],
    chapters: [
      ch('Theory of Computation', 'Automata & Regular Languages', 78, 'Strong'),
      ch('Theory of Computation', 'Context-Free Grammars', 72, 'Average'),
      ch('Theory of Computation', 'Decidability & Reductions', 58, 'Weak'),
    ],
    topics: [
      tp('Theory of Computation', 'DFA/NFA construction', 80, 'Strong'),
      tp('Theory of Computation', 'CFG parsing & ambiguity', 74, 'Average'),
      tp('Theory of Computation', 'Pumping lemma', 55, 'Weak'),
      tp('Theory of Computation', 'Undecidability reductions', 52, 'Weak'),
    ],
    qi: { total: 20, attempted: 0, correct: 0, incorrect: 0, skipped: 20, negativeMarks: 0, guessAttempts: 0, accuracy: 0, successRate: 0, attemptRatio: 0 },
    timeDistribution: [{ section: 'Theory of Computation', allocated: 180, used: 0, efficiency: 0 }],
    comparison: {
      previousTest: { label: 'End sem 2025', score: 64, percentile: null, grade: 'B' },
      previousMonth: { label: 'Midsem 2026', score: 38, percentile: null },
      batchAverage: { label: 'Class average (end sem)', score: 71, percentile: null },
      instituteAverage: { label: 'Section average', score: 68, percentile: null },
      topPerformer: { label: 'Topper', score: 92, percentile: null, name: 'Ishita Gupta' },
      deltas: [
        { label: 'vs end sem 2025', value: '—', up: true },
        { label: 'vs class average', value: '−7', up: false },
      ],
    },
    recommendations: {
      weakChapters: ['Decidability & Reductions (58%)'],
      weakTopics: ['Pumping lemma proofs', 'Reduction constructions'],
      priorityRevision: [
        { topic: 'Pumping lemma — 10 worked proofs', priority: 'Critical', timeframe: '4 days' },
        { topic: 'Reductions: HALT → other undecidable sets', priority: 'Critical', timeframe: '4 days' },
      ],
      suggestedPYQs: [{ title: 'University PYQ — ToC improvement papers', source: 'Dept. question bank' }],
      practiceQuestions: [{ title: '12-question drill — Pumping lemma & reductions', count: 12, difficulty: 'Hard' }],
      mockTests: [{ title: 'ToC improvement-pattern mock (50 marks)', mode: 'University pattern' }],
      lectures: [{ title: 'Reductions & Undecidability — Workshop (50 min)', type: 'Video' }],
    },
    prediction: {
      riskLevel: 'Medium', expectedImprovement: '+8 marks vs last attempt', targetProbability: 72,
      expectedCGPA: 8.6, expectedGrade: 'B+', classRank: 22,
      trajectory: [
        { exam: 'End sem 2025', score: 64 }, { exam: 'Midsem 2026', score: 38 },
        { exam: 'Improvement (predicted)', score: 72 },
      ],
    },
    review: [],
    mistakeList: [],
  }),

  /* ---------------- Supplementary — CS504 Networks ---------------- */
  'UNI-SUP-CS504-2026': universityVariant({
    id: 'UNI-SUP-CS504-2026', name: 'Supplementary Examination — CS504 · Computer Networks',
    course: 'CS504 — Computer Networks', subject: 'Computer Networks',
    faculty: 'Prof. Vikram Rao', semester: 'Semester 5', academicYear: '2026–27',
    date: '2026-08-12', duration: '3 hrs', venue: 'Main Academic Block', hall: 'LT-112', seat: 'F-21',
    maxMarks: 50, passingMarks: 20, examStatus: 'Scheduled', admitCard: 'Available', resultStatus: 'Awaiting Result',
    score: 0, grade: '—', rank: null, batchRank: null, cohortSize: 68, accuracy: 0,
    summary: 'Supplementary examination scheduled for 12 August 2026. The AI engine projects a pass with margin if the TCP congestion-control numericals and subnetting drills are completed — both were the losing areas in the end-sem (68/100).',
    subjectsCards: [
      { name: 'Computer Networks', maxMarks: 50, score: 0, accuracy: 0, time: 0, rank: null, difficulty: 'Hard', attempted: 0, correct: 0, weakAreas: ['TCP congestion control', 'Network security basics'], strongAreas: ['IP addressing', 'Routing'] },
    ],
    chapters: [
      ch('Computer Networks', 'Network Layer — IP & Routing', 78, 'Strong'),
      ch('Computer Networks', 'Transport Layer — TCP', 62, 'Weak'),
      ch('Computer Networks', 'Application Protocols & Security', 66, 'Average'),
    ],
    topics: [
      tp('Computer Networks', 'Subnetting & CIDR', 84, 'Strong'),
      tp('Computer Networks', 'Routing algorithms', 78, 'Strong'),
      tp('Computer Networks', 'TCP congestion control', 58, 'Weak'),
      tp('Computer Networks', 'TLS & firewalls basics', 64, 'Average'),
    ],
    qi: { total: 22, attempted: 0, correct: 0, incorrect: 0, skipped: 22, negativeMarks: 0, guessAttempts: 0, accuracy: 0, successRate: 0, attemptRatio: 0 },
    timeDistribution: [{ section: 'Computer Networks', allocated: 180, used: 0, efficiency: 0 }],
    comparison: {
      previousTest: { label: 'End sem 2025', score: 68, percentile: null, grade: 'B' },
      previousMonth: { label: 'Midsem 2026', score: 41, percentile: null },
      batchAverage: { label: 'Class average (end sem)', score: 74, percentile: null },
      instituteAverage: { label: 'Section average', score: 71, percentile: null },
      topPerformer: { label: 'Topper', score: 93, percentile: null, name: 'Divya Krishnan' },
      deltas: [
        { label: 'vs end sem 2025', value: '—', up: true },
        { label: 'vs class average', value: '−6', up: false },
      ],
    },
    recommendations: {
      weakChapters: ['Transport Layer — TCP (62%)'],
      weakTopics: ['TCP congestion control', 'Flow control numericals'],
      priorityRevision: [
        { topic: 'TCP cwnd traces — 8 numericals', priority: 'Critical', timeframe: '5 days' },
        { topic: 'Subnetting speed drills', priority: 'High', timeframe: '3 days' },
      ],
      suggestedPYQs: [{ title: 'University PYQ — CN supplementary papers', source: 'Dept. question bank' }],
      practiceQuestions: [{ title: '10-question drill — Transport layer', count: 10, difficulty: 'Medium' }],
      mockTests: [{ title: 'CN supplementary-pattern mock (50 marks)', mode: 'University pattern' }],
      lectures: [{ title: 'TCP Congestion Control — Traces Explained (35 min)', type: 'Video' }],
    },
    prediction: {
      riskLevel: 'Medium', expectedImprovement: '+9 marks vs last attempt', targetProbability: 76,
      expectedCGPA: 8.5, expectedGrade: 'B+', classRank: 25,
      trajectory: [
        { exam: 'End sem 2025', score: 68 }, { exam: 'Midsem 2026', score: 41 },
        { exam: 'Supplementary (predicted)', score: 77 },
      ],
    },
    review: [],
    mistakeList: [],
  }),
})
