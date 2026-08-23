import { describe, expect, it } from 'vitest'
import { classifyAttemptContext, buildAttemptSignals } from '../src/intelligence/engine/exam-attempt-intelligence.js'
import { computeStudentChapterIntelligence, computeStudentQuestionIntelligence } from '../src/intelligence/faculty/engine/student-360.js'
import { groupSimilarIssues } from '../src/intelligence/faculty/engine/similar-issues.js'
import { attempt, mixedUniversityJee, mixedUniversityNeet } from './fixtures/intelligence-attempts.js'

const names = (rows) => rows.map((row) => row.chapter)

describe('Student 360 canonical domain isolation', () => {
  it('classifies canonical University, JEE, and NEET metadata without subject-name inference', () => {
    expect(classifyAttemptContext(mixedUniversityJee[0])).toEqual({ domain: 'university', examFamily: 'University' })
    expect(classifyAttemptContext(mixedUniversityJee[1])).toEqual({ domain: 'competitive', examFamily: 'JEE' })
    expect(classifyAttemptContext(mixedUniversityNeet[1])).toEqual({ domain: 'competitive', examFamily: 'NEET' })
  })

  it('rejects competitive attempts with no canonical family instead of guessing from a subject', () => {
    expect(classifyAttemptContext(attempt({ id: 'x1', examMode: 'Competitive', subject: 'Biology', chapter: 'Human Physiology' }))).toEqual({ domain: null, examFamily: null })
  })

  it('normalizes canonical attempt context into separate signal pools', () => {
    const signals = buildAttemptSignals(mixedUniversityJee)
    expect(signals.university.subjects.map((s) => s.subject)).toEqual(['CS501'])
    expect(signals.competitive.JEE.subjects.map((s) => s.subject).sort()).toEqual(['Chemistry', 'Mathematics', 'Physics'])
    expect(signals.competitive.NEET.subjects).toEqual([])
  })

  it('keeps University chapters and questions isolated from JEE', () => {
    const chapters = computeStudentChapterIntelligence({ attempts: mixedUniversityJee })
    const questions = computeStudentQuestionIntelligence({ attempts: mixedUniversityJee }).rows
    expect(names(chapters.university)).toEqual(['Graphs'])
    expect(names(chapters.competitive.JEE)).not.toContain('Graphs')
    expect(questions.filter((q) => q.examMode === 'University').every((q) => q.subject === 'CS501')).toBe(true)
  })

  it('keeps JEE Physics, Mathematics, and Chemistry isolated from University and NEET', () => {
    const chapters = computeStudentChapterIntelligence({ attempts: mixedUniversityJee })
    expect(names(chapters.competitive.JEE).sort()).toEqual(['Calculus', 'Organic Chemistry', 'Rotational Motion'])
    expect(chapters.competitive.NEET).toEqual([])
  })

  it('keeps NEET Physics, Chemistry, and Biology isolated from University and JEE', () => {
    const chapters = computeStudentChapterIntelligence({ attempts: mixedUniversityNeet })
    expect(names(chapters.competitive.NEET).sort()).toEqual(['Human Physiology', 'Modern Physics', 'Organic Chemistry'])
    expect(chapters.competitive.JEE).toEqual([])
    expect(names(chapters.university)).toEqual(['Data Structures'])
  })

  it('does not cross-contaminate same-name JEE and NEET chapters in their trend series', () => {
    const attempts = [
      attempt({ id: 'j10', examMode: 'Competitive', examFamily: 'JEE', subject: 'Physics', chapter: 'Modern Physics', correct: false }),
      attempt({ id: 'n10', examMode: 'Competitive', examFamily: 'NEET', subject: 'Physics', chapter: 'Modern Physics', correct: true }),
    ]
    const signals = buildAttemptSignals(attempts)
    expect(signals.competitive.JEE.chapters[0].series).toHaveLength(1)
    expect(signals.competitive.NEET.chapters[0].series).toHaveLength(1)
  })

  it('hard-partitions Similar Issues by University, JEE, and NEET context', () => {
    const base = { subject: 'Physics', chapter: 'Modern Physics', issueType: 'Low Accuracy', accuracyBand: 'low', timeBand: 'normal', trend: 'stable', skipBand: 'none' }
    const result = groupSimilarIssues([
      { ...base, studentId: 'u', domain: 'University', examFamily: null },
      { ...base, studentId: 'j', domain: 'Competitive', examFamily: 'JEE' },
      { ...base, studentId: 'n', domain: 'Competitive', examFamily: 'NEET' },
    ])
    expect(result.groups).toEqual([])
    expect(result.individuals).toHaveLength(3)
  })

  it('only groups equivalent issues in the same family partition', () => {
    const base = { domain: 'Competitive', examFamily: 'JEE', subject: 'Physics', chapter: 'Mechanics', issueType: 'Low Accuracy', accuracyBand: 'low', timeBand: 'normal', trend: 'stable', skipBand: 'none' }
    const result = groupSimilarIssues([{ ...base, studentId: 'j1' }, { ...base, studentId: 'j2' }])
    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].examFamily).toBe('JEE')
  })
})
