/**
 * Faculty — Student Profile → 360° Student Intelligence (Phase 4+).
 *
 * Orchestration page: loads the 360 bundle, renders the profile header, KPI
 * section and tab navigation, and delegates each tab to a focused panel
 * component from `@/components/students-workspace/`. This file holds no
 * analytical UI — all panels live in student-workspace and read the derived
 * `s360` data directly (canonical attempts → engine → s360 → UI).
 *
 * Tabs: Overview · Examinations · Subject Intelligence · Chapter Intelligence
 * · Question Analysis · Time & Behaviour · Trends · Academic DNA
 */
import { useMemo, useState, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, BrainCircuit, ClipboardList, FileText,
  LayoutDashboard, Layers, ListChecks, Target, Timer, TrendingUp,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Button, Card, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import { Student360Panels } from '@/components/students-workspace/student-360-panels'
import { ExamHistoryTable } from '@/components/students-workspace/student-exam-history'
import { DOMAIN_BADGE, FAMILY_BADGE, STUDENT_STATUS_STYLES } from '@/constants/ui'
import {
  SubjectIntelligencePanel, SubjectDrilldownPanel,
  ChapterIntelligencePanel, QuestionAnalysisPanel,
} from '@/components/students-workspace/student-intelligence-tabs'
import {
  TimeBehaviourPanel, TrendsPanel, DnaPanel,
} from '@/components/students-workspace/student-profile-panels'
import { useFacultyStudent360 } from '@/services/faculty-students'
import { useFacultyStudentInterventions } from '@/services/faculty-interventions'

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'exams', label: 'Examinations', icon: ClipboardList },
  { id: 'subjects', label: 'Subject Intelligence', icon: Layers },
  { id: 'chapters', label: 'Chapter Intelligence', icon: ListChecks },
  { id: 'questions', label: 'Question Analysis', icon: FileText },
  { id: 'time', label: 'Time & Behaviour', icon: Timer },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'dna', label: 'Academic DNA', icon: BrainCircuit },
]

