/**
 * PYQ (Previous Year Question) Analysis — faculty dataset.
 * Powers overview, upload/OCR status, trend analytics, question
 * intelligence, difficulty analytics and AI suggestions.
 */

export const pyqAnalysis = {
  overview: {
    totalPapers: 46,
    yearsCovered: [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
    subjects: ['CS501 — DSA', 'CS502 — DBMS', 'CS503 — OS', 'CS504 — Networks', 'CS505 — ML', 'CS506 — ToC'],
    totalQuestions: 486,
    repeatedQuestions: 68,
    coveragePct: 87,
  },
  uploads: [
    { id: 'up1', paper: 'CS501 — Midsem 2025', year: 2025, status: 'Processed', ocr: 99.2, questions: 22, category: 'Auto-categorized', uploaded: '2026-07-28' },
    { id: 'up2', paper: 'CS501 — EndSem 2025', year: 2025, status: 'Processed', ocr: 98.7, questions: 25, category: 'Auto-categorized', uploaded: '2026-07-28' },
    { id: 'up3', paper: 'CS503 — Midsem 2024', year: 2024, status: 'Processed', ocr: 96.4, questions: 20, category: 'Auto-categorized', uploaded: '2026-07-25' },
    { id: 'up4', paper: 'CS502 — EndSem 2023 (scanned)', year: 2023, status: 'Processing', ocr: 88.1, questions: null, category: 'Pending review', uploaded: '2026-08-01' },
    { id: 'up5', paper: 'CS505 — Midsem 2022', year: 2022, status: 'Processed', ocr: 97.8, questions: 18, category: 'Auto-categorized', uploaded: '2026-07-22' },
    { id: 'up6', paper: 'CS506 — EndSem 2021 (handwritten)', year: 2021, status: 'Failed', ocr: 41.2, questions: null, category: 'Manual review needed', uploaded: '2026-07-20' },
  ],
  trendAnalytics: {
    yearWise: [
      { year: 2011, questions: 41, repeated: 2 },
      { year: 2012, questions: 43, repeated: 3 },
      { year: 2013, questions: 45, repeated: 3 },
      { year: 2014, questions: 47, repeated: 4 },
      { year: 2015, questions: 49, repeated: 5 },
      { year: 2016, questions: 52, repeated: 5 },
      { year: 2017, questions: 54, repeated: 6 },
      { year: 2018, questions: 56, repeated: 7 },
      { year: 2019, questions: 58, repeated: 8 },
      { year: 2020, questions: 62, repeated: 10 },
      { year: 2021, questions: 60, repeated: 11 },
      { year: 2022, questions: 66, repeated: 13 },
      { year: 2023, questions: 71, repeated: 15 },
      { year: 2024, questions: 78, repeated: 18 },
      { year: 2025, questions: 84, repeated: 21 },
    ],
    semesterTrends: [
      { semester: 'Mid-Sem', questions: 41, repeated: 7 },
      { semester: 'End-Sem', questions: 45, repeated: 9 },
      { semester: 'Quiz', questions: 12, repeated: 3 },
    ],
    questionFrequency: [
      { topic: 'Dijkstra & shortest paths', frequency: 14 },
      { topic: 'MST (Kruskal/Prim)', frequency: 12 },
      { topic: '0/1 Knapsack', frequency: 11 },
      { topic: 'AVL rotations', frequency: 10 },
      { topic: 'Big-O analysis', frequency: 13 },
      { topic: 'Topological sort', frequency: 9 },
      { topic: 'KMP string matching', frequency: 6 },
      { topic: 'Segment trees', frequency: 5 },
      { topic: 'NP-completeness', frequency: 8 },
      { topic: 'Hashing', frequency: 9 },
    ],
    chapterWeightage: [
      { chapter: 'Graph Algorithms', weight: 26 },
      { chapter: 'Dynamic Programming', weight: 20 },
      { chapter: 'Sorting & Searching', weight: 16 },
      { chapter: 'Trees & Heaps', weight: 14 },
      { chapter: 'Complexity Analysis', weight: 12 },
      { chapter: 'String Algorithms', weight: 8 },
      { chapter: 'NP-Completeness', weight: 4 },
    ],
    topicWeightage: [
      { topic: 'Shortest paths', weight: 14 },
      { topic: 'MST', weight: 12 },
      { topic: 'Knapsack family', weight: 11 },
      { topic: 'Sorting analysis', weight: 10 },
      { topic: 'AVL', weight: 9 },
      { topic: 'Topological ordering', weight: 8 },
      { topic: 'Hashing', weight: 8 },
    ],
    subjectWeightage: [
      { subject: 'CS501', weight: 34 },
      { subject: 'CS502', weight: 20 },
      { subject: 'CS503', weight: 18 },
      { subject: 'CS505', weight: 15 },
      { subject: 'CS504', weight: 8 },
      { subject: 'CS506', weight: 5 },
    ],
  },
  questionIntelligence: {
    mostRepeated: [
      { question: 'Trace Dijkstra\'s algorithm on a 5-vertex graph', times: 14, years: [2019, 2020, 2021, 2022, 2023, 2024, 2025] },
      { question: 'Construct MST using Kruskal & Prim', times: 12, years: [2019, 2020, 2022, 2023, 2024, 2025] },
      { question: 'Solve 0/1 knapsack with DP table', times: 11, years: [2020, 2021, 2022, 2023, 2025] },
      { question: 'Analyse Big-O of recursive algorithms', times: 13, years: [2019, 2020, 2021, 2023, 2024, 2025] },
      { question: 'Insert nodes into an AVL tree with rotations', times: 10, years: [2019, 2021, 2022, 2024, 2025] },
    ],
    frequentTopics: ['Shortest paths', 'MST', 'DP — knapsack', 'Complexity analysis', 'AVL rotations', 'Topological sort'],
    frequentChapters: ['Graph Algorithms', 'Dynamic Programming', 'Sorting & Searching'],
    importantConcepts: ['Greedy vs DP trade-offs', 'Amortized analysis', 'Graph traversal applications', 'Heaps in priority queues'],
    aiPredictedQuestions: [
      { question: 'Design a variant of Dijkstra for path with maximum bottleneck edge', confidence: 92, reason: 'Combines 3 top topics; never asked directly' },
      { question: 'Compare iterative vs recursive segment tree for range updates', confidence: 87, reason: 'Segment trees trending up; gap year 2024–25' },
      { question: 'Prove optimal substructure for activity selection', confidence: 84, reason: 'Proof-type questions appear every 2nd year' },
    ],
    neverAsked: ['Suffix array construction', 'Treap implementation', 'B-tree deletion details'],
    emergingTopics: ['Segment trees with lazy propagation', 'Graph applications in ML', 'Persistent data structures'],
  },
  ncertMapping: [
    { chapter: 'Mechanics', ncertBook: 'NCERT XI — Ch 5–8', coverage: 95 },
    { chapter: 'Electrostatics', ncertBook: 'NCERT XII — Ch 1–2', coverage: 90 },
    { chapter: 'Ray Optics', ncertBook: 'NCERT XII — Ch 9', coverage: 85 },
    { chapter: 'Physical Chemistry', ncertBook: 'NCERT XI — Ch 5, 7', coverage: 92 },
    { chapter: 'Coordination Compounds', ncertBook: 'NCERT XII — Ch 9', coverage: 88 },
    { chapter: 'Calculus', ncertBook: 'NCERT XII — Ch 7–8', coverage: 82 },
    { chapter: '3D Geometry', ncertBook: 'NCERT XII — Ch 11', coverage: 80 },
  ],
  aiImportantQuestions: [
    { question: 'Derive the lens maker formula and apply it to a given system', confidence: 94, reason: 'Asked 6× in 15 years · high-weightage' },
    { question: 'Solve definite integration using properties (odd/even functions)', confidence: 92, reason: 'Appears every 2nd year · current weak area' },
    { question: "Explain Werner's theory with coordination compound examples", confidence: 88, reason: 'NCERT table-based · frequent in recent years' },
    { question: 'Application of Gauss law to symmetric charge distributions', confidence: 86, reason: 'Classic PYQ pattern · moderate difficulty' },
  ],
  difficultyAnalytics: {
    distribution: [
      { difficulty: 'Easy', pct: 32 },
      { difficulty: 'Medium', pct: 48 },
      { difficulty: 'Hard', pct: 20 },
    ],
    marksDistribution: [
      { type: 'MCQ', marks: 20 },
      { type: 'Short Answer', marks: 30 },
      { type: 'Long Answer', marks: 50 },
    ],
    typeDistribution: [
      { type: 'MCQ', count: 186 },
      { type: 'Short Answer', count: 164 },
      { type: 'Long Answer', count: 86 },
      { type: 'Case Study', count: 30 },
      { type: 'Programming', count: 20 },
    ],
  },
  aiSuggestions: [
    { id: 'as1', type: 'Generate similar questions', desc: 'Create 10 questions similar to the most repeated patterns', icon: 'CopyPlus' },
    { id: 'as2', type: 'Generate mock test', desc: 'Auto-build a full mock from PYQ distribution', icon: 'Timer' },
    { id: 'as3', type: 'Generate practice set', desc: 'Topic-wise practice set for weak chapters', icon: 'ListChecks' },
    { id: 'as4', type: 'Generate revision sheet', desc: 'One-page concept sheet for high-frequency topics', icon: 'FileText' },
    { id: 'as5', type: 'Generate important questions', desc: 'Ranked list of predicted questions for the next exam', icon: 'Star' },
  ],
  exportOptions: ['Download Analysis', 'Export Charts', 'Export CSV', 'Print'],
}

/* =====================================================================
 * Workflow support — filter options, repeated patterns and per-subject
 * analysis variants for the redesigned PYQ analysis workflow.
 * ===================================================================== */

export const pyqFilters = {
  programs: ['B.Tech — CSE', 'B.Tech — ECE', 'B.Tech — ME', 'M.Sc — Data Science'],
  subjects: [
    { code: 'CS501', name: 'Data Structures & Algorithms', chapters: ['Graph Algorithms', 'Dynamic Programming', 'Sorting & Searching', 'Trees & Heaps', 'Complexity Analysis', 'String Algorithms'] },
    { code: 'CS502', name: 'Database Management Systems', chapters: ['Relational Design', 'SQL & Query Optimisation', 'Transactions & Concurrency', 'Indexing', 'NoSQL Systems'] },
    { code: 'CS503', name: 'Operating Systems', chapters: ['Processes & Threads', 'CPU Scheduling', 'Memory Management', 'File Systems', 'Synchronisation'] },
    { code: 'CS504', name: 'Computer Networks', chapters: ['Physical & Data Link', 'Network Layer', 'Transport Layer', 'Application Protocols', 'Network Security'] },
    { code: 'CS505', name: 'Machine Learning', chapters: ['Regression', 'Classification', 'Neural Networks', 'Model Evaluation', 'Unsupervised Learning'] },
    { code: 'CS506', name: 'Theory of Computation', chapters: ['Automata', 'Formal Languages', 'Turing Machines', 'Decidability', 'Complexity Classes'] },
  ],
  chapters: {
    'Graph Algorithms': ['Dijkstra & shortest paths', 'MST (Kruskal/Prim)', 'Topological sort', 'Network flows', 'BFS/DFS applications'],
    'Dynamic Programming': ['0/1 Knapsack', 'LCS & edit distance', 'Matrix chain', 'DP on trees'],
    'Sorting & Searching': ['Comparison sorts', 'Linear-time sorts', 'Binary search variants', 'Order statistics'],
    'Trees & Heaps': ['AVL rotations', 'Segment trees', 'Heaps & priority queues', 'B-trees'],
    'Complexity Analysis': ['Big-O analysis', 'Recurrences & Master theorem', 'Amortized analysis'],
    'String Algorithms': ['KMP string matching', 'Rabin-Karp', 'Suffix arrays', 'Tries'],
    'Relational Design': ['Normalisation', 'Functional dependencies', 'ER modelling'],
    'SQL & Query Optimisation': ['Joins & subqueries', 'Query execution plans', 'Indexing strategies'],
    'Transactions & Concurrency': ['ACID properties', 'Isolation levels', '2PL & deadlock handling'],
    Indexing: ['B+ trees', 'Hash indexes', 'Composite indexes'],
    'NoSQL Systems': ['Key-value stores', 'Document stores', 'CAP theorem'],
    'Processes & Threads': ['Process states', 'Thread models', 'Context switching'],
    'CPU Scheduling': ['FCFS/SJF/RR', 'Priority scheduling', 'Multilevel queues'],
    'Memory Management': ['Paging & segmentation', 'Virtual memory', 'Page replacement'],
    'File Systems': ['Inodes', 'Disk allocation', 'Journaling'],
    Synchronisation: ['Semaphores', 'Monitors', 'Deadlock detection', 'Classic problems'],
    'Physical & Data Link': ['Framing & error detection', 'MAC protocols', 'Ethernet & switching'],
    'Network Layer': ['IP addressing & subnetting', 'Routing algorithms', 'ICMP & ARP'],
    'Transport Layer': ['TCP congestion control', 'Flow control', 'UDP vs TCP'],
    'Application Protocols': ['HTTP & DNS', 'Email protocols', 'DHCP'],
    'Network Security': ['Firewalls & NAT', 'TLS basics', 'Common attacks'],
    Regression: ['Linear regression', 'Ridge & Lasso', 'Gradient descent'],
    Classification: ['Logistic regression', 'SVM & kernels', 'Decision trees'],
    'Neural Networks': ['Backpropagation', 'Activation functions', 'Regularisation'],
    'Model Evaluation': ['Cross-validation', 'Metrics (precision/recall/F1)', 'Bias-variance trade-off'],
    'Unsupervised Learning': ['K-means', 'PCA', 'Anomaly detection'],
    Automata: ['DFA/NFA construction', 'Pumping lemma', 'Minimisation'],
    'Formal Languages': ['Regular expressions', 'Context-free grammars', 'CFL properties'],
    'Turing Machines': ['TM design', 'Undecidability', 'Reductions'],
    Decidability: ['Halting problem', 'Rice theorem', 'Decidable languages'],
    'Complexity Classes': ['P vs NP', 'NP-completeness', 'Reductions'],
  },
  yearRanges: [
    { id: 'all', label: 'All years (2011–2025)', from: 2011, to: 2025 },
    { id: 'recent5', label: 'Last 5 years (2021–2025)', from: 2021, to: 2025 },
    { id: 'recent10', label: 'Last 10 years (2016–2025)', from: 2016, to: 2025 },
    { id: 'last3', label: 'Last 3 years (2023–2025)', from: 2023, to: 2025 },
    { id: 'old5', label: '2011–2015', from: 2011, to: 2015 },
    { id: 'mid5', label: '2016–2020', from: 2016, to: 2020 },
  ],
}

export const pyqPatterns = [
  { pattern: 'Trace an algorithm on a given input (graph/array)', frequency: 38, years: '2015–2025', example: 'Trace Dijkstra on a 5-vertex graph', impact: 'High' },
  { pattern: 'Prove correctness / derive complexity', frequency: 29, years: '2013–2025', example: 'Prove MST optimality', impact: 'High' },
  { pattern: 'Compare two approaches with trade-offs', frequency: 24, years: '2016–2025', example: 'Quick sort vs merge sort', impact: 'Medium' },
  { pattern: 'Design a variant or application problem', frequency: 18, years: '2018–2025', example: 'Dijkstra for bottleneck path', impact: 'Medium' },
  { pattern: 'Construct a data structure step-by-step', frequency: 16, years: '2014–2025', example: 'AVL insert with rotations', impact: 'High' },
  { pattern: 'Numerical computation with formulas', frequency: 14, years: '2012–2025', example: 'Page offset bits from address size', impact: 'Medium' },
]

/** Per-subject PYQ variants — merge into the base dataset when a subject filter is applied. */
export const pyqVariants = {
  CS501: null, // base dataset is CS501 (DSA)
  CS503: {
    chapterWeightage: [
      { chapter: 'CPU Scheduling', weight: 24 },
      { chapter: 'Memory Management', weight: 26 },
      { chapter: 'Processes & Threads', weight: 18 },
      { chapter: 'Synchronisation', weight: 17 },
      { chapter: 'File Systems', weight: 15 },
    ],
    topicWeightage: [
      { topic: 'Scheduling policies', weight: 16 },
      { topic: 'Paging & segmentation', weight: 15 },
      { topic: 'Page replacement', weight: 12 },
      { topic: 'Deadlock detection', weight: 10 },
      { topic: 'Semaphores', weight: 9 },
    ],
    questionFrequency: [
      { topic: 'Scheduling (FCFS/SJF/RR)', frequency: 16 },
      { topic: 'Page replacement algorithms', frequency: 14 },
      { topic: 'Deadlock conditions', frequency: 11 },
      { topic: 'Semaphore problems', frequency: 10 },
      { topic: 'Virtual memory', frequency: 12 },
      { topic: 'File allocation', frequency: 8 },
    ],
    mostRepeated: [
      { question: 'Compute average waiting time for FCFS, SJF and RR on a given process set', times: 16, years: [2016, 2017, 2019, 2020, 2022, 2023, 2024, 2025] },
      { question: 'Trace page replacement (FIFO, LRU, Optimal) on a reference string', times: 14, years: [2017, 2018, 2019, 2021, 2022, 2024, 2025] },
      { question: 'Explain the four necessary conditions for deadlock and one prevention strategy', times: 11, years: [2015, 2017, 2019, 2020, 2023, 2025] },
      { question: 'Solve the producer–consumer problem with semaphores', times: 10, years: [2016, 2018, 2020, 2022, 2024] },
      { question: 'Compare paging vs segmentation with a numeric example', times: 12, years: [2016, 2018, 2019, 2021, 2023, 2025] },
    ],
    difficultyAnalytics: {
      distribution: [
        { difficulty: 'Easy', pct: 30 },
        { difficulty: 'Medium', pct: 50 },
        { difficulty: 'Hard', pct: 20 },
      ],
      marksDistribution: [
        { type: 'MCQ', marks: 20 },
        { type: 'Short Answer', marks: 35 },
        { type: 'Long Answer', marks: 45 },
      ],
      typeDistribution: [
        { type: 'MCQ', count: 142 },
        { type: 'Short Answer', count: 138 },
        { type: 'Long Answer', count: 64 },
        { type: 'Numerical', count: 26 },
        { type: 'Case Study', count: 14 },
      ],
    },
    importantConcepts: ['Scheduling metrics (turnaround, waiting)', 'Thrashing & working set', 'Dining philosophers', 'Copy-on-write', 'Belady anomaly'],
    frequentTopics: ['CPU scheduling', 'Page replacement', 'Deadlocks', 'Semaphores', 'Virtual memory'],
    frequentChapters: ['Memory Management', 'CPU Scheduling', 'Synchronisation'],
    aiPredictedQuestions: [
      { question: 'Design a lottery scheduler and compare with CFS', confidence: 91, reason: 'Scheduling is the #1 chapter; modern schedulers never asked' },
      { question: 'Explain why LRU can suffer Belady anomaly and which algorithm cannot', confidence: 86, reason: 'Classic trap question; appears in ~every 3rd paper' },
      { question: 'Solve a multi-resource deadlock scenario with banker\'s algorithm', confidence: 83, reason: 'Banker\'s algorithm has a 6-year gap' },
    ],
  },
  CS505: {
    chapterWeightage: [
      { chapter: 'Regression', weight: 22 },
      { chapter: 'Classification', weight: 24 },
      { chapter: 'Neural Networks', weight: 21 },
      { chapter: 'Model Evaluation', weight: 18 },
      { chapter: 'Unsupervised Learning', weight: 15 },
    ],
    topicWeightage: [
      { topic: 'Gradient descent', weight: 14 },
      { topic: 'Metrics (precision/recall/F1)', weight: 12 },
      { topic: 'Regularisation', weight: 11 },
      { topic: 'Backpropagation', weight: 10 },
      { topic: 'Bias-variance', weight: 9 },
    ],
    questionFrequency: [
      { topic: 'Gradient descent variants', frequency: 13 },
      { topic: 'Regularisation (L1/L2)', frequency: 12 },
      { topic: 'Evaluation metrics', frequency: 12 },
      { topic: 'Backpropagation', frequency: 10 },
      { topic: 'Bias-variance trade-off', frequency: 9 },
      { topic: 'K-means clustering', frequency: 8 },
    ],
    mostRepeated: [
      { question: 'Derive the gradient descent update rule for linear regression', times: 13, years: [2017, 2018, 2020, 2021, 2023, 2024, 2025] },
      { question: 'Explain L1 vs L2 regularisation with effect on weights', times: 12, years: [2018, 2019, 2020, 2022, 2023, 2025] },
      { question: 'Compute precision, recall and F1 from a confusion matrix', times: 12, years: [2017, 2019, 2021, 2022, 2024, 2025] },
      { question: 'Trace backpropagation on a 2-layer network', times: 10, years: [2018, 2020, 2022, 2024] },
      { question: 'Explain the bias-variance trade-off with examples', times: 9, years: [2016, 2018, 2021, 2023, 2025] },
    ],
    difficultyAnalytics: {
      distribution: [
        { difficulty: 'Easy', pct: 28 },
        { difficulty: 'Medium', pct: 52 },
        { difficulty: 'Hard', pct: 20 },
      ],
      marksDistribution: [
        { type: 'MCQ', marks: 15 },
        { type: 'Short Answer', marks: 40 },
        { type: 'Long Answer', marks: 45 },
      ],
      typeDistribution: [
        { type: 'MCQ', count: 128 },
        { type: 'Short Answer', count: 154 },
        { type: 'Long Answer', count: 72 },
        { type: 'Numerical', count: 22 },
        { type: 'Programming', count: 18 },
      ],
    },
    importantConcepts: ['Gradient descent convergence', 'Regularisation intuition', 'Cross-entropy loss', 'Feature scaling', 'Overfitting detection'],
    frequentTopics: ['Gradient descent', 'Regularisation', 'Evaluation metrics', 'Backpropagation'],
    frequentChapters: ['Regression', 'Model Evaluation', 'Neural Networks'],
    aiPredictedQuestions: [
      { question: 'Compare batch vs stochastic vs mini-batch gradient descent on convergence behaviour', confidence: 90, reason: 'Top topic; comparison pattern is hot' },
      { question: 'Design an evaluation strategy for an imbalanced dataset', confidence: 85, reason: 'Imbalanced data never asked; metrics chapter trending' },
      { question: 'Explain how dropout regularises and why it works', confidence: 82, reason: 'Regularisation questions appear every 2nd year' },
    ],
  },
}

/* ---------- helpers ---------- */

/** Deep-merge a per-subject variant into the base PYQ dataset. */
export function applyPyqVariant(base, variant) {
  if (!variant) return base
  return {
    ...base,
    trendAnalytics: {
      ...base.trendAnalytics,
      chapterWeightage: variant.chapterWeightage ?? base.trendAnalytics.chapterWeightage,
      topicWeightage: variant.topicWeightage ?? base.trendAnalytics.topicWeightage,
      questionFrequency: variant.questionFrequency ?? base.trendAnalytics.questionFrequency,
      subjectWeightage: variant.subjectWeightage ?? base.trendAnalytics.subjectWeightage,
    },
    questionIntelligence: {
      ...base.questionIntelligence,
      mostRepeated: variant.mostRepeated ?? base.questionIntelligence.mostRepeated,
      frequentTopics: variant.frequentTopics ?? base.questionIntelligence.frequentTopics,
      frequentChapters: variant.frequentChapters ?? base.questionIntelligence.frequentChapters,
      importantConcepts: variant.importantConcepts ?? base.questionIntelligence.importantConcepts,
      aiPredictedQuestions: variant.aiPredictedQuestions ?? base.questionIntelligence.aiPredictedQuestions,
    },
    difficultyAnalytics: variant.difficultyAnalytics ?? base.difficultyAnalytics,
  }
}
