/**
 * MediXO EduX — Faculty · Teaching Command Center.
 *
 * The executive faculty dashboard: Faculty Success Center, AI Faculty
 * Brief, Today's Teaching Schedule, AI Intervention Center, Teaching
 * Timeline, Pending Tasks, Course Progress, Students Requiring Attention,
 * Recent Activities and Smart Quick Actions.
 *
 * EVERY value derives from the centralized Faculty Intelligence Foundation
 * (`/faculty-intelligence/summary` → derived.dashboard) — the dashboard
 * contains no isolated mock values.
 */

import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useFacultyIntelligence } from '@/services/faculty-intelligence'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui'
import {
  SuccessCenter, AiFacultyBrief, TodaySchedule, InterventionCenter,
  DashboardTimeline, PendingTasks, CourseProgress, AttentionSection,
  RecentActivities, SmartQuickActions,
} from '@/components/faculty-dashboard'

function Dashboard() {
  const { data, isLoading, isError, refetch } = useFacultyIntelligence()

  if (isLoading) return <DashboardSkeleton cards={4} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const db = data.derived.dashboard ?? {}
  const alerts = db.interventions?.length ?? 0

  return (
    <div>
      <PageHeader
        eyebrow="Faculty · Command Center"
        title="Teaching Command Center"
        description="Your executive view — teaching health, engagement, assessments and today's priorities at a glance."
        breadcrumbs={[{ label: 'Faculty' }, { label: 'Dashboard' }]}
        actions={
          <>
            {alerts > 0 && (
              <Button asChild size="sm" variant="outline">
                <a href="#interventions">🎯 {alerts} interventions today</a>
              </Button>
            )}
            <Button asChild size="sm">
              <Link to="/faculty/ai-assistant"><Sparkles className="h-4 w-4" /> AI Teaching Assistant</Link>
            </Button>
          </>
        }
      />

      {/* 1. Faculty Success Center */}
      <SuccessCenter data={data} />

      {/* 2. AI Faculty Brief + 3. Today's Schedule */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><AiFacultyBrief data={data} /></div>
        <div className="lg:col-span-1"><TodaySchedule data={data} /></div>
      </div>

      {/* 4. AI Intervention Center */}
      <div id="interventions" className="mt-10">
        <InterventionCenter data={data} />
      </div>

      {/* 5. Teaching Timeline + 6. Pending Tasks */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardTimeline data={data} />
        <PendingTasks data={data} />
      </div>

      {/* 7. Course Progress + 8. Students Requiring Attention */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CourseProgress data={data} />
        <AttentionSection data={data} />
      </div>

      {/* 9. Recent Activities + 10. Smart Quick Actions */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentActivities data={data} />
        <SmartQuickActions data={data} />
      </div>
    </div>
  )
}

export { Dashboard }
export default Dashboard
