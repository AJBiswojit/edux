/**
 * AI Exam Conducting Agent — mock practice examinations (DATA ONLY).
 *
 * 9 practice papers served by the prototype API adapter:
 *   · 3 University papers  (CS501 DSA · CS503 OS · CS505 ML)
 *   · 3 JEE Main papers    (2 full mocks + 1 Physics subject test)
 *   · 3 NEET UG papers     (2 full mocks + 1 Biology subject test)
 *
 * Every question carries the interaction metadata the agent analyses:
 * id · subject · chapter · topic · difficulty · options[4] · correctAnswer ·
 * marks / negativeMarks · type. `demoProfile` biases the Demo Monitoring
 * simulation per paper (strong/weak chapters + base accuracy) so each demo
 * attempt looks realistic and different — never identical question behaviour.
 *
 * Chapter names reuse the Student Intelligence vocabulary (chapterMastery
 * for university subjects, the competitive PYQ families for JEE/NEET) so the
 * agent's subject/chapter analysis can be cross-referenced with the AI
 * Academic DNA and AI Exam Analysis.
 */

const q = (subject, chapter, topic, difficulty, question, options, correctAnswer) => ({
  id: '',
  subject,
  chapter,
  topic,
  difficulty,
  question,
  options,
  correctAnswer,
  type: 'MCQ',
})

/* ================================================================== */
/* UNIVERSITY — Data Structures & Algorithms (CS501)                  */
/* ================================================================== */
const uniCs501 = {
  id: 'EA-UNI-CS501-M1',
  type: 'University',
  category: 'University',
  title: 'AI Practice Paper 1 — Data Structures & Algorithms',
  shortTitle: 'DSA · AI Practice Paper',
  subjectCode: 'CS501',
  subject: 'Data Structures & Algorithms',
  faculty: 'Dr. Meera Krishnan',
  description: 'University-style MCQ paper covering the CS501 semester modules — complexity, trees & heaps, graph algorithms, sorting/searching, dynamic programming and string algorithms.',
  durationMinutes: 40,
  marksPerQuestion: 3,
  negativeMarksPerQuestion: 0,
  difficulty: 'Mixed',
  format: '12 MCQs · 40 minutes · +3 marks · no negative marking',
  instructions: [
    'This is a practice paper, not the actual mid-semester examination.',
    'Attempt all 12 questions. There is no negative marking.',
    'Each question carries 3 marks and has exactly one correct option.',
    'Use the question navigator to jump between questions; answers are auto-saved.',
    'The AI Exam Agent analyses only your interactions — timing, answers and revisits. No camera, microphone or device monitoring is used.',
  ],
  demoProfile: { strongChapters: ['Trees & Heaps', 'Graph Algorithms'], weakChapters: ['String Algorithms'], baseAccuracy: 0.74 },
  questions: [
    q('Data Structures & Algorithms', 'Graph Algorithms', 'BFS traversal', 'Easy', 'In an undirected graph, a breadth-first search (BFS) from a source vertex visits all reachable vertices. Which data structure does BFS use to store the frontier?', ['Stack', 'Queue', 'Priority queue', 'Doubly linked list'], 1),
    q('Data Structures & Algorithms', 'Graph Algorithms', 'Shortest paths', 'Medium', 'Which algorithm finds single-source shortest paths correctly for a graph with non-negative edge weights?', ['Bellman-Ford', 'Floyd-Warshall', 'Dijkstra', "Kruskal's algorithm"], 2),
    q('Data Structures & Algorithms', 'Graph Algorithms', 'Topological sort', 'Hard', 'A directed graph has a valid topological ordering if and only if it is a…', ['DAG', 'Tree', 'Connected graph', 'Bipartite graph'], 0),
    q('Data Structures & Algorithms', 'Trees & Heaps', 'AVL trees', 'Medium', 'After inserting a node into an AVL tree and performing the required rotations, the height of the tree remains…', ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'], 1),
    q('Data Structures & Algorithms', 'Trees & Heaps', 'Heaps', 'Easy', 'In a min-heap, the smallest element is always stored at…', ['A leaf node', 'The root', 'The last level', 'Any level, depending on inserts'], 1),
    q('Data Structures & Algorithms', 'Trees & Heaps', 'BST traversal', 'Medium', 'An in-order traversal of a binary search tree visits its keys in…', ['Random order', 'Post-order', 'Ascending sorted order', 'Level order'], 2),
    q('Data Structures & Algorithms', 'Sorting & Searching', 'Complexity', 'Easy', 'The worst-case time complexity of merge sort is…', ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], 1),
    q('Data Structures & Algorithms', 'Sorting & Searching', 'Binary search', 'Medium', 'Binary search on a sorted array of n elements performs at most how many comparisons in the worst case?', ['n', 'n / 2', '⌊log₂ n⌋ + 1', 'n²'], 2),
    q('Data Structures & Algorithms', 'Dynamic Programming', '0/1 Knapsack', 'Hard', 'The 0/1 Knapsack problem with n items and capacity W is solved optimally in O(nW) time using…', ['Greedy selection', 'Divide and conquer', 'Dynamic programming', 'Randomised heuristics only'], 2),
    q('Data Structures & Algorithms', 'Dynamic Programming', 'Longest common subsequence', 'Medium', 'The length of the Longest Common Subsequence (LCS) of "ABCBDAB" and "BDCABA" is…', ['3', '4', '5', '6'], 1),
    q('Data Structures & Algorithms', 'String Algorithms', 'KMP failure function', 'Hard', 'The failure (π) function computed by the KMP pattern-matching algorithm is used to…', ['Sort the pattern characters', 'Skip safe character comparisons after a mismatch', 'Hash the text in O(1)', 'Count character frequencies'], 1),
    q('Data Structures & Algorithms', 'String Algorithms', 'Rabin-Karp', 'Easy', 'Rabin-Karp pattern matching compares substrings quickly using…', ['A rolling hash', 'A suffix array only', 'Dynamic programming', 'Greedy matching'], 0),
  ],
}

