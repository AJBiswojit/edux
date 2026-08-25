/**
 * Faculty + student API — AI Micro-Assessment Studio.
 *
 * UI → service hook → this prototype API → domain dataset/intelligence.
 * Persistence is intentionally local to the browser for the prototype. The
 * assessment attempts use their own store and are never written to the
 * official ExamAttempt store or its intelligence engines.
 */
import { defineRoute } from '../core/router'
import {
  buildMicroSource, buildPrototypeMicroAttempts, computeMicroAssessmentResults,
  filterMicroSources, findMicroSource, generateMicroQuestions,
  generateMissingCoverage, normalizeExamFamily, normalizeMicroDomain,
  processMicroSource, regenerateMicroQuestion, sourceFilterOptions,
  validateMicroSourceInput, MICRO_ASSESSMENT_COUNTS,
} from '@/intelligence/faculty/engine/micro-assessments.js'
import {
  MICRO_ASSESSMENT_DOMAINS, MICRO_ASSESSMENT_EXAM_FAMILIES, MICRO_ASSESSMENT_SOURCE_TYPES,
  microAssessmentSources,
} from '@/datasets/faculty/micro-assessments.js'
import { facultyBatches, facultyStudents } from '@/intelligence/faculty/datasets/students-directory.js'
import { buildInterventionFromGroup } from '@/intelligence/faculty/engine/intervention-lifecycle.js'
import { readStatus, writeStatus } from '@/api/interventions/store.js'

const ASSESSMENTS_KEY = 'EduX_micro_assessments'
const ATTEMPTS_KEY = 'EduX_micro_assessment_attempts'
let assessmentSequence = 0

/* Explicit source-to-batch scopes for the existing demo roster. The directory
 * currently has CSE University cohorts plus JEE/NEET cohorts; non-CSE
 * University samples therefore surface a truthful empty state instead of
 * exposing unrelated CSE learners. This is a context map, not a subject-name
 * heuristic for determining domain or exam family. */
const SOURCE_BATCH_SCOPES = {
  'mas-uni-cs-graph-traversal': ['batch_uni_cse_a', 'batch_uni_cse_b', 'batch_uni_cse_c'],
  'mas-uni-cs-normalization': ['batch_uni_cse_a', 'batch_uni_cse_b', 'batch_uni_cse_c'],
  'mas-uni-me-thermodynamics': [],
  'mas-uni-ee-logic-gates': [],
  'mas-uni-physics-wave-particle': [],
}

function readJSON(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || 'null') ?? fallback
  } catch {
    return fallback
  }
}
function writeJSON(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)) } catch { /* prototype storage is optional */ }
}
function readAssessments() { return readJSON(ASSESSMENTS_KEY, []) }
function writeAssessments(items) { writeJSON(ASSESSMENTS_KEY, items) }
function readAttempts() { return readJSON(ATTEMPTS_KEY, []) }
function writeAttempts(items) { writeJSON(ATTEMPTS_KEY, items) }
function unique(items) { return [...new Set((items ?? []).filter(Boolean))] }
function fail(message, details = {}, status = 400) {
  const error = new Error(message)
  error.response = { status, data: { message, ...details } }
  throw error
}
function sourceFor(body = {}) {
  const base = body.sourceId ? findMicroSource(body.sourceId) : null
  if (body.sourceId && !base) fail('Source not found.', {}, 404)
  const input = body.source ?? body.sourceOverride ?? body
  return buildMicroSource(input, base)
}
function validSourceOrFail(source) {
  const validation = validateMicroSourceInput(source)
  if (!validation.valid) fail('Complete the source details before continuing.', { errors: validation.errors })
  return source
}
function participantContextMatches(person, context = {}) {
  const domain = normalizeMicroDomain(context.domain)
  const personDomain = normalizeMicroDomain(person.domain)
  if (!domain || personDomain !== domain) return false
  if (domain === 'competitive') return person.examFamily === normalizeExamFamily(context.examFamily)
  return !person.examFamily
}
function batchContextMatches(batch, context = {}) {
  const domain = normalizeMicroDomain(context.domain)
  if (normalizeMicroDomain(batch.domain) !== domain) return false
  if (domain === 'competitive') return batch.examFamily === normalizeExamFamily(context.examFamily)
  return !batch.examFamily
}
function participantsFor(context = {}) {
  const scopedBatchIds = context.sourceId && Object.prototype.hasOwnProperty.call(SOURCE_BATCH_SCOPES, context.sourceId)
    ? new Set(SOURCE_BATCH_SCOPES[context.sourceId])
    : null
  const batches = facultyBatches.filter((batch) => batchContextMatches(batch, context) && (!scopedBatchIds || scopedBatchIds.has(batch.id)))
  const batchIds = new Set(batches.map((batch) => batch.id))
  const students = facultyStudents.filter((student) => batchIds.has(student.batchId) && participantContextMatches(student, context))
  return { batches, students }
}
function assessmentContext(assessment) {
  return {
    sourceId: assessment.sourceId ?? assessment.id,
    domain: assessment.domain,
    examFamily: assessment.examFamily,
    subject: assessment.subject,
    chapter: assessment.chapter,
    topic: assessment.topic,
  }
}
function storedAssessment(id) {
  const assessment = readAssessments().find((item) => item.id === id)
  if (!assessment) fail('Micro-assessment not found.', {}, 404)
  return assessment
}
function studentIdFrom(params = {}, body = {}) {
  return params.studentId ?? params.student ?? body.studentId ?? 'u_stu_001'
}

