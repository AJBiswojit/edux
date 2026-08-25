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
 * @param {Array}  ctx.bankQuestions   university question bank
 * @param {Array}  ctx.compQuestions   competitive PYQ records
 */
export function buildPaperGeneratorCascade({ mode, exam, cfg = null, bankQuestions = [], compQuestions = [] }) {
  const competitive = mode === 'Competitive'
  const examFamily = exam === 'NEET' ? 'NEET UG' : 'JEE Main'
  const scoped = competitive ? compQuestions.filter((q) => q.exam === examFamily) : bankQuestions
  const bySubject = (values) => scoped.filter((q) => values.subject === PAPER_GENERATOR_EMPTY.subject || q.subject === values.subject)

  return {
    dependencies: PAPER_GENERATOR_DEPENDENCIES,
    emptyValues: { subject: PAPER_GENERATOR_EMPTY.subject, chapter: PAPER_GENERATOR_EMPTY.chapter, topic: PAPER_GENERATOR_EMPTY.topic },
    /* The config/question datasets load asynchronously: while an option
       list is still empty, keep the current value (re-validated once the
       dataset arrives). University mode has no topic dimension. */
    deriveOptions: (key, values) => {
      switch (key) {
        case 'course':
          return (cfg?.courses ?? [])
        case 'subject':
          return competitive
            ? ((cfg?.competitiveSubjects ?? {})[exam] ?? [])
            : [...new Set(bankQuestions.map((q) => q.subject))]
        case 'chapter':
          return [...new Set(bySubject(values).map((q) => q.chapter))]
        case 'topic':
          if (!competitive) return []
          return [
            ...new Set(
              bySubject(values)
                .filter((q) => values.chapter === PAPER_GENERATOR_EMPTY.chapter || q.chapter === values.chapter)
                .map((q) => q.topic),
            ),
          ]
        default:
          return []
      }
    },
  }
}

export default buildPaperGeneratorCascade