/* ================================================================== */
/* UNIVERSITY — Operating Systems (CS503)                             */
/* ================================================================== */
const uniCs503 = {
  id: 'EA-UNI-CS503-M1',
  type: 'University',
  category: 'University',
  title: 'AI Practice Paper 1 — Operating Systems',
  shortTitle: 'OS · AI Practice Paper',
  subjectCode: 'CS503',
  subject: 'Operating Systems',
  faculty: 'Dr. Meera Krishnan',
  description: 'University-style MCQ paper over the CS503 semester modules — CPU scheduling, memory management, synchronisation and file systems.',
  durationMinutes: 40,
  marksPerQuestion: 3,
  negativeMarksPerQuestion: 0,
  difficulty: 'Mixed',
  format: '12 MCQs · 40 minutes · +3 marks · no negative marking',
  instructions: [
    'This is a practice paper, not the actual mid-semester examination.',
    'Attempt all 12 questions. There is no negative marking.',
    'Each question carries 3 marks and has exactly one correct option.',
    'Use the question navigator to jump between questions; answers are auto-saved.',
    'The AI Exam Agent analyses only your interactions — timing, answers and revisits. No camera, microphone or device monitoring is used.',
  ],
  demoProfile: { strongChapters: ['CPU Scheduling'], weakChapters: ['File Systems', 'Synchronisation'], baseAccuracy: 0.72 },
  questions: [
    q('Operating Systems', 'CPU Scheduling', 'Round robin', 'Easy', 'In Round Robin scheduling with n processes and time quantum q, the maximum waiting time for a process is roughly…', ['(n − 1) × q', 'q', 'n × q', '2n × q'], 0),
    q('Operating Systems', 'CPU Scheduling', 'SJF', 'Medium', 'Which non-preemptive scheduling policy can suffer from starvation of long jobs?', ['Round Robin', 'Shortest Job First', 'FCFS', 'Multilevel queue without aging'], 1),
    q('Operating Systems', 'CPU Scheduling', 'FCFS convoy', 'Medium', 'The convoy effect — short processes queueing behind one long process — is classically associated with…', ['SJF', 'FCFS', 'Priority scheduling', 'Round Robin'], 1),
    q('Operating Systems', 'Memory Management', 'Paging', 'Easy', 'Page size is 4 KB and the logical address space is 2²⁰ bytes. The number of bits in the page-offset field is…', ['10', '12', '20', '32'], 1),
    q('Operating Systems', 'Memory Management', 'Page replacement', 'Medium', 'Which page-replacement policy gives the lowest possible page-fault count (when the future reference string is known)?', ['FIFO', 'LRU', 'Optimal', 'Second chance'], 2),
    q('Operating Systems', 'Memory Management', 'LRU faults', 'Hard', 'A process has 4 frames (initially empty) and the reference string 1,2,3,4,1,2,5,1,2,3,4,5. With LRU replacement, the total number of page faults is…', ['7', '8', '9', '10'], 2),
    q('Operating Systems', 'Synchronisation', 'Semaphores', 'Easy', 'A semaphore initialised to 1 that protects a critical section is called a…', ['Counting semaphore', 'Binary semaphore (mutex)', 'Spinlock', 'Monitor'], 1),
    q('Operating Systems', 'Synchronisation', 'Producer-consumer', 'Medium', 'The classic bounded-buffer producer-consumer solution requires at least how many semaphores?', ['1', '2', '3', '4'], 2),
    q('Operating Systems', 'Synchronisation', 'Deadlock', 'Hard', 'Which of the following is NOT one of the four necessary conditions for deadlock?', ['Mutual exclusion', 'Hold and wait', 'Preemption', 'Circular wait'], 2),
    q('Operating Systems', 'File Systems', 'Storage units', 'Easy', 'The smallest addressable unit of storage in most file systems is a…', ['Bit', 'Byte', 'Block', 'Track'], 2),
    q('Operating Systems', 'File Systems', 'Inodes', 'Medium', 'In a UNIX inode, a pointer that references a block containing pointers to data blocks is called…', ['Direct pointer', 'Single indirect pointer', 'Double indirect pointer', 'Triple indirect pointer'], 2),
    q('Operating Systems', 'File Systems', 'Journaling', 'Hard', 'Journaling file systems primarily provide…', ['Faster sequential reads', 'Crash consistency', 'Automatic compression', 'On-disk encryption'], 1),
  ],
}

