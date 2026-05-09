import { BarChart3, CalendarDays, ReceiptText, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { formatCurrency, formatHours } from '../../lib/format'
import {
  canEditTimeEntry,
  canEditTimeEntries,
  canSeeEntryChangeLog,
  hourlyRateFor,
  visibleEntriesForUser,
} from '../../lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'

export function ReportsPage() {
  const {
    deleteTimeEntry,
    projects,
    timeEntries,
    updateTimeEntry,
    users,
    teams,
  } = useWorkspaceStore()
  const viewer = useAuthStore((state) => state.user)
  const [isEditing, setIsEditing] = useState(false)
  const visibleEntries = visibleEntriesForUser(timeEntries, viewer, teams)
  const canEditAnyEntry =
    viewer !== null &&
    visibleEntries.some((entry) => canEditTimeEntry(viewer, entry))
  const showEditControls = canEditAnyEntry && isEditing
  const showChangeLog = viewer ? canSeeEntryChangeLog(viewer.role) : false
  const canSeeWages = viewer?.role !== 'Member'
  const totalSeconds = visibleEntries.reduce((sum, entry) => sum + entry.duration, 0)
  const billableSeconds = visibleEntries
    .filter((entry) => entry.billable)
    .reduce((sum, entry) => sum + entry.duration, 0)
  const utilization = Math.round((billableSeconds / Math.max(totalSeconds, 1)) * 100)
  const wageValue = visibleEntries.reduce((sum, entry) => {
    const user = users.find((item) => item.id === entry.userId)
    return sum + (entry.duration / 3600) * hourlyRateFor(user)
  }, 0)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Insights
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Reports</h1>
      </div>
      <div className={`grid gap-4 ${canSeeWages ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
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
        {canSeeWages ? (
          <StatCard
            detail="Based on team hourly wages"
            icon={<ReceiptText size={18} />}
            label="Wages"
            value={formatCurrency(wageValue)}
          />
        ) : null}
      </div>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-semibold">Detailed entries</h2>
          {canEditAnyEntry ? (
            <Button
              className="h-9 px-3"
              onClick={() => setIsEditing((current) => !current)}
              variant={isEditing ? 'primary' : 'secondary'}
            >
              {isEditing ? 'Done' : 'Edit'}
            </Button>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">Entry</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium">Hours</th>
                {showChangeLog ? (
                  <th className="px-4 py-3 font-medium">Changes</th>
                ) : null}
                {showEditControls ? (
                  <th className="px-4 py-3 font-medium">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {visibleEntries.map((entry) => {
                const project = projects.find((item) => item.id === entry.projectId)
                const user = users.find((item) => item.id === entry.userId)
                const canEditRow = showEditControls && canEditTimeEntry(viewer, entry)

                return (
                  <tr key={entry.id}>
                    <td className="px-4 py-4 font-medium">
                      {canEditRow ? (
                        <input
                          className="h-9 w-56 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
                          onBlur={(event) =>
                            updateTimeEntry(
                              entry.id,
                              {
                                description: event.currentTarget.value,
                              },
                              viewer,
                            )
                          }
                          defaultValue={entry.description}
                        />
                      ) : (
                        entry.description
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {canEditRow ? (
                        <textarea
                          className="min-h-16 w-64 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
                          onBlur={(event) =>
                            updateTimeEntry(
                              entry.id,
                              {
                                details: event.currentTarget.value,
                              },
                              viewer,
                            )
                          }
                          defaultValue={entry.details ?? ''}
                        />
                      ) : (
                        <p className="max-w-xs whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">
                          {entry.details || 'No details'}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-zinc-500">
                      {canEditRow ? (
                        <select
                          className="h-9 w-44 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
                          onChange={(event) =>
                            updateTimeEntry(
                              entry.id,
                              {
                                projectId: event.currentTarget.value,
                              },
                              viewer,
                            )
                          }
                          value={entry.projectId}
                        >
                          {projects.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        project?.name
                      )}
                    </td>
                    <td className="px-4 py-4 text-zinc-500">
                      {canEditRow && viewer && canEditTimeEntries(viewer.role) ? (
                        <select
                          className="h-9 w-44 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
                          onChange={(event) =>
                            updateTimeEntry(
                              entry.id,
                              {
                                userId: event.currentTarget.value,
                              },
                              viewer,
                            )
                          }
                          value={entry.userId}
                        >
                          {users.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        user?.name
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {canEditRow ? (
                        <input
                          className="h-9 w-44 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
                          onBlur={(event) =>
                            updateTimeEntry(
                              entry.id,
                              {
                                tags: event.currentTarget.value
                                  .split(',')
                                  .map((tag) => tag.trim())
                                  .filter(Boolean),
                              },
                              viewer,
                            )
                          }
                          defaultValue={entry.tags.join(', ')}
                        />
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.map((tag) => (
                            <Badge key={tag}>{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {canEditRow ? (
                        <input
                          className="h-9 w-24 rounded-md border border-zinc-200 bg-zinc-50 px-2 font-mono text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
                          min={0}
                          onBlur={(event) =>
                            updateTimeEntry(
                              entry.id,
                              {
                                hours: Number(event.currentTarget.value),
                              },
                              viewer,
                            )
                          }
                          step={0.25}
                          type="number"
                          defaultValue={(entry.duration / 3600).toFixed(2)}
                        />
                      ) : (
                        <span className="font-mono">{formatHours(entry.duration)}</span>
                      )}
                    </td>
                    {showChangeLog ? (
                      <td className="px-4 py-4 text-xs text-zinc-500">
                        {entry.changeLog?.length ? (
                          <div className="space-y-1">
                            {entry.changeLog.slice(-3).map((change) => (
                              <p key={change.id}>
                                {change.changedByName}: {change.fields.join(', ')}
                              </p>
                            ))}
                          </div>
                        ) : (
                          'No changes'
                        )}
                      </td>
                    ) : null}
                    {showEditControls ? (
                      <td className="px-4 py-4">
                        {canEditRow && viewer && canEditTimeEntries(viewer.role) ? (
                          <Button
                            className="h-9 px-3"
                            icon={<Trash2 size={14} />}
                            onClick={() => deleteTimeEntry(entry.id)}
                            variant="danger"
                          >
                            Delete
                          </Button>
                        ) : null}
                      </td>
                    ) : null}
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
