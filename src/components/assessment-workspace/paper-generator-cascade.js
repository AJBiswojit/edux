/**
 * Question Paper Studio (Assessment Workspace) — feature-declared filter
 * cascade.
 *
 * Dependency reality (from the question foundation datasets):
 *   - Course → Subject: a course is named "<code> — <name>" and implies its
 *     subject code (existing studio behaviour — picking a course selects
 *     that subject).
 *   - Subject → Chapter → Topic: chapters/topics are derived from the
 *     actual question pools (competitive PYQ records scoped by exam family,
 *     or the university question bank) — never a hardcoded list.
 *   - Mode (University/Competitive) and exam (JEE/NEET) are context
 *     switches (chips). They are NOT cascade keys; they change the
 *     `deriveOptions` closure, which re-sanitizes state — a subject that
 *     does not exist under the new context is cleared, one that does exist
 *     (e.g. Physics under both JEE and NEET) is kept.
 *
 * Cleared values use the studio's "All …" sentinels.
 */

export const PAPER_GENERATOR_DEPENDENCIES = {
  course: [],
  subject: ['course'],
  chapter: ['subject'],
  topic: ['chapter'],
}

export const PAPER_GENERATOR_EMPTY = {
  subject: 'All subjects',
  chapter: 'All chapters',
  topic: 'All topics',
}

/**
 * @param {Object} ctx
 * @param {'University'|'Competitive'} ctx.mode
 * @param {'JEE'|'NEET'} ctx.exam
 * @param {object|null} ctx.cfg        paper-generator config (courses, competitiveSubjects, …)
 * @param {Array}  [ctx.bankQuestions]   DEPRECATED — Phase 9 backend-ready, not used
 * @param {Array}  [ctx.compQuestions]   DEPRECATED — Phase 9 backend-ready, not used
 *
 * Phase 9: Cascade is backend-oriented. Options derive from cfg only,
 * not from seeded question pools. Domain isolation via domain+examFamily.
 */
export function buildPaperGeneratorCascade({ mode, exam, cfg = null, bankQuestions = [], compQuestions = [] }) {
  const competitive = mode === 'Competitive'

  // Phase 9: backend-oriented — do NOT filter local pools
  // If pools are provided (legacy Question Intelligence), still support them for backward compat
  const hasPools = (bankQuestions?.length ?? 0) > 0 || (compQuestions?.length ?? 0) > 0
  const examFamily = exam === 'NEET' ? 'NEET UG' : 'JEE Main'
  const scoped = hasPools ? (competitive ? compQuestions.filter((q) => q.exam === examFamily) : bankQuestions) : []
  const bySubject = (values) => hasPools ? scoped.filter((q) => values.subject === PAPER_GENERATOR_EMPTY.subject || q.subject === values.subject) : []

  return {
    dependencies: PAPER_GENERATOR_DEPENDENCIES,
    emptyValues: { subject: PAPER_GENERATOR_EMPTY.subject, chapter: PAPER_GENERATOR_EMPTY.chapter, topic: PAPER_GENERATOR_EMPTY.topic },
    deriveOptions: (key, values) => {
      switch (key) {
        case 'course':
          return (cfg?.courses ?? ['CS501 — DSA', 'CS503 — OS', 'CS505 — ML'])
        case 'subject':
          if (competitive) {
            return ((cfg?.competitiveSubjects ?? {})[exam] ?? (exam === 'JEE' ? ['Physics', 'Mathematics', 'Chemistry'] : ['Physics', 'Chemistry', 'Biology']))
          }
          // University: prefer cfg.subjects, fallback to pool-derived if available, else generic
          if (cfg?.subjects?.length) return cfg.subjects
          if (hasPools) return [...new Set(bankQuestions.map((q) => q.subject))]
          return ['CS501', 'CS503', 'CS505', 'CS506']
        case 'chapter':
          if (hasPools) return [...new Set(bySubject(values).map((q) => q.chapter))]
          // Backend-oriented: chapters come from backend config or are empty (backend will filter)
          return cfg?.chapters?.[values.subject] ?? []
        case 'topic':
          if (!competitive && !hasPools) return []
          if (hasPools) {
            return [
              ...new Set(
                bySubject(values)
                  .filter((q) => values.chapter === PAPER_GENERATOR_EMPTY.chapter || q.chapter === values.chapter)
                  .map((q) => q.topic),
              ),
            ]
          }
          return cfg?.topics?.[values.chapter] ?? []
        default:
          return []
      }
    },
  }
}

export default buildPaperGeneratorCascade