/* ================================================================== */
/* UNIVERSITY — Machine Learning (CS505)                              */
/* ================================================================== */
const uniCs505 = {
  id: 'EA-UNI-CS505-M1',
  type: 'University',
  category: 'University',
  title: 'AI Practice Paper 1 — Machine Learning',
  shortTitle: 'ML · AI Practice Paper',
  subjectCode: 'CS505',
  subject: 'Machine Learning',
  faculty: 'Dr. Priya Nair',
  description: 'University-style MCQ paper over the CS505 semester modules — regression, neural networks, model evaluation and unsupervised learning.',
  durationMinutes: 40,
  marksPerQuestion: 3,
  negativeMarksPerQuestion: 0,
  difficulty: 'Mixed',
  format: '12 MCQs · 40 minutes · +3 marks · no negative marking',
  instructions: [
    'This is a practice paper, not the actual mid-semester examination.',
    'Attempt all 12 questions. There is no negative marking.',
    'Each question carries 3 marks and has exactly one correct option.',
    'Use the question navigator to jump between questions; answers are auto-saved.',
    'The AI Exam Agent analyses only your interactions — timing, answers and revisits. No camera, microphone or device monitoring is used.',
  ],
  demoProfile: { strongChapters: ['Regression', 'Neural Networks'], weakChapters: ['Unsupervised Learning'], baseAccuracy: 0.74 },
  questions: [
    q('Machine Learning', 'Regression', 'Gradient descent', 'Easy', 'In gradient descent for linear regression, the learning rate controls…', ['The number of features', 'The step size of each update', 'The model size', 'The regularisation strength'], 1),
    q('Machine Learning', 'Regression', 'Regularisation', 'Medium', 'Ridge regression adds which penalty term to the loss function?', ['L1 norm of weights', 'L2 norm of weights', 'Both L1 and L2', 'No penalty — it is plain OLS'], 1),
    q('Machine Learning', 'Regression', 'Feature scaling', 'Hard', 'Gradient descent converges very slowly when features are on very different scales. The standard fix is…', ['Dropout', 'Feature scaling / normalisation', 'Data augmentation', 'Increasing the batch size'], 1),
    q('Machine Learning', 'Neural Networks', 'Activations', 'Easy', 'Which activation function is standard for the output layer of a binary classifier?', ['ReLU', 'Sigmoid', 'Linear', 'Leaky ReLU'], 1),
    q('Machine Learning', 'Neural Networks', 'Backpropagation', 'Medium', 'Backpropagation computes weight gradients by applying…', ['Monte-Carlo sampling', 'The chain rule of calculus', 'Bayesian inference', 'Greedy local search'], 1),
    q('Machine Learning', 'Neural Networks', 'Dropout', 'Hard', 'Dropout (with keep-probability p) primarily prevents…', ['Underfitting', 'Overfitting', 'Vanishing gradients', 'Slow training'], 1),
    q('Machine Learning', 'Model Evaluation', 'Precision', 'Medium', 'Precision is defined as…', ['TP / (TP + FP)', 'TP / (TP + FN)', 'TN / (TN + FP)', 'FP / (FP + FN)'], 0),
    q('Machine Learning', 'Model Evaluation', 'ROC curve', 'Medium', 'The ROC curve plots…', ['Precision vs recall', 'True positive rate vs false positive rate', 'Accuracy vs loss', 'TPR vs precision'], 1),
    q('Machine Learning', 'Model Evaluation', 'Cross validation', 'Easy', 'In 5-fold cross-validation, the model is trained how many times?', ['5', '1', '4', '10'], 0),
    q('Machine Learning', 'Unsupervised Learning', 'K-means', 'Easy', 'K-means clustering is an example of…', ['Supervised learning', 'Unsupervised learning', 'Reinforcement learning', 'Semi-supervised learning'], 1),
    q('Machine Learning', 'Unsupervised Learning', 'Elbow method', 'Medium', 'The elbow method is used to choose…', ['The value of K in K-means', 'The learning rate', 'The number of hidden layers', 'The batch size'], 0),
    q('Machine Learning', 'Unsupervised Learning', 'PCA', 'Hard', 'Principal Component Analysis (PCA) is primarily used for…', ['Clustering', 'Dimensionality reduction', 'Classification', 'Regression'], 1),
  ],
}