/* ---------------- Source library ---------------- */
defineRoute('get', '/faculty/micro-assessments/sources', ({ params }) => {
  const items = filterMicroSources(params ?? {}, microAssessmentSources)
  return {
    items,
    count: items.length,
    total: microAssessmentSources.length,
    filters: sourceFilterOptions(microAssessmentSources),
    domains: MICRO_ASSESSMENT_DOMAINS,
    examFamilies: MICRO_ASSESSMENT_EXAM_FAMILIES,
    sourceTypes: MICRO_ASSESSMENT_SOURCE_TYPES,
  }
})

defineRoute('get', '/faculty/micro-assessments/sources/:id', ({ params }) => {
  const source = findMicroSource(params.id)
  if (!source) fail('Source not found.', {}, 404)
  return { source }
})

/* ---------------- AI-style processing ---------------- */
defineRoute('post', '/faculty/micro-assessments/process', ({ body }) => {
  const source = sourceFor(body)
  const result = processMicroSource(source)
  if (!result.ok) fail('Complete the source details before processing.', { errors: result.errors, source: result.source })
  return result
})

/* ---------------- Question generation + review helpers ---------------- */
defineRoute('post', '/faculty/micro-assessments/generate', ({ body }) => {
  const source = validSourceOrFail(sourceFor(body))
  const count = Number(body?.count ?? 10)
  if (!MICRO_ASSESSMENT_COUNTS.includes(count)) fail('Choose 5, 10, 15 or 20 questions.', { allowedCounts: MICRO_ASSESSMENT_COUNTS })
  const result = generateMicroQuestions({
    source,
    count,
    difficulty: body?.difficulty ?? 'Mixed',
    questionTypes: body?.questionTypes ?? [],
  })
  if (!result.questions.length) fail('No questions are available for this source configuration.')
  return result
})

defineRoute('post', '/faculty/micro-assessments/regenerate', ({ body }) => {
  const source = validSourceOrFail(sourceFor(body))
  const result = regenerateMicroQuestion({ source, target: body?.target, usedIds: body?.usedIds ?? [] })
  if (result.unavailable) fail(result.message, { unavailable: true })
  return result
})

defineRoute('post', '/faculty/micro-assessments/missing-coverage', ({ body }) => {
  const source = validSourceOrFail(sourceFor(body))
  return generateMissingCoverage({ source, questions: body?.questions ?? [], count: body?.count ?? 1 })
})

/* ---------------- Context-aware faculty participants ---------------- */
defineRoute('get', '/faculty/micro-assessments/participants', ({ params }) => {
  const context = {
    sourceId: params?.sourceId,
    domain: params?.domain,
    examFamily: params?.examFamily,
  }
  if (!normalizeMicroDomain(context.domain)) return { batches: [], students: [], count: 0, message: 'Choose a source context before selecting students.' }
  const { batches, students } = participantsFor(context)
  return {
    batches,
    students,
    count: students.length,
    context: { sourceId: context.sourceId ?? null, domain: normalizeMicroDomain(context.domain), examFamily: normalizeExamFamily(context.examFamily) },
    note: 'Participants are read from the existing faculty batch/student directory and filtered by canonical domain and exam family.',
  }
})

