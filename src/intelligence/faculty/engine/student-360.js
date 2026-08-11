/**
 * Faculty Intelligence Engine — 360° STUDENT INTELLIGENCE (Phase 4).
 *
 * Individual-student deep analysis built ON TOP of the Phase 3
 * students-directory engine. Everything is derived from canonical
 * ExamAttempts via the Phase 2 adapter — no second strength/weakness
 * engine, no second trend engine, no fabricated error categories.
 *
 *   · computeStudent360() — the full 360° bundle: executive overview,
 *     AI summary, strengths, weaknesses, subject/chapter/question/time/
 *     behaviour/error intelligence, longitudinal trends, exam
 *     comparison, persistent/resolved issues, evidence trail.
 *   · computeStudentExamComparison() — two-attempt comparison (accuracy/
 *     attempt rate/time/errors), derived from raw attempts.
 *
 * Evidence rules (transparent, deterministic):
 *   · a chapter needs ≥ 2 attempts with ≥ 3 questions to be a weakness
 *     (never labelled from one incorrect question alone)
 *   · statuses come from the Phase 2 trend logic (improving/declining/
 *     stable/persistent/resolved)
 *   · error categories are only assigned when observable (fast+incorrect
 *     → Careless proxy; slow+incorrect → Time-related; unattempted →
 *     Unattempted); everything else is "Unclassified" — no inference of
 *     emotion/motivation/psychology.
 */

import { round1, avg, clamp } from './scores.js'
import { buildExamEvidence, buildAttemptSignals, classifyChapterTrend } from '@/intelligence/engine/exam-attempt-intelligence.js'
import { ATTEMPT_CLASSIFICATIONS } from '@/intelligence/engine/exam-agent.js'
import { computeStudentProfileBundle } from './students-directory.js'

/* ------------------------------------------------------------------ */
/* Executive overview + AI summary                                    */
/* ------------------------------------------------------------------ */

export function computeStudentOverview({ attempts = [], derived }) {
  const manual = (attempts ?? []).filter((a) => a?.mode !== 'demo')
  const sorted = [...manual].sort((a, b) => String(a.submittedAt ?? '').localeCompare(String(b.submittedAt ?? '')))
  const latest = sorted[sorted.length - 1] ?? null
  const accuracies = sorted.map((a) => a.scoring?.accuracy ?? a.summary?.accuracy ?? null).filter((v) => v != null)
  const attemptRates = sorted.map((a) => a.scoring?.attemptRate ?? a.summary?.attemptRate ?? null).filter((v) => v != null)
  const timeEffs = sorted.map((a) => a.scoring?.timeEfficiency ?? null).filter((v) => v != null)
  const scores = sorted.map((a) => a.scoring?.pct ?? a.summary?.pct ?? null).filter((v) => v != null)
  return {
    status: derived.status,
    trend: derived.trend,
    latestAccuracy: derived.latest,
    avgAccuracy: derived.accuracy,
    latestScore: latest ? (latest.scoring?.pct ?? latest.summary?.pct ?? null) : null,
    attemptRate: attemptRates.length ? round1(avg(attemptRates)) : 0,
    timeEfficiency: timeEffs.length ? round1(avg(timeEffs)) : 0,
    examsCompleted: sorted.length,
    improvementDelta: scores.length >= 2 ? round1(scores[scores.length - 1] - scores[0]) : null,
    firstScore: scores[0] ?? null,
    latestPct: scores[scores.length - 1] ?? null,
  }
}