/* ================================================================== */
/* JEE MAIN — Full Mock 01                                            */
/* ================================================================== */
const jeeFull01 = {
  id: 'EA-JEE-FULL-01',
  type: 'JEE',
  category: 'Competitive',
  title: 'JEE Main · Full Mock 01',
  shortTitle: 'JEE Main Mock 01',
  subject: 'Physics + Chemistry + Mathematics',
  description: 'Full-syllabus JEE Main style mock — 5 Physics, 5 Chemistry and 5 Mathematics questions with +4 / −1 marking.',
  durationMinutes: 45,
  marksPerQuestion: 4,
  negativeMarksPerQuestion: 1,
  difficulty: 'Mixed',
  format: '15 MCQs · 45 minutes · +4 marks · −1 per incorrect answer',
  instructions: [
    'This is a practice mock in JEE Main format with negative marking.',
    'Each question carries 4 marks; every incorrect answer deducts 1 mark.',
    'Unanswered questions receive 0 marks — do not guess blindly.',
    'Use the question navigator to jump between questions; answers are auto-saved.',
    'The AI Exam Agent analyses only your interactions — timing, answers and revisits. No camera, microphone or device monitoring is used.',
  ],
  demoProfile: { strongChapters: ['Kinematics', 'Quadratic Equations'], weakChapters: ['Rotational Motion', 'GOC'], baseAccuracy: 0.68 },
  questions: [
    q('Physics', 'Kinematics', 'Projectile motion', 'Easy', 'A body is projected with velocity 20 m/s at 60° to the horizontal (g = 10 m/s²). Its time of flight is…', ['2 s', '2√3 s', '4 s', '√3 s'], 1),
    q('Physics', 'Rotational Motion', 'Rolling kinetic energy', 'Medium', 'A solid sphere rolls without slipping on a horizontal surface. The fraction of its total kinetic energy that is rotational is…', ['2/7', '2/5', '1/2', '3/7'], 0),
    q('Physics', 'Electrostatics', 'Dipole field', 'Medium', 'Two charges +q and −q separated by 2a form an electric dipole. On the axial line at distance r ≫ a, the field is proportional to…', ['1/r²', '1/r³', 'r', '1/r'], 1),
    q('Physics', 'Current Electricity', 'Wheatstone bridge', 'Easy', 'A Wheatstone bridge is balanced when…', ['P/Q = R/S', 'P·Q = R·S', 'P + Q = R + S', 'P − Q = R − S'], 0),
    q('Physics', 'Modern Physics', 'De Broglie wavelength', 'Medium', 'An electron is accelerated through potential V. Its de Broglie wavelength is proportional to…', ['V', '1/V', '1/√V', '√V'], 2),
    q('Chemistry', 'Chemical Equilibrium', 'Kp & Kc relation', 'Easy', 'For N₂ + 3H₂ ⇌ 2NH₃, the relation Kp = Kc (RT)ⁿ has n equal to…', ['+2', '−2', '+1', '0'], 1),
    q('Chemistry', 'Thermodynamics', 'Spontaneity', 'Medium', 'For a spontaneous process at constant temperature and pressure, which statement is always true?', ['ΔG < 0', 'ΔH < 0', 'ΔS > 0', 'ΔU < 0'], 0),
    q('Chemistry', 'GOC', 'Peroxide effect', 'Hard', 'The peroxide (Kharasch) effect in the addition of HBr to propene proceeds through…', ['A carbocation intermediate', 'A free-radical intermediate', 'A carbene intermediate', 'A carbanion intermediate'], 1),
    q('Chemistry', 'Coordination Compounds', 'Oxidation state', 'Medium', 'The oxidation state of iron in K₄[Fe(CN)₆] is…', ['+2', '+3', '+4', '0'], 0),
    q('Chemistry', 'Mole Concept', 'Moles of oxygen atoms', 'Easy', 'The number of moles of oxygen atoms in 9 g of water (H₂O) is…', ['0.5', '1.0', '0.25', '2.0'], 0),
    q('Mathematics', 'Limits & Continuity', 'Standard limits', 'Medium', 'lim (x → 0) (sin 3x)/x equals…', ['0', '1', '3', '1/3'], 2),
    q('Mathematics', 'Quadratic Equations', 'Sum of roots', 'Easy', 'If α and β are the roots of x² − 5x + 6 = 0, then α + β equals…', ['5', '6', '−5', '1'], 0),
    q('Mathematics', 'Coordinate Geometry', 'Distance formula', 'Easy', 'The distance of the point (3, 4) from the origin is…', ['5', '7', '25', '1'], 0),
    q('Mathematics', 'Vectors & 3D', 'Scalar triple product', 'Hard', 'If the scalar triple product [a b c] of three vectors is zero, the vectors are…', ['Coplanar', 'Mutually orthogonal', 'Unit vectors', 'Parallel to each other'], 0),
    q('Mathematics', 'Integration', 'Definite integral', 'Medium', '∫₀¹ x² dx equals…', ['1/3', '1/2', '1', '2/3'], 0),
  ],
}

