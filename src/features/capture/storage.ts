import { getActiveCaptureItems, sortCaptureItems } from './store'
import type { CaptureItem } from './model'

export const CAPTURE_STORAGE_KEY = 'todo-kanban-captures-v1'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

type SaveCaptureItemsResult =
  | { ok: true }
  | { ok: false; error: Error }

export function loadCaptureItems(storage: StorageLike = window.localStorage) {
  try {
    const raw = storage.getItem(CAPTURE_STORAGE_KEY)

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as CaptureItem[]

    if (!Array.isArray(parsed)) {
      return []
    }

    return sortCaptureItems(parsed)
  } catch {
    return []
  }
}

export function saveCaptureItems(
  items: CaptureItem[],
  storage: StorageLike = window.localStorage,
): SaveCaptureItemsResult {
  try {
    storage.setItem(CAPTURE_STORAGE_KEY, JSON.stringify(getActiveCaptureItems(items)))
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error : new Error('Unknown storage error'),
    }
  }
}

