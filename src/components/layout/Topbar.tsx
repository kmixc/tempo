import { Eye, EyeOff, KeyRound, LogOut, Menu, Moon, Search, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore } from '../../stores/themeStore'

export function Topbar() {
  const { theme, toggleTheme } = useThemeStore()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const changePassword = useAuthStore((state) => state.changePassword)
  const isLoading = useAuthStore((state) => state.isLoading)
  const [isPasswordPanelOpen, setIsPasswordPanelOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [nextPassword, setNextPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNextPassword, setShowNextPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError(null)
    setPasswordMessage(null)

    if (nextPassword.length < 6) {
      setPasswordError('Use a password with at least 6 characters.')
      return
    }

    if (nextPassword !== confirmPassword) {
      setPasswordError('New password and confirmation must match.')
      return
    }

    try {
      await changePassword(currentPassword, nextPassword)
      setCurrentPassword('')
      setNextPassword('')
      setConfirmPassword('')
      setShowCurrentPassword(false)
      setShowNextPassword(false)
      setShowConfirmPassword(false)
      setPasswordMessage('Password updated.')
      setIsPasswordPanelOpen(false)
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : 'Unable to change the password.',
      )
    }
  }

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
      <div className="relative flex items-center gap-2">
        <Button
          aria-expanded={isPasswordPanelOpen}
          aria-label="Change password"
          className="h-10 px-3"
          onClick={() => {
            setIsPasswordPanelOpen((open) => !open)
            setPasswordError(null)
            setPasswordMessage(null)
          }}
          type="button"
          variant="secondary"
        >
          <KeyRound size={16} />
          <span className="hidden sm:inline">Password</span>
        </Button>
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
        {isPasswordPanelOpen ? (
          <div className="absolute right-0 top-14 z-30 w-80 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/40">
            <div className="mb-3">
              <h2 className="font-semibold">Change your password</h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Use your current password, then set a new one.
              </p>
            </div>
            <form className="space-y-3" onSubmit={handleChangePassword}>
              <label className="block">
                <span className="sr-only">Current password</span>
                <div className="flex items-center rounded-md border border-zinc-200 bg-zinc-50 focus-within:ring-2 focus-within:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:ring-white">
                  <input
                    className="h-10 w-full bg-transparent px-3 text-sm outline-none"
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="Current password"
                    required
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                  />
                  <button
                    aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                    className="px-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    onClick={() => setShowCurrentPassword((value) => !value)}
                    type="button"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="sr-only">New password</span>
                <div className="flex items-center rounded-md border border-zinc-200 bg-zinc-50 focus-within:ring-2 focus-within:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:ring-white">
                  <input
                    className="h-10 w-full bg-transparent px-3 text-sm outline-none"
                    minLength={6}
                    onChange={(event) => setNextPassword(event.target.value)}
                    placeholder="New password"
                    required
                    type={showNextPassword ? 'text' : 'password'}
                    value={nextPassword}
                  />
                  <button
                    aria-label={showNextPassword ? 'Hide new password' : 'Show new password'}
                    className="px-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    onClick={() => setShowNextPassword((value) => !value)}
                    type="button"
                  >
                    {showNextPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="sr-only">Confirm new password</span>
                <div className="flex items-center rounded-md border border-zinc-200 bg-zinc-50 focus-within:ring-2 focus-within:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:ring-white">
                  <input
                    className="h-10 w-full bg-transparent px-3 text-sm outline-none"
                    minLength={6}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm new password"
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                  />
                  <button
                    aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                    className="px-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    type="button"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              {passwordError ? (
                <p className="text-sm text-red-600">{passwordError}</p>
              ) : null}
              {passwordMessage ? (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {passwordMessage}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setIsPasswordPanelOpen(false)
                    setPasswordError(null)
                    setPasswordMessage(null)
                    setShowCurrentPassword(false)
                    setShowNextPassword(false)
                    setShowConfirmPassword(false)
                  }}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button disabled={isLoading} type="submit">
                  Update password
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  )
}
