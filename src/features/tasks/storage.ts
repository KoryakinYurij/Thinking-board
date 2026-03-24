import { sortTasks } from './board'
import type { Task } from './model'

export const STORAGE_KEY = 'todo-kanban-mvp-v1'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

type SaveTasksResult =
  | { ok: true }
  | { ok: false; error: Error }

export function loadTasks(storage: StorageLike = window.localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY)

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as Task[]

    if (!Array.isArray(parsed)) {
      return []
    }

    return sortTasks(parsed)
  } catch {
    return []
  }
}

export function saveTasks(
  tasks: Task[],
  storage: StorageLike = window.localStorage,
): SaveTasksResult {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error : new Error('Unknown storage error'),
    }
  }
}
