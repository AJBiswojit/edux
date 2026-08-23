/**
 * MediXO Mentor workspace — unified AI Tutor + AI Copilot data.
 * Study resources surfaced in the Mentor workspace and the AI chat
 * learning history (sessions, topics, outcomes).
 */

export const mentorResources = [
  { id: 'mr1', title: 'Graph algorithms masterclass (video)', type: 'Video', subject: 'CS501', meta: '48 min · Dr. Meera Krishnan', icon: 'PlayCircle', color: '#6366f1', recommended: true },
  { id: 'mr2', title: 'Transactions & isolation levels — visual notes', type: 'Notes', subject: 'CS502', meta: '6 pages · AI summarised', icon: 'StickyNote', color: '#14b8a6', recommended: true },
  { id: 'mr3', title: 'TCP congestion control — interactive demo', type: 'Lab', subject: 'CS504', meta: 'Self-paced · 30 min', icon: 'FlaskConical', color: '#f43f5e', recommended: false },
  { id: 'mr4', title: 'Calculus drill pack — 100 JEE-level problems', type: 'Practice', subject: 'Mathematics', meta: 'With step-by-step solutions', icon: 'PenLine', color: '#8b5cf6', recommended: true },
  { id: 'mr5', title: 'NCERT coordination compounds tables (PDF)', type: 'PDF', subject: 'Chemistry', meta: '2.1 MB · NCERT aligned', icon: 'FileText', color: '#f59e0b', recommended: false },
  { id: 'mr6', title: 'OS scheduling — animations & quiz', type: 'Quiz', subject: 'CS503', meta: '20 questions · adaptive', icon: 'ListChecks', color: '#f59e0b', recommended: false },
]

export const mentorLearningHistory = [
  { id: 'lh1', topic: 'TCP congestion control — slow start & avoidance', subject: 'Networks', date: '2026-08-04', duration: '26 min', outcome: 'Mastered', score: 92 },
  { id: 'lh2', topic: 'Definite integration — substitution techniques', subject: 'Mathematics', date: '2026-08-03', duration: '41 min', outcome: 'Improving', score: 64 },
  { id: 'lh3', topic: 'AVL trees — rotations deep dive', subject: 'DSA', date: '2026-08-02', duration: '33 min', outcome: 'Mastered', score: 95 },
  { id: 'lh4', topic: 'Ray optics — sign conventions', subject: 'Physics', date: '2026-08-01', duration: '22 min', outcome: 'Needs review', score: 48 },
  { id: 'lh5', topic: 'Midsem revision plan builder', subject: 'Planning', date: '2026-07-31', duration: '12 min', outcome: 'Completed', score: null },
  { id: 'lh6', topic: 'Coordination compounds — NCERT tables', subject: 'Chemistry', date: '2026-07-30', duration: '35 min', outcome: 'Improving', score: 58 },
  { id: 'lh7', topic: 'BFS/DFS vs Dijkstra — when to use what', subject: 'DSA', date: '2026-07-29', duration: '19 min', outcome: 'Mastered', score: 90 },
  { id: 'lh8', topic: 'Essay: ethics of predictive ML (AI draft)', subject: 'Writing', date: '2026-07-28', duration: '18 min', outcome: 'Delivered', score: null },
]

export const mentorQuickTopics = [
  { id: 'qt1', subject: 'Mathematics', title: 'Why does integration by parts fail for |x|?', tags: ['Calculus', 'Concept'], askedAt: '2026-08-04' },
  { id: 'qt2', subject: 'Networks', title: 'Difference between congestion window & receive window', tags: ['TCP', 'Concept'], askedAt: '2026-08-03' },
  { id: 'qt3', subject: 'DSA', title: 'Segment tree vs Fenwick tree — when to choose which?', tags: ['Trees', 'Interview'], askedAt: '2026-08-02' },
  { id: 'qt4', subject: 'Chemistry', title: 'NCERT detail: why is CO a strong field ligand?', tags: ['Coordination', 'NCERT'], askedAt: '2026-08-01' },
]

/* =====================================================================
 * Learning-focused datasets — Explain Concepts, Notes, Practice
 * Questions, Quiz Generator and Revision Assistant. Research-related
 * data has been removed from the Mentor workspace.
 * ===================================================================== */

