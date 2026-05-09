import {
  Activity,
  ShieldCheck,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { formatHours } from '../../lib/format'
import { createManagedAuthUser } from '../../stores/authStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import type { Role } from '../../types'

const roles: Role[] = ['Admin', 'Manager', 'Member']

export function AdminPage() {
  const {
    addUser,
    addTeam,
    addUserToTeam,
    assignRole,
    deleteUserEverywhere,
    projects,
    removeUserFromTeam,
    teams,
    timeEntries,
    users,
  } = useWorkspaceStore()
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [userRole, setUserRole] = useState<Role>('Member')
  const [userTeamId, setUserTeamId] = useState('')
  const [userHourlyRate, setUserHourlyRate] = useState('0')
  const [userError, setUserError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const trackedSeconds = timeEntries.reduce((sum, entry) => sum + entry.duration, 0)

  async function handleCreateTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await addTeam({
      name: teamName,
      description: teamDescription || 'New workspace team.',
    })
    setTeamName('')
    setTeamDescription('')
  }

  async function handleDeleteUser(userId: string) {
    setDeleteError(null)

    const user = users.find((item) => item.id === userId)
    const confirmed = window.confirm(
      `Delete ${user?.name ?? 'this user'} from Firestore profiles, teams, projects, and time entries?`,
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteUserEverywhere(userId)
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'Unable to delete this user.',
      )
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setUserError(null)

    try {
      const authUser = await createManagedAuthUser(userName, userEmail, userPassword)
      await addUser({
        ...authUser,
        role: userRole,
        teamId: userTeamId,
        capacity: 35,
        hourlyRate: Number(userHourlyRate),
      })

      if (userTeamId) {
        await addUserToTeam(userTeamId, authUser.id)
      }

      setUserName('')
      setUserEmail('')
      setUserPassword('')
      setUserRole('Member')
      setUserTeamId('')
      setUserHourlyRate('0')
    } catch (error) {
      setUserError(
        error instanceof Error ? error.message : 'Unable to create this user.',
      )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Workspace control</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          detail="Provisioned users"
          icon={<Users size={18} />}
          label="Users"
          value={String(users.length)}
        />
        <StatCard
          detail="Project portfolio"
          icon={<Activity size={18} />}
          label="Projects"
          value={String(projects.length)}
        />
        <StatCard
          detail="Audited activity"
          icon={<ShieldCheck size={18} />}
          label="Tracked"
          value={formatHours(trackedSeconds)}
        />
      </div>
      <Card className="p-4">
        <h2 className="mb-3 font-semibold">Create team</h2>
        <form
          className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto]"
          onSubmit={handleCreateTeam}
        >
          <input
            className="h-10 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
            onChange={(event) => setTeamName(event.target.value)}
            placeholder="Team name"
            required
            value={teamName}
          />
          <input
            className="h-10 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
            onChange={(event) => setTeamDescription(event.target.value)}
            placeholder="Team description"
            value={teamDescription}
          />
          <Button type="submit">Create team</Button>
        </form>
      </Card>
      <Card className="p-4">
        <h2 className="mb-3 font-semibold">Create user account</h2>
        <form className="grid gap-3 lg:grid-cols-7" onSubmit={handleCreateUser}>
          <input
            className="h-10 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white lg:col-span-2"
            onChange={(event) => setUserName(event.target.value)}
            placeholder="Full name"
            required
            value={userName}
          />
          <input
            className="h-10 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white lg:col-span-2"
            onChange={(event) => setUserEmail(event.target.value)}
            placeholder="Email"
            required
            type="email"
            value={userEmail}
          />
          <input
            className="h-10 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
            minLength={6}
            onChange={(event) => setUserPassword(event.target.value)}
            placeholder="Password"
            required
            type="password"
            value={userPassword}
          />
          <input
            className="h-10 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
            min={0}
            onChange={(event) => setUserHourlyRate(event.target.value)}
            placeholder="Hourly wage"
            step={0.5}
            type="number"
            value={userHourlyRate}
          />
          <select
            className="h-10 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
            onChange={(event) => setUserRole(event.target.value as Role)}
            value={userRole}
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white lg:col-span-2"
            onChange={(event) => setUserTeamId(event.target.value)}
            value={userTeamId}
          >
            <option value="">No team yet</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <Button className="lg:col-span-2" type="submit">
            Create Firebase user
          </Button>
          {userError ? (
            <p className="text-sm text-red-600 lg:col-span-6">{userError}</p>
          ) : null}
        </form>
      </Card>
      <Card className="overflow-hidden">
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-semibold">All users</h2>
          {deleteError ? (
            <p className="mt-2 text-sm text-red-600">{deleteError}</p>
          ) : null}
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {users.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
              No users have been created yet.
            </p>
          ) : null}
          {users.map((user) => {
            const team = teams.find(
              (item) => item.id === user.teamId || item.userIds.includes(user.id),
            )

            return (
              <div
                className="grid gap-3 p-4 md:grid-cols-[1fr_150px_150px_auto] md:items-center"
                key={user.id}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white dark:bg-white dark:text-zinc-950">
                    {user.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </div>
                </div>
                <span className="text-sm text-zinc-500">{team?.name ?? 'No team'}</span>
                <select
                  className="h-9 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  onChange={(event) => assignRole(user.id, event.target.value as Role)}
                  value={user.role}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <Button
                  className="h-9 px-3"
                  icon={<Trash2 size={14} />}
                  onClick={() => handleDeleteUser(user.id)}
                  variant="danger"
                >
                  Delete
                </Button>
              </div>
            )
          })}
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {teams.length === 0 ? (
          <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
            No teams yet. Create a team to start assigning users.
          </Card>
        ) : null}
        {teams.map((team) => {
          const members = users.filter((user) => team.userIds.includes(user.id))
          const availableUsers = users.filter((user) => !team.userIds.includes(user.id))

          return (
            <Card className="p-4" key={team.id}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{team.name}</h2>
                  <p className="mt-1 text-sm text-zinc-500">{team.description}</p>
                </div>
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                  {members.length} users
                </span>
              </div>
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
                    key={member.id}
                  >
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-zinc-500">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className="h-8 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
                        onChange={(event) =>
                          assignRole(member.id, event.target.value as Role)
                        }
                        value={member.role}
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <Button
                        className="h-8 px-3"
                        icon={<UserMinus size={14} />}
                        onClick={() => removeUserFromTeam(team.id, member.id)}
                        variant="ghost"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  className="h-10 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  onChange={(event) => {
                    if (event.target.value) {
                      addUserToTeam(team.id, event.target.value)
                      event.target.value = ''
                    }
                  }}
                >
                  <option value="">Add member</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <Button icon={<UserPlus size={16} />} variant="secondary">
                  Invite
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
