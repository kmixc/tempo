import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { AdminPage } from './features/admin/AdminPage'
import { ForcePasswordChangePage } from './features/auth/ForcePasswordChangePage'
import { LoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ProjectDetailPage } from './features/projects/ProjectDetailPage'
import { ProjectsPage } from './features/projects/ProjectsPage'
import { ReportsPage } from './features/reports/ReportsPage'
import { TeamPage } from './features/team/TeamPage'
import { canAccessAdmin, canAccessApp, teamForUser } from './lib/permissions'
import { useAuthStore } from './stores/authStore'
import { useWorkspaceStore } from './stores/workspaceStore'

function ProtectedRoute() {
  const user = useAuthStore((state) => state.user)
  const isReady = useAuthStore((state) => state.isReady)
  const hasLoadedWorkspace = useWorkspaceStore((state) => state.hasLoaded)
  const teams = useWorkspaceStore((state) => state.teams)

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
        Loading workspace...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!canAccessApp(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 text-center dark:bg-zinc-950">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-white">
            Access restricted
          </h1>
          <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            Ask the workspace owner to approve this account if you need access.
          </p>
        </div>
      </div>
    )
  }

  if (user.mustChangePassword) {
    return <ForcePasswordChangePage />
  }

  if (user.role === 'Member' && !hasLoadedWorkspace) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
        Loading workspace...
      </div>
    )
  }

  if (user.role === 'Member' && !teamForUser(user, teams)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 text-center dark:bg-zinc-950">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-white">
            No team assigned
          </h1>
          <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            Your account needs to be added to a team before you can use Tempo.
            Reach out to an admin to finish setup.
          </p>
        </div>
      </div>
    )
  }

  return <AppLayout />
}

function AdminRoute() {
  const user = useAuthStore((state) => state.user)

  if (!user || !canAccessAdmin(user.role)) {
    return <Navigate to="/" replace />
  }

  return <AdminPage />
}

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initialize)
  const user = useAuthStore((state) => state.user)
  const loadWorkspace = useWorkspaceStore((state) => state.loadWorkspace)

  useEffect(() => initializeAuth(), [initializeAuth])

  useEffect(() => {
    if (user) {
      void loadWorkspace()
    }
  }, [loadWorkspace, user])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/admin" element={<AdminRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