export const mentorConcepts = [
  {
    id: 'mc1', subject: 'Data Structures', title: 'Why Dijkstra fails with negative edges',
    difficulty: 'Medium', summary: 'The greedy "settled" set assumes no later path can improve a settled distance — negative edges break that invariant.',
    explanation: 'Dijkstra settles the closest unvisited node and never revisits it. That works because all remaining edges are non-negative, so a settled distance can never shrink later. With a negative edge, a longer-looking path can reduce a settled distance after all — the algorithm would have already locked in a wrong answer.',
    keyPoints: ['Settled nodes are never relaxed again', 'Negative edges can shorten settled distances', 'Bellman-Ford relaxes all edges V−1 times and handles negatives'],
    example: 'Graph A→B (4), A→C (2), C→B (−3): Dijkstra picks B at 4 from A, but the true shortest A→C→B is −1.',
    relatedTopics: ['Bellman-Ford', 'Graph traversal'],
  },
  {
    id: 'mc2', subject: 'Networks', title: 'TCP congestion window vs receive window',
    difficulty: 'Medium', summary: 'Congestion window is network-side flow control; receive window is receiver-side — the effective window is the minimum.',
    explanation: 'The sender may send up to min(cwnd, rwnd) unacknowledged bytes. cwnd adapts to network congestion (slow start, congestion avoidance, fast retransmit), while rwnd reflects the receiver\'s buffer capacity advertised in every ACK.',
    keyPoints: ['Effective window = min(cwnd, rwnd)', 'cwnd is per-sender, network-driven', 'rwnd is per-receiver, buffer-driven'],
    example: 'If cwnd = 8 segments and rwnd = 3, only 3 can be in flight — the receiver is the bottleneck.',
    relatedTopics: ['Slow start', 'Flow control'],
  },
  {
    id: 'mc3', subject: 'Chemistry', title: 'Why CO is a strong field ligand',
    difficulty: 'Hard', summary: 'CO is a π-acceptor: it donates σ electron density but also accepts d-electron density back into its empty π* orbitals, raising Δo.',
    explanation: 'Ligand field strength depends on both σ donation and π back-bonding. CO\'s empty π* orbitals accept electron density from the metal, which stabilises the t2g set and increases the splitting energy Δo — making CO a strong-field ligand that favours low-spin complexes.',
    keyPoints: ['Synergic bonding: σ donation + π back-donation', 'π-acceptors raise Δo', 'Low-spin complexes: strong-field ligands'],
    example: '[Co(CO)6]³⁺ is diamagnetic (low spin) because CO forces pairing.',
    relatedTopics: ['Crystal field theory', 'Spectrochemical series'],
  },
  {
    id: 'mc4', subject: 'Mathematics', title: 'Definite integration by substitution — when to switch limits',
    difficulty: 'Medium', summary: 'When you substitute u = g(x), the limits must change to u-values: ∫ₐᵇ f(g(x))g′(x)dx = ∫_{g(a)}^{g(b)} f(u)du.',
    explanation: 'The substitution theorem maps the x-interval to a u-interval. Forgetting to convert limits is the single most common exam error. If the function is odd/even, symmetry properties can shortcut the computation entirely.',
    keyPoints: ['Convert limits: u = g(a), u = g(b)', 'Odd function on symmetric interval → 0', 'Even function → 2× the half-interval integral'],
    example: '∫₀^π sin²x·cos x dx with u = sin x: limits become 0 → 0? No — sin 0 = 0, sin π = 0, so the integral is 0.',
    relatedTopics: ['Odd/even functions', 'Integration by parts'],
  },
  {
    id: 'mc5', subject: 'Operating Systems', title: 'Paging vs segmentation — the trade-off',
    difficulty: 'Easy', summary: 'Paging splits memory into fixed frames (no external fragmentation, internal waste possible); segmentation splits by logical units (no internal waste, external fragmentation).',
    explanation: 'Paging uses fixed-size pages mapped through a page table — simple, no compaction needed, but a program\'s last page may be half empty. Segmentation divides memory by logical segments (code, data, stack) with base+limit — natural sharing and protection, but variable sizes cause external fragmentation.',
    keyPoints: ['Paging: fixed size, page table, internal fragmentation', 'Segmentation: logical units, base+limit, external fragmentation', 'Modern systems combine both (segmented paging)'],
    example: 'A 70 KB program on 32 KB pages uses 3 frames: 2 full + 1 with 26 KB wasted (internal).',
    relatedTopics: ['Page replacement', 'Virtual memory'],
  },
  {
    id: 'mc6', subject: 'Machine Learning', title: 'L1 vs L2 regularisation — why L1 gives sparse weights',
    difficulty: 'Medium', summary: 'L1 penalises the absolute weight (diamond constraint) which hits corners → exact zeros; L2 penalises the square (sphere) → small but non-zero weights.',
    explanation: 'Both shrink weights toward zero, but the geometry differs. The L1 constraint region is a diamond whose corners lie on the axes — the optimal point often lands on a corner, zeroing some features. L2\'s spherical region rarely touches the axes, so weights shrink smoothly but stay non-zero.',
    keyPoints: ['L1 → feature selection (sparse)', 'L2 → smooth shrinkage, stable', 'L1 is non-differentiable at zero; L2 always differentiable'],
    example: 'With two features, L1 optimisation often yields (w₁, 0) or (0, w₂); L2 yields (0.4, 0.7).',
    relatedTopics: ['Ridge vs Lasso', 'Gradient descent'],
  },
]

