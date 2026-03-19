import { sortTasks } from './board'
import { seedTasks } from './seed'
import type { Task } from './model'

export const STORAGE_KEY = 'todo-kanban-mvp-v1'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

export function loadTasks(storage: StorageLike = window.localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY)

    if (!raw) {
      return sortTasks(seedTasks())
    }

    const parsed = JSON.parse(raw) as Task[]

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return sortTasks(seedTasks())
    }

    return sortTasks(parsed)
  } catch {
    return sortTasks(seedTasks())
  }
}

export function saveTasks(
  tasks: Task[],
  storage: StorageLike = window.localStorage,
) {
  storage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}
