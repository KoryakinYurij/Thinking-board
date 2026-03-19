import { isDueSoon } from './format'
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

export function getResolvedSelectedTaskId(
  tasks: Task[],
  selectedTaskId: string | null,
) {
  return tasks.some((task) => task.id === selectedTaskId)
    ? selectedTaskId
    : (tasks[0]?.id ?? null)
}

export function getTaskStats(tasks: Task[]) {
  const openCount = tasks.filter((task) => task.status !== 'done').length
  const doneCount = tasks.filter((task) => task.status === 'done').length
  const dueSoonCount = tasks.filter((task) => isDueSoon(task.dueAt)).length

  return {
    openCount,
    doneCount,
    dueSoonCount,
    archivedCount: 0,
  }
}