export const mentorNotes = [
  { id: 'mn1', subject: 'Data Structures', title: 'Graph algorithms — one-page revision', excerpt: 'Adjacency lists, BFS/DFS, Dijkstra, Bellman-Ford, MST: when to use what and the complexity table.', length: '6 pages', tags: ['Graphs', 'Midsem'], updated: '2026-08-03', color: '#6366f1' },
  { id: 'mn2', subject: 'Database Systems', title: 'Transactions & isolation levels', excerpt: 'ACID, anomalies, isolation levels with the classic table, 2PL and deadlock handling in 4 pages.', length: '4 pages', tags: ['DBMS', 'Midsem'], updated: '2026-08-02', color: '#14b8a6' },
  { id: 'mn3', subject: 'Mathematics', title: 'Calculus — integration techniques', excerpt: 'Substitution, by-parts, partial fractions, odd/even shortcuts with worked examples.', length: '8 pages', tags: ['JEE', 'Calculus'], updated: '2026-08-01', color: '#8b5cf6' },
  { id: 'mn4', subject: 'Chemistry', title: 'Coordination compounds — NCERT tables', excerpt: 'Werner theory, VBT, CFT, spectrochemical series and the table-heavy NCERT points condensed.', length: '5 pages', tags: ['NCERT', 'NEET'], updated: '2026-07-31', color: '#f59e0b' },
  { id: 'mn5', subject: 'Networks', title: 'TCP in one diagram', excerpt: 'Handshake, sliding window, congestion control phases and the cwnd trace visualised.', length: '3 pages', tags: ['TCP', 'Quick ref'], updated: '2026-07-30', color: '#f43f5e' },
  { id: 'mn6', subject: 'Operating Systems', title: 'Scheduling formulas cheat sheet', excerpt: 'Turnaround, waiting, response times for FCFS/SJF/RR with solved traces.', length: '4 pages', tags: ['OS', 'Numericals'], updated: '2026-07-29', color: '#f59e0b' },
]

export const mentorPracticeSets = [
  {
    id: 'mps1', subject: 'Data Structures', topic: 'Graph Algorithms', difficulty: 'Medium', count: 4, status: 'In progress', accuracy: 75,
    questions: [
      { q: 'Which algorithm finds shortest paths with negative edges (no negative cycles)?', options: ['Dijkstra', 'Bellman-Ford', 'Prim', 'KMP'], answer: 1, difficulty: 'Easy', explanation: 'Bellman-Ford relaxes all edges V−1 times, handling negative weights.' },
      { q: 'Time complexity of Dijkstra with a binary heap?', options: ['O(V²)', 'O(E log V)', 'O(V log E)', 'O(V + E)'], answer: 1, difficulty: 'Medium', explanation: 'Each extract-min is O(log V); total O((V+E) log V) ≈ O(E log V).' },
      { q: 'A back-edge in DFS of a directed graph indicates…', options: ['A tree edge', 'A cycle', 'A cross edge', 'An MST'], answer: 1, difficulty: 'Medium', explanation: 'Back-edges point to an ancestor — exactly what forms a cycle.' },
      { q: 'Kruskal\'s algorithm is best implemented with…', options: ['Adjacency matrix', 'Union-Find', 'Priority queue only', 'BFS'], answer: 1, difficulty: 'Hard', explanation: 'Union-Find gives near-constant cycle checks while processing sorted edges.' },
    ],
  },
  {
    id: 'mps2', subject: 'Physics', topic: 'Ray Optics', difficulty: 'Hard', count: 4, status: 'Needs practice', accuracy: 50,
    questions: [
      { q: 'For a concave lens, the image formed by a real object is always…', options: ['Real & inverted', 'Virtual & erect', 'Real & erect', 'At infinity'], answer: 1, difficulty: 'Easy', explanation: 'Concave lenses always form virtual, erect, diminished images.' },
      { q: 'Lens maker\'s formula uses which convention for radii?', options: ['Cartesian sign convention', 'Real-is-positive', 'No convention', 'New Cartesian'], answer: 0, difficulty: 'Medium', explanation: 'New Cartesian: radii positive in the direction of incident light.' },
      { q: 'A convex lens of power +2 D has focal length…', options: ['0.5 m', '2 m', '5 m', '0.2 m'], answer: 0, difficulty: 'Easy', explanation: 'f = 1/P = 1/2 = 0.5 m.' },
      { q: 'Critical angle exists only when light travels from…', options: ['Rarer to denser', 'Denser to rarer', 'Vacuum to air', 'Any medium'], answer: 1, difficulty: 'Medium', explanation: 'TIR needs a denser-to-rarer transition with angle > critical angle.' },
    ],
  },
]

