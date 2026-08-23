/**
 * MediXO EduX — Mock AI Teaching Assistant reply generator.
 *
 * Frontend-only prototype: there is no backend, so the assistant's replies
 * are simulated here with contextual, deterministic content derived from
 * the Faculty Intelligence Foundation (live health, weak chapters, weak
 * topics, evaluation backlog). The route handler in ./assistant.js calls
 * this — previously the handler referenced an undefined symbol, which is
 * why every prompt surfaced "Assistant offline".
 *
 * Intent detection is keyword based; each intent returns a realistic,
 * markdown-formatted teaching response. Conversations are persisted into
 * the shared aiTeachingAssistantThreads dataset by the route.
 */

import { computeFacultyIntelligence } from '@/intelligence/faculty'

const TOPIC_MAP = [
  { re: /(network flow|max-flow|min-cut|ford-fulkerson|edmonds)/i, topic: 'Network flows', subject: 'CS501' },
  { re: /(dijkstra|shortest path|mst|kruskal|prim|graph)/i, topic: 'Graph Algorithms', subject: 'CS501' },
  { re: /(knapsack|dynamic programming|dp on trees|lcs|edit distance)/i, topic: 'Dynamic Programming', subject: 'CS501' },
  { re: /(avl|tree|heap|bst)/i, topic: 'Trees & Heaps', subject: 'CS501' },
  { re: /(sorting|quick sort|merge sort|complexity|big-o|master theorem)/i, topic: 'Sorting & Complexity', subject: 'CS501' },
  { re: /(schedul|fcfs|sjf|round robin|priority)/i, topic: 'CPU Scheduling', subject: 'CS503' },
  { re: /(memory|paging|segmentation|page replacement)/i, topic: 'Memory Management', subject: 'CS503' },
  { re: /(deadlock|synchroni[sz]|semaphore|mutex|monitor)/i, topic: 'Synchronisation', subject: 'CS503' },
  { re: /(process|thread|file system)/i, topic: 'Processes & File Systems', subject: 'CS503' },
  { re: /(regression|gradient|regularisation|overfit)/i, topic: 'Regression & Regularisation', subject: 'CS505' },
  { re: /(neural|backprop|vanishing|dropout)/i, topic: 'Neural Networks', subject: 'CS505' },
  { re: /(automata|pda|turing|decidab)/i, topic: 'Automata & Computability', subject: 'CS506' },
]

const pick = (arr, seed = 0) => arr[seed % arr.length]

function detectTopic(text) {
  for (const m of TOPIC_MAP) {
    if (m.re.test(text)) return m
  }
  return null
}

function detectCount(text, fallback = 10) {
  const m = String(text).match(/(\d+)\s*(?:questions?|mcqs?|items?|problems?|q)/i)
  return m ? Math.min(parseInt(m[1], 10), 25) : fallback
}