/* ================================================================== */
/* JEE MAIN — Physics Subject Test                                    */
/* ================================================================== */
const jeePhy01 = {
  id: 'EA-JEE-PHY-01',
  type: 'JEE',
  category: 'Competitive',
  title: 'JEE Main · Physics Subject Test',
  shortTitle: 'JEE Physics Test',
  subject: 'Physics',
  description: 'JEE Main style Physics-only subject test — mechanics, electricity, optics, thermodynamics and modern physics.',
  durationMinutes: 30,
  marksPerQuestion: 4,
  negativeMarksPerQuestion: 1,
  difficulty: 'Mixed',
  format: '10 MCQs · 30 minutes · +4 marks · −1 per incorrect answer',
  instructions: [
    'This is a practice mock in JEE Main format with negative marking.',
    'Each question carries 4 marks; every incorrect answer deducts 1 mark.',
    'Unanswered questions receive 0 marks — do not guess blindly.',
    'Use the question navigator to jump between questions; answers are auto-saved.',
    'The AI Exam Agent analyses only your interactions — timing, answers and revisits. No camera, microphone or device monitoring is used.',
  ],
  demoProfile: { strongChapters: ['Kinematics', 'Current Electricity'], weakChapters: ['Optics', 'Thermodynamics'], baseAccuracy: 0.7 },
  questions: [
    q('Physics', 'Kinematics', 'Graphs of motion', 'Easy', 'The area under a velocity–time graph between two instants gives the…', ['Acceleration', 'Displacement', 'Force', 'Work done'], 1),
    q('Physics', 'Laws of Motion', 'Newton second law', 'Medium', 'A 2 kg block on a frictionless table is pulled by a 4 N horizontal force. Its acceleration is…', ['0.5 m/s²', '1 m/s²', '2 m/s²', '8 m/s²'], 2),
    q('Physics', 'Work, Energy & Power', 'Conservative forces', 'Easy', 'The work done by a conservative force over a closed path is…', ['Maximum', 'Zero', 'Negative', 'Equal to the kinetic energy'], 1),
    q('Physics', 'Rotational Motion', 'Moment of inertia', 'Medium', 'The moment of inertia of a thin uniform rod (mass M, length L) about an axis through its centre, perpendicular to its length, is…', ['ML²/12', 'ML²/3', 'ML²/2', 'ML²'], 0),
    q('Physics', 'Gravitation', 'Escape velocity', 'Medium', 'The escape velocity from the surface of the Earth is approximately…', ['7.9 km/s', '11.2 km/s', '3.1 km/s', '9.8 km/s'], 1),
    q('Physics', 'Electrostatics', 'Electric flux units', 'Easy', 'The SI unit of electric flux is…', ['V·m', 'C/m²', 'N/C', 'V/m'], 0),
    q('Physics', 'Current Electricity', 'Resistors in parallel', 'Medium', 'A wire of resistance R is cut into 4 equal parts and the parts are joined in parallel. The equivalent resistance is…', ['R/4', 'R/16', '4R', 'R'], 1),
    q('Physics', 'Optics', 'Lens formula', 'Medium', 'A convex lens of focal length 20 cm forms a real image at 30 cm. The object distance is…', ['60 cm', '12 cm', '30 cm', '40 cm'], 0),
    q('Physics', 'Thermodynamics', 'Adiabatic exponent', 'Hard', 'For an ideal monatomic gas, the ratio of specific heats γ = Cp/Cv equals…', ['5/3', '7/5', '4/3', '1.4'], 0),
    q('Physics', 'Modern Physics', 'Photoelectric effect', 'Medium', 'The photoelectric effect is best explained by treating light as…', ['A continuous wave', 'A stream of photons of energy hν', 'A sound wave', 'A plasma'], 1),
  ],
}

/* ================================================================== */
/* JEE MAIN — Full Mock 02                                            */
/* ================================================================== */
const jeeFull02 = {
  id: 'EA-JEE-FULL-02',
  type: 'JEE',
  category: 'Competitive',
  title: 'JEE Main · Full Mock 02',
  shortTitle: 'JEE Main Mock 02',
  subject: 'Physics + Chemistry + Mathematics',
  description: 'Second full-syllabus JEE Main style mock — different chapter mix with +4 / −1 marking.',
  durationMinutes: 45,
  marksPerQuestion: 4,
  negativeMarksPerQuestion: 1,
  difficulty: 'Mixed',
  format: '15 MCQs · 45 minutes · +4 marks · −1 per incorrect answer',
  instructions: [
    'This is a practice mock in JEE Main format with negative marking.',
    'Each question carries 4 marks; every incorrect answer deducts 1 mark.',
    'Unanswered questions receive 0 marks — do not guess blindly.',
    'Use the question navigator to jump between questions; answers are auto-saved.',
    'The AI Exam Agent analyses only your interactions — timing, answers and revisits. No camera, microphone or device monitoring is used.',
  ],
  demoProfile: { strongChapters: ['Integration', 'Hydrocarbons'], weakChapters: ['Modern Physics', 'Conic Sections'], baseAccuracy: 0.68 },
  questions: [
    q('Physics', 'Work, Energy & Power', 'Work against gravity', 'Medium', 'A 5 kg mass is lifted vertically through 2 m. The work done against gravity (g = 10 m/s²) is…', ['50 J', '100 J', '10 J', '200 J'], 1),
    q('Physics', 'Optics', 'Concave mirror', 'Medium', 'A concave mirror of focal length 15 cm forms a virtual, erect image when the object is placed…', ['Beyond C', 'Between F and C', 'Between the pole and the focus', 'At infinity'], 2),
    q('Physics', 'Waves', 'Beats', 'Easy', 'Two tuning forks produce beats at 4 Hz. If one fork has frequency 256 Hz, the other could be…', ['252 Hz', '256 Hz', '128 Hz', '512 Hz'], 0),
    q('Physics', 'Thermodynamics', 'First law', 'Easy', 'The first law of thermodynamics is a statement of conservation of…', ['Mass', 'Energy', 'Momentum', 'Charge'], 1),
    q('Physics', 'Modern Physics', 'Bohr orbits', 'Hard', 'The radius of the nth Bohr orbit in a hydrogen atom is proportional to…', ['n', 'n²', '1/n', '1/n²'], 1),
    q('Chemistry', 'Hydrocarbons', 'IUPAC naming', 'Easy', 'The IUPAC name of CH₃–CH=CH₂ is…', ['Propene', 'Propane', 'Propyne', 'Propanol'], 0),
    q('Chemistry', 'p-Block Elements', 'Gas evolution', 'Medium', 'Dilute HCl reacts with ZnS to liberate which gas?', ['H₂S', 'SO₂', 'Cl₂', 'H₂'], 0),
    q('Chemistry', 'Chemical Kinetics', 'Half-life', 'Medium', 'For a first-order reaction, the half-life is given by…', ['0.693/k', '1/k', 'k/2', '2/k'], 0),
    q('Chemistry', 'Solutions', 'Molality', 'Easy', 'Molality is defined as the number of moles of solute per…', ['Litre of solution', 'Kilogram of solvent', 'Kilogram of solution', 'Litre of solvent'], 1),
    q('Chemistry', 'Alcohols & Ethers', 'Oxidation of alcohols', 'Hard', 'Which reagent oxidises a primary alcohol to a carboxylic acid?', ['PCC', 'Acidified K₂Cr₂O₇ (with heat)', 'NaBH₄', 'LiAlH₄'], 1),
    q('Mathematics', 'Differentiation', 'Power rule', 'Easy', 'd/dx (x³) equals…', ['3x²', 'x²', '3x', 'x³/3'], 0),
    q('Mathematics', 'Matrices', 'Scalar multiplication', 'Medium', 'If A is a 3×3 matrix with |A| = 2, then |2A| equals…', ['4', '8', '16', '2'], 1),
    q('Mathematics', 'Probability', 'Coin tosses', 'Easy', 'The probability of getting exactly one head in two fair coin tosses is…', ['1/2', '1/4', '3/4', '1'], 0),
    q('Mathematics', 'Conic Sections', 'Eccentricity', 'Medium', 'The eccentricity of a parabola is…', ['1', '0', 'Less than 1', 'Greater than 1'], 0),
    q('Mathematics', 'Differential Equations', 'Order of ODE', 'Hard', 'The order of the differential equation (d²y/dx²)³ + y = 0 is…', ['2', '3', '1', '6'], 0),
  ],
}