/* ---------------- Faculty assessment lifecycle ---------------- */
defineRoute('get', '/faculty/micro-assessments', () => {
  const items = readAssessments().map((assessment) => {
    const results = computeMicroAssessmentResults(assessment, readAttempts().filter((attempt) => attempt.assessmentId === assessment.id))
    return {
      ...assessment,
      studentsCompleted: results.studentsCompleted,
      averageAccuracy: results.averageAccuracy,
    }
  })
  return { items, count: items.length }
})

defineRoute('post', '/faculty/micro-assessments', ({ body }) => {
  const source = validSourceOrFail(sourceFor(body))
  const questions = Array.isArray(body?.questions) ? body.questions.filter(Boolean) : []
  if (!questions.length) fail('No questions available. Generate and review questions before sending.')
  const title = String(body?.title ?? '').trim()
  if (!title) fail('Assessment title is required.', { field: 'title' })
  const duration = Number(body?.duration ?? body?.durationMinutes)
  if (!Number.isFinite(duration) || duration < 1 || duration > 180) fail('Duration must be between 1 and 180 minutes.', { field: 'duration' })
  const deadline = String(body?.deadline ?? '').trim()
  if (!deadline || Number.isNaN(new Date(deadline).getTime())) fail('Enter a valid deadline.', { field: 'deadline' })

  const audience = body?.audience ?? 'Entire Batch'
  const batchIds = unique(body?.batchIds ?? body?.targetBatchIds)
  const requestedStudentIds = unique(body?.studentIds ?? body?.targetStudentIds)
  const context = assessmentContext({ ...source })
  const { batches: availableBatches, students: availableStudents } = participantsFor(context)
  const availableBatchIds = new Set(availableBatches.map((batch) => batch.id))
  const availableStudentIds = new Set(availableStudents.map((student) => student.id))

  if (!['Entire Batch', 'Selected Batch', 'Selected Students'].includes(audience)) fail('Choose a valid audience.', { field: 'audience' })
  if (audience !== 'Selected Students' && !batchIds.length) fail('Select at least one batch.', { field: 'batchIds' })
  if (audience === 'Selected Students' && !requestedStudentIds.length) fail('Select at least one student.', { field: 'studentIds' })
  if (batchIds.some((id) => !availableBatchIds.has(id))) fail('Selected batch is outside this source context.', { field: 'batchIds' })
  if (requestedStudentIds.some((id) => !availableStudentIds.has(id))) fail('Selected student is outside this source context.', { field: 'studentIds' })

  const selectedStudentIds = audience === 'Selected Students'
    ? requestedStudentIds
    : availableStudents.filter((student) => batchIds.includes(student.batchId)).map((student) => student.id)
  if (!selectedStudentIds.length) fail('No students are available in the selected batch/context.', { field: 'students' })
  if (audience === 'Selected Students' && batchIds.length) {
    const batchSet = new Set(batchIds)
    if (selectedStudentIds.some((id) => !batchSet.has(availableStudents.find((student) => student.id === id)?.batchId))) {
      fail('Selected students must belong to the selected batch or context.', { field: 'studentIds' })
    }
  }

  const sequence = ++assessmentSequence
  const assessment = {
    id: `micro-${Date.now()}-${sequence}`,
    title,
    faculty: 'Dr. Meera Krishnan',
    description: String(body?.description ?? '').trim(),
    instructions: String(body?.instructions ?? '').trim(),
    questionCount: questions.length,
    difficulty: body?.difficulty ?? 'Mixed',
    duration,
    durationMinutes: duration,
    audience,
    deadline,
    sourceId: source.id,
    source: {
      id: source.id,
      title: source.title,
      sourceType: source.sourceType,
      wordCount: source.wordCount,
    },
    domain: source.domain,
    examFamily: source.examFamily,
    subject: source.subject,
    chapter: source.chapter,
    topic: source.topic,
    questions,
    target: {
      audience,
      batchIds,
      studentIds: selectedStudentIds,
      studentCount: selectedStudentIds.length,
    },
    status: 'Sent',
    createdAt: '2026-08-25T09:00:00.000Z',
    sentAt: '2026-08-25T09:00:00.000Z',
    prototypeOnly: true,
  }
  const assessments = readAssessments()
  assessments.unshift(assessment)
  writeAssessments(assessments)

  /* Seed only the results demo subset. The first selected student remains
     Not Started so the student can take the newly sent assessment. */
  const attempts = readAttempts().filter((attempt) => attempt.assessmentId !== assessment.id)
  writeAttempts([...buildPrototypeMicroAttempts(assessment, selectedStudentIds), ...attempts])
  return {
    ok: true,
    assessment,
    summary: {
      studentsSelected: selectedStudentIds.length,
      questions: questions.length,
      duration,
      deadline,
    },
    note: 'Assessment Sent in prototype mode. No notifications or external messages were sent.',
  }
})

