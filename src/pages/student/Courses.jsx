import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, GraduationCap, PlayCircle } from 'lucide-react'
import { useStudentIntelligence } from '@/services/intelligence'
import { PageHeader } from '@/components/shared/page-header'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Card, Progress } from '@/components/ui'
import { Reveal } from '@/components/shared/section-heading'

/**
 * Course card grid — reused by the standalone Courses page and the
 * Academics hub (Courses tab). Never duplicate this markup.
 */
export function CourseGrid({ courses }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {courses.map((c, i) => (
        <Reveal key={c.id} delay={i * 0.05}>
          <Link to={`/student/courses/${c.id}`} className="group block h-full">
            <Card className="flex h-full flex-col overflow-hidden p-0 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-lift">
              {/* header band */}
              <div className="relative flex items-center justify-between overflow-hidden p-6 pb-5" style={{ background: `linear-gradient(135deg, ${c.color}1a, ${c.color}08)` }}>
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-transform duration-500 group-hover:scale-150" style={{ background: c.color }} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: c.color }}>{c.code}</p>
                  <h3 className="mt-1 max-w-[220px] text-[16px] font-bold leading-snug text-slate-900 dark:text-white">{c.title}</h3>
                  <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                    <GraduationCap className="mr-1 inline h-3 w-3" />{c.instructor}
                  </p>
                </div>
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}bb)` }}>
                  <BookOpen className="h-6 w-6" />
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6 pt-4">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span>{c.completed}/{c.lessons} lessons done</span>
                  <span style={{ color: c.color }}>{c.progress}%</span>
                </div>
                <Progress value={c.progress} className="mt-2" gradient={c.color} />
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" size="sm">{c.credits} credits</Badge>
                    {c.grade && <Badge variant="success" size="sm">Grade {c.grade}</Badge>}
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 transition-transform duration-300 group-hover:translate-x-1 dark:text-indigo-400">
                    Continue <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        </Reveal>
      ))}
    </div>
  )
}

function Courses() {
  /* Phase 27.3: courses come from the Student Intelligence Foundation (was /student/courses). */
  const { data: intel, isLoading, isError, refetch } = useStudentIntelligence()
  const courses = intel?.derived?.university?.courses ?? []

  if (isLoading) return <DashboardSkeleton cards={3} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      <PageHeader
        eyebrow="Academics · Courses"
        title="My courses"
        description="Your enrolled courses this semester — continue where you left off."
        breadcrumbs={[{ label: 'Student' }, { label: 'Courses' }]}
        actions={<Badge variant="gradient" className="px-3 py-1">{courses.length} enrolled</Badge>}
      />

      <CourseGrid courses={courses} />

      {/* featured */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500 p-8 text-white shadow-lift sm:p-10">
          <div className="bg-dots absolute inset-0 opacity-15" />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">AI Recommendation</p>
              <h3 className="mt-2 text-xl font-bold">Advanced SQL & Query Tuning — 88% match for your goals</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/85">
                Recommended by your learning path: it closes the gap between your DBMS internals and real-world systems. 5 hours · certificate included.
              </p>
            </div>
            <Link to="/student/learning-path" className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-bold ring-1 ring-white/30 transition-all hover:bg-white/25">
              <PlayCircle className="h-4 w-4" /> View learning path
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export { Courses }
export default Courses
