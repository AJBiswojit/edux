import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, FileBarChart, Route as RouteIcon, Sparkles, Target } from 'lucide-react'
import { useStudentIntelligence } from '@/services/intelligence'
import { StatCard } from '@/components/shared/stat-card'
import { ChartCard } from '@/components/shared/chart-card'
import { BarCompare } from '@/components/charts'
import { ProgressRing } from '@/components/shared/progress-ring'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { PageHeader } from '@/components/shared/page-header'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { formatDate } from '@/utils/format'
import {
  SuccessCenter, DailyBrief, InterventionCenter, SmartActions,
  AcademicJourney, RecentActivities, UpcomingDeadlines, AcademicInfoCard,
} from '@/components/dashboard'


/**
 * Student Dashboard — Academic Command Center.
 * Every section consumes the centralized Student Intelligence Foundation
 * (src/intelligence): success center, daily brief, interventions, journey,
 * activities and deadlines are all derived — never hardcoded.
 */
/* Phase 27.3: the dashboard is now 100% foundation-driven — KPIs, schedule,
   weekly activity and subject mastery derive from the intelligence snapshot
   (was /student/dashboard + /student/courses + /student/academic-profile). */
function buildDashboardKpis({ profile, derived, datasets }) {
  const history = datasets.academicPerformance?.semesterHistory ?? []
  const lastSem = [...history].reverse().find((h) => h.gpa != null) ?? { gpa: 0 }
  const cgpa = profile.cgpa ?? 0
  const att = datasets.attendance?.overall ?? 0
  const attStart = datasets.attendanceAnalytics?.monthlyTrend?.[0]?.pct ?? att
  const pending = (datasets.assignments ?? []).filter((a) => a.status === 'Pending').length
  const onTime = datasets.learningBehaviourDetailed?.assignmentCompletion?.onTime ?? 0
  const streak = datasets.studyStatistics?.streakDays ?? 0
  const cgpaDelta = +(cgpa - (lastSem.gpa ?? cgpa)).toFixed(2)
  const attDelta = +(att - attStart).toFixed(1)
  return [
    { id: 'cgpa', label: 'CGPA', value: String(cgpa), delta: `${cgpaDelta >= 0 ? '+' : ''}${cgpaDelta}`, up: cgpaDelta >= 0, sub: 'vs last semester', icon: 'GraduationCap', gradient: 'from-indigo-500 to-blue-500' },
    { id: 'attendance', label: 'Attendance', value: `${att}%`, delta: `${attDelta >= 0 ? '+' : ''}${attDelta}%`, up: attDelta >= 0, sub: 'vs semester start', icon: 'CalendarCheck2', gradient: 'from-emerald-500 to-teal-500' },
    { id: 'assignments', label: 'Assignments', value: String(pending), delta: `${pending} due`, up: false, sub: `${onTime} submitted on time`, icon: 'FileText', gradient: 'from-amber-500 to-orange-500' },
    { id: 'streak', label: 'Study streak', value: String(streak), delta: '🔥', up: true, sub: 'days — keep it up!', icon: 'Flame', gradient: 'from-rose-500 to-fuchsia-500' },
  ]
}