/* ================================================================== */
/* NEET UG — Full Mock 01                                             */
/* ================================================================== */
const neetFull01 = {
  id: 'EA-NEET-FULL-01',
  type: 'NEET',
  category: 'Competitive',
  title: 'NEET UG · Full Mock 01',
  shortTitle: 'NEET UG Mock 01',
  subject: 'Physics + Chemistry + Biology',
  description: 'Full-syllabus NEET UG style mock — 5 Physics, 5 Chemistry and 5 Biology questions with +4 / −1 marking.',
  durationMinutes: 30,
  marksPerQuestion: 4,
  negativeMarksPerQuestion: 1,
  difficulty: 'Mixed',
  format: '15 MCQs · 30 minutes · +4 marks · −1 per incorrect answer',
  instructions: [
    'This is a practice mock in NEET UG format with negative marking.',
    'Each question carries 4 marks; every incorrect answer deducts 1 mark.',
    'Unanswered questions receive 0 marks — do not guess blindly.',
    'Use the question navigator to jump between questions; answers are auto-saved.',
    'The AI Exam Agent analyses only your interactions — timing, answers and revisits. No camera, microphone or device monitoring is used.',
  ],
  demoProfile: { strongChapters: ['Human Physiology'], weakChapters: ['Modern Physics', 'Physical Chemistry'], baseAccuracy: 0.72 },
  questions: [
    q('Physics', 'Mechanics', 'Unit conversion', 'Easy', 'A car moving at 54 km/h has a speed of…', ['15 m/s', '20 m/s', '25 m/s', '10 m/s'], 0),
    q('Physics', 'Current Electricity', 'Parallel resistors', 'Medium', 'Three 6 Ω resistors connected in parallel have an equivalent resistance of…', ['18 Ω', '6 Ω', '2 Ω', '3 Ω'], 2),
    q('Physics', 'Optics', 'Plane mirror', 'Medium', 'The image formed by a plane mirror is always…', ['Virtual and erect', 'Real and inverted', 'Virtual and inverted', 'Real and erect'], 0),
    q('Physics', 'Thermodynamics', 'Isothermal process', 'Medium', 'In an isothermal process for an ideal gas, the change in internal energy is…', ['Zero', 'Maximum', 'Negative', 'Equal to the work done'], 0),
    q('Physics', 'Modern Physics', 'Photon energy', 'Hard', 'The energy of a photon of frequency 5 × 10¹⁴ Hz (h = 6.6 × 10⁻³⁴ J·s) is about…', ['3.3 × 10⁻¹⁹ J', '6.6 × 10⁻¹⁹ J', '1.1 × 10⁻¹⁹ J', '9.9 × 10⁻¹⁹ J'], 0),
    q('Chemistry', 'Organic Chemistry', 'Iodoform test', 'Easy', 'Which of the following gives a positive iodoform test?', ['Acetone', 'Methanol', 'Formaldehyde', 'Acetic acid'], 0),
    q('Chemistry', 'Inorganic Chemistry', 'Chlorophyll metal', 'Medium', 'The metal present at the centre of the chlorophyll molecule is…', ['Magnesium', 'Iron', 'Calcium', 'Zinc'], 0),
    q('Chemistry', 'Physical Chemistry', 'pH scale', 'Easy', 'The pH of a 10⁻³ M HCl solution is…', ['3', '11', '7', '10'], 0),
    q('Chemistry', 'Organic Chemistry', 'Reducing sugars', 'Medium', 'Which of the following is a reducing sugar?', ['Sucrose', 'Glucose', 'Starch', 'Cellulose'], 1),
    q('Chemistry', 'Physical Chemistry', 'Spontaneity criteria', 'Hard', 'For a reaction with ΔH positive and ΔS positive, spontaneity is favoured at…', ['High temperature', 'Low temperature', 'All temperatures', 'No temperature'], 0),
    q('Biology', 'Human Physiology', 'Blood cells', 'Easy', 'Which blood cells are primarily responsible for immune defence?', ['Red blood cells', 'White blood cells', 'Platelets', 'Plasma cells only'], 1),
    q('Biology', 'Genetics & Evolution', 'Monohybrid cross', 'Medium', 'In Mendel\u2019s monohybrid cross, the phenotypic ratio in the F₂ generation is…', ['3 : 1', '9 : 3 : 3 : 1', '1 : 2 : 1', '1 : 1'], 0),
    q('Biology', 'Cell Biology', 'Mitochondria', 'Medium', 'Which organelle is known as the powerhouse of the cell?', ['Ribosome', 'Mitochondrion', 'Lysosome', 'Golgi apparatus'], 1),
    q('Biology', 'Plant Physiology', 'Transpiration', 'Easy', 'The loss of water as vapour from plants, mainly through stomata, is called…', ['Transpiration', 'Guttation', 'Respiration', 'Osmosis'], 0),
    q('Biology', 'Ecology', 'Energy pyramid', 'Medium', 'The pyramid of energy in any ecosystem is always…', ['Upright', 'Inverted', 'Spindle shaped', 'Linear'], 0),
  ],
}

