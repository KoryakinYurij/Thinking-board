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

const store = new Map<string, StoredSuggestionSet>()

export function saveSuggestionSet(
  entry: StoredSuggestionSet,
): StoredSuggestionSet {
  store.set(entry.id, entry)
  return entry
}

export function getSuggestionSet(
  id: string,
): StoredSuggestionSet | null {
  return store.get(id) ?? null
}

export function updateSuggestionSetStatus(
  id: string,
  status: SuggestionReviewStatus,
  acceptedFields: string[] = [],
): StoredSuggestionSet | null {
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
  return updated
}