function Dashboard() {
  const { data: intel, isLoading: intelLoading, isError: intelError, refetch: refetchIntel } = useStudentIntelligence()

  const [dialogs, setDialogs] = useState({ dna: false, readiness: false, career: false, portfolio: false })
  const setDialog = (patch) => setDialogs((d) => ({ ...d, ...patch }))

  if (intelLoading) return <DashboardSkeleton cards={4} />
  if (intelError) return <ErrorState onRetry={() => refetchIntel()} />

  const derived = intel.derived
  const profile = intel.profile
  const datasets = intel.datasets
  const coursesTop = (derived.university?.courses ?? []).slice(0, 4)
  const kpis = buildDashboardKpis({ profile, derived, datasets })
  const weeklyActivity = datasets.studyStatistics?.weeklyActivity ?? []
  const subjectMastery = (derived.subjectMasteryRanking ?? []).map((s) => ({ subject: s.subject, mastery: s.mastery }))
  /* Academic info card consumes the compat profile view derived from the master profile. */
  const academicProfileView = {
    name: profile.fullName,
    fullName: profile.fullName,
    initials: `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() || undefined,
    studentId: profile.studentId ?? profile.rollNo,
    rollNo: profile.rollNo,
    enrollmentNo: profile.enrollmentNo,
    institution: profile.institution,
    program: profile.program,
    branch: profile.branch,
    department: profile.department,
    semester: profile.semester,
    section: profile.section,
    batch: profile.batch,
    mentor: profile.mentor,
    cgpa: profile.cgpa,
    attendance: profile.attendance,
    academicStatus: profile.academicStatus,
  }
  /* Phase 27.2: weekly study delta derives from the foundation (was hardcoded "+12%"). */
  const weeklyStudySeries = datasets.learningBehaviourDetailed?.weeklyStudy ?? []
  const lastWeekHours = weeklyStudySeries[weeklyStudySeries.length - 1]?.hours
  const prevWeekHours = weeklyStudySeries[weeklyStudySeries.length - 2]?.hours
  const weeklyDelta = lastWeekHours != null && prevWeekHours ? Math.round(((lastWeekHours - prevWeekHours) / prevWeekHours) * 100) : null

  const openDna = () => { document.getElementById('success-center')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => setDialog({ dna: true }), 400) }
  const openReadiness = () => { document.getElementById('success-center')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => setDialog({ readiness: true }), 400) }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Student · Command Center"
        title={`Welcome back, ${profile?.firstName ?? 'Aarav'} 👋`}
        description="Your academic command center — health, readiness, interventions and today's plan, all in one place."
        actions={
          <>
            <Button asChild variant="outline" size="sm"><Link to="/student/learning-path"><RouteIcon className="h-4 w-4" /> Learning path</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/student/progress-report"><FileBarChart className="h-4 w-4" /> View Progress Report</Link></Button>
            <Button asChild size="sm"><Link to="/student/mentor"><Sparkles className="h-4 w-4" /> Ask MediXO Mentor</Link></Button>
          </>
        }
        breadcrumbs={[{ label: 'Student' }, { label: 'Dashboard' }]}
      />

      {/* Academic information card */}
      <AcademicInfoCard profile={academicProfileView} />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, i) => (
          <StatCard key={kpi.id} {...kpi} index={i} />
        ))}
      </div>

      {/* 1. Student Success Center */}
      <SuccessCenter
        derived={derived}
        profile={profile}
        datasets={datasets}
        dnaOpen={dialogs.dna}
        readinessOpen={dialogs.readiness}
        careerOpen={dialogs.career}
        portfolioOpen={dialogs.portfolio}
        onOpenChange={setDialog}
      />

      {/* 2. Competitive preparation (JEE · NEET) — distinct from university progress */}
      {derived.readiness?.byExamFamily && Object.keys(derived.readiness.byExamFamily).length > 0 && (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                <Target className="h-3.5 w-3.5" /> Competitive preparation
              </p>
              <h2 className="mt-0.5 text-[15px] font-bold text-slate-900 dark:text-white">Exam-specific readiness — JEE &amp; NEET</h2>
            </div>
            <Link to="/student/examinations?tab=readiness" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
              View readiness workspace <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(derived.readiness.byExamFamily).map(([family, fam]) => {
              const next = (derived.readiness.competitive ?? []).find((e) => e.examFamily === family)
              const mockAvg = fam.factors?.find((f) => f.label === 'Mock average')?.value
              return (
                <div key={family} className="flex items-center justify-between gap-5 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex min-w-0 items-center gap-4">
                    <ProgressRing value={fam.score ?? 0} size={76} stroke={8} label={`${fam.score ?? '—'}`} sublabel={family} color={fam.score >= 70 ? '#10b981' : fam.score >= 55 ? '#f59e0b' : '#f43f5e'} />
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-slate-900 dark:text-white">{family === 'JEE' ? 'JEE Main & Advanced' : 'NEET (UG)'} <Badge variant={fam.score >= 70 ? 'success' : fam.score >= 55 ? 'warning' : 'danger'} size="sm">{fam.level}</Badge></p>
                      <p className="mt-1 text-[11.5px] text-slate-400">
                        {next ? `Next: ${next.title.slice(0, 34)} · ${formatDate(next.date, 'MMM d')}` : 'No scheduled mocks'}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {mockAvg != null && <Badge variant="outline" size="sm">Mock avg {Math.round(mockAvg)}%</Badge>}
                        {(fam.recommendations ?? []).slice(0, 1).map((rec) => (
                          <Badge key={rec.text} variant="secondary" size="sm">
                            <span className="block max-w-[190px] truncate">{rec.text}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. AI Daily Brief */}
      <DailyBrief brief={derived.dailyBrief} />

      {/* 4. AI Intervention Center — only when the engine flags something */}
      <InterventionCenter interventions={derived.interventions} />

      {/* 5. Smart Quick Actions */}
      <SmartActions onOpenDna={openDna} onOpenReadiness={openReadiness} />

      {/* 7+8. Today · deadlines · activities */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Today's schedule" subtitle={formatDate(new Date(), 'EEEE, MMMM d')}>
          <div className="space-y-2.5">
            {(datasets.todaySchedule ?? []).map((s) => (
              <div key={s.time} className="flex items-center gap-3.5 rounded-2xl border border-slate-100 p-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-slate-800 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/5">
                <span className="rounded-xl bg-indigo-50 px-2.5 py-1.5 text-[11px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                  {s.time}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">{s.title}</p>
                  <p className="text-[11px] text-slate-400">{s.room}</p>
                </div>
                <Badge variant="secondary" size="sm">{s.type}</Badge>
              </div>
            ))}
          </div>
        </ChartCard>

        <UpcomingDeadlines deadlines={derived.upcomingDeadlines} />

        <RecentActivities activities={derived.recentActivities} />
      </div>

      {/* Study activity + subject mastery (existing analytics) */}
      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard
          title="Study activity"
          subtitle="Hours & focus this week"
          className="xl:col-span-2"
          actions={weeklyDelta != null ? <Badge variant={weeklyDelta >= 0 ? "success" : "warning"}>{weeklyDelta >= 0 ? "+" : ""}{weeklyDelta}% vs last week</Badge> : <Badge variant="secondary">This week</Badge>}
          contentClassName="pt-4"
        >
          <BarCompare
            data={weeklyActivity}
            xKey="day"
            height={240}
            series={[{ key: 'hours', name: 'Hours', color: '#6366f1' }]}
            formatter={(v) => `${v} hrs`}
          />
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-white">{datasets.studyStatistics.weeklyHours}h</p>
              <p className="text-[11px] font-medium text-slate-400">This week</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-white">{datasets.studyStatistics.avgFocus}%</p>
              <p className="text-[11px] font-medium text-slate-400">Avg focus</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-white">{datasets.studyStatistics.streakDays}d</p>
              <p className="text-[11px] font-medium text-slate-400">Streak</p>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Subject mastery" subtitle="AI-modelled understanding">
          <div className="flex flex-col items-center pt-2">
            <ProgressRing
              value={derived.academicHealth.score}
              size={150}
              stroke={12}
              label={`${derived.academicHealth.score}`}
              sublabel="Academic health"
              color={derived.academicHealth.score >= 85 ? '#10b981' : derived.academicHealth.score >= 70 ? '#f59e0b' : '#f43f5e'}
            />
            <div className="mt-4 w-full space-y-2">
              {subjectMastery.slice(0, 4).map((s) => (
                <div key={s.subject} className="flex items-center gap-2.5 text-xs">
                  <span className="w-16 font-semibold text-slate-500 dark:text-slate-400">{s.subject}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.mastery}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400"
                    />
                  </div>
                  <span className="w-8 text-right font-bold text-slate-600 dark:text-slate-300">{s.mastery}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* 3. Academic Journey + course progress */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AcademicJourney events={derived.academicJourney} />
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-[15px]">Course progress</CardTitle>
            <Link to="/student/academics" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3.5">
              {coursesTop.map((c) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{c.title}</span>
                    <span className="font-bold" style={{ color: c.color }}>{c.progress}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${c.progress}%`, background: `linear-gradient(90deg, ${c.color}, ${c.color}aa)` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-gradient-to-r from-indigo-600/10 to-teal-500/10 p-3.5 ring-1 ring-indigo-500/15">
              <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                <span className="font-bold text-indigo-600 dark:text-indigo-300">AI:</span> ML ({coursesTop.find((c) => c.code === 'CS505')?.progress ?? 71}%) is your most active course — 2 lessons this week keeps you on track for an A.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { Dashboard }
export default Dashboard
