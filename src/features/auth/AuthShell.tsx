import { Timer } from 'lucide-react'
import type { ReactNode } from 'react'

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthShell({ children, subtitle, title }: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-zinc-950 text-white lg:grid-cols-[1fr_520px]">
      <section className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_top_left,#3b82f6,transparent_32%),linear-gradient(135deg,#09090b,#18181b_48%,#27272a)] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-zinc-950">
            <Timer size={19} />
          </div>
          <span className="font-semibold">Tempo</span>
        </div>
        <div className="max-w-xl">
          <p className="mb-4 text-sm uppercase tracking-[0.24em] text-blue-200">
            Time intelligence
          </p>
          <h1 className="text-5xl font-semibold tracking-tight">
            Track work, forecast capacity, and keep delivery calm.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-zinc-300">
            A focused operating layer for teams that bill, plan, and review time
            every week.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center bg-zinc-50 px-6 py-12 text-zinc-950 dark:bg-zinc-950 dark:text-white">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-md bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
              <Timer size={19} />
            </div>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          {children}
        </div>
      </section>
    </main>
  )
}
