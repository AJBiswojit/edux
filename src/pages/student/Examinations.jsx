import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, BarChart3, BrainCircuit, CalendarDays, ClipboardList, Sparkles, Target, Timer } from 'lucide-react'
import { useAdmitCard } from '@/services/extra'
import { useStudentIntelligence } from '@/services/intelligence'
import { useExamAgentExams } from '@/services/exam-agent'
import { useStudentInterventions } from '@/services/faculty-interventions'
import { useMasterStudentProfile } from '@/services/intelligence'
import { PageHeader } from '@/components/shared/page-header'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent, useToast } from '@/components/ui'
import { UpcomingExamCard, ExamDetailsDialog, ReadinessTab, MockTestsContent } from '@/components/exam-workspace'

const CATEGORIES = [
  { id: 'All', label: 'All exams' },
  { id: 'University', label: 'University' },
  { id: 'Competitive', label: 'Competitive' },
]

/**
 * Examinations — Examination Intelligence Workspace.
 * · Upcoming Examinations (enhanced cards + details dialog)
 * · Mock Tests (university & competitive)
 * · 🎯 AI Exam Readiness (flagship, from the Student Intelligence Foundation)
 * Past Results remain available in Performance & AI and AI Exam Analysis.
 */
function Examinations() {
  const { data: admitData } = useAdmitCard()
  const { data: intel, isLoading: intelLoading, isError: intelError, refetch: refetchIntel } = useStudentIntelligence()
  const { data: agentExamsData } = useExamAgentExams()
  const { data: masterProfile } = useMasterStudentProfile()
  const { data: studentInterventionsData } = useStudentInterventions(masterProfile?.id ?? 'u_stu_001')
  const [selected, setSelected] = useState(null)
  const [category, setCategory] = useState('All')
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') ?? 'upcoming')
  const toast = useToast()

  /* AI Exam Agent practice papers (counts derived from the agent dataset) */
  const agentExams = agentExamsData?.items ?? []
  const agentCounts = {
    University: agentExams.filter((e) => e.type === 'University').length,
    JEE: agentExams.filter((e) => e.type === 'JEE').length,
    NEET: agentExams.filter((e) => e.type === 'NEET').length,
  }

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t) setTab(t)
  }, [searchParams])

  if (intelLoading) return <DashboardSkeleton cards={2} />
  if (intelError) return <ErrorState onRetry={() => refetchIntel()} />

  /* Phase 27.3: the upcoming list comes from the foundation (was /student/exams) —
     university and competitive exams now share ONE source with readiness, calendar and deadlines. */
  const items = [
    ...(intel.derived?.university?.examinations?.university ?? []),
    ...(intel.derived?.university?.examinations?.competitive ?? []),
  ]
  const upcoming = items.filter((e) => e.status === 'Upcoming' || e.status === 'Scheduled')
  const university = upcoming.filter((e) => e.category === 'University')
  const competitive = upcoming.filter((e) => e.category === 'Competitive')
  const visible = category === 'All' ? upcoming : category === 'University' ? university : competitive
  const readiness = intel.derived.readiness

  const handleAddToPlanner = (exam) => {
    toast.success(exam.inPlanner ? 'Already in planner' : 'Added to planner', exam.inPlanner
      ? 'Revision sessions are already scheduled for this exam.'
      : 'AI has scheduled revision sessions for this exam.')
  }
  const handleAddToCalendar = (exam) => {
    toast.success('Added to calendar', `${exam.title} — ${exam.date.slice(0, 10)} · ${exam.duration}.`)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Academics · Examinations"
        title="Examinations"
        description="Your examination intelligence workspace — university and competitive assessments, mock tests, and AI-powered readiness for every paper."
        breadcrumbs={[{ label: 'Student' }, { label: 'Examinations' }]}
        actions={<Badge variant="gradient" className="px-3 py-1"><CalendarDays className="h-3 w-3" /> {university.length} University · {competitive.length} Competitive</Badge>}
      />

      {/* My Interventions entry (Phase 6 — prototype assignments) */}
      {studentInterventionsData?.count > 0 && (
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-teal-200/60 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-indigo-500/10 p-5 ring-1 ring-teal-500/10 dark:border-teal-500/25 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-[14px] font-bold text-slate-900 dark:text-white">
                My Interventions
                <Badge variant="gradient" size="sm">{studentInterventionsData.count} assigned</Badge>
              </p>
              <p className="mt-0.5 max-w-xl text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
                Your faculty has assigned you targeted practice. Complete it and any re-test — tracked separately from official exams.
              </p>
            </div>
          </div>
          <Link to="/student/interventions">
            <Button size="sm" className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:brightness-110">Open interventions <ArrowRight className="h-3.5 w-3.5" /></Button>
          </Link>
        </div>
      )}

      {/* AI Exam Conducting Agent entry */}
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-indigo-200/60 bg-gradient-to-r from-indigo-600/10 via-blue-600/10 to-violet-600/10 p-5 ring-1 ring-indigo-500/10 dark:border-indigo-500/25 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/30">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-[14px] font-bold text-slate-900 dark:text-white">
              AI Exam Conducting Agent
              <Badge variant="gradient" size="sm"><Sparkles className="h-2.5 w-2.5" /> New</Badge>
            </p>
            <p className="mt-0.5 max-w-xl text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
              Take one of {agentCounts.University + agentCounts.JEE + agentCounts.NEET} practice papers
              ({agentCounts.University} university · {agentCounts.JEE} JEE Main · {agentCounts.NEET} NEET UG) with a live timer
              and real-time question intelligence, then get an AI performance report with strengths, weaknesses and
              recommendations. Interaction-only analysis — no camera or microphone.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link to="/student/exam-agent">
            <Button size="sm">Open AI Exam Agent <ArrowRight className="h-3.5 w-3.5" /></Button>
          </Link>
          <Link to="/student/exam-agent?mode=demo">
            <Button size="sm" variant="outline" className="bg-white/70 backdrop-blur dark:bg-slate-900/70"><Sparkles className="h-3.5 w-3.5" /> Demo monitoring</Button>
          </Link>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-1 flex w-full flex-wrap justify-start sm:w-auto">
          <TabsTrigger value="upcoming"><ClipboardList className="h-3.5 w-3.5" /> Upcoming Examinations ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="mock"><Timer className="h-3.5 w-3.5" /> Mock Tests</TabsTrigger>
          <TabsTrigger value="readiness"><Target className="h-3.5 w-3.5" /> 🎯 AI Exam Readiness</TabsTrigger>
        </TabsList>

        {/* ---------------- Upcoming Examinations ---------------- */}
        <TabsContent value="upcoming">
          {/* Segmented control */}
          <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-bold transition-all ${
                  category === c.id
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300'
                }`}
              >
                {c.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${category === c.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                  {c.id === 'All' ? upcoming.length : c.id === 'University' ? university.length : competitive.length}
                </span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No {category === 'University' ? 'university' : 'competitive'} exams scheduled</p>
              <p className="mt-1 text-xs text-slate-400">Switch the segment to see the other category.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {visible.map((e, i) => (
                <div key={e.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-fade-up">
                  <UpcomingExamCard
                    exam={e}
                    onViewDetails={() => setSelected(e)}
                    onAddToPlanner={() => handleAddToPlanner(e)}
                    onAddToCalendar={() => handleAddToCalendar(e)}
                  />
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-[11.5px] font-medium text-slate-400 dark:bg-slate-800/60">
            Admit cards / hall tickets are available inside each exam's <span className="font-bold text-slate-600 dark:text-slate-300">View details</span> dialog — never printed on the card itself.
          </p>

          {/* Past results relocated */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-gradient-to-r from-indigo-600/10 to-teal-500/10 p-5 ring-1 ring-indigo-500/15">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-md dark:bg-slate-900 dark:text-indigo-300">
                <BarChart3 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">Looking for past results?</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Completed examination results now live in <span className="font-bold text-slate-600 dark:text-slate-300">Performance &amp; AI</span> and the deep analysis in <span className="font-bold text-slate-600 dark:text-slate-300">AI Exam Analysis</span>.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/student/performance-accuracy">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[11.5px] font-bold text-slate-600 transition-all hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                  <BarChart3 className="h-3.5 w-3.5" /> Performance &amp; AI <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
              <Link to="/student/exam-analysis">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3.5 py-2 text-[11.5px] font-bold text-white shadow-md shadow-indigo-500/25 transition-all hover:brightness-110">
                  <BrainCircuit className="h-3.5 w-3.5" /> AI Exam Analysis <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          </div>
        </TabsContent>

        {/* ---------------- Mock Tests ---------------- */}
        <TabsContent value="mock">
          <MockTestsContent />
        </TabsContent>

        {/* ---------------- AI Exam Readiness ---------------- */}
        <TabsContent value="readiness">
          <ReadinessTab readiness={readiness} />
        </TabsContent>
      </Tabs>

      {/* Exam details + admit card dialog */}
      <ExamDetailsDialog
        exam={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        admit={admitData}
        onDownload={() => toast.success('Downloading…', `admit-card-${selected?.id}.pdf saved.`)}
      />
    </div>
  )
}

export { Examinations }
export default Examinations