/* ================================================================== */
/* NEET UG — Biology Subject Test                                     */
/* ================================================================== */
const neetBio01 = {
  id: 'EA-NEET-BIO-01',
  type: 'NEET',
  category: 'Competitive',
  title: 'NEET UG · Biology Subject Test',
  shortTitle: 'NEET Biology Test',
  subject: 'Biology',
  description: 'NEET UG style Biology-only subject test — human physiology, genetics, cell biology, biomolecules and ecology.',
  durationMinutes: 25,
  marksPerQuestion: 4,
  negativeMarksPerQuestion: 1,
  difficulty: 'Mixed',
  format: '10 MCQs · 25 minutes · +4 marks · −1 per incorrect answer',
  instructions: [
    'This is a practice mock in NEET UG format with negative marking.',
    'Each question carries 4 marks; every incorrect answer deducts 1 mark.',
    'Unanswered questions receive 0 marks — do not guess blindly.',
    'Use the question navigator to jump between questions; answers are auto-saved.',
    'The AI Exam Agent analyses only your interactions — timing, answers and revisits. No camera, microphone or device monitoring is used.',
  ],
  demoProfile: { strongChapters: ['Cell Biology', 'Genetics & Evolution'], weakChapters: ['Ecology'], baseAccuracy: 0.76 },
  questions: [
    q('Biology', 'Human Physiology', 'Heart chambers', 'Easy', 'The number of chambers in the human heart is…', ['2', '3', '4', '5'], 2),
    q('Biology', 'Human Physiology', 'Calcium regulation', 'Medium', 'Which hormone regulates the level of calcium in the blood?', ['Insulin', 'Parathyroid hormone', 'Thyroxine', 'Adrenaline'], 1),
    q('Biology', 'Human Physiology', 'Kidney unit', 'Medium', 'The structural and functional unit of the kidney is the…', ['Neuron', 'Nephron', 'Alveolus', 'Villus'], 1),
    q('Biology', 'Genetics & Evolution', 'Chromosome number', 'Medium', 'The number of chromosomes in a normal human somatic cell is…', ['23', '44', '46', '48'], 2),
    q('Biology', 'Genetics & Evolution', 'X-linked inheritance', 'Hard', 'A colour-blind man marries a woman who is a carrier for colour blindness. The probability that their daughter is colour-blind is…', ['25%', '50%', '75%', '0%'], 1),
    q('Biology', 'Cell Biology', 'Ribosomes', 'Easy', 'Ribosomes are the site of…', ['Protein synthesis', 'ATP production', 'Photosynthesis', 'Lipid synthesis'], 0),
    q('Biology', 'Cell Biology', 'Lysosomes', 'Medium', 'Which organelle contains hydrolytic digestive enzymes?', ['Peroxisome', 'Lysosome', 'Nucleolus', 'Centrosome'], 1),
    q('Biology', 'Biomolecules', 'Protein monomers', 'Easy', 'The monomer of proteins is the…', ['Nucleotide', 'Amino acid', 'Glucose', 'Fatty acid'], 1),
    q('Biology', 'Ecology', 'Ozone layer', 'Medium', 'The ozone layer is mainly present in which atmospheric layer?', ['Troposphere', 'Stratosphere', 'Mesosphere', 'Ionosphere'], 1),
    q('Biology', 'Ecology', 'Energy flow', 'Hard', 'In a food chain, the trophic level that always holds the maximum energy is…', ['Producers', 'Primary consumers', 'Secondary consumers', 'Decomposers'], 0),
  ],
}

