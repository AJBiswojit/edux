import { useMemo, useState } from 'react'
import { BookOpen, Download, Plus, Search, Users } from 'lucide-react'
import { useAdminCourses } from '@/services'
import { useCreateAdminCourse } from '@/services/extra'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Button, useToast } from '@/components/ui'

function Courses() {
  const { data, isLoading, isError, refetch } = useAdminCourses()
  const [dept, setDept] = useState('All')
  const toast = useToast()
  const createCourse = useCreateAdminCourse()
  const courses = (data?.courses ?? []).filter((c) => dept === 'All' || c.dept === dept)
  const deptCodes = ['All', ...new Set((data?.courses ?? []).map((c) => c.dept).filter(Boolean))]

  const columns = useMemo(() => [
    {
      key: 'title',
      label: 'Course',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-teal-500/10 text-indigo-600 ring-1 ring-indigo-500/15 dark:text-indigo-300">
            <BookOpen className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{c.title}</p>
            <p className="text-[11px] text-slate-400">{c.code} · {c.semester}</p>
          </div>
        </div>
      ),
    },
    { key: 'dept', label: 'Dept', render: (c) => <Badge variant="secondary" size="sm">{c.dept}</Badge> },
    { key: 'faculty', label: 'Faculty', render: (c) => <span className="text-slate-500 dark:text-slate-400">{c.faculty}</span> },
    {
      key: 'enrolled',
      label: 'Enrolled',
      sortable: true,
      render: (c) => (
        <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
          <Users className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" /> {c.enrolled}
        </span>
      ),
    },
    {
      key: 'passRate',
      label: 'Pass rate',
      sortable: true,
      render: (c) => <Badge variant={c.passRate == null ? 'secondary' : c.passRate >= 90 ? 'success' : c.passRate >= 85 ? 'warning' : 'danger'}>{c.passRate == null ? '—' : `${c.passRate}%`}</Badge>,
    },
    { key: 'credits', label: 'Credits', render: (c) => <span className="text-slate-500 dark:text-slate-400">{c.credits}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (c) => <Badge variant={c.status === 'Active' ? 'success' : 'secondary'}>{c.status}</Badge>,
    },
  ], [])

  if (isLoading) return <DashboardSkeleton cards={2} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      <PageHeader
        eyebrow="Management · Courses"
        title="Course catalogue"
        description={`${courses.length} courses — enrolment, faculty allocation and outcome health per programme.`}
        breadcrumbs={[{ label: 'Admin' }, { label: 'Courses' }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.info('Export unavailable', 'Catalogue export is not available yet.')}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm" onClick={async () => {
              const code = window.prompt('Course code')
              const name = window.prompt('Course title')
              if (!code || !name) return
              try {
                await createCourse.mutateAsync({ code, name })
                toast.success('Course created', `${code} saved.`)
              } catch (err) {
                toast.error('Create failed', err?.response?.data?.detail || 'Could not create course.')
              }
            }}>
              <Plus className="h-4 w-4" /> New course
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {deptCodes.map((d) => (
          <button
            key={d}
            onClick={() => setDept(d)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
              dept === d
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25'
                : 'border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={courses}
        searchKeys={['title', 'code', 'faculty']}
        searchPlaceholder="Search courses…"
        pageSize={8}
      />
    </div>
  )
}

export { Courses }
export default Courses
