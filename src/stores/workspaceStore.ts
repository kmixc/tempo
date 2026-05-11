import { create } from 'zustand'
import { formatDuration } from '../lib/format'
import { workspaceService } from '../services/workspaceService'
import type {
  Project,
  Role,
  Team,
  TimeEntry,
  TimeEntryChangeSnapshot,
  TimeEntryFieldChange,
  User,
} from '../types'

const timeEntryFieldLabels = {
  description: 'Description',
  details: 'Details',
  project: 'Project',
  user: 'User',
  tags: 'Tags',
  billable: 'Billing',
  hours: 'Hours',
} as const

function formatTimeEntryFieldValue(params: {
  field: keyof typeof timeEntryFieldLabels
  value: unknown
  projects: Project[]
  users: User[]
}) {
  const { field, value, projects, users } = params

  if (field === 'project') {
    const project = projects.find((item) => item.id === value)
    return project?.name ?? String(value ?? 'Unknown project')
  }

  if (field === 'user') {
    const user = users.find((item) => item.id === value)
    return user?.name ?? String(value ?? 'Unknown user')
  }

  if (field === 'tags') {
    return Array.isArray(value) && value.length > 0 ? value.join(', ') : 'No tags'
  }

  if (field === 'billable') {
    return value ? 'Billable' : 'Internal'
  }

  if (field === 'hours') {
    return formatDuration(Number(value ?? 0))
  }

  const normalizedValue = typeof value === 'string' ? value : String(value ?? '')
  return normalizedValue.length > 0 ? normalizedValue : 'Empty'
}