/* ================================================================== */
/* NEET UG — Full Mock 02                                             */
/* ================================================================== */
const neetFull02 = {
  id: 'EA-NEET-FULL-02',
  type: 'NEET',
  category: 'Competitive',
  title: 'NEET UG · Full Mock 02',
  shortTitle: 'NEET UG Mock 02',
  subject: 'Physics + Chemistry + Biology',
  description: 'Second full-syllabus NEET UG style mock — different chapter mix with +4 / −1 marking.',
  durationMinutes: 30,
  marksPerQuestion: 4,
  negativeMarksPerQuestion: 1,
  difficulty: 'Mixed',
  format: '15 MCQs · 30 minutes · +4 marks · −1 per incorrect answer',
  instructions: [
    'This is a practice mock in NEET UG format with negative marking.',
    'Each question carries 4 marks; every incorrect answer deducts 1 mark.',
    'Unanswered questions receive 0 marks — do not guess blindly.',
    'Use the question navigator to jump between questions; answers are auto-saved.',
    'The AI Exam Agent analyses only your interactions — timing, answers and revisits. No camera, microphone or device monitoring is used.',
  ],
  demoProfile: { strongChapters: ['Plant Physiology'], weakChapters: ['Organic Chemistry', 'Genetics & Evolution'], baseAccuracy: 0.72 },
  questions: [
    q('Physics', 'Mechanics', 'Free fall', 'Medium', 'A ball dropped from rest takes 2 s to reach the ground (g = 10 m/s²). The height of the drop is…', ['10 m', '20 m', '40 m', '5 m'], 1),
    q('Physics', 'Electrostatics', 'SI units', 'Easy', 'The SI unit of electric charge is the…', ['Coulomb', 'Volt', 'Ampere', 'Farad'], 0),
    q('Physics', 'Current Electricity', 'Ohm\u2019s law', 'Medium', 'Ohm\u2019s law V = IR is obeyed by…', ['All materials at all temperatures', 'Ohmic conductors at constant temperature', 'Semiconductors only', 'Electrolytes only'], 1),
    q('Physics', 'Waves', 'Speed of sound', 'Medium', 'The speed of sound in air is maximum in…', ['Winter', 'Summer', 'The rainy season', 'The same in all seasons'], 1),
    q('Physics', 'Modern Physics', 'Zero rest mass', 'Easy', 'Which of the following particles has zero rest mass?', ['Electron', 'Photon', 'Proton', 'Neutron'], 1),
    q('Chemistry', 'Organic Chemistry', 'Functional groups', 'Medium', 'Which functional group is present in carboxylic acids?', ['−COOH', '−OH', '−CHO', '−NH₂'], 0),
    q('Chemistry', 'Inorganic Chemistry', 'Bleaching powder', 'Medium', 'The gas used in the manufacture of bleaching powder is…', ['Cl₂', 'O₂', 'N₂', 'CO₂'], 0),
    q('Chemistry', 'Physical Chemistry', 'Avogadro number', 'Easy', 'Avogadro\u2019s number is approximately…', ['6.022 × 10²³', '3.14 × 10²³', '9.1 × 10³¹', '1.6 × 10⁻¹⁹'], 0),
    q('Chemistry', 'Organic Chemistry', 'Nitration', 'Hard', 'Benzene reacts with conc. HNO₃ in the presence of conc. H₂SO₄ to give nitrobenzene. This reaction is an example of…', ['Nitration', 'Halogenation', 'Sulphonation', 'Alkylation'], 0),
    q('Chemistry', 'Physical Chemistry', 'Molar volume', 'Medium', 'At STP, one mole of any ideal gas occupies…', ['22.4 L', '11.2 L', '44.8 L', '2.24 L'], 0),
    q('Biology', 'Human Physiology', 'Digestion', 'Easy', 'Which enzyme in saliva digests starch?', ['Pepsin', 'Salivary amylase', 'Trypsin', 'Lipase'], 1),
    q('Biology', 'Genetics & Evolution', 'DNA discovery', 'Medium', 'The double-helix structure of DNA was proposed by…', ['Watson and Crick', 'Mendel', 'Darwin', 'Pasteur'], 0),
    q('Biology', 'Cell Biology', 'Mitochondria', 'Easy', 'ATP synthesis in eukaryotic cells mainly occurs in the…', ['Mitochondrion', 'Nucleus', 'Ribosome', 'Vacuole'], 0),
    q('Biology', 'Plant Physiology', 'Photosynthesis site', 'Medium', 'Photosynthesis takes place in which organelle of the plant cell?', ['Chloroplast', 'Mitochondrion', 'Nucleus', 'Lysosome'], 0),
    q('Biology', 'Ecology', 'Largest ecosystem', 'Easy', 'The largest ecosystem on Earth is the…', ['Ocean', 'Desert', 'Forest', 'Tundra'], 0),
  ],
}

/* ------------------------------------------------------------------ */
/* Build + export                                                     */
/* ------------------------------------------------------------------ */

/** Stamp per-question marks/negative marks from the exam config and
    compute total marks — one source of truth, never duplicated. */
function stamp(exam) {
  const questions = exam.questions.map((qq, i) => ({
    ...qq,
    id: `Q${String(i + 1).padStart(2, '0')}`,
    marks: exam.marksPerQuestion,
    negativeMarks: exam.negativeMarksPerQuestion,
  }))
  return {
    ...exam,
    questions,
    totalMarks: questions.reduce((s, qq) => s + qq.marks, 0),
  }
}

const raw = [uniCs501, uniCs503, uniCs505, jeeFull01, jeePhy01, jeeFull02, neetFull01, neetBio01, neetFull02]

export const EXAM_AGENT_EXAMS = raw.map(stamp)

export const EXAM_AGENT_TYPES = ['University', 'JEE', 'NEET']

export const EXAM_AGENT_GROUP_LABELS = {
  University: { label: 'University Practice Papers', sub: 'Course-level MCQs · no negative marking' },
  JEE: { label: 'JEE Main Mocks', sub: 'Physics + Chemistry + Mathematics · +4 / −1' },
  NEET: { label: 'NEET UG Mocks', sub: 'Physics + Chemistry + Biology · +4 / −1' },
}

export default EXAM_AGENT_EXAMS
