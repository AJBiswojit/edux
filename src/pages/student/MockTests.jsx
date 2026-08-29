/**
 * Mock Tests (legacy deep-link page) — keeps the /student/mock-tests route working.
 * Reuses the shared Examination Intelligence mock-tests workspace.
 */

import { PageHeader } from '@/components/shared/page-header'
import { MockTestsContent } from '@/components/exam-workspace'

function MockTests() {
  return (
    <div>
      <PageHeader
        eyebrow="Academics · Mock Tests"
        title="Mock tests · Backend-Ready"
        description="Timed, scored and analysed — fetched from backend via GET /student/mock-tests, no seeded fallback."
        breadcrumbs={[{ label: 'Student' }, { label: 'Mock Tests' }]}
      />
      <MockTestsContent />
    </div>
  )
}

export { MockTests, MockTestsContent }
export default MockTests
