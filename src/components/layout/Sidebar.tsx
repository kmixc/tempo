import {
  BarChart3,
  BriefcaseBusiness,
  LayoutDashboard,
  Shield,
  Timer,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: BriefcaseBusiness },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin', label: 'Admin', icon: Shield },
]

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white/80 px-3 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 lg:block">
      <div className="mb-6 flex items-center gap-3 px-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
          <Timer size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-950 dark:text-white">Tempo</p>
          <p className="text-xs text-zinc-500">Workspace</p>
        </div>
      </div>
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon

          return (
            <NavLink
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'
                }`
              }
              key={link.to}
              to={link.to}
            >
              <Icon size={17} />
              {link.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
