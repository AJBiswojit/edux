/**
 * MediXO EduX — Faculty Command Center · 7. Course Progress.
 * Premium progress indicators per course — completion, subject, chapters,
 * teaching, revision and lab progress — all derived.
 */

import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen } from 'lucide-react'
import { ChartCard } from '@/components/shared/chart-card'
import { Badge, Button } from '@/components/ui'

function CourseProgress({ data }) {
  const courses = data.derived.dashboard?.courseProgress ?? []
  return (
    <ChartCard
      title="Course progress"
      subtitle="Completion · teaching · revision · chapters · labs"
      className="h-full"
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link to="/faculty/courses">Course overview <ArrowRight className="h-3.5 w-3.5" /></Link>
        </Button>
      }
    >
      <div className="space-y-5">
        {courses.map((c) => (
          <div key={c.courseCode}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-[13px] font-bold text-slate-800 dark:text-slate-100">
                <BookOpen className="h-4 w-4 text-indigo-500" /> {c.courseCode} · {c.title}
              </p>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-bold text-indigo-600 dark:text-indigo-400">{c.completion}%</span>
                <Badge variant="outline" size="sm">{c.teachingProgress}% taught</Badge>
              </div>
            </div>

            {/* completion bar */}
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-700" style={{ width: `${c.completion}%` }} />
            </div>

            {/* micro progress rows */}
            <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
              {[
                { label: 'Subject', value: c.subjectCompletion },
                { label: 'Chapters', value: c.chapterCompletion },
                { label: 'Revision', value: c.revisionProgress },
                { label: 'Labs', value: c.labProgress },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-1.5">
                  <span className="w-14 shrink-0 text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">{m.label}</span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${m.value == null ? 'bg-slate-200 dark:bg-slate-700' : 'bg-gradient-to-r from-indigo-400 to-teal-400'}`}
                      style={{ width: `${m.value ?? 0}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {m.value != null ? `${m.value}%` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}

export { CourseProgress }
export default CourseProgress