export function buildStudentAiSummary({ overview, strengths, weaknesses, timeBySubject }) {
  const parts = []
  const latest = overview?.latestAccuracy ?? 0
  const delta = overview?.improvementDelta
  if (overview?.examsCompleted >= 2) {
    if (delta >= 8) parts.push(`Accuracy has improved by ${delta} percentage points across the last ${overview.examsCompleted} assessments.`)
    else if (delta <= -8) parts.push(`Performance has declined by ${Math.abs(delta)} points over the last ${overview.examsCompleted} assessments.`)
    else parts.push(`Performance has remained stable across the last ${overview.examsCompleted} assessments (${latest}% latest accuracy).`)
  } else {
    parts.push(`${overview?.examsCompleted ?? 0} completed assessment${(overview?.examsCompleted ?? 0) === 1 ? '' : 's'} — more attempts will sharpen this picture.`)
  }
  if (strengths?.length) {
    parts.push(`${strengths[0].chapter ?? strengths[0].subject} is a strong area (${strengths[0].accuracy ?? 0}% accuracy${strengths[0].fast ? ', fast solving' : ''}).`)
  }
  const topWeak = weaknesses?.[0]
  if (topWeak) {
    parts.push(`${topWeak.chapter ?? topWeak.subject} continues to require attention (${topWeak.accuracy ?? 0}% accuracy${topWeak.highTime ? ', high time consumption' : ''}).`)
  }
  if (timeBySubject?.length && timeBySubject.length > 1) {
    const slowest = [...timeBySubject].sort((a, b) => b.avgTime - a.avgTime)[0]
    const fastest = [...timeBySubject].sort((a, b) => a.avgTime - b.avgTime)[0]
    if (slowest && fastest && slowest.avgTime > fastest.avgTime * 1.4) {
      parts.push(`${slowest.subject} consumes significantly more time than other subjects while maintaining ${slowest.accuracy >= 60 ? 'comparable' : 'lower'} accuracy.`)
    }
  }
  return parts.join(' ')
}

/* ------------------------------------------------------------------ */
/* Strengths / weaknesses (from the Phase 2 evidence pools)            */
/* ------------------------------------------------------------------ */

export function computeStudentStrengthsWeaknesses({ attempts = [] }) {
  const manual = (attempts ?? []).filter((a) => a?.mode !== 'demo')
  const evidence = buildExamEvidence(manual)
  const pool = (ev) => {
    const strengths = (ev?.strengths ?? []).map((s) => ({
      chapter: s.chapter, subject: s.subject, accuracy: s.accuracy, avgTime: s.avgTime,
      trend: s.trend, status: s.status,
      fast: s.avgTime != null && s.avgTime <= 60,
      evidence: s.evidence,
    }))
    const weaknesses = (ev?.weaknesses ?? []).map((w) => ({
      chapter: w.chapter, subject: w.subject, accuracy: w.accuracy, avgTime: w.avgTime,
      trend: w.trend, status: w.status,
      incorrect: w.evidence?.incorrect ?? 0,
      skipped: w.evidence?.skipped ?? 0,
      attempted: w.evidence?.attempted ?? 0,
      questions: w.evidence?.questions ?? 0,
      attempts: w.evidence?.attempts ?? 0,
      highTime: w.avgTime != null && w.avgTime >= 100,
      priority: w.accuracy != null && w.accuracy < 55 ? 'High' : w.accuracy < 70 ? 'Medium' : 'Low',
      reason: w.accuracy != null && w.highTime
        ? `Low accuracy combined with high time consumption across multiple assessments.`
        : w.accuracy != null && w.accuracy < 55
          ? `Consistently low accuracy across ${w.evidence?.attempts ?? 0} assessment(s).`
          : `Below-par performance requiring review.`,
      evidence: w.evidence,
    }))
    return { strengths, weaknesses }
  }
  /* pool by domain; pick the student's dominant domain for the top view */
  return {
    university: pool(evidence?.university),
    competitive: {
      JEE: pool(evidence?.competitive?.JEE),
      NEET: pool(evidence?.competitive?.NEET),
    },
    evidence,
  }
}

/* ------------------------------------------------------------------ */
/* Subject intelligence (reuses buildAttemptSignals)                  */
/* ------------------------------------------------------------------ */

export function computeStudentSubjectIntelligence({ attempts = [] }) {
  const manual = (attempts ?? []).filter((a) => a?.mode !== 'demo')
  const signals = buildAttemptSignals(manual)
  return {
    university: signals.university.subjects,
    competitive: {
      JEE: signals.competitive.JEE.subjects,
      NEET: signals.competitive.NEET.subjects,
    },
  }
}

/* ------------------------------------------------------------------ */
/* Chapter intelligence (with evidence + trend)                       */
/* ------------------------------------------------------------------ */

