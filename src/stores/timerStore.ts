import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RunningTimer, TimeEntry } from '../types'

type DraftTimer = Omit<RunningTimer, 'startedAt'>

type TimerState = {
  current: RunningTimer | null
  draft: DraftTimer
  setDraft: (draft: Partial<DraftTimer>) => void
  start: () => void
  stop: (userId: string) => TimeEntry | null
}

const initialDraft: DraftTimer = {
  description: '',
  details: '',
  projectId: '',
  tags: [],
  billable: true,
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      current: null,
      draft: initialDraft,
      setDraft: (draft) =>
        set((state) => ({
          draft: { ...state.draft, ...draft },
          current: state.current ? { ...state.current, ...draft } : state.current,
        })),
      start: () =>
        set((state) => ({
          current: {
            ...state.draft,
            startedAt: Date.now(),
          },
        })),
      stop: (userId) => {
        const runningTimer = get().current

        if (!runningTimer) {
          return null
        }

        const now = Date.now()
        const entry: TimeEntry = {
          id: crypto.randomUUID(),
          description: runningTimer.description || 'Untitled time entry',
          details: runningTimer.details,
          projectId: runningTimer.projectId,
          userId,
          tags: runningTimer.tags,
          billable: runningTimer.billable,
          start: new Date(runningTimer.startedAt).toISOString(),
          end: new Date(now).toISOString(),
          duration: Math.max(1, Math.floor((now - runningTimer.startedAt) / 1000)),
        }

        set({ current: null, draft: { ...runningTimer } })
        return entry
      },
    }),
    { name: 'tempo-running-timer-v2' },
  ),
)
