import type {
  DecompositionAcceptedField,
  DecompositionSuggestionFailureInput,
  DecompositionSuggestionRecordInput,
  ExpansionAcceptedField,
  ExpansionSuggestionFailureInput,
  ExpansionSuggestionRecordInput,
  ExpansionSuggestionSet,
  DecompositionSuggestionSet,
  SuggestionKind,
  SuggestionReviewStatus,
  SuggestionSet,
  SuggestionSourceEntityType,
} from './model'

export function sortSuggestionSets(items: SuggestionSet[]) {
  return [...items].sort((left, right) => {
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  })
}

export function recordExpansionSuggestion(
  items: SuggestionSet[],
  input: ExpansionSuggestionRecordInput,
  timestamp = new Date().toISOString(),
  createId: () => string = () => crypto.randomUUID(),
) {
  const nextItem: ExpansionSuggestionSet = {
    id: createId(),
    sourceEntityType: input.sourceEntityType,
    sourceEntityId: input.sourceEntityId,
    kind: 'expansion',
    status: 'pending',
    payload: input.response.suggestion,
    model: input.response.model,
    responseId: input.response.responseId,
    errorMessage: null,
    acceptedFields: [],
    schemaVersion: 'v1',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  return sortSuggestionSets([nextItem, ...items])
}

export function recordFailedExpansionSuggestion(
  items: SuggestionSet[],
  input: ExpansionSuggestionFailureInput,
  timestamp = new Date().toISOString(),
  createId: () => string = () => crypto.randomUUID(),
) {
  const nextItem: ExpansionSuggestionSet = {
    id: createId(),
    sourceEntityType: input.sourceEntityType,
    sourceEntityId: input.sourceEntityId,
    kind: 'expansion',
    status: 'failed',
    payload: null,
    model: null,
    responseId: null,
    errorMessage: input.errorMessage,
    acceptedFields: [],
    schemaVersion: 'v1',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  return sortSuggestionSets([nextItem, ...items])
}

export function recordDecompositionSuggestion(
  items: SuggestionSet[],
  input: DecompositionSuggestionRecordInput,
  timestamp = new Date().toISOString(),
  createId: () => string = () => crypto.randomUUID(),
) {
  const nextItem: DecompositionSuggestionSet = {
    id: createId(),
    sourceEntityType: 'task',
    sourceEntityId: input.sourceEntityId,
    kind: 'decomposition',
    status: 'pending',
    payload: input.response.suggestion,
    model: input.response.model,
    responseId: input.response.responseId,
    errorMessage: null,
    acceptedFields: [],
    schemaVersion: 'v1',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  return sortSuggestionSets([nextItem, ...items])
}

export function recordFailedDecompositionSuggestion(
  items: SuggestionSet[],
  input: DecompositionSuggestionFailureInput,
  timestamp = new Date().toISOString(),
  createId: () => string = () => crypto.randomUUID(),
) {
  const nextItem: DecompositionSuggestionSet = {
    id: createId(),
    sourceEntityType: 'task',
    sourceEntityId: input.sourceEntityId,
    kind: 'decomposition',
    status: 'failed',
    payload: null,
    model: null,
    responseId: null,
    errorMessage: input.errorMessage,
    acceptedFields: [],
    schemaVersion: 'v1',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  return sortSuggestionSets([nextItem, ...items])
}

export function updateExpansionSuggestionStatus(
  items: SuggestionSet[],
  suggestionSetId: string,
  status: SuggestionReviewStatus,
  acceptedFields: ExpansionAcceptedField[] = [],
  timestamp = new Date().toISOString(),
) {
  return sortSuggestionSets(
    items.map((item) =>
      item.id === suggestionSetId && item.kind === 'expansion'
        ? {
            ...item,
            status,
            acceptedFields,
            updatedAt: timestamp,
          }
        : item,
    ),
  )
}

export function updateDecompositionSuggestionStatus(
  items: SuggestionSet[],
  suggestionSetId: string,
  status: SuggestionReviewStatus,
  acceptedFields: DecompositionAcceptedField[] = [],
  timestamp = new Date().toISOString(),
) {
  return sortSuggestionSets(
    items.map((item) =>
      item.id === suggestionSetId && item.kind === 'decomposition'
        ? {
            ...item,
            status,
            acceptedFields,
            updatedAt: timestamp,
          }
        : item,
    ),
  )
}

export function getLatestExpansionSuggestionSet(
  items: SuggestionSet[],
  sourceEntityType: SuggestionSourceEntityType,
  sourceEntityId: string,
): ExpansionSuggestionSet | null {
  return (
    sortSuggestionSets(items).find(
      (item): item is ExpansionSuggestionSet =>
        item.kind === 'expansion' &&
        item.sourceEntityType === sourceEntityType &&
        item.sourceEntityId === sourceEntityId,
    ) ?? null
  )
}

export function getLatestSuggestionSet(
  items: SuggestionSet[],
  kind: SuggestionKind,
  sourceEntityType: SuggestionSourceEntityType,
  sourceEntityId: string,
) {
  return (
    sortSuggestionSets(items).find(
      (item) =>
        item.kind === kind &&
        item.sourceEntityType === sourceEntityType &&
        item.sourceEntityId === sourceEntityId,
    ) ?? null
  )
}
