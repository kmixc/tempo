import { Banknote, Clock3, Target, Users } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { formatCurrency, formatHours } from '../../lib/format'
import { hourlyRateFor, visibleEntriesForUser } from '../../lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { TimerControl } from '../timer/TimerControl'

export function DashboardPage() {
  const { projects, timeEntries, users } = useWorkspaceStore()
  const viewer = useAuthStore((state) => state.user)
  const visibleEntries = visibleEntriesForUser(timeEntries, users, viewer)
  const totalSeconds = visibleEntries.reduce((sum, entry) => sum + entry.duration, 0)
  const wageValue = visibleEntries.reduce((sum, entry) => {
    const entryUser = users.find((user) => user.id === entry.userId)
    return sum + (entry.duration / 3600) * hourlyRateFor(entryUser)
  }, 0)
  const averageHourlyRate =
    users.length > 0
      ? users.reduce((sum, user) => sum + hourlyRateFor(user), 0) / users.length
      : 0

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Friday, May 8
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          Command center
        </h1>
      </div>
      <TimerControl />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          detail="Across active workspace entries"
          icon={<Clock3 size={18} />}
          label="Tracked"
          value={formatHours(totalSeconds)}
        />
        <StatCard
          detail="Based on each team member's hourly wage"
          icon={<Banknote size={18} />}
          label="Tracked wages"
          value={formatCurrency(wageValue)}
        />
        <StatCard
          detail="Projects currently in flight"
          icon={<Target size={18} />}
          label="Active projects"
          value={String(projects.filter((project) => project.status === 'Active').length)}
        />
        <StatCard
          detail="Members with weekly capacity"
          icon={<Users size={18} />}
          label="Avg wage"
          value={formatCurrency(averageHourlyRate)}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-950 dark:text-white">
              Recent time entries
            </h2>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {visibleEntries.slice(0, 5).map((entry) => {
              const project = projects.find((item) => item.id === entry.projectId)
              const entryUser = users.find((user) => user.id === entry.userId)

              return (
                <div
                  className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                  key={entry.id}
                >
                  <div>
                    <p className="font-medium text-zinc-950 dark:text-white">
                      {entry.description}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {project?.name} · {entryUser?.name ?? 'Unknown user'}
                    </p>
                  </div>
                  <Badge tone={entry.billable ? 'green' : 'zinc'}>
                    {entry.billable ? 'Billable' : 'Internal'}
                  </Badge>
                  <p className="font-mono text-sm text-zinc-700 dark:text-zinc-300">
                    {formatHours(entry.duration)}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold text-zinc-950 dark:text-white">
            Project health
          </h2>
          <div className="mt-4 space-y-4">
            {projects.map((project) => {
              const progress = Math.min(
                100,
                Math.round((project.trackedHours / project.budgetHours) * 100),
              )

              return (
                <div key={project.id}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{project.name}</span>
                    <span className="text-zinc-500">{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                    <div
                      className="h-full rounded-full"
                      style={{ backgroundColor: project.color, width: `${progress}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
