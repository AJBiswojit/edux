import { describe, expect, it } from 'vitest'
import { normalizeExamAttempt, classifyAttemptContext } from '../../src/intelligence/engine/exam-agent.js'
import { buildAttemptSignals } from '../../src/intelligence/engine/exam-attempt-intelligence.js'
import {
  computeStudent360,
  computeStudentChapterIntelligence,
  computeStudentQuestionIntelligence,
} from '../../src/intelligence/faculty/engine/student-360.js'
import { groupSimilarIssues } from '../../src/intelligence/faculty/engine/similar-issues.js'

const student = { id: 'fixture-student', roll: 'FIX-001', name: 'Fixture Student', batchId: 'fixture-batch' }

function attempt({ id, examMode, examFamily = null, subject, chapter, topic = chapter }) {
  return {
    id,
    studentId: student.id,
    roll: student.roll,
    mode: 'manual',
    examMode,
    examFamily,
    examType: examFamily,
    category: examMode,
    examId: id,
    examName: id,
    submittedAt: `2026-08-${String(Number(id.slice(-2)) || 1).padStart(2, '0')}T10:00:00.000Z`,
    scoring: { pct: 50, accuracy: 50, attemptRate: 100 },
    questionAttempts: [0, 1].map((index) => ({
      questionId: `${id}-q${index + 1}`,
      academicContext: { subject, chapter, topic },
      question: { difficulty: 'Medium', marks: 4, type: 'MCQ', correctAnswer: 0, text: `${chapter} question` },
      response: { selectedAnswer: index === 0 ? 0 : 1, status: 'answered', answerChanges: 0, markedForReview: false },
      timing: { timeSpent: 60 },
      behaviour: { visits: 1 },
      evaluation: { isCorrect: index === 0, isSkipped: false, classification: index === 0 ? 'fast-correct' : 'fast-incorrect' },
    })),
  }
}

const university = attempt({ id: 'uni-01', examMode: 'University', examFamily: 'JEE', subject: 'CS501', chapter: 'Graphs' })
const jeePhysics = attempt({ id: 'jee-02', examMode: 'Competitive', examFamily: 'JEE', subject: 'Physics', chapter: 'Rotational Motion' })
const jeeMaths = attempt({ id: 'jee-03', examMode: 'Competitive', examFamily: 'JEE', subject: 'Mathematics', chapter: 'Calculus' })
const jeeChemistry = attempt({ id: 'jee-04', examMode: 'Competitive', examFamily: 'JEE', subject: 'Chemistry', chapter: 'Organic Chemistry' })
const neetPhysics = attempt({ id: 'neet-05', examMode: 'Competitive', examFamily: 'NEET', subject: 'Physics', chapter: 'Modern Physics' })
const neetChemistry = attempt({ id: 'neet-06', examMode: 'Competitive', examFamily: 'NEET', subject: 'Chemistry', chapter: 'Organic Chemistry' })
const neetBiology = attempt({ id: 'neet-07', examMode: 'Competitive', examFamily: 'NEET', subject: 'Biology', chapter: 'Human Physiology' })
const allAttempts = [university, jeePhysics, jeeMaths, jeeChemistry, neetPhysics, neetChemistry, neetBiology]

