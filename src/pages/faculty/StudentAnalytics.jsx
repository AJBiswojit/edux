/**
 * MediXO EduX — Faculty · Students Intelligence Workspace.
 *
 * Every learner, every signal — Cohort Overview · At-Risk & Interventions ·
 * Performance Analytics · Skill Gaps & Mastery · Engagement & Behaviour.
 * All values derive from the Faculty Intelligence Foundation
 * (`/faculty-intelligence/summary`) — no hardcoded numbers.
 * Deep-linkable via ?tab=overview|at-risk|performance|gaps|engagement.
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, BarChart3, HeartPulse, LayoutDashboard, Sparkles, Target, Users } from 'lucide-react'
import { useFacultyIntelligence } from '@/services/faculty-intelligence'
import { PageHeader } from '@/components/shared/page-header'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent, useToast } from '@/components/ui'
import {
  StudentsOverviewTab, StudentsAtRiskTab, StudentsPerformanceTab,
  StudentsGapsTab, StudentsEngagementTab,
} from '@/components/students-workspace'

const TAB_META = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'at-risk', label: 'At-Risk & Interventions', icon: AlertTriangle },
  { id: 'performance', label: 'Performance Analytics', icon: BarChart3 },
  { id: 'gaps', label: 'Skill Gaps & Mastery', icon: Target },
  { id: 'engagement', label: 'Engagement & Behaviour', icon: HeartPulse },
]

function StudentAnalytics() {
  const { data, isLoading, isError, refetch } = useFacultyIntelligence()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState('overview')
  const toast = useToast()

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t) setTab(t)
  }, [searchParams])

  if (isLoading) return <DashboardSkeleton cards={3} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const s = data.derived.students ?? {}
  const flagged = s.interventionStats?.flagged ?? 0

  return (
    <div>
      <PageHeader
        eyebrow="Faculty · Students Intelligence"
        title="Students Intelligence"
        description="Every learner, every signal: cohort health, at-risk detection, performance, skill gaps and engagement in one workspace."
        breadcrumbs={[{ label: 'Faculty' }, { label: 'Students' }]}
        actions={
          <>
            {flagged > 0 && (
              <Badge variant="danger" className="px-3 py-1">
                <AlertTriangle className="h-3 w-3" /> {flagged} flagged · {s.interventionStats?.active ?? 0} active
              </Badge>
            )}
            <Badge variant="gradient" className="px-3 py-1">
              <Users className="h-3 w-3" /> {s.cohortSummary?.totalStudents ?? '—'} students · {s.cohortSummary?.sections?.length ?? '—'} sections
            </Badge>
            <Button size="sm" onClick={() => toast.success('Outreach drafted', 'Personalised messages for all active-risk students are ready for review.')}>
              <Sparkles className="h-4 w-4" /> Draft outreach
            </Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-1 flex w-full flex-wrap justify-start sm:w-auto">
          {TAB_META.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview"><StudentsOverviewTab data={data} /></TabsContent>
        <TabsContent value="at-risk"><StudentsAtRiskTab data={data} /></TabsContent>
        <TabsContent value="performance"><StudentsPerformanceTab data={data} /></TabsContent>
        <TabsContent value="gaps"><StudentsGapsTab data={data} /></TabsContent>
        <TabsContent value="engagement"><StudentsEngagementTab data={data} /></TabsContent>
      </Tabs>
    </div>
  )
}

export { StudentAnalytics }
export default StudentAnalytics
