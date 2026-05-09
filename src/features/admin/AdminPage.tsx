import {
  Activity,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
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
import {
  createManagedAuthUser,
  useAuthStore,
} from '../../stores/authStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import type { Role } from '../../types'

const roles: Role[] = ['Admin', 'Manager', 'Member']

export function AdminPage() {
  const adminChangeUserPassword = useAuthStore((state) => state.adminChangeUserPassword)
  const sendUserPasswordReset = useAuthStore((state) => state.sendUserPasswordReset)
  const {
    addUser,
    addTeam,
    addUserToTeam,
    assignRole,
    deleteTeamEverywhere,
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
  const [showNewUserPassword, setShowNewUserPassword] = useState(false)
  const [userRole, setUserRole] = useState<Role>('Member')
  const [userTeamId, setUserTeamId] = useState('')
  const [userHourlyRate, setUserHourlyRate] = useState('0')
  const [userError, setUserError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null)
  const [managedCurrentPassword, setManagedCurrentPassword] = useState('')
  const [managedNextPassword, setManagedNextPassword] = useState('')
  const [managedConfirmPassword, setManagedConfirmPassword] = useState('')
  const [showManagedCurrentPassword, setShowManagedCurrentPassword] = useState(false)
  const [showManagedNextPassword, setShowManagedNextPassword] = useState(false)
  const [showManagedConfirmPassword, setShowManagedConfirmPassword] = useState(false)
  const [managedPasswordError, setManagedPasswordError] = useState<string | null>(null)
  const [managedPasswordMessage, setManagedPasswordMessage] = useState<string | null>(null)
  const trackedSeconds = timeEntries.reduce((sum, entry) => sum + entry.duration, 0)

  function togglePasswordEditor(userId: string) {
    setManagedPasswordError(null)
    setManagedPasswordMessage(null)
    setManagedCurrentPassword('')
    setManagedNextPassword('')
    setManagedConfirmPassword('')
    setShowManagedCurrentPassword(false)
    setShowManagedNextPassword(false)
    setShowManagedConfirmPassword(false)
    setPasswordUserId((current) => (current === userId ? null : userId))
  }

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

  async function handleDeleteTeam(teamId: string) {
    setDeleteError(null)

    const team = teams.find((item) => item.id === teamId)
    const confirmed = window.confirm(
      `Delete ${team?.name ?? 'this team'} and remove its member assignments?`,
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteTeamEverywhere(teamId)
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'Unable to delete this team.',
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
        mustChangePassword: true,
      })

      if (userTeamId) {
        await addUserToTeam(userTeamId, authUser.id)
      }

      setUserName('')
      setUserEmail('')
      setUserPassword('')
      setShowNewUserPassword(false)
      setUserRole('Member')
      setUserTeamId('')
      setUserHourlyRate('0')
    } catch (error) {
      setUserError(
        error instanceof Error ? error.message : 'Unable to create this user.',
      )
    }
  }

  async function handleManagedPasswordChange(
    event: FormEvent<HTMLFormElement>,
    userId: string,
    email: string,
  ) {
    event.preventDefault()
    setManagedPasswordError(null)
    setManagedPasswordMessage(null)

    if (managedNextPassword.length < 6) {
      setManagedPasswordError('Use a password with at least 6 characters.')
      return
    }

    if (managedNextPassword !== managedConfirmPassword) {
      setManagedPasswordError('New password and confirmation must match.')
      return
    }

    try {
      await adminChangeUserPassword(
        userId,
        email,
        managedCurrentPassword,
        managedNextPassword,
      )
      setManagedCurrentPassword('')
      setManagedNextPassword('')
      setManagedConfirmPassword('')
      setShowManagedCurrentPassword(false)
      setShowManagedNextPassword(false)
      setShowManagedConfirmPassword(false)
      setManagedPasswordMessage(
        'Temporary password saved. The user must change it at next sign-in.',
      )
    } catch (error) {
      setManagedPasswordError(
        error instanceof Error ? error.message : 'Unable to update this password.',
      )
    }
  }

  async function handleSendResetEmail(email: string) {
    setManagedPasswordError(null)
    setManagedPasswordMessage(null)

    try {
      await sendUserPasswordReset(email)
      setManagedPasswordMessage('Password reset email sent.')
    } catch (error) {
      setManagedPasswordError(
        error instanceof Error ? error.message : 'Unable to send a reset email.',
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
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
          The password set here is temporary. New users will be required to change it after their first sign-in.
        </p>
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
          <label className="block">
            <span className="sr-only">Password</span>
            <div className="flex items-center rounded-md border border-zinc-200 bg-zinc-50 focus-within:ring-2 focus-within:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:ring-white">
              <input
                className="h-10 w-full bg-transparent px-3 text-sm outline-none"
                minLength={6}
                onChange={(event) => setUserPassword(event.target.value)}
                placeholder="Temporary password"
                required
                type={showNewUserPassword ? 'text' : 'password'}
                value={userPassword}
              />
              <button
                aria-label={showNewUserPassword ? 'Hide password' : 'Show password'}
                className="px-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                onClick={() => setShowNewUserPassword((value) => !value)}
                type="button"
              >
                {showNewUserPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
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
            const canManagePassword = user.role === 'Manager' || user.role === 'Member'
            const isManagingPassword = passwordUserId === user.id

            return (
              <div key={user.id}>
                <div className="grid gap-3 p-4 md:grid-cols-[1fr_150px_150px_auto] md:items-center">
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
                  <div className="flex flex-wrap justify-end gap-2">
                    {canManagePassword ? (
                      <Button
                        className="h-9 px-3"
                        icon={<KeyRound size={14} />}
                        onClick={() => togglePasswordEditor(user.id)}
                        type="button"
                        variant="secondary"
                      >
                        Password
                      </Button>
                    ) : null}
                    <Button
                      className="h-9 px-3"
                      icon={<Trash2 size={14} />}
                      onClick={() => handleDeleteUser(user.id)}
                      type="button"
                      variant="danger"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {canManagePassword && isManagingPassword ? (
                  <div className="border-t border-zinc-200 px-4 pb-4 dark:border-zinc-800">
                    <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                      <div className="mb-3">
                        <h3 className="font-medium">Manage password</h3>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Set a temporary password if you know the account's current password, or send a reset email if you do not.
                        </p>
                      </div>
                      <form
                        className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]"
                        onSubmit={(event) =>
                          handleManagedPasswordChange(event, user.id, user.email)
                        }
                      >
                        <label className="block">
                          <span className="sr-only">Current password</span>
                          <div className="flex items-center rounded-md border border-zinc-200 bg-white focus-within:ring-2 focus-within:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:ring-white">
                            <input
                              className="h-10 w-full bg-transparent px-3 text-sm outline-none"
                              onChange={(event) => setManagedCurrentPassword(event.target.value)}
                              placeholder="Current password"
                              required
                              type={showManagedCurrentPassword ? 'text' : 'password'}
                              value={managedCurrentPassword}
                            />
                            <button
                              aria-label={showManagedCurrentPassword ? 'Hide current password' : 'Show current password'}
                              className="px-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                              onClick={() => setShowManagedCurrentPassword((value) => !value)}
                              type="button"
                            >
                              {showManagedCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </label>
                        <label className="block">
                          <span className="sr-only">New password</span>
                          <div className="flex items-center rounded-md border border-zinc-200 bg-white focus-within:ring-2 focus-within:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:ring-white">
                            <input
                              className="h-10 w-full bg-transparent px-3 text-sm outline-none"
                              minLength={6}
                              onChange={(event) => setManagedNextPassword(event.target.value)}
                              placeholder="Temporary password"
                              required
                              type={showManagedNextPassword ? 'text' : 'password'}
                              value={managedNextPassword}
                            />
                            <button
                              aria-label={showManagedNextPassword ? 'Hide new password' : 'Show new password'}
                              className="px-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                              onClick={() => setShowManagedNextPassword((value) => !value)}
                              type="button"
                            >
                              {showManagedNextPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </label>
                        <label className="block">
                          <span className="sr-only">Confirm new password</span>
                          <div className="flex items-center rounded-md border border-zinc-200 bg-white focus-within:ring-2 focus-within:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:ring-white">
                            <input
                              className="h-10 w-full bg-transparent px-3 text-sm outline-none"
                              minLength={6}
                              onChange={(event) => setManagedConfirmPassword(event.target.value)}
                              placeholder="Confirm new password"
                              required
                              type={showManagedConfirmPassword ? 'text' : 'password'}
                              value={managedConfirmPassword}
                            />
                            <button
                              aria-label={showManagedConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                              className="px-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                              onClick={() => setShowManagedConfirmPassword((value) => !value)}
                              type="button"
                            >
                              {showManagedConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </label>
                        <Button className="h-10" type="submit">
                          Save temporary password
                        </Button>
                      </form>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <Button
                          icon={<Mail size={14} />}
                          onClick={() => handleSendResetEmail(user.email)}
                          type="button"
                          variant="ghost"
                        >
                          Send reset email
                        </Button>
                        <Button
                          onClick={() => togglePasswordEditor(user.id)}
                          type="button"
                          variant="secondary"
                        >
                          Close
                        </Button>
                      </div>
                      {managedPasswordError ? (
                        <p className="mt-3 text-sm text-red-600">{managedPasswordError}</p>
                      ) : null}
                      {managedPasswordMessage ? (
                        <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
                          {managedPasswordMessage}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
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
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                    {members.length} users
                  </span>
                  <Button
                    className="h-8 px-3"
                    icon={<Trash2 size={14} />}
                    onClick={() => handleDeleteTeam(team.id)}
                    type="button"
                    variant="danger"
                  >
                    Delete
                  </Button>
                </div>
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
