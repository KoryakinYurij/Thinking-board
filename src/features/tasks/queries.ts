import { getDueState } from './format'
import { STATUS_ORDER } from './model'
import type {
  Task,
  TaskPriorityFilter,
  TaskStatus,
  TaskStatusFilter,
} from './model'

export function filterTasks(
  tasks: Task[],
  search: string,
  focusStatus: TaskStatusFilter,
  priorityFilter: TaskPriorityFilter,
) {
  const normalizedSearch = search.trim().toLowerCase()

  return tasks.filter((task) => {
    const text = `${task.title} ${task.description}`.toLowerCase()
    const matchesSearch = text.includes(normalizedSearch)
    const matchesStatus = focusStatus === 'all' || task.status === focusStatus
    const matchesPriority =
      priorityFilter === 'all' || task.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })
}

export function getVisibleStatuses(focusStatus: TaskStatusFilter): TaskStatus[] {
  return focusStatus === 'all'
    ? [...STATUS_ORDER]
    : ([focusStatus] as TaskStatus[])
}

export function sortArchivedTasks(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    const leftArchivedAt = left.archivedAt ?? left.updatedAt
    const rightArchivedAt = right.archivedAt ?? right.updatedAt

    return (
      new Date(rightArchivedAt).getTime() - new Date(leftArchivedAt).getTime()
    )
  })
}

export function getResolvedSelectedTaskId(
  tasks: Task[],
  selectedTaskId: string | null,
) {
  return tasks.some((task) => task.id === selectedTaskId)
    ? selectedTaskId
    : (tasks[0]?.id ?? null)
}

export function getTaskStats(tasks: Task[]) {
  const now = new Date()
  let openCount = 0
  let doneCount = 0
  let urgentCount = 0
  let archivedCount = 0

  for (let i = 0, len = tasks.length; i < len; i++) {
    const task = tasks[i]
    const isDone = task.status === 'done'

    if (isDone) {
      doneCount++
    } else {
      openCount++
    }

    if (getDueState(task.dueAt, isDone, now).isUrgent) {
      urgentCount++
    }

    if (task.archivedAt) {
      archivedCount++
    }
  }

  return {
    openCount,
    doneCount,
    urgentCount,
    archivedCount,
  }
}
