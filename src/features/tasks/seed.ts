import { shiftDate } from './format'
import { sortTasks } from './board'
import type { Task } from './model'

export function seedTasks(now = new Date()): Task[] {
  const yesterday = shiftDate(now, -1)
  const tomorrow = shiftDate(now, 1)
  const inTwoDays = shiftDate(now, 2)

  return sortTasks([
    {
      id: crypto.randomUUID(),
      title: 'Map the first release around task truth',
      description:
        'Keep the board secondary: create, edit, complete, and reopen must stand on their own.',
      status: 'todo',
      priority: 'high',
      position: 1000,
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
      completedAt: null,
      archivedAt: null,
      dueAt: tomorrow.toISOString().slice(0, 10),
    },
    {
      id: crypto.randomUUID(),
      title: 'Design the quick capture lane',
      description:
        'The first interaction has to feel faster than opening a modal or dragging a card.',
      status: 'todo',
      priority: 'medium',
      position: 2000,
      createdAt: yesterday.toISOString(),
      updatedAt: now.toISOString(),
      completedAt: null,
      archivedAt: null,
      dueAt: inTwoDays.toISOString().slice(0, 10),
    },
    {
      id: crypto.randomUUID(),
      title: 'Build column projection from task status',
      description:
        'Columns should render from canonical task state rather than a second board model.',
      status: 'in_progress',
      priority: 'high',
      position: 1000,
      createdAt: yesterday.toISOString(),
      updatedAt: now.toISOString(),
      completedAt: null,
      archivedAt: null,
      dueAt: tomorrow.toISOString().slice(0, 10),
    },
    {
      id: crypto.randomUUID(),
      title: 'Define fallback controls for status changes',
      description:
        'Drag can be expressive, but completion and status updates must stay available without it.',
      status: 'in_progress',
      priority: 'medium',
      position: 2000,
      createdAt: yesterday.toISOString(),
      updatedAt: now.toISOString(),
      completedAt: null,
      archivedAt: null,
      dueAt: null,
    },
    {
      id: crypto.randomUUID(),
      title: 'Lock the MVP rules in project docs',
      description:
        'Domain rules, reorder semantics, and QA expectations are documented before scale arrives.',
      status: 'done',
      priority: 'low',
      position: 1000,
      createdAt: yesterday.toISOString(),
      updatedAt: now.toISOString(),
      completedAt: now.toISOString(),
      archivedAt: null,
      dueAt: null,
    },
  ])
}
