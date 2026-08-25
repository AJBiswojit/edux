/**
 * MediXO EduX — frontend API layer.
 *
 * Architecture:
 *   UI → hook/service (src/services) → request() (src/api/client)
 *      → core/router (deterministic prototype adapter)  [CURRENT]
 *      → axios instance → real backend                  [FUTURE]
 *
 * Importing this module registers every endpoint of the prototype adapter.
 * Route modules are grouped by API domain (auth · platform · student ·
 * faculty · admin · parent · exam · interventions · ai) and expose exactly
 * the same endpoint contracts a backend will serve. No UI or page ever
 * imports a route module directly.
 */
import './auth/session'
import './platform/content'

/* Student */
import './student/academics'
import './student/exam-analysis'
import './student/mentor'
import './student/intelligence'

/* Exam Agent */
import './exam/exam-agent'

/* Faculty */
import './faculty/workspace'
import './faculty/reports'
import './faculty/ai-studio'
import './faculty/papers'
import './faculty/pyq-analysis'
import './faculty/students'
import './faculty/question-studio'
import './faculty/micro-assessments'
import './faculty/intelligence'

/* Admin */
import './admin/administration'
import './admin/people'
import './admin/intelligence'

/* Parent (portal disabled by FEATURE_FLAGS.parentPortal — endpoints kept) */
import './parent/routes'

/* Interventions (faculty + student surfaces, one store, one lifecycle) */
import './interventions/faculty'
import './interventions/student'

/* AI conversation surfaces */
import './ai/assistant'

export { dispatchRequest, hasRouteHandler, setResponseLatency } from './core/router'
export { default as request } from './client'
