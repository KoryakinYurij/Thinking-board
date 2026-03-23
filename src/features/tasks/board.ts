import { PRIORITY_ORDER, STATUS_ORDER } from './model'
import type {
  ColumnMap,
  MovePlacement,
  Task,
  TaskDraft,
  TaskPatch,
  TaskStatus,
} from './model'

const POSITION_STEP = 1000

export function getActiveTasks(tasks: Task[]) {
  return tasks.filter((task) => !task.archivedAt && !task.parentTaskId)
}

export function getArchivedTasks(tasks: Task[]) {
  return tasks.filter((task) => task.archivedAt && !task.parentTaskId)
}

export function buildColumns(tasks: Task[]): ColumnMap {
  return Object.fromEntries(
    STATUS_ORDER.map((status) => [
      status,
      sortColumn(tasks.filter((task) => task.status === status)),
    ]),
  ) as ColumnMap
}

export function sortColumn(tasks: Task[]) {
  return [...tasks].sort((left, right) => left.position - right.position)
}

export function sortTasks(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    if (left.archivedAt && !right.archivedAt) return 1
    if (!left.archivedAt && right.archivedAt) return -1

    const statusDelta =
      STATUS_ORDER.indexOf(left.status) - STATUS_ORDER.indexOf(right.status)

    if (statusDelta !== 0) {
      return statusDelta
    }

    const priorityDelta =
      PRIORITY_ORDER.indexOf(left.priority) - PRIORITY_ORDER.indexOf(right.priority)

    if (priorityDelta !== 0 && left.position === right.position) {
      return priorityDelta
    }

    return left.position - right.position
  })
}

export function nextPosition(tasks: Task[], status: TaskStatus) {
  const column = tasks.filter((task) => task.status === status && !task.archivedAt)
  return column.length === 0
    ? POSITION_STEP
    : Math.max(...column.map((task) => task.position)) + POSITION_STEP
}

export function createTask(
  tasks: Task[],
  draft: TaskDraft,
  timestamp = new Date().toISOString(),
  createId: () => string = () => crypto.randomUUID(),
) {
  const title = draft.title.trim()

  if (!title) {
    return tasks
  }

  const nextTask: Task = {
    id: createId(),
    sourceCaptureId: draft.sourceCaptureId ?? null,
    title,
    description: draft.description.trim(),
    status: 'todo',
    priority: draft.priority,
    position: nextPosition(getActiveTasks(tasks), 'todo'),
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
    archivedAt: null,
    dueAt: draft.dueAt,
  }

  return sortTasks([...tasks, nextTask])
}

export function patchTask(
  tasks: Task[],
  taskId: string,
  updates: TaskPatch,
  timestamp = new Date().toISOString(),
) {
  return tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          ...normalizeTaskPatch(task, updates),
          updatedAt: timestamp,
        }
      : task,
  )
}

export function setTaskStatus(
  tasks: Task[],
  taskId: string,
  status: TaskStatus,
  timestamp = new Date().toISOString(),
) {
  const task = tasks.find((item) => item.id === taskId)

  if (task?.parentTaskId) {
    return tasks.map((item) =>
      item.id === taskId
        ? {
            ...item,
            status,
            updatedAt: timestamp,
            completedAt: status === 'done' ? timestamp : null,
          }
        : item,
    )
  }

  return applyBoardMutation(tasks, (columns) => {
    const movedTask = findAndRemoveTask(columns, taskId)

    if (!movedTask) {
      return
    }

    movedTask.status = status
    movedTask.updatedAt = timestamp
    movedTask.completedAt = status === 'done' ? timestamp : null
    columns[status].push(movedTask)
  })
}

export function moveTask(
  tasks: Task[],
  taskId: string,
  placement: MovePlacement,
  timestamp = new Date().toISOString(),
) {
  return applyBoardMutation(tasks, (columns) => {
    const movedTask = findAndRemoveTask(columns, taskId)

    if (!movedTask) {
      return
    }

    const nextColumn = columns[placement.toStatus]
    const insertIndex = resolveInsertIndex(nextColumn, placement)

    movedTask.status = placement.toStatus
    movedTask.updatedAt = timestamp
    movedTask.completedAt = placement.toStatus === 'done' ? timestamp : null

    nextColumn.splice(insertIndex, 0, movedTask)
  })
}

