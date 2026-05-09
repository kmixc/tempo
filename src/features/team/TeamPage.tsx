import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import {
  canAccessAdmin,
  canManageWages,
  hourlyRateFor,
  teamForUser,
  visibleUsersForUser,
} from '../../lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import type { Role } from '../../types'

const roles: Role[] = ['Owner', 'Admin', 'Manager', 'Member']

export function TeamPage() {
  const viewer = useAuthStore((state) => state.user)
  const { assignRole, teams, updateUserHourlyRate, users } = useWorkspaceStore()
  const canEditRoles = viewer ? canAccessAdmin(viewer.role) : false
  const canEditWages = viewer ? canManageWages(viewer.role) : false
  const visibleTeams =
    viewer && canAccessAdmin(viewer.role)
      ? teams
      : teams.filter((team) => team.id === teamForUser(viewer, teams)?.id)
  const visibleUsers = visibleUsersForUser(users, teams, viewer)
  const assignedUsers = visibleUsers.filter((user) =>
    visibleTeams.some(
      (team) => team.id === user.teamId || team.userIds.includes(user.id),
    ),
  )
  const memberGrid = canEditWages
    ? 'md:grid-cols-[1fr_auto_150px_170px]'
    : 'md:grid-cols-[1fr_auto_170px]'

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Organization
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Team</h1>
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          {visibleTeams.map((team) => (
            <Card className="p-4" key={team.id}>
              <h2 className="font-semibold">{team.name}</h2>
              <p className="mt-1 text-sm text-zinc-500">{team.description}</p>
              <p className="mt-4 text-sm font-medium">
                {team.userIds.length} members assigned
              </p>
            </Card>
          ))}
        </div>
        <Card className="overflow-hidden">
          <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="font-semibold">Members</h2>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {assignedUsers.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
                No assigned team members.
              </p>
            ) : null}
            {assignedUsers.map((user) => {
              const team = teams.find(
                (item) => item.id === user.teamId || item.userIds.includes(user.id),
              )

              return (
                <div
                  className={`grid gap-4 p-4 ${memberGrid} md:items-center`}
                  key={user.id}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
                      {user.avatar}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-zinc-500">{user.email}</p>
                    </div>
                  </div>
                  <Badge tone={team ? 'blue' : 'zinc'}>{team?.name ?? 'No team'}</Badge>
                  {canEditWages ? (
                    <label className="block">
                      <span className="sr-only">Hourly wage</span>
                      <div className="flex h-10 items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <span className="text-zinc-500">$</span>
                        <input
                          className="ml-1 min-w-0 flex-1 bg-transparent outline-none"
                          min={0}
                          onBlur={(event) =>
                            updateUserHourlyRate(
                              user.id,
                              Number(event.currentTarget.value),
                            )
                          }
                          step={0.5}
                          type="number"
                          defaultValue={hourlyRateFor(user)}
                        />
                      </div>
                    </label>
                  ) : null}
                  {canEditRoles ? (
                    <select
                      className="h-10 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
                      onChange={(event) =>
                        assignRole(user.id, event.target.value as Role)
                      }
                      value={user.role}
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge>{user.role}</Badge>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
