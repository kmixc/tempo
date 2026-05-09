import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { useAuthStore } from '../../stores/authStore'
import { AuthShell } from './AuthShell'

export function ForcePasswordChangePage() {
  const changePassword = useAuthStore((state) => state.changePassword)
  const isLoading = useAuthStore((state) => state.isLoading)
  const user = useAuthStore((state) => state.user)
  const [currentPassword, setCurrentPassword] = useState('')
  const [nextPassword, setNextPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNextPassword, setShowNextPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (nextPassword.length < 6) {
      setFormError('Use a password with at least 6 characters.')
      return
    }

    if (nextPassword !== confirmPassword) {
      setFormError('New password and confirmation must match.')
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
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Unable to change the password.',
      )
    }
  }

  return (
    <AuthShell
      subtitle="This account is using a temporary password. Update it before continuing into the workspace."
      title="Change temporary password"
    >
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
        Signed in as {user?.email}. Use the temporary password you were given as the current password below.
      </div>
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium">Current temporary password</span>
          <div className="mt-2 flex items-center rounded-md border border-zinc-200 bg-white ring-zinc-950 transition focus-within:ring-2 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white">
            <input
              className="h-11 w-full bg-transparent px-3 text-sm outline-none"
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
            />
            <button
              aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
              className="px-3 text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
              onClick={() => setShowCurrentPassword((value) => !value)}
              type="button"
            >
              {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-medium">New password</span>
          <div className="mt-2 flex items-center rounded-md border border-zinc-200 bg-white ring-zinc-950 transition focus-within:ring-2 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white">
            <input
              className="h-11 w-full bg-transparent px-3 text-sm outline-none"
              minLength={6}
              onChange={(event) => setNextPassword(event.target.value)}
              required
              type={showNextPassword ? 'text' : 'password'}
              value={nextPassword}
            />
            <button
              aria-label={showNextPassword ? 'Hide new password' : 'Show new password'}
              className="px-3 text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
              onClick={() => setShowNextPassword((value) => !value)}
              type="button"
            >
              {showNextPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Confirm new password</span>
          <div className="mt-2 flex items-center rounded-md border border-zinc-200 bg-white ring-zinc-950 transition focus-within:ring-2 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white">
            <input
              className="h-11 w-full bg-transparent px-3 text-sm outline-none"
              minLength={6}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
            />
            <button
              aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
              className="px-3 text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
              onClick={() => setShowConfirmPassword((value) => !value)}
              type="button"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        <Button
          className="w-full"
          disabled={isLoading}
          icon={<KeyRound size={16} />}
          type="submit"
        >
          {isLoading ? 'Updating password...' : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  )
}