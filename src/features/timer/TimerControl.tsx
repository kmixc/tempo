import { Play, Plus, Square } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { formatDuration } from '../../lib/format'
import { useAuthStore } from '../../stores/authStore'
import { useTimerStore } from '../../stores/timerStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'

export function TimerControl() {
  const [now, setNow] = useState(() => Date.now())
  const [timerFlash, setTimerFlash] = useState<'start' | 'stop' | null>(null)
  const user = useAuthStore((state) => state.user)
  const projects = useWorkspaceStore((state) => state.projects)
  const addEntry = useWorkspaceStore((state) => state.addEntry)
  const { current, draft, setDraft, start, stop } = useTimerStore()
  const hasProjects = projects.length > 0

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const elapsed = useMemo(() => {
    if (!current) {
      return 0
    }

    return Math.floor((now - current.startedAt) / 1000)
  }, [current, now])

  function flashTimer(type: 'start' | 'stop') {
    setTimerFlash(type)
    window.setTimeout(() => setTimerFlash(null), 900)
  }

  function handleStart() {
    start()
    flashTimer('start')
  }

  async function handleStop() {
    if (!user) {
      return
    }

    const entry = stop(user.id)
    flashTimer('stop')
    if (entry) {
      await addEntry(entry)
    }
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    const nextTag = event.currentTarget.value.trim()
    if (nextTag && !draft.tags.includes(nextTag)) {
      setDraft({ tags: [...draft.tags, nextTag] })
      event.currentTarget.value = ''
    }
  }

  return (
    <Card
      className={`p-4 transition ${current ? 'timer-running ' : ''}${timerFlash === 'start'
          ? 'timer-flash-start'
          : timerFlash === 'stop'
            ? 'timer-flash-stop'
            : ''
        }`}
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_180px_auto] xl:items-center">
        <div className="grid gap-3 md:grid-cols-[1.4fr_220px]">
          <input
            className="h-11 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none ring-zinc-950 transition placeholder:text-zinc-400 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white"
            onChange={(event) => setDraft({ description: event.target.value })}
            placeholder="What are you working on?"
            value={draft.description}
          />
          <select
            className="h-11 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none ring-zinc-950 transition focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white"
            disabled={!hasProjects}
            onChange={(event) => setDraft({ projectId: event.target.value })}
            value={draft.projectId}
          >
            <option value="">
              {hasProjects ? 'Select project' : 'Create a project first'}
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div className="font-mono text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          {formatDuration(elapsed)}
        </div>
        {current ? (
          <Button icon={<Square size={16} />} onClick={handleStop} variant="danger">
            Stop
          </Button>
        ) : (
          <Button
            disabled={!hasProjects || !draft.projectId}
            icon={<Play size={16} />}
            onClick={handleStart}
          >
            Start
          </Button>
        )}
      </div>
      <textarea
        className="mt-3 min-h-20 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none ring-zinc-950 transition placeholder:text-zinc-400 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white"
        onChange={(event) => setDraft({ details: event.target.value })}
        placeholder="Add details about what you completed..."
        value={draft.details}
      />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {draft.tags.map((tag) => (
          <button
            className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
            key={tag}
            onClick={() =>
              setDraft({ tags: draft.tags.filter((currentTag) => currentTag !== tag) })
            }
            type="button"
          >
            #{tag}
          </button>
        ))}
        <div className="flex items-center gap-2 rounded-full border border-dashed border-zinc-300 px-3 py-1 dark:border-zinc-700">
          <Plus size={13} />
          <input
            className="w-24 bg-transparent text-xs outline-none placeholder:text-zinc-400"
            onKeyDown={handleTagKeyDown}
            placeholder="Add tag"
          />
        </div>
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <input
            checked={draft.billable}
            className="h-4 w-4 accent-zinc-950 dark:accent-white"
            onChange={(event) => setDraft({ billable: event.target.checked })}
            type="checkbox"
          />
          Billable
        </label>
      </div>
    </Card>
  )
}