export function generateAssistantReply(text = '') {
  const d = computeFacultyIntelligence()
  const t = String(text)
  const topic = detectTopic(t)
  const topicName = topic?.topic ?? 'the current chapter'
  const subject = topic?.subject ?? 'CS501'
  const count = detectCount(t)
  const weak = d.teachingInsights?.weakChapters?.[0]?.chapter ?? 'Network flows'
  const pending = d.evaluationProgress?.pending ?? 0
  const health = d.teachingHealth?.score ?? 0
  const engagement = d.studentEngagement?.score ?? 0
  const attention = d.attentionStudents?.total ?? 0
  const avgAtt = d.attendanceIntelligence?.overall ?? '—'
  const weakestUnit = d.assessment?.coverage?.weakest

  const lower = t.toLowerCase()

  /* ---------- intents ---------- */

  if (/(generate|create|draft).*(20|mcq|objective|quiz)/i.test(t) || (/(mcq|quiz|objective)/i.test(lower) && /(generate|create|draft|make)/i.test(lower)) || lower.includes('generate 20 mcq')) {
    return `Here's a draft **${count} MCQ quiz on ${topicName}** (${subject}, medium difficulty) with an answer key.

**Q1 (MCQ)** — Which of the following best characterises ${topicName} in this course's context? *(a) the core abstraction* ✓ (b) an edge case (c) a minor detail (d) unrelated to exams

**Q2 (Numerical)** — Solve the standard numerical on ${topicName} from last week's sheet. → **answer follows the worked example**

**Q3 (True/False)** — A common misconception about ${topicName} is that bigger inputs always mean harder problems. → **False** (structure matters more than size)

**Q4 (MCQ)** — Which exam pattern most frequently tests ${topicName}? → **PYQ × high frequency** (see your PYQ intelligence)

… (Q5–Q${count} available — say "show all" to expand)

**Coverage:** ${topicName} + connected sub-topics · **Estimated time:** 15 min.
**Note:** your question bank shows ${d.assessment?.questionStats?.difficultyDistribution?.find((x) => x.level === 'Hard')?.pct ?? '—'}% hard questions — I balanced this quiz with 2 hard items to nudge the top band.
Want me to push this into the Quiz Builder as a draft?`
  }

  if (/(subjective|short answer|long answer|theory question)/i.test(lower)) {
    return `Here are **6 subjective questions on ${topicName}** (${subject}) weighted toward Apply/Analyze levels:

1. **Explain (5 marks)** — State the core idea of ${topicName} with a labelled diagram.
2. **Trace (8 marks)** — Run the standard method on the given input and show all intermediate states.
3. **Compare (6 marks)** — Two approaches for ${topicName}: when does each win?
4. **Design (10 marks)** — Design a variant of ${topicName} for the stated constraint and justify your choices.
5. **Evaluate (4 marks)** — Discuss the top misconception students hold about ${topicName} (your class shows a ${'gap'}% gap here).
6. **Exam-style (8 marks)** — Solve the 2023 PYQ on this topic.

**Bloom mix:** Understand 1 · Apply 2 · Analyze 2 · Create 1 — matches the recommended 30/50/20 spread.`
  }

  if (/(assignment)/i.test(lower)) {
    return `Here's a **20-mark assignment on ${topicName}** (${subject}):

- **Problem 1 (3 marks)** — Direct application on ${topicName}.
- **Problem 2 (4 marks)** — The "trap variant" — most of last year's class lost marks here.
- **Problem 3 (5 marks)** — Compare two strategies with complexity analysis.
- **Problem 4 (5 marks)** — Implementation with 3 test cases.
- **Problem 5 (3 marks)** — Exam-style PYQ question.

**Rubric:** correctness 30% · complexity 20% · clarity 20% · edge cases 15% · documentation 15%.
💡 Your current submission rate is **${d.assignmentCompletion?.overallSubmission ?? '—'}%** — set the deadline to give a 24h grace window.`
  }

  if (/(lesson|lecture).*(plan|prepare|tomorrow)/i.test(lower) || /(prepare|plan).*(lecture|lesson)/i.test(lower)) {
    const weakNote = weak.toLowerCase().includes(topicName.toLowerCase().split(' ')[0]) ? ` (gap ${d.teachingInsights?.weakChapters?.[0]?.gap ?? '—'}% — keep examples concrete and re-test at the end)` : ''
    return `Here's a **50-minute lesson plan for ${topicName}** (${subject})${weakNote}:

1. **Hook (6 min)** — Open with a relatable problem; 2 recall questions from last class.
2. **Objectives (2 min)** — 4 measurable objectives for the session.
3. **Core explanation (14 min)** — Definitions + the worked method, medium difficulty.
4. **Worked examples (9 min)** — Example A (textbook trace) and Example B (misconception embedded).
5. **Activities (6 min)** — Pair activity with a half-solved scaffold.
6. **Class discussion (5 min)** — "Where does the naive approach fail?"
7. **Practice (6 min)** — 2 core + 1 challenge problem.
8. **Homework (2 min)** — 3 problems incl. one exam-style from the PYQ bank.
9. **Exit ticket (3 min)** — 3 quick questions.

I can save this to your Lesson Planner or adjust the duration — just say the word.`
  }

  if (/(explain|what is|what are|how does|simply|analogy|concept)/i.test(lower)) {
    return `Let me explain **${topicName}** simply 👩‍🏫

**The idea:** ${topicName} is about ${topic?.subject === 'CS503' ? 'managing limited resources so concurrent work stays correct and efficient' : 'breaking a big problem into steps you can verify one at a time'}.

**Everyday analogy:** think of it like a ${pick(['kitchen with one stove and many chefs', 'highway with toll booths', 'library with a single copy of a popular book'], t.length)} — the rules tell you who goes next and why it stays fair.

**The 3 things to remember:**
1. The **core rule** (one sentence version).
2. The **worked example** — trace it once yourself with paper.
3. The **common mistake** — your class flagged ${weak} as the #1 gap, so check for it specifically.

**Next step:** try the ${count}-question practice set on ${topicName}, then compare with the answer key. Want me to generate it?`
  }

  if (/(revision|revise|revise plan|before (the )?midsem)/i.test(lower)) {
    const weakestUnitLine = weakestUnit ? `\n- **Assessment gap:** ${weakestUnit.name} (${weakestUnit.course}) sits at ${weakestUnit.coveragePct}% question coverage — add a targeted drill.` : ''
    return `Here's a **7-day revision plan before the midsem**:

- **Day 1** — ${weak} (highest-priority gap) — revision notes + 10 MCQs.
- **Day 2** — ${d.teachingInsights?.weakChapters?.[1]?.chapter ?? 'Second weak chapter'} — worked examples + PYQ set.
- **Day 3** — ${d.teachingInsights?.weakChapters?.[2]?.chapter ?? 'Third weak chapter'} — timed practice.
- **Day 4** — Mixed mock (30 questions, 40 min) — track accuracy per topic.
- **Day 5** — Retest the weakest topic from the mock + revision sheet.
- **Day 6** — Full-length PYQ paper under exam conditions.
- **Day 7** — Formula sheet + quick-revision facts + rest.${weakestUnitLine}

**Priority from your data:** ${d.revisionPriority?.items?.[0]?.topic ?? 'top revision item'} (${d.revisionPriority?.items?.[0]?.priority ?? 'High'}) — start there.`
  }

  if (/(viva)/i.test(lower)) {
    return `Here are **12 viva questions for the ${topic?.subject === 'CS503' ? 'OS' : 'DSA'} lab exam** (with expected one-liners):

1. Why do we ${topic ? topic.topic : 'implement this'}? — *Purpose + real use.*
2. What is the time complexity of your implementation? — *State it and justify.*
3. What happens on the boundary input? — *Edge case behaviour.*
4. How would you optimise it? — *One concrete improvement.*
5. What data structure did you choose and why?
6. How do you test correctness? — *Test cases + reasoning.*
7. What is the difference between X and Y in this lab? (X, Y = the two main variants)
8. Show the trace for one small input.
9. What is the common bug in this experiment and how did you avoid it?
10. How does this connect to ${d.teachingInsights?.weakChapters?.[0]?.chapter ?? 'the current unit'}?
11. What would you change if the input were 100× larger?
12. One-sentence summary of today's experiment.

**Tip:** your lab attendance is **${avgAtt}%** — remind Sec C about the record template before the exam.`
  }

  if (/(practical|lab exercise|lab session)/i.test(lower)) {
    return `Here's a **practical exercise on ${topicName}** (${subject}, 50 min):

**Aim:** Implement and verify the core routine of ${topicName}.
**Setup:** Workstation + IDE + lab record book.
**Steps:**
1. Write the basic implementation with input validation.
2. Add the class variant discussed in the lecture.
3. Run the 3 provided test cases + 1 of your own.
4. Record observations in the table template.
5. Conclude with what you verified and one insight.

**Test cases:** empty input · single element · boundary case · large input (performance check).
**Viva hook:** be ready to trace your code on a small input.

📌 Lab attendance is at **${avgAtt}%** — a quick reminder via announcements usually lifts it 2–3 points.`
  }

  if (/(summarize|summarise|summary|unit \d)/i.test(lower)) {
    return `Here's a **one-page summary of ${topicName}** (${subject}):

**Big idea** — ${topicName} in one sentence.
**Key definitions** — 4 terms with one-line glosses.
**The method** — 4 numbered steps with the running example.
**Formula/fact box** — the 2 formulas examiners love.
**PYQ frequency** — this topic appears **×${d.pyqIntelligence?.university?.topicFrequency?.[0]?.frequency ?? 'high'}** in your corpus.
**Top 3 exam questions** — the highest-yield ones with short answers.
**Watch out** — the #1 misconception (your class gap on ${weak}).

Want this as a printable revision sheet? I can draft the PDF-ready version.`
  }

  if (/(bloom)/i.test(lower)) {
    return `Here are **Bloom's Taxonomy questions on ${topicName}** — one per level:

- **Remember:** Define the key term in ${topicName} in one sentence.
- **Understand:** Explain the method in your own words with a diagram.
- **Apply:** Solve the standard problem on ${topicName} (classic case).
- **Analyze:** Compare two approaches — where does each fail?
- **Evaluate:** Critique the naive solution; justify when it is acceptable.
- **Create:** Design a variant of ${topicName} for the stated constraint and defend it.

**Exam mapping:** your PYQ data shows Apply+Analyze carry ~50% of the marks — this set mirrors that split.`
  }

  if (/(warm-?up|start class|begin class)/i.test(lower)) {
    return `Here's a **5-minute warm-up for today's class**:

1. **Recall (90s)** — Two quick-fire questions from last lecture (private think, then choral answer).
2. **Hook (90s)** — One-line real-world scenario on ${topicName}; "what would you do?"
3. **Stakes (90s)** — Show the PYQ frequency of ${topicName}: ×high. "This WILL be in the exam."
4. **Bridge (60s)** — One preview question that today's lecture answers.

**Why it works:** participation in your classes is **${engagement}%** — warm-ups that reference exam weightage historically lift engagement the most.`
  }

  if (/(pre-?grade|grade|pending|review submissions)/i.test(lower)) {
    return `Here's your **grading status** 📋

- **Pending submissions:** ${pending}
- **AI pre-graded:** ${d.teachingProductivity?.gradedAutomated ?? 0} this term
- **Recommended:** approve AI drafts in batches of 10 — clears the queue in ~30 minutes.

**Plan:** I can draft batch comments for the ${d.assignmentAnalytics?.items?.[0]?.title ?? 'open assignment'} with the rubric attached. Say "draft comments" to start.`
  }

  if (/(at-?risk|weak students|attention|intervention)/i.test(lower)) {
    const top = d.attentionStudents?.items?.[0]
    return `Here's your **at-risk snapshot** 🚨

- **Students flagged:** ${attention} (${d.attentionStudents?.critical ?? 0} critical · ${d.attentionStudents?.high ?? 0} high)
- **Top priority:** ${top ? `${top.name} (${top.roll}) — ${top.category}, risk ${top.risk}%` : 'none'}
- **Recommended action:** ${top?.suggestedAction ?? 'cohort-level check-in'}
- **Expected improvement:** ${top?.estimatedImprovement ?? '—'} with weekly check-ins

Want me to draft the personalised outreach message for ${top?.name ?? 'the critical cohort'}?`
  }

  if (/(attendance)/i.test(lower)) {
    return `Here's your **attendance insight** 📊

- **Overall attendance:** ${avgAtt}%
- **Below 75% floor:** ${d.attendanceIntelligence?.summary?.studentsBelow75 ?? 0} students
- **Missing consecutively:** ${d.attendanceIntelligence?.consecutiveMissing?.length ?? 0} students
- **Correlation:** the below-75% cohort scores ${d.attendanceIntelligence?.correlationGap ?? '—'} points lower — attendance is your strongest lever.

**Action:** share the attendance reminder now; a tutorial-week bump usually recovers 2–3 points.`
  }

  /* ---------- default contextual reply ---------- */
  return `Here's your **teaching snapshot** right now 👩‍🏫

- **Teaching health:** ${health}/100 (${d.teachingHealth?.grade ?? '—'}) · engagement ${engagement}%
- **Weakest chapter:** ${weak} — worth a revision class this week
- **Pending grading:** ${pending} submissions · AI pre-graded drafts ready to approve
- **At-risk students:** ${attention} flagged · ${d.attentionStudents?.critical ?? 0} critical
- **Today's priority:** ${d.recommendations?.items?.[0]?.title ?? 'clear the grading queue'}

**I can help you with:** lesson plans · MCQs · subjective questions · assignments · revision plans · viva questions · practical exercises · Bloom's questions · explanations · warm-ups. Just ask, e.g. *"Generate 20 MCQs on ${topicName}"* or *"Prepare tomorrow's lecture"*.`
}

export default generateAssistantReply
