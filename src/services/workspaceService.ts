import {
  collection,
  deleteDoc,
  type DocumentData,
  doc,
  getDocs,
  orderBy,
  query,
  type QuerySnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import type { Project, Team, TimeEntry, User } from '../types'

const usersRef = collection(firestore, 'users')
const teamsRef = collection(firestore, 'teams')
const projectsRef = collection(firestore, 'projects')
const timeEntriesRef = collection(firestore, 'timeEntries')

function withId<T>(snapshot: QuerySnapshot<DocumentData>) {
  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  })) as T[]
}

export const workspaceService = {
  async getWorkspace() {
    const [userSnapshot, teamSnapshot, projectSnapshot, entrySnapshot] =
      await Promise.all([
        getDocs(usersRef),
        getDocs(teamsRef),
        getDocs(projectsRef),
        getDocs(query(timeEntriesRef, orderBy('start', 'desc'))),
      ])

    return {
      users: withId<User>(userSnapshot),
      teams: withId<Team>(teamSnapshot),
      projects: withId<Project>(projectSnapshot),
      timeEntries: withId<TimeEntry>(entrySnapshot),
    }
  },
  async upsertUser(user: User) {
    await setDoc(doc(firestore, 'users', user.id), user)
  },
  async createProject(project: Project) {
    await setDoc(doc(firestore, 'projects', project.id), project)
  },
  async updateProject(project: Project) {
    await updateDoc(doc(firestore, 'projects', project.id), { ...project })
  },
  async createTeam(team: Team) {
    await setDoc(doc(firestore, 'teams', team.id), team)
  },
  async updateTeam(team: Team) {
    await updateDoc(doc(firestore, 'teams', team.id), { ...team })
  },
  async updateUser(user: User) {
    await updateDoc(doc(firestore, 'users', user.id), { ...user })
  },
  async updateEntry(entry: TimeEntry) {
    await updateDoc(doc(firestore, 'timeEntries', entry.id), { ...entry })
  },
  async deleteUser(userId: string) {
    await deleteDoc(doc(firestore, 'users', userId))
  },
  async deleteUserEverywhere(params: {
    userId: string
    teams: Team[]
    projects: Project[]
    timeEntries: TimeEntry[]
  }) {
    const batch = writeBatch(firestore)

    batch.delete(doc(firestore, 'users', params.userId))

    params.teams.forEach((team) => {
      if (team.userIds.includes(params.userId)) {
        batch.update(doc(firestore, 'teams', team.id), {
          userIds: team.userIds.filter((id) => id !== params.userId),
        })
      }
    })

    params.projects.forEach((project) => {
      if (project.members.includes(params.userId)) {
        batch.update(doc(firestore, 'projects', project.id), {
          members: project.members.filter((id) => id !== params.userId),
        })
      }
    })

    params.timeEntries.forEach((entry) => {
      if (entry.userId === params.userId) {
        batch.delete(doc(firestore, 'timeEntries', entry.id))
      }
    })

    await batch.commit()
  },
  async createEntry(entry: TimeEntry) {
    await setDoc(doc(firestore, 'timeEntries', entry.id), entry)
  },
}