export function computeStudentChapterIntelligence({ attempts = [] }) {
  const manual = (attempts ?? []).filter((a) => a?.mode !== 'demo')
  const signals = buildAttemptSignals(manual)
  const chapters = [
    ...signals.university.chapters,
    ...signals.competitive.JEE.chapters,
    ...signals.competitive.NEET.chapters,
  ].map((c) => ({
    ...c,
    evidence: {
      attempts: c.attempts,
      questions: c.questions,
      accuracy: c.accuracy,
      avgTime: c.avgTime,
      incorrect: c.incorrect,
      skipped: c.skipped,
      attempted: c.attempted,
    },
    priority: c.accuracy != null && c.accuracy < 55 ? 'High' : c.accuracy < 70 ? 'Medium' : 'Low',
    highTime: c.avgTime != null && c.avgTime >= 100,
  }))
  return {
    university: chapters.filter((c) => c.subject?.includes('Data Structures') || c.subject?.includes('Operating') || c.subject?.includes('Machine') || c.subject?.includes('Database') || c.subject?.includes('Networks') || c.subject?.includes('Theory')),
    competitive: {
      JEE: chapters.filter((c) => ['Physics', 'Chemistry', 'Mathematics'].includes(c.subject) && !c.subject.includes('NEET')),
      NEET: chapters.filter((c) => ['Physics', 'Chemistry', 'Biology'].includes(c.subject) && c.subject.includes('Biology') || c.subject === 'Physics' || c.subject === 'Chemistry'),
    },
  }
}

/* ------------------------------------------------------------------ */
/* Question-level intelligence + time + behaviour + errors            */
/* ------------------------------------------------------------------ */