describe('Student 360 canonical domain isolation', () => {
  it('classifies explicit University metadata ahead of a conflicting family', () => {
    expect(classifyAttemptContext(university)).toEqual({ domain: 'university', examMode: 'University', examFamily: null })
  })

  it('normalizes legacy attempts into canonical University, JEE, and NEET contexts', () => {
    expect(normalizeExamAttempt({ id: 'u', category: 'University', examType: 'JEE', interactions: {} }).examFamily).toBeNull()
    expect(normalizeExamAttempt({ id: 'j', category: 'Competitive', examType: 'JEE', interactions: {} }).examMode).toBe('Competitive')
    expect(normalizeExamAttempt({ id: 'n', category: 'Competitive', examType: 'NEET', interactions: {} }).examFamily).toBe('NEET')
  })

  it('keeps University subjects and chapters university-only', () => {
    const signals = buildAttemptSignals(allAttempts)
    expect(signals.university.subjects.map((row) => row.subject)).toEqual(['CS501'])
    expect(signals.university.chapters.map((row) => row.chapter)).toEqual(['Graphs'])
  })

  it('keeps JEE Physics, Mathematics, and Chemistry isolated from NEET and University', () => {
    const chapters = computeStudentChapterIntelligence({ attempts: allAttempts }).competitive.JEE
    expect(chapters.map((row) => row.subject).sort()).toEqual(['Chemistry', 'Mathematics', 'Physics'])
    expect(chapters.map((row) => row.chapter)).not.toContain('Human Physiology')
    expect(chapters.map((row) => row.chapter)).not.toContain('Graphs')
  })

  it('keeps NEET Physics, Chemistry, and Biology isolated from JEE and University', () => {
    const chapters = computeStudentChapterIntelligence({ attempts: allAttempts }).competitive.NEET
    expect(chapters.map((row) => row.subject).sort()).toEqual(['Biology', 'Chemistry', 'Physics'])
    expect(chapters.map((row) => row.chapter)).not.toContain('Calculus')
    expect(chapters.map((row) => row.chapter)).not.toContain('Graphs')
  })

  it('does not merge a same-named JEE and NEET chapter into one chapter series', () => {
    const signals = buildAttemptSignals([jeeChemistry, neetChemistry])
    expect(signals.competitive.JEE.chapters).toHaveLength(1)
    expect(signals.competitive.NEET.chapters).toHaveLength(1)
    expect(signals.competitive.JEE.chapters[0].attempts).toBe(1)
    expect(signals.competitive.NEET.chapters[0].attempts).toBe(1)
  })

  it('isolates a University plus JEE student across subjects, questions, trends, and comparison', () => {
    const s360 = computeStudent360({ student, attempts: [university, jeePhysics, jeeMaths, jeeChemistry] })
    expect(s360.subjects.university.map((row) => row.subject)).toEqual(['CS501'])
    expect(s360.subjects.competitive.JEE.map((row) => row.subject).sort()).toEqual(['Chemistry', 'Mathematics', 'Physics'])
    expect(s360.question.byContext.University.rows.every((row) => row.examMode === 'University')).toBe(true)
    expect(s360.question.byContext.JEE.rows.every((row) => row.examFamily === 'JEE')).toBe(true)
    expect(s360.longitudinal.series.filter((row) => row.examFamily === 'JEE')).toHaveLength(3)
    expect(s360.comparisonByContext.University).toBeNull()
  })

  it('isolates a University plus NEET student across subjects, questions, and DNA evidence', () => {
    const s360 = computeStudent360({ student, attempts: [university, neetPhysics, neetChemistry, neetBiology] })
    expect(s360.subjects.competitive.NEET.map((row) => row.subject).sort()).toEqual(['Biology', 'Chemistry', 'Physics'])
    expect(s360.question.byContext.NEET.rows.every((row) => row.examFamily === 'NEET')).toBe(true)
    expect(s360.strengthsWeaknesses.evidence.university.chapters.every((row) => row.subject === 'CS501')).toBe(true)
    expect(s360.strengthsWeaknesses.evidence.competitive.NEET.chapters.every((row) => row.subject !== 'CS501')).toBe(true)
  })

  it('does not leak cross-domain attempts into question intelligence', () => {
    const question = computeStudentQuestionIntelligence({ attempts: allAttempts })
    expect(question.rows.filter((row) => row.examMode === 'University')).toHaveLength(2)
    expect(question.rows.filter((row) => row.examFamily === 'JEE')).toHaveLength(6)
    expect(question.rows.filter((row) => row.examFamily === 'NEET')).toHaveLength(6)
  })
})

describe('Similar Issues partition regression', () => {
  it('never groups University, JEE, and NEET fingerprints across their domain/family partition', () => {
    const base = { subject: 'Physics', chapter: 'Mechanics', issueType: 'Low Accuracy', accuracyBand: 'low', timeBand: 'normal', trend: 'stable', skipBand: 'none' }
    const result = groupSimilarIssues([
      { ...base, studentId: 'u1', domain: 'University', examFamily: null },
      { ...base, studentId: 'u2', domain: 'University', examFamily: null },
      { ...base, studentId: 'j1', domain: 'Competitive', examFamily: 'JEE' },
      { ...base, studentId: 'j2', domain: 'Competitive', examFamily: 'JEE' },
      { ...base, studentId: 'n1', domain: 'Competitive', examFamily: 'NEET' },
      { ...base, studentId: 'n2', domain: 'Competitive', examFamily: 'NEET' },
    ])
    expect(result.groups).toHaveLength(3)
    expect(result.groups.map((group) => `${group.domain}:${group.examFamily ?? 'University'}`).sort())
      .toEqual(['Competitive:JEE', 'Competitive:NEET', 'University:University'])
  })
})