export function moveTaskWithinStatus(
  tasks: Task[],
  taskId: string,
  direction: -1 | 1,
  timestamp = new Date().toISOString(),
) {
  const task = getActiveTasks(tasks).find((item) => item.id === taskId)

  if (!task) {
    return tasks
  }

  return applyBoardMutation(tasks, (columns) => {
    const column = columns[task.status]
    const currentIndex = column.findIndex((item) => item.id === taskId)

    if (currentIndex === -1) {
      return
    }

    const targetIndex = currentIndex + direction

    if (targetIndex < 0 || targetIndex >= column.length) {
      return
    }

    const [movedTask] = column.splice(currentIndex, 1)
    movedTask.updatedAt = timestamp
    column.splice(targetIndex, 0, movedTask)
  })
}

export function archiveTask(
  tasks: Task[],
  taskId: string,
  timestamp = new Date().toISOString(),
) {
  const familyIds = getTaskFamilyIds(tasks, taskId)

  if (familyIds.size === 0) {
    return tasks
  }

  return tasks.map((task) =>
    familyIds.has(task.id)
      ? {
          ...task,
          archivedAt: timestamp,
          updatedAt: timestamp,
        }
      : task,
  )
}

export function restoreTask(
  tasks: Task[],
  taskId: string,
  timestamp = new Date().toISOString(),
) {
  const task = tasks.find((item) => item.id === taskId && item.archivedAt)

  if (!task) {
    return tasks
  }

  const restoredPosition = nextPosition(getActiveTasks(tasks), task.status)
  const familyIds = getTaskFamilyIds(tasks, taskId)

  return sortTasks(
    tasks.map((item) =>
      familyIds.has(item.id)
        ? {
            ...item,
            archivedAt: null,
            updatedAt: timestamp,
            position: item.id === taskId ? restoredPosition : item.position,
          }
        : item,
    ),
  )
}

export function deleteTask(tasks: Task[], taskId: string) {
  const familyIds = getTaskFamilyIds(tasks, taskId)

  if (familyIds.size === 0) {
    return tasks
  }

  return tasks.filter((task) => !familyIds.has(task.id))
}

function applyBoardMutation(
  tasks: Task[],
  mutate: (columns: ColumnMap) => void,
) {
  const archivedTopLevel = tasks.filter(
    (task) => task.archivedAt && !task.parentTaskId,
  )
  const nestedTasks = tasks.filter((task) => task.parentTaskId)
  const columns = buildColumns(getActiveTasks(tasks).map((task) => ({ ...task })))

  mutate(columns)

  const active = STATUS_ORDER.flatMap((status) =>
    columns[status].map((task, index) => ({
      ...task,
      position: (index + 1) * POSITION_STEP,
    })),
  )

  return sortTasks([...active, ...archivedTopLevel, ...nestedTasks])
}

function findAndRemoveTask(columns: ColumnMap, taskId: string) {
  for (const status of STATUS_ORDER) {
    const index = columns[status].findIndex((task) => task.id === taskId)

    if (index !== -1) {
      const [task] = columns[status].splice(index, 1)
      return task
    }
  }

  return null
}

function resolveInsertIndex(tasks: Task[], placement: MovePlacement) {
  if (placement.beforeTaskId) {
    const beforeIndex = tasks.findIndex((task) => task.id === placement.beforeTaskId)
    return beforeIndex === -1 ? tasks.length : beforeIndex
  }

  if (placement.afterTaskId) {
    const afterIndex = tasks.findIndex((task) => task.id === placement.afterTaskId)
    return afterIndex === -1 ? tasks.length : afterIndex + 1
  }

  return tasks.length
}

function normalizeTaskPatch(task: Task, updates: TaskPatch): TaskPatch {
  const normalized = { ...updates }

  if (typeof updates.title === 'string') {
    const trimmedTitle = updates.title.trim()
    normalized.title = trimmedTitle || task.title
  }

  return normalized
}

function getTaskFamilyIds(tasks: Task[], rootTaskId: string) {
  const familyIds = new Set<string>()
  const stack = [rootTaskId]

  while (stack.length > 0) {
    const currentTaskId = stack.pop()

    if (!currentTaskId || familyIds.has(currentTaskId)) {
      continue
    }

    familyIds.add(currentTaskId)

    for (const childTask of tasks) {
      if (childTask.parentTaskId === currentTaskId) {
        stack.push(childTask.id)
      }
    }
  }

  return familyIds
}