export function computeStudentQuestionIntelligence({ attempts = [] }) {
  const manual = (attempts ?? []).filter((a) => a?.mode !== 'demo')
  const rows = []
  const timeRows = []
  const behaviour = { answerChanges: 0, revisits: 0, skipped: 0, markedForReview: 0, questions: 0 }
  const errors = []
  const errorCounts = { 'Conceptual': 0, 'Calculation': 0, 'Misread': 0, 'Careless': 0, 'Time-related': 0, 'Unattempted': 0, 'Guessing': 0, 'Unclassified': 0 }

  ;(manual ?? []).forEach((attempt) => {
    const date = (attempt.submittedAt ?? attempt.completedAt ?? '').slice(0, 10)
    ;(attempt.questionAttempts ?? []).forEach((qa, qi) => {
      const status = qa.evaluation?.isCorrect ? 'Correct' : qa.response?.status === 'skipped' || qa.evaluation?.isSkipped ? 'Skipped' : 'Incorrect'
      const timeSpent = qa.timing?.timeSpent ?? 0
      const visits = qa.behaviour?.visits ?? 0
      const answerChanges = qa.response?.answerChanges ?? 0
      const revisits = Math.max(0, visits - 1)
      const marked = !!qa.response?.markedForReview
      const classification = qa.evaluation?.classification ?? null
      const clsLabel = classification && ATTEMPT_CLASSIFICATIONS[classification] ? ATTEMPT_CLASSIFICATIONS[classification].label : null
      const obs = classification === 'fast-incorrect'
        ? 'Answered quickly but incorrectly — possible careless error.'
        : classification === 'slow-incorrect'
          ? 'High time consumption followed by an incorrect response.'
          : classification === 'slow-correct'
            ? 'Correct but slow — speed can improve.'
            : classification === 'fast-correct'
              ? 'Strong, efficient solve.'
              : status === 'Skipped'
                ? 'Question was visited but left unanswered.'
                : 'Not reached or unattempted.'

      rows.push({
        attemptId: attempt.id,
        date,
        examName: attempt.examName ?? attempt.examTitle ?? attempt.examId,
        examMode: attempt.examMode ?? attempt.category,
        examFamily: attempt.examFamily ?? null,
        questionNumber: qi + 1,
        id: qa.questionId,
        subject: qa.academicContext?.subject ?? null,
        chapter: qa.academicContext?.chapter ?? null,
        topic: qa.academicContext?.topic ?? null,
        difficulty: qa.question?.difficulty ?? null,
        type: qa.question?.type ?? 'MCQ',
        marks: qa.question?.marks ?? 0,
        status,
        timeSpent,
        answerChanges,
        revisits,
        markedForReview: marked,
        selected: qa.response?.selectedAnswer ?? null,
        correctAnswer: qa.question?.correctAnswer ?? null,
        text: qa.question?.text ?? null,
        options: qa.question?.options ?? [],
        classification,
        observation: obs,
      })

      timeRows.push({ subject: qa.academicContext?.subject, difficulty: qa.question?.difficulty, timeSpent, status, chapter: qa.academicContext?.chapter, topic: qa.academicContext?.topic })
      behaviour.answerChanges += answerChanges
      behaviour.revisits += revisits
      behaviour.skipped += status === 'Skipped' ? 1 : 0
      behaviour.markedForReview += marked ? 1 : 0
      behaviour.questions += 1

      /* error classification — observable only */
      let cat = 'Unclassified'
      if (status === 'Skipped') cat = 'Unattempted'
      else if (status === 'Incorrect') {
        if (classification === 'fast-incorrect') cat = 'Careless'
        else if (classification === 'slow-incorrect') cat = 'Time-related'
      }
      errorCounts[cat] = (errorCounts[cat] ?? 0) + 1
    })
  })

  const errorTotal = Object.values(errorCounts).reduce((n, c) => n + c, 0)
  const errorsList = Object.entries(errorCounts)
    .filter(([, c]) => c > 0)
    .map(([category, count]) => ({
      category,
      count,
      percentage: errorTotal ? round1((count / errorTotal) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  /* time intelligence */
  const timed = timeRows.filter((t) => t.timeSpent > 0)
  const avgTime = timed.length ? round1(avg(timed, 'timeSpent')) : 0
  const fastest = timed.length ? timed.reduce((a, b) => (a.timeSpent <= b.timeSpent ? a : b)) : null
  const slowest = timed.length ? timed.reduce((a, b) => (a.timeSpent >= b.timeSpent ? a : b)) : null
  const bySubject = [...new Set(timeRows.map((t) => t.subject).filter(Boolean))].map((s) => {
    const r = timeRows.filter((t) => t.subject === s && t.timeSpent > 0)
    const rAll = timeRows.filter((t) => t.subject === s)
    const correct = rAll.filter((t) => t.status === 'Correct').length
    const attempted = rAll.filter((t) => t.status !== 'Skipped').length
    return {
      subject: s,
      avgTime: r.length ? round1(avg(r, 'timeSpent')) : 0,
      correctTime: r.filter((t) => t.status === 'Correct').length ? round1(avg(r.filter((t) => t.status === 'Correct'), 'timeSpent')) : null,
      incorrectTime: r.filter((t) => t.status === 'Incorrect').length ? round1(avg(r.filter((t) => t.status === 'Incorrect'), 'timeSpent')) : null,
      accuracy: attempted ? round1((correct / attempted) * 100) : 0,
      questions: rAll.length,
    }
  })
  const byDifficulty = ['Easy', 'Medium', 'Hard'].map((d) => {
    const r = timeRows.filter((t) => t.difficulty === d && t.timeSpent > 0)
    return { difficulty: d, avgTime: r.length ? round1(avg(r, 'timeSpent')) : 0, questions: timeRows.filter((t) => t.difficulty === d).length }
  }).filter((d) => d.questions > 0)

  const timeByCorrect = timed.filter((t) => t.status === 'Correct').length ? round1(avg(timed.filter((t) => t.status === 'Correct'), 'timeSpent')) : null
  const timeByIncorrect = timed.filter((t) => t.status === 'Incorrect').length ? round1(avg(timed.filter((t) => t.status === 'Incorrect'), 'timeSpent')) : null

  return {
    rows,
    time: {
      avgTime,
      fastest: fastest ? { time: fastest.timeSpent, subject: fastest.subject, chapter: fastest.chapter, topic: fastest.topic } : null,
      slowest: slowest ? { time: slowest.timeSpent, subject: slowest.subject, chapter: slowest.chapter, topic: slowest.topic } : null,
      bySubject,
      byDifficulty,
      timeByCorrect,
      timeByIncorrect,
      timeTrend: manual.map((a) => ({
        examId: a.examId,
        date: (a.submittedAt ?? a.completedAt ?? '').slice(0, 10),
        avgTime: (a.questionAttempts ?? []).filter((q) => (q.timing?.timeSpent ?? 0) > 0).length
          ? round1(avg((a.questionAttempts ?? []).filter((q) => (q.timing?.timeSpent ?? 0) > 0), (q) => q.timing.timeSpent))
          : 0,
      })),
    },
    behaviour,
    errors: errorsList,
    errorTotal,
  }
}

/* ------------------------------------------------------------------ */
/* Longitudinal trends + persistent/resolved issues                   */
/* ------------------------------------------------------------------ */

export function computeStudentLongitudinal({ attempts = [] }) {
  const manual = (attempts ?? []).filter((a) => a?.mode !== 'demo')
  const sorted = [...manual].sort((a, b) => String(a.submittedAt ?? '').localeCompare(String(b.submittedAt ?? '')))
  const series = sorted.map((a) => ({
    attemptId: a.id,
    examId: a.examId,
    examName: a.examName ?? a.examTitle ?? a.examId,
    shortTitle: a.shortTitle ?? null,
    date: (a.submittedAt ?? a.completedAt ?? '').slice(0, 10),
    pct: a.scoring?.pct ?? a.summary?.pct ?? 0,
    accuracy: a.scoring?.accuracy ?? a.summary?.accuracy ?? 0,
    attemptRate: a.scoring?.attemptRate ?? a.summary?.attemptRate ?? 0,
    timeEfficiency: a.scoring?.timeEfficiency ?? null,
    avgTime: (a.questionAttempts ?? []).filter((q) => (q.timing?.timeSpent ?? 0) > 0).length
      ? round1(avg((a.questionAttempts ?? []).filter((q) => (q.timing?.timeSpent ?? 0) > 0), (q) => q.timing.timeSpent))
      : 0,
    errors: (a.questionAttempts ?? []).filter((q) => !q.evaluation?.isCorrect && q.response?.status !== 'skipped' && !q.evaluation?.isSkipped).length,
  }))

  /* persistent / improving / resolved / declining per chapter (Phase 2 trend logic reused) */
  const signals = buildAttemptSignals(manual)
  const chapterStatuses = [...signals.university.chapters, ...signals.competitive.JEE.chapters, ...signals.competitive.NEET.chapters].map((c) => ({
    subject: c.subject,
    chapter: c.chapter,
    domain: c.domain,
    trend: c.trend,
    status: c.status,
    accuracy: c.accuracy,
    avgTime: c.avgTime,
    series: c.series ?? [],
    evidence: { attempts: c.attempts, questions: c.questions, accuracy: c.accuracy, avgTime: c.avgTime, incorrect: c.incorrect, skipped: c.skipped },
  }))

  const classify = (s) => {
    if (s.status === 'persistent') return { type: 'Persistent weakness', tone: 'danger' }
    if (s.status === 'resolved') return { type: 'Resolved issue', tone: 'success' }
    if (s.status === 'improving') return { type: 'Improving issue', tone: 'info' }
    if (s.trend === 'declining') return { type: 'Declining area', tone: 'warning' }
    if (s.status === 'strong') return { type: 'Strong area', tone: 'success' }
    return { type: 'Developing area', tone: 'secondary' }
  }

  const issues = chapterStatuses
    .map((c) => ({ ...c, ...classify(c) }))
    .filter((c) => ['Persistent weakness', 'Resolved issue', 'Improving issue', 'Declining area'].includes(c.type))

  return { series, issues, chapterStatuses }
}

/* ------------------------------------------------------------------ */
/* Exam comparison (two attempts)                                     */
/* ------------------------------------------------------------------ */

export function computeStudentExamComparison(attemptA, attemptB) {
  if (!attemptA || !attemptB) return null
  const sum = (a) => ({
    accuracy: a.scoring?.accuracy ?? a.summary?.accuracy ?? 0,
    attemptRate: a.scoring?.attemptRate ?? a.summary?.attemptRate ?? 0,
    avgTime: (a.questionAttempts ?? []).filter((q) => (q.timing?.timeSpent ?? 0) > 0).length
      ? round1(avg((a.questionAttempts ?? []).filter((q) => (q.timing?.timeSpent ?? 0) > 0), (q) => q.timing.timeSpent))
      : 0,
    errors: (a.questionAttempts ?? []).filter((q) => !q.evaluation?.isCorrect && q.response?.status !== 'skipped' && !q.evaluation?.isSkipped).length,
    pct: a.scoring?.pct ?? a.summary?.pct ?? 0,
    score: a.scoring?.score ?? a.summary?.score ?? 0,
    maxScore: a.scoring?.maxScore ?? a.summary?.maxScore ?? null,
  })
  const sA = sum(attemptA)
  const sB = sum(attemptB)
  const rows = [
    { label: 'Accuracy', a: `${sA.accuracy}%`, b: `${sB.accuracy}%`, delta: round1(sB.accuracy - sA.accuracy), unit: 'pp', better: sB.accuracy > sA.accuracy },
    { label: 'Score', a: `${sA.score}${sA.maxScore ? `/${sA.maxScore}` : ''}`, b: `${sB.score}${sB.maxScore ? `/${sB.maxScore}` : ''}`, delta: round1(sB.score - sA.score), unit: 'pts', better: sB.score > sA.score },
    { label: 'Attempt rate', a: `${sA.attemptRate}%`, b: `${sB.attemptRate}%`, delta: round1(sB.attemptRate - sA.attemptRate), unit: 'pp', better: sB.attemptRate > sA.attemptRate },
    { label: 'Average time', a: `${sA.avgTime}s`, b: `${sB.avgTime}s`, delta: round1(sB.avgTime - sA.avgTime), unit: 's', better: sB.avgTime < sA.avgTime },
    { label: 'Incorrect answers', a: String(sA.errors), b: String(sB.errors), delta: sB.errors - sA.errors, unit: '', better: sB.errors < sA.errors },
  ]
  return {
    examA: { id: attemptA.id, name: attemptA.examName ?? attemptA.examTitle ?? attemptA.examId, date: (attemptA.submittedAt ?? attemptA.completedAt ?? '').slice(0, 10) },
    examB: { id: attemptB.id, name: attemptB.examName ?? attemptB.examTitle ?? attemptB.examId, date: (attemptB.submittedAt ?? attemptB.completedAt ?? '').slice(0, 10) },
    rows,
  }
}

/* ------------------------------------------------------------------ */
/* Full 360° bundle                                                   */
/* ------------------------------------------------------------------ */

export function computeStudent360({ student, batches = [], attempts = [] }) {
  const manual = (attempts ?? []).filter((a) => a?.mode !== 'demo')
  const base = computeStudentProfileBundle({ student, batches, attempts: manual })
  const overview = computeStudentOverview({ attempts: manual, derived: base.derived ?? base })
  const sw = computeStudentStrengthsWeaknesses({ attempts: manual })
  const subjects = computeStudentSubjectIntelligence({ attempts: manual })
  const chapters = computeStudentChapterIntelligence({ attempts: manual })
  const question = computeStudentQuestionIntelligence({ attempts: manual })
  const longitudinal = computeStudentLongitudinal({ attempts: manual })
  const sorted = [...manual].sort((a, b) => String(a.submittedAt ?? '').localeCompare(String(b.submittedAt ?? '')))

  /* dominant domain for the top view */
  const uniCount = manual.filter((a) => (a.examMode ?? a.category) === 'University').length
  const compCount = manual.length - uniCount
  const defaultDomain = compCount > uniCount ? 'Competitive' : 'University'

  /* strengths/weaknesses for the summary (dominant domain pool) */
  const topPool = defaultDomain === 'Competitive'
    ? { strengths: [...(sw.competitive?.JEE?.strengths ?? []), ...(sw.competitive?.NEET?.strengths ?? [])], weaknesses: [...(sw.competitive?.JEE?.weaknesses ?? []), ...(sw.competitive?.NEET?.weaknesses ?? [])] }
    : sw.university

  const aiSummary = buildStudentAiSummary({
    overview,
    strengths: topPool.strengths,
    weaknesses: topPool.weaknesses,
    timeBySubject: question.time.bySubject,
  })

  return {
    ...base,
    overview,
    aiSummary,
    strengthsWeaknesses: {
      ...sw,
      /* flattened top lists for the dominant domain (overview + panels) */
      topStrengths: topPool.strengths,
      topWeaknesses: topPool.weaknesses,
    },
    subjects,
    chapters,
    question,
    longitudinal,
    comparison: sorted.length >= 2 ? computeStudentExamComparison(sorted[0], sorted[sorted.length - 1]) : null,
    defaultDomain,
    uniCount,
    compCount,
  }
}

export default { computeStudent360, computeStudentOverview, buildStudentAiSummary, computeStudentStrengthsWeaknesses, computeStudentSubjectIntelligence, computeStudentChapterIntelligence, computeStudentQuestionIntelligence, computeStudentLongitudinal, computeStudentExamComparison }
