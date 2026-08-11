/**
 * Faculty — Attempt Analysis (Phase 3).
 * Thin wrapper that renders the EXISTING AI Exam Analysis dashboard
 * (AnalysisDashboard — same component the student page uses) for a
 * student's attempt, via the faculty attempt-analysis endpoint. No
 * duplicate analysis engine or page was created.
 */
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge } from '@/components/ui'
import { AnalysisDashboard } from '@/pages/student/ExamAnalysis'
import { useFacultyAttemptAnalysis } from '@/services/faculty-students'

function FacultyAttemptAnalysis() {
  const { studentId, attemptId } = useParams()
  const { data, isLoading, isError, refetch } = useFacultyAttemptAnalysis(studentId, attemptId)

  if (isLoading) return <DashboardSkeleton cards={3} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      <PageHeader
        eyebrow="Faculty · Students · Attempt analysis"
        title={data?.meta?.examName ?? 'Attempt analysis'}
        description={`Reuses the AI Exam Analysis dashboard for this attempt — ${data?.meta?.pattern ?? ''} · ${data?.meta?.date ?? ''}`}
        breadcrumbs={[
          { label: 'Faculty' },
          { label: 'My Students', to: '/faculty/my-students' },
          { label: 'Student', to: `/faculty/my-students/${studentId}` },
          { label: 'Attempt analysis' },
        ]}
        actions={data?.meta?.examId ? <Badge variant="gradient" className="px-3 py-1">{data.meta.examId}</Badge> : undefined}
      />
      <Link to={`/faculty/my-students/${studentId}`} className="mb-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-bold text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to student profile
      </Link>
      <AnalysisDashboard data={data} subject="All Subjects" />
    </div>
  )
}

export { FacultyAttemptAnalysis }
export default FacultyAttemptAnalysis
