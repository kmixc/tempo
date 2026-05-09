export type Role = 'Owner' | 'Admin' | 'Manager' | 'Member'

export type User = {
  id: string
  name: string
  email: string
  avatar: string
  role: Role
  teamId: string
  capacity: number
  hourlyRate?: number
}

export type Team = {
  id: string
  name: string
  description: string
  userIds: string[]
}

export type ProjectStatus = 'Active' | 'Paused' | 'Archived'

export type Project = {
  id: string
  name: string
  client: string
  color: string
  budgetHours: number
  trackedHours: number
  status: ProjectStatus
  members: string[]
}

export type TimeEntry = {
  id: string
  description: string
  details?: string
  projectId: string
  userId: string
  tags: string[]
  billable: boolean
  start: string
  end: string
  duration: number
  changeLog?: TimeEntryChange[]
}

export type TimeEntryChange = {
  id: string
  changedAt: string
  changedBy: string
  changedByName: string
  fields: string[]
}

export type RunningTimer = {
  description: string
  details: string
  projectId: string
  tags: string[]
  billable: boolean
  startedAt: number
}
