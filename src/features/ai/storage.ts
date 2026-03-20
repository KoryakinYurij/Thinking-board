import { sortSuggestionSets } from './store'
import type { SuggestionSet } from './model'

export const SUGGESTION_STORAGE_KEY = 'todo-kanban-ai-suggestions-v1'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

type SaveSuggestionSetsResult =
  | { ok: true }
  | { ok: false; error: Error }

export function loadSuggestionSets(storage: StorageLike = window.localStorage) {
  try {
    const raw = storage.getItem(SUGGESTION_STORAGE_KEY)

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as SuggestionSet[]

    if (!Array.isArray(parsed)) {
      return []
    }

    return sortSuggestionSets(parsed)
  } catch {
    return []
  }
}

export function saveSuggestionSets(
  items: SuggestionSet[],
  storage: StorageLike = window.localStorage,
): SaveSuggestionSetsResult {
  try {
    storage.setItem(SUGGESTION_STORAGE_KEY, JSON.stringify(items))
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error : new Error('Unknown storage error'),
    }
  }
}
