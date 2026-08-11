import { ChartCard } from '@/components/shared/chart-card'
import { ActivityFeed } from '@/components/shared/activity-feed'
import { Badge } from '@/components/ui'

/**
 * Recent Activities — meaningful academic events derived from the
 * intelligence foundation (grades, exams, achievements, health/career
 * improvements), rendered through the shared ActivityFeed.
 */
function RecentActivities({ activities = [] }) {
  const items = activities.slice(0, 7).map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title.split(' — ')[0],
    action: a.detail,
    time: a.date ? `${a.date}T09:00:00` : undefined,
  }))

  return (
    <ChartCard
      title="Recent activities"
      subtitle="What happened across your academics"
      actions={<Badge variant="secondary" size="sm">{activities.length} events</Badge>}
      contentClassName="pt-1"
    >
      <ActivityFeed items={items} empty="No academic activity yet this week." />
    </ChartCard>
  )
}

export { RecentActivities }
export default RecentActivities