type WorkspaceState = {
  users: User[]
  teams: Team[]
  projects: Project[]
  timeEntries: TimeEntry[]
  isLoading: boolean
  hasLoaded: boolean
  error: string | null
  loadWorkspace: () => Promise<void>
  addEntry: (entry: TimeEntry) => Promise<void>
  addProject: (project: Omit<Project, 'id' | 'trackedHours' | 'status'>) => Promise<void>
  addTeam: (team: Omit<Team, 'id' | 'userIds'>) => Promise<void>
  addUser: (user: User) => Promise<void>
  removeUserFromTeam: (teamId: string, userId: string) => Promise<void>
  addUserToTeam: (teamId: string, userId: string) => Promise<void>
  deleteTeamEverywhere: (teamId: string) => Promise<void>
  assignRole: (userId: string, role: Role) => Promise<void>
  updateUserHourlyRate: (userId: string, hourlyRate: number) => Promise<void>
  updateProjectBudget: (
    projectId: string,
    values: Pick<Project, 'budgetHours' | 'trackedHours'>,
  ) => Promise<void>
  updateProject: (projectId: string, values: Partial<Project>) => Promise<void>
  updateTimeEntry: (
    entryId: string,
    values: Partial<Omit<TimeEntry, 'id' | 'start' | 'end'>> & { hours?: number },
    actor?: User | null,
  ) => Promise<void>
  updateTimeEntryDuration: (entryId: string, hours: number) => Promise<void>
  deleteTimeEntry: (entryId: string) => Promise<void>
  deleteUserEverywhere: (userId: string) => Promise<void>
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  users: [],
  teams: [],
  projects: [],
  timeEntries: [],
  isLoading: false,
  hasLoaded: false,
  error: null,
  loadWorkspace: async () => {
    set({ isLoading: true, error: null })
    try {
      const workspace = await workspaceService.getWorkspace()
      set({ ...workspace, isLoading: false, hasLoaded: true })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unable to load workspace.',
        isLoading: false,
        hasLoaded: true,
      })
    }
  },
  addEntry: async (entry) => {
    await workspaceService.createEntry(entry)
    const projects = get().projects.map((project) =>
      project.id === entry.projectId
        ? {
          ...project,
          trackedHours: project.trackedHours + entry.duration / 3600,
        }
        : project,
    )
    const updatedProject = projects.find((project) => project.id === entry.projectId)
    if (updatedProject) {
      await workspaceService.updateProject(updatedProject)
    }
    set((state) => ({
      timeEntries: [entry, ...state.timeEntries],
      projects,
    }))
  },
  addProject: async (project) => {
    const nextProject: Project = {
      ...project,
      id: crypto.randomUUID(),
      trackedHours: 0,
      status: 'Active',
    }

    await workspaceService.createProject(nextProject)
    set((state) => ({ projects: [nextProject, ...state.projects] }))
  },
  addTeam: async (team) => {
    const nextTeam: Team = {
      ...team,
      id: crypto.randomUUID(),
      userIds: [],
    }

    await workspaceService.createTeam(nextTeam)
    set((state) => ({ teams: [nextTeam, ...state.teams] }))
  },
  addUser: async (user) => {
    await workspaceService.upsertUser(user)
    set((state) => ({ users: [user, ...state.users] }))
  },
  removeUserFromTeam: async (teamId, userId) => {
    const team = get().teams.find((item) => item.id === teamId)
    const user = get().users.find((item) => item.id === userId)
    if (!team) {
      return
    }

    const nextTeam = {
      ...team,
      userIds: team.userIds.filter((id) => id !== userId),
    }
    const nextUser = user ? { ...user, teamId: '' } : null
    await workspaceService.updateTeam(nextTeam)
    if (nextUser) {
      await workspaceService.updateUser(nextUser)
    }
    set((state) => ({
      teams: state.teams.map((item) => (item.id === teamId ? nextTeam : item)),
      users: state.users.map((item) => (item.id === userId && nextUser ? nextUser : item)),
    }))
  },
  addUserToTeam: async (teamId, userId) => {
    const team = get().teams.find((item) => item.id === teamId)
    const user = get().users.find((item) => item.id === userId)
    if (!team || team.userIds.includes(userId)) {
      return
    }

    const nextTeam = { ...team, userIds: [...team.userIds, userId] }
    const nextUser = user ? { ...user, teamId } : null
    await workspaceService.updateTeam(nextTeam)
    if (nextUser) {
      await workspaceService.updateUser(nextUser)
    }
    set((state) => ({
      teams: state.teams.map((item) => (item.id === teamId ? nextTeam : item)),
      users: state.users.map((item) => (item.id === userId && nextUser ? nextUser : item)),
    }))
  },
  deleteTeamEverywhere: async (teamId) => {
    const team = get().teams.find((item) => item.id === teamId)
    if (!team) {
      return
    }

    const affectedUserIds = new Set(
      get()
        .users
        .filter((user) => user.teamId === teamId || team.userIds.includes(user.id))
        .map((user) => user.id),
    )

    await workspaceService.deleteTeamEverywhere({
      team,
      users: get().users,
    })

    set((state) => ({
      teams: state.teams.filter((item) => item.id !== teamId),
      users: state.users.map((user) =>
        affectedUserIds.has(user.id) ? { ...user, teamId: '' } : user,
      ),
    }))
  },
  assignRole: async (userId, role) => {
    const user = get().users.find((item) => item.id === userId)
    if (!user) {
      return
    }

    const nextUser = { ...user, role }
    await workspaceService.updateUser(nextUser)
    set((state) => ({
      users: state.users.map((item) => (item.id === userId ? nextUser : item)),
    }))
  },
  updateUserHourlyRate: async (userId, hourlyRate) => {
    const user = get().users.find((item) => item.id === userId)
    if (!user) {
      return
    }

    const nextUser = { ...user, hourlyRate: Math.max(0, hourlyRate) }
    await workspaceService.updateUser(nextUser)
    set((state) => ({
      users: state.users.map((item) => (item.id === userId ? nextUser : item)),
    }))
  },
  updateProjectBudget: async (projectId, values) => {
    const project = get().projects.find((item) => item.id === projectId)
    if (!project) {
      return
    }

    const nextProject = {
      ...project,
      budgetHours: Math.max(0, values.budgetHours),
      trackedHours: Math.max(0, values.trackedHours),
    }

    await workspaceService.updateProject(nextProject)
    set((state) => ({
      projects: state.projects.map((item) =>
        item.id === projectId ? nextProject : item,
      ),
    }))
  },
  updateProject: async (projectId, values) => {
    const project = get().projects.find((item) => item.id === projectId)
    if (!project) {
      return
    }

    const nextProject = { ...project, ...values }
    await workspaceService.updateProject(nextProject)
    set((state) => ({
      projects: state.projects.map((item) =>
        item.id === projectId ? nextProject : item,
      ),
    }))
  },
  updateTimeEntry: async (entryId, values, actor) => {
    const entry = get().timeEntries.find((item) => item.id === entryId)
    if (!entry) {
      return
    }

    const normalizedValues = {
      ...values,
      ...(values.details !== undefined
        ? { details: values.details === '' ? undefined : values.details }
        : {}),
    }

    const currentState = get()

    const nextDuration =
      normalizedValues.hours === undefined
        ? entry.duration
        : Math.max(0, Math.round(normalizedValues.hours * 3600))
    const durationDeltaHours = (nextDuration - entry.duration) / 3600
    const projectChanged =
      normalizedValues.projectId && normalizedValues.projectId !== entry.projectId
    const changes = [
      normalizedValues.description !== undefined &&
        normalizedValues.description !== entry.description
        ? {
          field: 'description',
          from: formatTimeEntryFieldValue({
            field: 'description',
            value: entry.description,
            projects: currentState.projects,
            users: currentState.users,
          }),
          to: formatTimeEntryFieldValue({
            field: 'description',
            value: normalizedValues.description,
            projects: currentState.projects,
            users: currentState.users,
          }),
        }
        : null,
      normalizedValues.details !== undefined && normalizedValues.details !== entry.details
        ? {
          field: 'details',
          from: formatTimeEntryFieldValue({
            field: 'details',
            value: entry.details,
            projects: currentState.projects,
            users: currentState.users,
          }),
          to: formatTimeEntryFieldValue({
            field: 'details',
            value: normalizedValues.details,
            projects: currentState.projects,
            users: currentState.users,
          }),
        }
        : null,
      normalizedValues.projectId !== undefined && normalizedValues.projectId !== entry.projectId
        ? {
          field: 'project',
          from: formatTimeEntryFieldValue({
            field: 'project',
            value: entry.projectId,
            projects: currentState.projects,
            users: currentState.users,
          }),
          to: formatTimeEntryFieldValue({
            field: 'project',
            value: normalizedValues.projectId,
            projects: currentState.projects,
            users: currentState.users,
          }),
        }
        : null,
      normalizedValues.userId !== undefined && normalizedValues.userId !== entry.userId
        ? {
          field: 'user',
          from: formatTimeEntryFieldValue({
            field: 'user',
            value: entry.userId,
            projects: currentState.projects,
            users: currentState.users,
          }),
          to: formatTimeEntryFieldValue({
            field: 'user',
            value: normalizedValues.userId,
            projects: currentState.projects,
            users: currentState.users,
          }),
        }
        : null,
      normalizedValues.tags !== undefined &&
        JSON.stringify(normalizedValues.tags) !== JSON.stringify(entry.tags)
        ? {
          field: 'tags',
          from: formatTimeEntryFieldValue({
            field: 'tags',
            value: entry.tags,
            projects: currentState.projects,
            users: currentState.users,
          }),
          to: formatTimeEntryFieldValue({
            field: 'tags',
            value: normalizedValues.tags,
            projects: currentState.projects,
            users: currentState.users,
          }),
        }
        : null,
      normalizedValues.billable !== undefined && normalizedValues.billable !== entry.billable
        ? {
          field: 'billable',
          from: formatTimeEntryFieldValue({
            field: 'billable',
            value: entry.billable,
            projects: currentState.projects,
            users: currentState.users,
          }),
          to: formatTimeEntryFieldValue({
            field: 'billable',
            value: normalizedValues.billable,
            projects: currentState.projects,
            users: currentState.users,
          }),
        }
        : null,
      nextDuration !== entry.duration
        ? {
          field: 'hours',
          from: formatTimeEntryFieldValue({
            field: 'hours',
            value: entry.duration,
            projects: currentState.projects,
            users: currentState.users,
          }),
          to: formatTimeEntryFieldValue({
            field: 'hours',
            value: nextDuration,
            projects: currentState.projects,
            users: currentState.users,
          }),
        }
        : null,
    ].filter((change): change is TimeEntryFieldChange => change !== null)

    const changeSnapshot = changes.reduce<{
      before: TimeEntryChangeSnapshot
      after: TimeEntryChangeSnapshot
    }>(
      (snapshot, change) => {
        snapshot.before[change.field] = change.from
        snapshot.after[change.field] = change.to
        return snapshot
      },
      { before: {}, after: {} },
    )

    const nextEntry = {
      ...entry,
      ...normalizedValues,
      duration: nextDuration,
      changeLog:
        changes.length > 0
          ? [
            ...(entry.changeLog ?? []),
            {
              id: crypto.randomUUID(),
              changedAt: new Date().toISOString(),
              changedBy: actor?.id ?? 'system',
              changedByName: actor?.name ?? 'System',
              fields: changes.map((change) => timeEntryFieldLabels[change.field]),
              changes,
              before: changeSnapshot.before,
              after: changeSnapshot.after,
            },
          ]
          : entry.changeLog,
    }
    delete nextEntry.hours
    const projects = get().projects.map((project) =>
      project.id === entry.projectId && projectChanged
        ? {
          ...project,
          trackedHours: Math.max(0, project.trackedHours - entry.duration / 3600),
        }
        : project.id === nextEntry.projectId && projectChanged
          ? {
            ...project,
            trackedHours: project.trackedHours + nextDuration / 3600,
          }
          : project.id === entry.projectId
            ? {
              ...project,
              trackedHours: Math.max(0, project.trackedHours + durationDeltaHours),
            }
            : project,
    )

    await workspaceService.updateEntry(nextEntry)
    await Promise.all(
      projects
        .filter((project) => {
          const oldProject = get().projects.find((item) => item.id === project.id)
          return oldProject && oldProject.trackedHours !== project.trackedHours
        })
        .map((project) => workspaceService.updateProject(project)),
    )

    set((state) => ({
      timeEntries: state.timeEntries.map((item) =>
        item.id === entryId ? nextEntry : item,
      ),
      projects,
    }))
  },
  updateTimeEntryDuration: async (entryId, hours) => {
    await get().updateTimeEntry(entryId, { hours })
  },
  deleteTimeEntry: async (entryId) => {
    const entry = get().timeEntries.find((item) => item.id === entryId)
    if (!entry) {
      return
    }

    const projects = get().projects.map((project) =>
      project.id === entry.projectId
        ? {
          ...project,
          trackedHours: Math.max(0, project.trackedHours - entry.duration / 3600),
        }
        : project,
    )
    const updatedProject = projects.find((project) => project.id === entry.projectId)

    await workspaceService.deleteEntry(entryId)
    if (updatedProject) {
      await workspaceService.updateProject(updatedProject)
    }

    set((state) => ({
      timeEntries: state.timeEntries.filter((item) => item.id !== entryId),
      projects,
    }))
  },
  deleteUserEverywhere: async (userId) => {
    const { projects, teams, timeEntries } = get()
    await workspaceService.deleteUserEverywhere({
      userId,
      projects,
      teams,
      timeEntries,
    })

    set((state) => ({
      users: state.users.filter((user) => user.id !== userId),
      teams: state.teams.map((team) => ({
        ...team,
        userIds: team.userIds.filter((id) => id !== userId),
      })),
      projects: state.projects.map((project) => ({
        ...project,
        members: project.members.filter((id) => id !== userId),
      })),
      timeEntries: state.timeEntries.filter((entry) => entry.userId !== userId),
    }))
  },
}))
