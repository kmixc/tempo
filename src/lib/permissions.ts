import type { Project, Role, Team, TimeEntry, User } from '../types'

export function canAccessApp(role: Role) {
  return role === 'Owner' || role === 'Admin' || role === 'Manager' || role === 'Member'
}

export function canAccessAdmin(role: Role) {
  return role === 'Owner' || role === 'Admin'
}

export function canManageWages(role: Role) {
  return role === 'Owner' || role === 'Admin' || role === 'Manager'
}

export function canEditTimeEntries(role: Role) {
  return role === 'Owner' || role === 'Admin'
}

export function canEditTimeEntry(viewer: User | null, entry: TimeEntry) {
  if (!viewer) {
    return false
  }

  return canEditTimeEntries(viewer.role) || entry.userId === viewer.id
}

export function canSeeEntryChangeLog(role: Role) {
  return role === 'Owner' || role === 'Admin' || role === 'Manager'
}

export function canManageProjectBudgets(role: Role) {
  return role === 'Owner' || role === 'Admin' || role === 'Manager'
}

export function hourlyRateFor(user: User | undefined) {
  return user?.hourlyRate ?? 0
}

export function teamForUser(user: User | null | undefined, teams: Team[]) {
  if (!user) {
    return undefined
  }

  return teams.find((team) => team.id === user.teamId || team.userIds.includes(user.id))
}

export function teamUserIdsForViewer(viewer: User | null, teams: Team[]) {
  const team = teamForUser(viewer, teams)
  return new Set(team ? [...team.userIds, viewer?.id].filter(Boolean) : [viewer?.id])
}

export function visibleUsersForUser(users: User[], teams: Team[], viewer: User | null) {
  if (!viewer) {
    return []
  }

  if (viewer.role === 'Owner' || viewer.role === 'Admin') {
    return users
  }

  const teamUserIds = teamUserIdsForViewer(viewer, teams)
  return users.filter((user) => teamUserIds.has(user.id))
}

export function visibleEntriesForUser(
  entries: TimeEntry[],
  viewer: User | null,
  teams: Team[] = [],
) {
  if (!viewer) {
    return []
  }

  if (viewer.role === 'Owner' || viewer.role === 'Admin') {
    return entries
  }

  if (viewer.role === 'Manager') {
    const teamUserIds = teamUserIdsForViewer(viewer, teams)
    return entries.filter((entry) => teamUserIds.has(entry.userId))
  }

  return entries.filter((entry) => entry.userId === viewer.id)
}

export function visibleProjectsForUser(
  projects: Project[],
  teams: Team[],
  viewer: User | null,
) {
  if (!viewer) {
    return []
  }

  if (viewer.role === 'Owner' || viewer.role === 'Admin') {
    return projects
  }

  const teamUserIds = teamUserIdsForViewer(viewer, teams)
  return projects.filter((project) =>
    project.members.some((memberId) => teamUserIds.has(memberId)),
  )
}
