import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { useAuthStore } from '../../stores/authStore'
import { AuthShell } from './AuthShell'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const login = useAuthStore((state) => state.login)
  const authError = useAuthStore((state) => state.error)
  const isLoading = useAuthStore((state) => state.isLoading)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    try {
      await login(email, password)
      navigate('/')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to sign in.')
    }
  }

  return (
    <AuthShell
      subtitle="Sign in with a Firebase Authentication account."
      title="Welcome back"
    >
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none ring-zinc-950 transition focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none ring-zinc-950 transition focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {formError || authError ? (
          <p className="text-sm text-red-600">{authError ?? formError}</p>
        ) : null}
        <Button
          className="w-full"
          disabled={isLoading}
          icon={<ArrowRight size={16} />}
          type="submit"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Accounts are created by the workspace admin.
      </p>
    </AuthShell>
  )
}
