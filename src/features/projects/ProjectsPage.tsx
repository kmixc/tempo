import { Plus } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useWorkspaceStore } from '../../stores/workspaceStore'

export function ProjectsPage() {
  const { addProject, projects, users } = useWorkspaceStore()
  const [name, setName] = useState('')
  const [client, setClient] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await addProject({
      name,
      client,
      color: '#7c3aed',
      budgetHours: 140,
      members: selectedMembers,
    })
    setName('')
    setClient('')
    setSelectedMembers([])
  }

  function toggleMember(userId: string) {
    setSelectedMembers((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Planning
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Projects</h1>
        </div>
      </div>
      <Card className="p-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input
              className="h-10 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
              onChange={(event) => setName(event.target.value)}
              placeholder="Project name"
              required
              value={name}
            />
            <input
              className="h-10 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
              onChange={(event) => setClient(event.target.value)}
              placeholder="Client"
              required
              value={client}
            />
            <Button icon={<Plus size={16} />} type="submit">
              Add project
            </Button>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Assign people</p>
            <div className="flex flex-wrap gap-2">
              {users.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Create users in Admin before assigning projects.
                </p>
              ) : null}
              {users.map((user) => (
                <label
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                  key={user.id}
                >
                  <input
                    checked={selectedMembers.includes(user.id)}
                    className="h-4 w-4 accent-zinc-950 dark:accent-white"
                    onChange={() => toggleMember(user.id)}
                    type="checkbox"
                  />
                  {user.name}
                </label>
              ))}
            </div>
          </div>
        </form>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        {projects.map((project) => {
          const progress = Math.min(
            100,
            Math.round((project.trackedHours / project.budgetHours) * 100),
          )

          return (
            <Card className="p-4" key={project.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div
                    className="mb-3 h-2 w-12 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <h2 className="font-semibold">{project.name}</h2>
                  <p className="mt-1 text-sm text-zinc-500">{project.client}</p>
                </div>
                <Badge tone={project.status === 'Active' ? 'green' : 'orange'}>
                  {project.status}
                </Badge>
              </div>
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-zinc-500">Budget used</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                  <div
                    className="h-full rounded-full"
                    style={{ backgroundColor: project.color, width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="mt-5 flex -space-x-2">
                {project.members.map((memberId) => {
                  const member = users.find((user) => user.id === memberId)

                  return (
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-zinc-900 text-xs font-semibold text-white dark:border-zinc-950"
                      key={memberId}
                    >
                      {member?.avatar}
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
