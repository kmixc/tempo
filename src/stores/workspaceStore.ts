import { create } from 'zustand'
import { workspaceService } from '../services/workspaceService'
import type { Project, Role, Team, TimeEntry, User } from '../types'

type WorkspaceState = {
  users: User[]
  teams: Team[]
  projects: Project[]
  timeEntries: TimeEntry[]
  isLoading: boolean
  error: string | null
  loadWorkspace: () => Promise<void>
  addEntry: (entry: TimeEntry) => Promise<void>
  addProject: (project: Omit<Project, 'id' | 'trackedHours' | 'status'>) => Promise<void>
  addTeam: (team: Omit<Team, 'id' | 'userIds'>) => Promise<void>
  addUser: (user: User) => Promise<void>
  removeUserFromTeam: (teamId: string, userId: string) => Promise<void>
  addUserToTeam: (teamId: string, userId: string) => Promise<void>
  assignRole: (userId: string, role: Role) => Promise<void>
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  users: [],
  teams: [],
  projects: [],
  timeEntries: [],
  isLoading: false,
  error: null,
  loadWorkspace: async () => {
    set({ isLoading: true, error: null })
    try {
      const workspace = await workspaceService.getWorkspace()
      set({ ...workspace, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unable to load workspace.',
        isLoading: false,
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
}))
