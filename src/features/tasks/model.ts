export const STATUS_ORDER = ['todo', 'in_progress', 'done'] as const
export const PRIORITY_ORDER = ['high', 'medium', 'low'] as const

export type TaskStatus = (typeof STATUS_ORDER)[number]
export type TaskPriority = (typeof PRIORITY_ORDER)[number]
export type TaskStatusFilter = 'all' | TaskStatus
export type TaskPriorityFilter = 'all' | TaskPriority

export type Task = {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  position: number
  createdAt: string
  updatedAt: string
  completedAt: string | null
  archivedAt: string | null
  dueAt: string | null
}

export type TaskDraft = {
  title: string
  description: string
  dueAt: string | null
  priority: TaskPriority
}

export type TaskPatch = Partial<
  Pick<Task, 'title' | 'description' | 'priority' | 'dueAt'>
>

export type MovePlacement = {
  toStatus: TaskStatus
  beforeTaskId?: string
  afterTaskId?: string
}

export type ColumnMeta = {
  label: string
  eyebrow: string
  accent: string
  note: string
}

export type ColumnMap = Record<TaskStatus, Task[]>

export const STATUS_META: Record<TaskStatus, ColumnMeta> = {
  todo: {
    label: 'Open Loop',
    eyebrow: 'Queue',
    accent: 'var(--tone-todo)',
    note: 'Fresh captures and unscheduled obligations.',
  },
  in_progress: {
    label: 'In Motion',
    eyebrow: 'Focus',
    accent: 'var(--tone-progress)',
    note: 'The narrow lane for active work right now.',
  },
  done: {
    label: 'Closed',
    eyebrow: 'Archive of momentum',
    accent: 'var(--tone-done)',
    note: 'Completed tasks stay visible until archived.',
  },
}

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; accent: string; description: string }
> = {
  high: {
    label: 'High signal',
    accent: 'var(--tone-high)',
    description: 'Needs attention soon.',
  },
  medium: {
    label: 'Steady',
    accent: 'var(--tone-medium)',
    description: 'Active but not urgent.',
  },
  low: {
    label: 'Quiet',
    accent: 'var(--tone-low)',
    description: 'Can wait without damage.',
  },
}
