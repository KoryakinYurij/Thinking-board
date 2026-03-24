import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import type {
  ExpandSuggestion,
  DecomposeSuggestion,
} from '../../shared/ai/contracts'

export type SuggestionReviewStatus =
  | 'pending'
  | 'accepted'
  | 'partially_accepted'
  | 'rejected'
  | 'failed'

export type StoredSuggestionSet = {
  id: string
  sourceEntityType: 'capture_item' | 'task'
  sourceEntityId: string
  kind: 'expansion' | 'decomposition'
  status: SuggestionReviewStatus
  payload: ExpandSuggestion | DecomposeSuggestion | null
  model: string | null
  responseId: string | null
  errorMessage: string | null
  acceptedFields: string[]
  schemaVersion: 'v1'
  createdAt: string
  updatedAt: string
}

let storeFilePath = join(process.cwd(), '.data', 'ai-suggestions.json')
const store = new Map<string, StoredSuggestionSet>()
let isHydrated = false

function hydrateStore() {
  if (isHydrated) {
    return
  }

  isHydrated = true

  if (!existsSync(storeFilePath)) {
    return
  }

  try {
    const raw = readFileSync(storeFilePath, 'utf8')
    const parsed = JSON.parse(raw) as StoredSuggestionSet[]

    if (!Array.isArray(parsed)) {
      return
    }

    store.clear()

    for (const item of parsed) {
      if (item?.id) {
        store.set(item.id, item)
      }
    }
  } catch {
    store.clear()
  }
}

function persistStore() {
  mkdirSync(dirname(storeFilePath), { recursive: true })
  writeFileSync(
    storeFilePath,
    JSON.stringify([...store.values()], null, 2),
    'utf8',
  )
}

export function saveSuggestionSet(
  entry: StoredSuggestionSet,
): StoredSuggestionSet {
  hydrateStore()
  store.set(entry.id, entry)
  persistStore()
  return entry
}

export function getSuggestionSet(
  id: string,
): StoredSuggestionSet | null {
  hydrateStore()
  return store.get(id) ?? null
}

export function updateSuggestionSetStatus(
  id: string,
  status: SuggestionReviewStatus,
  acceptedFields: string[] = [],
): StoredSuggestionSet | null {
  hydrateStore()

  const existing = store.get(id)
  if (!existing) {
    return null
  }

  const updated: StoredSuggestionSet = {
    ...existing,
    status,
    acceptedFields,
    updatedAt: new Date().toISOString(),
  }

  store.set(id, updated)
  persistStore()
  return updated
}

export function resetSuggestionStoreForTests() {
  store.clear()
  isHydrated = false
}

export function setSuggestionStoreFilePathForTests(path: string) {
  storeFilePath = path
  resetSuggestionStoreForTests()
}