defineRoute('get', '/faculty/micro-assessments/:id', ({ params }) => ({ assessment: storedAssessment(params.id) }))

defineRoute('get', '/faculty/micro-assessments/:id/results', ({ params }) => {
  const assessment = storedAssessment(params.id)
  const attempts = readAttempts().filter((attempt) => attempt.assessmentId === assessment.id)
  return {
    ...computeMicroAssessmentResults(assessment, attempts),
    assessment: {
      id: assessment.id,
      title: assessment.title,
      questionCount: assessment.questionCount,
      domain: assessment.domain,
      examFamily: assessment.examFamily,
      subject: assessment.subject,
      chapter: assessment.chapter,
      topic: assessment.topic,
      target: assessment.target,
    },
  }
})

/* Explicit faculty hand-off to the EXISTING intervention lifecycle. The
 * builder and status store below are the same ones used by Similar Issues and
 * Student 360; this route only supplies the micro-assessment evidence and
 * starts at Recommended. It never runs while results are merely viewed. */
defineRoute('post', '/faculty/micro-assessments/:id/intervention', ({ params, body }) => {
  const assessment = storedAssessment(params.id)
  const results = computeMicroAssessmentResults(
    assessment,
    readAttempts().filter((attempt) => attempt.assessmentId === assessment.id)
  )
  const recommendation = results.interventionRecommendation
  if (!recommendation) fail('No weak concept has been detected for this assessment.', { field: 'intervention' })
  const requestedStudentIds = unique(body?.studentIds ?? assessment.target?.studentIds)
  if (!requestedStudentIds.length) fail('Select at least one student for the suggested intervention.', { field: 'studentIds' })
  const knownStudents = new Map(facultyStudents.map((student) => [student.id, student]))
  if (requestedStudentIds.some((id) => !knownStudents.has(id) || !assessment.target?.studentIds?.includes(id))) {
    fail('Intervention students must come from this assessment audience.', { field: 'studentIds' })
  }
  const interventionId = `micro-${assessment.id}-${String(recommendation.concept).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  const overrides = readStatus()
  if (overrides[interventionId]?.status && overrides[interventionId].status !== 'Dismissed') {
    return {
      ok: true,
      created: false,
      intervention: overrides[interventionId],
      note: 'This recommendation already uses the existing Intervention lifecycle.',
    }
  }
  const conceptRow = results.conceptPerformance.find((item) => item.concept === recommendation.concept)
  const students = requestedStudentIds.map((studentId) => ({
    studentId,
    name: knownStudents.get(studentId).name,
    accuracy: conceptRow?.accuracy ?? null,
    evidence: { questions: conceptRow?.responses ?? 0, incorrect: (conceptRow?.responses ?? 0) - (conceptRow?.correct ?? 0) },
  }))
  const group = {
    id: interventionId,
    domain: assessment.domain === 'university' ? 'University' : 'Competitive',
    examFamily: assessment.examFamily,
    subject: assessment.subject,
    chapter: assessment.chapter,
    issueType: 'Micro-Assessment Concept Gap',
    priority: 'High',
    students,
    studentCount: students.length,
    evidence: {
      students: students.length,
      subject: assessment.subject,
      chapter: assessment.chapter,
      issueType: 'Micro-Assessment Concept Gap',
      avgAccuracy: conceptRow?.accuracy ?? null,
      questions: conceptRow?.responses ?? 0,
      incorrect: (conceptRow?.responses ?? 0) - (conceptRow?.correct ?? 0),
      skipped: 0,
      attempts: 1,
      affectedExams: 1,
      persistence: 1,
      trend: 'Micro-assessment result',
    },
    recommendation: {
      title: 'Targeted Practice',
      actions: [`Create ${recommendation.questions} ${recommendation.difficulty.toLowerCase()} questions for ${recommendation.concept}`],
      detail: recommendation.message,
    },
    whyDetected: recommendation.message,
  }
  const intervention = buildInterventionFromGroup(group, {
    source: 'AI Micro-Assessment Studio',
    title: `${assessment.topic} · ${recommendation.concept} practice`,
    studentIds: requestedStudentIds,
    objectives: [`Improve ${recommendation.concept} accuracy after ${assessment.title}.`],
    practiceConfig: {
      type: 'Targeted Practice',
      count: recommendation.questions,
      difficulty: recommendation.difficulty,
      duration: 15,
      questionType: 'Any',
      includePyq: false,
      selectionLevel: 'subject',
    },
    status: 'Recommended',
    createdBy: 'Dr. Meera Krishnan',
  })
  intervention.microAssessmentId = assessment.id
  intervention.microAssessmentTitle = assessment.title
  intervention.targetConcept = recommendation.concept
  /* The existing lifecycle store indexes persisted records through the
     interventionGroup wrapper (the same shape used by Similar Issues). */
  intervention.interventionGroup = group
  overrides[interventionId] = intervention
  writeStatus(overrides)
  return {
    ok: true,
    created: true,
    intervention,
    note: 'Created in the existing Intervention lifecycle at Recommended. Faculty approval is still required; nothing was assigned automatically.',
  }
})

/* ---------------- Student formative-assessment surface ---------------- */
defineRoute('get', '/student/micro-assessments', ({ params }) => {
  const studentId = studentIdFrom(params)
  const attempts = readAttempts().filter((attempt) => attempt.studentId === studentId)
  const items = readAssessments()
    .filter((assessment) => assessment.target?.studentIds?.includes(studentId))
    .map((assessment) => {
      const status = attempts.find((attempt) => attempt.assessmentId === assessment.id)?.status
      return {
        id: assessment.id,
        title: assessment.title,
        faculty: 'Dr. Meera Krishnan',
        subject: assessment.subject,
        chapter: assessment.chapter,
        topic: assessment.topic,
        domain: assessment.domain,
        examFamily: assessment.examFamily,
        questionCount: assessment.questionCount,
        duration: assessment.duration,
        deadline: assessment.deadline,
        status: status === 'completed' ? 'Completed' : status === 'in_progress' ? 'In Progress' : 'Not Started',
      }
    })
  return { items, count: items.length, studentId }
})

defineRoute('get', '/student/micro-assessments/:id', ({ params }) => {
  const assessment = storedAssessment(params.id)
  const studentId = studentIdFrom(params)
  if (!assessment.target?.studentIds?.includes(studentId)) fail('This micro-assessment is not assigned to this student.', {}, 403)
  const attempts = readAttempts().filter((attempt) => attempt.assessmentId === assessment.id && attempt.studentId === studentId)
  return {
    assessment,
    studentId,
    attempt: attempts.sort((a, b) => String(b.updatedAt ?? b.submittedAt ?? '').localeCompare(String(a.updatedAt ?? a.submittedAt ?? '')))[0] ?? null,
  }
})

defineRoute('post', '/student/micro-assessments/:id/attempts', ({ params, body }) => {
  const assessment = storedAssessment(params.id)
  const studentId = studentIdFrom(params, body)
  if (!assessment.target?.studentIds?.includes(studentId)) fail('This micro-assessment is not assigned to this student.', {}, 403)
  const status = body?.status ?? 'completed'
  if (!['in_progress', 'completed'].includes(status)) fail('Attempt status must be in_progress or completed.')
  const answers = body?.answers && typeof body.answers === 'object' ? body.answers : {}
  if (status === 'completed' && !Object.keys(answers).length) fail('Add at least one response before submitting.')
  const attempt = {
    id: `${assessment.id}-attempt-${studentId}`,
    assessmentId: assessment.id,
    studentId,
    status,
    answers,
    startedAt: body?.startedAt ?? '2026-08-25T09:15:00.000Z',
    submittedAt: status === 'completed' ? '2026-08-25T09:30:00.000Z' : null,
    updatedAt: '2026-08-25T09:30:00.000Z',
    source: 'micro-assessment',
    mode: 'formative-micro-assessment',
  }
  const attempts = readAttempts().filter((item) => !(item.assessmentId === assessment.id && item.studentId === studentId))
  attempts.unshift(attempt)
  writeAttempts(attempts)
  const results = computeMicroAssessmentResults(assessment, [attempt])
  return {
    ok: true,
    attempt,
    summary: {
      status: status === 'completed' ? 'Completed' : 'In Progress',
      accuracy: status === 'completed' ? results.averageAccuracy : null,
    },
    note: 'Stored as a formative micro-assessment attempt; official ExamAttempt analytics were not changed.',
  }
})

export { ASSESSMENTS_KEY, ATTEMPTS_KEY, readAssessments, readAttempts }

export default {
  ASSESSMENTS_KEY,
  ATTEMPTS_KEY,
  readAssessments,
  readAttempts,
}