export const mentorQuizBank = [
  { q: 'Which data structure gives O(1) average lookup?', options: ['Linked list', 'Hash table', 'Stack', 'Queue'], answer: 1, difficulty: 'Easy', explanation: 'Hash tables average O(1) per operation with good hashing.' },
  { q: 'Worst-case time of quicksort?', options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'], answer: 1, difficulty: 'Easy', explanation: 'Unlucky pivots (e.g., sorted input, first-element pivot) give O(n²).' },
  { q: 'Which traversal uses a stack implicitly?', options: ['Level order', 'DFS', 'BFS', 'None'], answer: 1, difficulty: 'Easy', explanation: 'DFS recursion uses the call stack; iterative DFS uses an explicit stack.' },
  { q: 'A segment tree supports which queries in O(log n)?', options: ['Range min & update', 'Only point queries', 'Only inserts', 'All in O(1)'], answer: 0, difficulty: 'Medium', explanation: 'Range queries and point updates both run in O(log n).' },
  { q: 'Hashing collisions are resolved by…', options: ['Chaining or open addressing', 'Sorting', 'Indexing', 'BFS'], answer: 0, difficulty: 'Easy', explanation: 'Separate chaining and open addressing (linear/quadratic probing) are the two families.' },
  { q: 'Bellman-Ford detects negative cycles by…', options: ['V−1 relaxations then one more pass', 'Counting edges', 'Using a heap', 'DFS'], answer: 0, difficulty: 'Medium', explanation: 'If any edge relaxes on the V-th pass, a negative cycle exists.' },
  { q: 'Which of these is NOT O(n log n) in the worst case?', options: ['Merge sort', 'Heap sort', 'Quicksort', 'Timsort'], answer: 2, difficulty: 'Hard', explanation: 'Quicksort degrades to O(n²) with poor pivot choices (naive implementations).' },
  { q: 'For a max-heap, extracting the max takes…', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], answer: 1, difficulty: 'Easy', explanation: 'Remove root, bubble the last element down — O(log n).' },
  { q: 'Trie lookup complexity for a word of length k?', options: ['O(k)', 'O(log k)', 'O(1)', 'O(k²)'], answer: 0, difficulty: 'Medium', explanation: 'Each character walks one level — O(k) regardless of dictionary size.' },
  { q: 'Which problem is NP-complete?', options: ['Sorting', '0/1 Knapsack (decision)', 'Shortest path', 'MST'], answer: 1, difficulty: 'Hard', explanation: '0/1 Knapsack decision is NP-complete; the listed others are polynomial.' },
]

export const mentorRevisionPlans = [
  {
    examId: 'UNI-MID-CS501-2026', examTitle: 'Mid Sem · CS501 DSA', examDate: '2026-08-19',
    overall: 65, sessions: [
      { day: 'Aug 14', topic: 'Graph algorithms — Dijkstra, MST', duration: '90 min', focus: 'Weak-adjacent: String algorithms first', status: 'Scheduled' },
      { day: 'Aug 15', topic: 'Trees & heaps — AVL, segment trees', duration: '60 min', focus: 'Practice rotation traces', status: 'Scheduled' },
      { day: 'Aug 16', topic: 'String algorithms — KMP & tries', duration: '75 min', focus: 'Top priority: 62% last time', status: 'Scheduled' },
      { day: 'Aug 17', topic: 'DP — knapsack & LCS drills', duration: '60 min', focus: 'Medium priority', status: 'Scheduled' },
      { day: 'Aug 18', topic: 'Full-pattern mock + review', duration: '120 min', focus: 'Simulate the real paper', status: 'Scheduled' },
      { day: 'Aug 19', topic: 'Light revision + formula sheet', duration: '45 min', focus: 'Exam day: stay calm', status: 'Scheduled' },
    ],
  },
  {
    examId: 'UNI-END-CSE-S5-2026', examTitle: 'End Sem · CSE Sem 5', examDate: '2025-12-10',
    overall: 80, sessions: [
      { day: 'Dec 5', topic: 'ToC — pumping lemma & reductions', duration: '120 min', focus: 'Weakest: 58%', status: 'Completed' },
      { day: 'Dec 6', topic: 'CN — TCP congestion control numericals', duration: '90 min', focus: 'Weak: 62%', status: 'Completed' },
      { day: 'Dec 7', topic: 'DBMS — query optimisation', duration: '90 min', focus: 'Medium priority', status: 'Completed' },
      { day: 'Dec 8', topic: 'ML + DSA mixed revision', duration: '120 min', focus: 'Strengths: keep sharp', status: 'Completed' },
    ],
  },
]