function StudentProfile() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useFacultyStudent360(studentId)
  const [tab, setTab] = useState('overview')
  const [domain, setDomain] = useState(null)
  const [examFilter, setExamFilter] = useState('All')
  const [family, setFamily] = useState('All')
  const { data: studentIvData } = useFacultyStudentInterventions(studentId)

  /* drilldown state for subject → chapter */
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [chapterContext, setChapterContext] = useState(null)
  const [questionContext, setQuestionContext] = useState(null)

  const activeDomain = useMemo(() => {
    if (domain) return domain
    if (data?.defaultDomain === 'University') return 'University'
    return (data?.attempts ?? []).find((a) => a.examFamily === 'JEE' || a.examFamily === 'NEET')?.examFamily ?? 'University'
  }, [domain, data])

  const history = useMemo(() => {
    let items = data?.attempts ?? []
    if (examFilter !== 'All') items = items.filter((a) => a.examMode === examFilter)
    if (family !== 'All') items = items.filter((a) => a.examFamily === family)
    return items
  }, [data, examFilter, family])

  const handleSubjectSelect = useCallback((subject) => {
    setSelectedSubject(subject)
  }, [])

  const handleChapterSelect = useCallback((chapter) => {
    setChapterContext({ subject: selectedSubject, chapter })
    setTab('chapters')
  }, [selectedSubject])

  if (isLoading) return <DashboardSkeleton cards={3} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const s = data?.student ?? {}
  const o = data?.overview ?? {}
  const atts = data?.attempts ?? []
  const latest = atts[0] ?? null

  return (
    <div>
      <button onClick={() => navigate('/faculty/my-students')} className="mb-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-bold text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        <ArrowLeft className="h-3.5 w-3.5" /> My Students
      </button>

      <PageHeader
        eyebrow="Faculty · Students · 360° Intelligence"
        title={`${s.name ?? 'Student'} — 360° Academic Intelligence`}
        description={`Roll ${s.roll} · ${s.batchName ?? '—'} — every insight derived from canonical exam attempts (demo excluded).`}
        breadcrumbs={[{ label: 'Faculty' }, { label: 'My Students', to: '/faculty/my-students' }, { label: s.name ?? 'Profile' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {(data?.uniCount > 0 || data?.compCount > 0) && (
              <div className="flex flex-wrap rounded-2xl border border-slate-200/80 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
                {[
                  ...(data?.uniCount > 0 ? ['University'] : []),
                  ...((data?.attempts ?? []).some((a) => a.examFamily === 'JEE') ? ['JEE'] : []),
                  ...((data?.attempts ?? []).some((a) => a.examFamily === 'NEET') ? ['NEET'] : []),
                ].map((d) => (
                  <button key={d} onClick={() => setDomain(d)}
                    className={`rounded-xl px-3.5 py-1.5 text-[11.5px] font-bold transition-all ${activeDomain === d ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                    {d}
                  </button>
                ))}
              </div>
            )}
            <Badge variant={STUDENT_STATUS_STYLES[data?.status] ?? 'secondary'} className="px-3 py-1">{data?.status}</Badge>
          </div>
        }
      />

      {/* Identity header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-600/20">
        <div className="bg-grid mask-fade-y pointer-events-none absolute inset-0 opacity-20" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15 text-lg font-bold ring-1 ring-white/25">
              {s.name?.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </span>
            <div>
              <p className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/70">
                <span>{s.roll}</span>·<span>ID {s.id}</span>·<span>{s.batchName}</span>
              </p>
              <h2 className="mt-1 text-xl font-bold">{s.name}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge variant={DOMAIN_BADGE[s.domain]} size="sm">{s.domain}</Badge>
                {s.examFamily && <Badge variant={FAMILY_BADGE[s.examFamily]} size="sm">{s.examFamily} · {data?.batch?.examLabel ?? ''}</Badge>}
                {s.domain === 'University' ? (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-white/20">
                    {s.program} · {s.course} · Sem {s.semester} · Sec {s.section}
                  </span>
                ) : (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-white/20">
                    {data?.batch?.examLabel ?? s.examFamily} · {s.academicSession}
                  </span>
                )}
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-white/20">{s.academicSession}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Exams', value: String(o.examsCompleted ?? atts.length) },
              { label: 'Latest accuracy', value: o.latestAccuracy != null ? `${o.latestAccuracy}%` : '—' },
              { label: 'Attempt rate', value: `${o.attemptRate ?? 0}%` },
              { label: 'Time efficiency', value: `${o.timeEfficiency ?? 0}%` },
              { label: 'Δ score', value: o.improvementDelta != null ? `${o.improvementDelta >= 0 ? '+' : ''}${o.improvementDelta}` : '—' },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl bg-white/10 px-4 py-2.5 text-center ring-1 ring-white/20">
                <p className="font-display text-lg font-bold">{m.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data?.attention && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200/70 bg-rose-50/70 p-4 dark:border-rose-500/25 dark:bg-rose-500/5">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
          <div>
            <p className="text-[13px] font-bold text-rose-800 dark:text-rose-200">Needs attention</p>
            <p className="mt-0.5 text-[12px] text-rose-700/80 dark:text-rose-300/80">{data.attentionReason ?? 'Derived from declining performance or low accuracy in recent exams.'}</p>
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => { setTab(v); if (v !== 'subjects') setSelectedSubject(null); if (v !== 'chapters') setChapterContext(null) }} className="mt-6">
        <TabsList className="mb-4 flex w-full flex-wrap justify-start sm:w-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}><t.icon className="h-3.5 w-3.5" /> {t.label}</TabsTrigger>
          ))}
        </TabsList>

        {/* ============ Overview ============ */}
        <TabsContent value="overview">
          <Student360Panels s360={data} studentId={studentId} domain={activeDomain} />
        </TabsContent>

        {/* ============ Examinations ============ */}
        <TabsContent value="exams">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
                  <ClipboardList className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Exam history
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">From canonical ExamAgent attempts — demo attempts excluded · official faculty history</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {['All', 'University', 'Competitive'].map((f) => (
                  <button key={f} onClick={() => { setExamFilter(f); setFamily('All') }}
                    className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all ${examFilter === f ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25' : 'border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'}`}>
                    {f === 'All' ? 'All' : f}
                  </button>
                ))}
                {examFilter === 'Competitive' && ['All', 'JEE', 'NEET'].map((f) => (
                  <button key={f} onClick={() => setFamily(f)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${family === f ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'}`}>
                    {f === 'All' ? 'All' : f}
                  </button>
                ))}
              </div>
            </div>
            {history.length ? (
              <div className="mt-4"><ExamHistoryTable attempts={history} studentId={studentId} /></div>
            ) : <p className="py-8 text-center text-xs text-slate-400">No exam history for this filter.</p>}
          </Card>
        </TabsContent>

        {/* ============ Subject Intelligence ============ */}
        <TabsContent value="subjects">
          {selectedSubject ? (
            <SubjectDrilldownPanel s360={data} domain={activeDomain} subject={selectedSubject}
              onSelectChapter={handleChapterSelect} onBack={() => setSelectedSubject(null)} />
          ) : (
            <SubjectIntelligencePanel s360={data} domain={activeDomain} onSelectSubject={handleSubjectSelect} />
          )}
        </TabsContent>

        {/* ============ Chapter Intelligence ============ */}
        <TabsContent value="chapters">
          <ChapterIntelligencePanel s360={data} domain={activeDomain} context={chapterContext}
            onNavigate={(ctx) => setChapterContext(ctx)} />
        </TabsContent>

        {/* ============ Question Analysis ============ */}
        <TabsContent value="questions">
          <QuestionAnalysisPanel s360={data} domain={activeDomain} context={questionContext} />
        </TabsContent>

        {/* ============ Time & Behaviour ============ */}
        <TabsContent value="time">
          <TimeBehaviourPanel s360={data} />
        </TabsContent>

        {/* ============ Trends ============ */}
        <TabsContent value="trends">
          <TrendsPanel s360={data} domain={activeDomain} />
        </TabsContent>

        {/* ============ Academic DNA ============ */}
        <TabsContent value="dna">
          <DnaPanel s360={data} domain={activeDomain} />
        </TabsContent>
      </Tabs>

      {/* Interventions (Phase 6) */}
      {(studentIvData?.items ?? []).length > 0 && (
        <Card className="mt-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
                <ClipboardList className="h-4 w-4 text-teal-600 dark:text-teal-400" /> Interventions
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">Assigned targeted practice & re-tests (prototype)</p>
            </div>
            <Link to="/faculty/my-students" className="text-[11.5px] font-bold text-indigo-600 hover:underline dark:text-indigo-300">Manage in Intervention Center →</Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(studentIvData?.items ?? []).map((iv) => (
              <Link key={iv.id} to="/faculty/my-students" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 px-3 py-2 text-[12px] font-semibold text-slate-700 transition-colors hover:border-teal-300 dark:border-slate-700 dark:text-slate-200">
                <Target className="h-3.5 w-3.5 text-teal-500" />
                {iv.title}
                <Badge variant={iv.status === 'Resolved' ? 'success' : iv.status === 'Improving' ? 'info' : iv.status === 'Persistent' ? 'danger' : 'secondary'} size="sm">{iv.status}</Badge>
                {iv.practiceDone && iv.practiceAccuracy != null && <Badge variant="outline" size="sm">{iv.practiceAccuracy}% practice</Badge>}
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/faculty/my-students">
          <Button variant="outline"><ArrowLeft className="h-4 w-4" /> My Students</Button>
        </Link>
        <Link to={`/faculty/my-students/${studentId}/exams/${latest?.id ?? ''}`}>
          <Button disabled={!latest}><BrainCircuit className="h-4 w-4" /> Latest analysis <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      </div>
      <p className="mt-4 text-[11px] font-medium text-slate-400">
        Status derived deterministically from this student's exam series — every insight is traceable to actual questions.
      </p>
    </div>
  )
}

export { StudentProfile }
export default StudentProfile
