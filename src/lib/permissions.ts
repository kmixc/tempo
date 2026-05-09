import type { Role, TimeEntry, User } from '../types'

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

export function canManageProjectBudgets(role: Role) {
  return role === 'Owner' || role === 'Admin' || role === 'Manager'
}

export function hourlyRateFor(user: User | undefined) {
  return user?.hourlyRate ?? 0
}

export function visibleEntriesForUser(entries: TimeEntry[], users: User[], viewer: User | null) {
  if (!viewer) {
    return []
  }

  if (viewer.role !== 'Member') {
    return entries
  }

  return entries.filter((entry) => {
    const entryUser = users.find((user) => user.id === entry.userId)
    return entryUser?.role === 'Member'
  })
}
