import type { ReactNode } from 'react'
import { Card } from './Card'

type StatCardProps = {
  label: string
  value: string
  detail: string
  icon: ReactNode
}

export function StatCard({ detail, icon, label, value }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{detail}</p>
        </div>
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          {icon}
        </div>
      </div>
    </Card>
  )
}
