import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { formatDuration } from '../../lib/format'
import {
  budgetProgressForProject,
  canManageProjectBudgets,
  visibleEntriesForUser,
  visibleProjectsForUser,
} from '../../lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import type { ProjectStatus } from '../../types'

const statuses: ProjectStatus[] = ['Active', 'Paused', 'Archived']

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const viewer = useAuthStore((state) => state.user)
  const {
    projects,
    teams,
    timeEntries,
    updateProject,
    updateProjectBudget,
    users,
  } = useWorkspaceStore()
  const project = visibleProjectsForUser(projects, teams, viewer).find(
    (item) => item.id === projectId,
  )

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  const canEditProject = viewer ? canManageProjectBudgets(viewer.role) : false
  const entries = visibleEntriesForUser(timeEntries, viewer, teams).filter(
    (entry) => entry.projectId === project.id,
  )
  const progress = budgetProgressForProject(project, entries, users)

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="mb-4 inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
          to="/projects"
        >
          <ArrowLeft size={15} />
          Projects
        </Link>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            {canEditProject ? (
              <input
                className="h-11 w-full max-w-xl rounded-md border border-zinc-200 bg-white px-3 text-3xl font-semibold tracking-tight outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
                onBlur={(event) =>
                  updateProject(project.id, { name: event.currentTarget.value })
                }
                defaultValue={project.name}
              />
            ) : (
              <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
            )}
            {canEditProject ? (
              <input
                className="mt-3 h-10 w-full max-w-sm rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
                onBlur={(event) =>
                  updateProject(project.id, { client: event.currentTarget.value })
                }
                defaultValue={project.client}
              />
            ) : (
              <p className="mt-2 text-sm text-zinc-500">{project.client}</p>
            )}
          </div>
          {canEditProject ? (
            <select
              className="h-10 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
              onChange={(event) =>
                updateProject(project.id, {
                  status: event.currentTarget.value as ProjectStatus,
                })
              }
              value={project.status}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          ) : (
            <Badge tone={project.status === 'Active' ? 'green' : 'orange'}>
              {project.status}
            </Badge>
          )}
        </div>
      </div>

      <Card className="p-4">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-zinc-500">Budget used</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
          <div
            className="h-full rounded-full"
            style={{ backgroundColor: project.color, width: `${progress}%` }}
          />
        </div>
        {canEditProject ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label>
              <span className="text-xs font-medium text-zinc-500">Tracked</span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
                min={0}
                onBlur={(event) =>
                  updateProjectBudget(project.id, {
                    budgetHours: project.budgetHours,
                    trackedHours: Number(event.currentTarget.value),
                  })
                }
                step={0.25}
                type="number"
                defaultValue={project.trackedHours.toFixed(2)}
              />
            </label>
            <label>
              <span className="text-xs font-medium text-zinc-500">Budget</span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
                min={0}
                onBlur={(event) =>
                  updateProjectBudget(project.id, {
                    budgetHours: Number(event.currentTarget.value),
                    trackedHours: project.trackedHours,
                  })
                }
                step={0.25}
                type="number"
                defaultValue={project.budgetHours.toFixed(2)}
              />
            </label>
            <label>
              <span className="text-xs font-medium text-zinc-500">Color</span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
                onBlur={(event) =>
                  updateProject(project.id, { color: event.currentTarget.value })
                }
                type="color"
                defaultValue={project.color}
              />
            </label>
          </div>
        ) : null}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-semibold">Project entries</h2>
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {entries.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">No entries for this project yet.</p>
          ) : null}
          {entries.map((entry) => {
            const user = users.find((item) => item.id === entry.userId)

            return (
              <div
                className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                key={entry.id}
              >
                <div>
                  <p className="font-medium">{entry.description}</p>
                  <p className="mt-1 text-sm text-zinc-500">{user?.name}</p>
                </div>
                <Badge tone={entry.billable ? 'green' : 'zinc'}>
                  {entry.billable ? 'Billable' : 'Internal'}
                </Badge>
                <p className="font-mono text-sm">{formatDuration(entry.duration)}</p>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
