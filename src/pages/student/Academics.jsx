import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, CalendarCheck2, Download, FileArchive, FileText, GraduationCap, LayoutGrid, Library, PlayCircle, Sparkles, StickyNote, Target, TrendingUp } from 'lucide-react'
import { useStudentIntelligence } from '@/services/intelligence'
import { PageHeader } from '@/components/shared/page-header'
import { ChartCard } from '@/components/shared/chart-card'
import { ProgressRing } from '@/components/shared/progress-ring'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Button, Card, Progress, Tabs, TabsList, TabsTrigger, TabsContent, useToast } from '@/components/ui'
import { CourseGrid } from './Courses'
import { SubjectGrid } from './Subjects'

const TYPE_ICONS = {
  PDF: FileText,
  Book: BookOpen,
  Notes: StickyNote,
  Zip: FileArchive,
}

function Academics() {
  /* Phase 27.3: courses, subjects, progress and resources all come from the
     Student Intelligence Foundation (was /student/courses|subjects|academic-progress|academic-resources). */
  const { data: intel, isLoading, isError, refetch } = useStudentIntelligence()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') ?? 'overview')
  const toast = useToast()

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t) setTab(t)
  }, [searchParams])

  if (isLoading) return <DashboardSkeleton cards={3} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const university = intel?.derived?.university ?? {}
  const courses = university.courses ?? []
  const subjects = university.subjects ?? []
  const resources = university.resources ?? []
  const progress = university.progress ?? { overall: 0, courses: [], semesterTarget: 65, subjects: [] }
  /* Attendance derives from the university intelligence slice (Phase 27.2). */
  const attendanceOverall = university.attendance?.overall ?? null
  const totalCredits = subjects.reduce((a, s) => a + s.credits, 0)
  const avgProgress = Math.round(courses.reduce((a, c) => a + c.progress, 0) / Math.max(courses.length, 1))
  const topCourse = [...courses].sort((a, b) => b.progress - a.progress)[0]

  const OVERVIEW_STATS = [
    { label: 'Enrolled courses', value: String(courses.length), icon: BookOpen, grad: 'from-indigo-500 to-blue-500' },
    { label: 'Credits this sem', value: String(totalCredits), icon: GraduationCap, grad: 'from-teal-500 to-emerald-500' },
    { label: 'Avg course progress', value: `${avgProgress}%`, icon: TrendingUp, grad: 'from-amber-500 to-orange-500' },
    { label: 'Overall attendance', value: attendanceOverall != null ? `${attendanceOverall}%` : '—', icon: CalendarCheck2, grad: 'from-emerald-500 to-green-500' },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Academics · Overview"
        title="Academics"
        description="Your courses, subjects, study resources and syllabus progress — unified in one workspace."
        breadcrumbs={[{ label: 'Student' }, { label: 'Academics' }]}
        actions={<Badge variant="gradient" className="px-3 py-1"><Sparkles className="h-3 w-3" /> Sem 5 · 6 courses</Badge>}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-1 flex w-full flex-wrap justify-start sm:w-auto">
          <TabsTrigger value="overview"><LayoutGrid className="h-3.5 w-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="courses"><BookOpen className="h-3.5 w-3.5" /> Courses</TabsTrigger>
          <TabsTrigger value="subjects"><Library className="h-3.5 w-3.5" /> Subjects</TabsTrigger>
          <TabsTrigger value="resources"><FileText className="h-3.5 w-3.5" /> Resources</TabsTrigger>
          <TabsTrigger value="progress"><Target className="h-3.5 w-3.5" /> Progress</TabsTrigger>
        </TabsList>

        {/* ---------------- Overview ---------------- */}
        <TabsContent value="overview">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {OVERVIEW_STATS.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-3xl bg-gradient-to-br ${s.grad} p-5 text-white shadow-lg`}>
                <s.icon className="h-5 w-5 opacity-80" />
                <p className="mt-2 font-display text-2xl font-bold">{s.value}</p>
                <p className="text-[11px] font-medium text-white/75">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between p-6 pb-2">
                <p className="text-[15px] font-semibold text-slate-900 dark:text-white">Continue where you left off</p>
                <Badge variant="success" size="sm">AI pick</Badge>
              </div>
              <div className="p-6 pt-3">
                {topCourse && (
                  <div className="flex flex-wrap items-center gap-5 rounded-3xl border border-slate-100 p-5 transition-colors hover:border-indigo-200 dark:border-slate-800 dark:hover:border-indigo-500/30" style={{ background: `linear-gradient(135deg, ${topCourse.color}14, transparent)` }}>
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${topCourse.color}, ${topCourse.color}bb)` }}>
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: topCourse.color }}>{topCourse.code} · {topCourse.instructor}</p>
                      <h3 className="mt-0.5 text-[16px] font-bold text-slate-900 dark:text-white">{topCourse.title}</h3>
                      <div className="mt-2 flex items-center gap-3">
                        <Progress value={topCourse.progress} className="h-2 flex-1" gradient={topCourse.color} />
                        <span className="text-xs font-bold" style={{ color: topCourse.color }}>{topCourse.progress}%</span>
                      </div>
                    </div>
                    <Link to={`/student/courses/${topCourse.id}`}>
                      <Button size="sm"><PlayCircle className="h-4 w-4" /> Resume</Button>
                    </Link>
                  </div>
                )}
                <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                  {[
                    { label: 'Highest progress', value: `${Math.max(...courses.map((c) => c.progress), 0)}%`, icon: TrendingUp, to: '/student/academics?tab=progress', tint: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Best internal marks', value: `${Math.max(...subjects.map((s) => s.internal), 0)}`, icon: Target, to: '/student/academics?tab=subjects', tint: 'text-indigo-600 dark:text-indigo-300' },
                    { label: 'Attending this sem', value: attendanceOverall != null ? `${attendanceOverall}%` : '—', icon: CalendarCheck2, to: '/student/attendance', tint: 'text-teal-600 dark:text-teal-300' },
                  ].map((q) => (
                    <Link key={q.label} to={q.to} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3.5 transition-all hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-slate-800 dark:hover:border-indigo-500/30">
                      <q.icon className={`h-4 w-4 shrink-0 ${q.tint}`} />
                      <div className="min-w-0">
                        <p className={`text-sm font-bold ${q.tint}`}>{q.value}</p>
                        <p className="truncate text-[10.5px] font-medium text-slate-400">{q.label}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <ChartCard title="Semester health" subtitle={`vs your ${progress.semesterTarget}% target`}>
                <div className="flex flex-col items-center pt-2">
                  <ProgressRing value={avgProgress} size={140} stroke={12} label={`${avgProgress}%`} sublabel="Avg progress" />
                  <div className="mt-4 w-full space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">Credits earned</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{courses.reduce((a, c) => a + c.completed, 0)}/{courses.reduce((a, c) => a + c.lessons, 0)} lessons</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">Target pace</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{progress.semesterTarget}%</span>
                    </div>
                  </div>
                </div>
              </ChartCard>
              <div className="flex items-start gap-3 rounded-3xl bg-gradient-to-r from-indigo-600/10 to-teal-500/10 p-5 ring-1 ring-indigo-500/15">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                <p className="text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-indigo-600 dark:text-indigo-300">MediXO Mentor:</span> you are 6% behind your semester target — two focused DSA lessons this week will close the gap before midsems.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ---------------- Courses ---------------- */}
        <TabsContent value="courses">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">{courses.length} enrolled courses this semester — click any card to continue.</p>
            <Badge variant="secondary" size="sm">{courses.reduce((a, c) => a + c.credits, 0)} credits</Badge>
          </div>
          <CourseGrid courses={courses} />
        </TabsContent>

        {/* ---------------- Subjects ---------------- */}
        <TabsContent value="subjects">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">Live internal marks, attendance and syllabus coverage per subject.</p>
            <Badge variant="secondary" size="sm">{subjects.length} subjects · {totalCredits} credits</Badge>
          </div>
          <SubjectGrid subjects={subjects} />
        </TabsContent>

        {/* ---------------- Resources ---------------- */}
        <TabsContent value="resources">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resources.map((r, i) => {
              const Icon = TYPE_ICONS[r.type] ?? FileText
              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="group flex h-full flex-col p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
                    <div className="flex items-start gap-3.5">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md" style={{ background: `linear-gradient(135deg, ${r.color}, ${r.color}aa)` }}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: r.color }}>{r.course}</p>
                        <h3 className="mt-0.5 text-[13.5px] font-bold leading-snug text-slate-800 dark:text-slate-100">{r.title}</h3>
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                        <Badge variant="secondary" size="sm">{r.type}</Badge>
                        <span>{r.size}</span>·<span>{r.updated}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toast.success('Downloading…', `${r.title} saved.`)} aria-label={`Download ${r.title}`}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        {/* ---------------- Progress ---------------- */}
        <TabsContent value="progress">
          <div className="grid gap-6 lg:grid-cols-3">
            <ChartCard title="Syllabus progress" subtitle="Per course · lessons completed" className="lg:col-span-2">
              <div className="space-y-4">
                {progress.courses.map((c) => (
                  <div key={c.id}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate font-semibold text-slate-700 dark:text-slate-200">
                        <span className="mr-2 font-mono text-[10.5px]" style={{ color: c.color }}>{c.code}</span>{c.title}
                      </span>
                      <span className="flex items-center gap-2 font-bold" style={{ color: c.color }}>
                        {c.progress}% <span className="font-medium text-slate-400">· {c.lessons} lessons · {c.credits} cr</span>
                      </span>
                    </div>
                    <Progress value={c.progress} className="mt-1.5" gradient={c.color} />
                  </div>
                ))}
              </div>
            </ChartCard>

            <div className="space-y-6">
              <ChartCard title="Semester target" subtitle="AI-modelled completion pace">
                <div className="flex flex-col items-center pt-2">
                  <ProgressRing value={progress.overall} size={150} stroke={12} label={`${progress.overall}%`} sublabel="Overall" />
                  <p className="mt-4 text-center text-[11.5px] leading-relaxed text-slate-400">
                    You are <span className="font-bold text-amber-600 dark:text-amber-400">{progress.semesterTarget - progress.overall}%</span> behind the AI-modelled target pace. Extra DSA + Networks effort this week is recommended.
                  </p>
                </div>
              </ChartCard>
              <Card className="p-5">
                <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Grade snapshot</p>
                <div className="mt-3 space-y-2">
                  {progress.courses.filter((c) => c.grade).map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2 text-xs dark:bg-slate-800/60">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{c.code}</span>
                      <Badge variant="success" size="sm">Grade {c.grade}</Badge>
                    </div>
                  ))}
                </div>
                <Link to="/student/programs" className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400">
                  View degree roadmap <ArrowRight className="h-3 w-3" />
                </Link>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { Academics }
export default Academics
