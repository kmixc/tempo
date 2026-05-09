import { BarChart3, CalendarDays, ReceiptText } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { formatCurrency, formatHours } from '../../lib/format'
import { useWorkspaceStore } from '../../stores/workspaceStore'

export function ReportsPage() {
  const { projects, timeEntries, users } = useWorkspaceStore()
  const totalSeconds = timeEntries.reduce((sum, entry) => sum + entry.duration, 0)
  const billableSeconds = timeEntries
    .filter((entry) => entry.billable)
    .reduce((sum, entry) => sum + entry.duration, 0)
  const utilization = Math.round((billableSeconds / Math.max(totalSeconds, 1)) * 100)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Insights
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Reports</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          detail="Selected period"
          icon={<CalendarDays size={18} />}
          label="Hours"
          value={formatHours(totalSeconds)}
        />
        <StatCard
          detail="Billable share"
          icon={<BarChart3 size={18} />}
          label="Utilization"
          value={`${utilization}%`}
        />
        <StatCard
          detail="Uninvoiced estimate"
          icon={<ReceiptText size={18} />}
          label="Revenue"
          value={formatCurrency((billableSeconds / 3600) * 145)}
        />
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-semibold">Detailed entries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">Entry</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {timeEntries.map((entry) => {
                const project = projects.find((item) => item.id === entry.projectId)
                const user = users.find((item) => item.id === entry.userId)

                return (
                  <tr key={entry.id}>
                    <td className="px-4 py-4 font-medium">{entry.description}</td>
                    <td className="px-4 py-4 text-zinc-500">{project?.name}</td>
                    <td className="px-4 py-4 text-zinc-500">{user?.name}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map((tag) => (
                          <Badge key={tag}>{tag}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono">{formatHours(entry.duration)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
