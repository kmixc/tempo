import { LogOut, Menu, Moon, Search, Sun } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore } from '../../stores/themeStore'

export function Topbar() {
  const { theme, toggleTheme } = useThemeStore()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 lg:hidden"
          type="button"
        >
          <Menu size={20} />
        </button>
        <div className="hidden h-10 w-80 items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 md:flex">
          <Search size={16} />
          Search entries, projects, people
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          aria-label="Toggle color mode"
          className="h-10 w-10 px-0"
          onClick={toggleTheme}
          variant="secondary"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </Button>
        <div className="hidden items-center gap-3 rounded-md border border-zinc-200 bg-white px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            {user?.avatar}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-zinc-950 dark:text-white">
              {user?.name}
            </p>
            <p className="text-xs text-zinc-500">{user?.role}</p>
          </div>
        </div>
        <Button
          aria-label="Log out"
          className="h-10 w-10 px-0"
          onClick={logout}
          variant="ghost"
        >
          <LogOut size={16} />
        </Button>
      </div>
    </header>
  )
}
