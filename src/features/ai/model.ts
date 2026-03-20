import type {
  DecomposeResponse,
  DecomposeSuggestion,
  ExpandResponse,
  ExpandSuggestion,
} from '../../../shared/ai/contracts'

export const SUGGESTION_REVIEW_STATUS = [
  'pending',
  'accepted',
  'partially_accepted',
  'rejected',
  'failed',
] as const

export type SuggestionReviewStatus = (typeof SUGGESTION_REVIEW_STATUS)[number]
export type SuggestionKind = 'expansion' | 'decomposition'
export type SuggestionSourceEntityType = 'capture_item' | 'task'
export type ExpansionAcceptedField = 'normalized_title' | 'description_notes'
export type DecompositionAcceptedField = 'subtasks' | 'next_actions_notes'

export type ExpansionSuggestionSet = {
  id: string
  sourceEntityType: SuggestionSourceEntityType
  sourceEntityId: string
  kind: 'expansion'
  status: SuggestionReviewStatus
  payload: ExpandSuggestion | null
  model: string | null
  responseId: string | null
  errorMessage: string | null
  acceptedFields: ExpansionAcceptedField[]
  schemaVersion: 'v1'
  createdAt: string
  updatedAt: string
}

export type DecompositionSuggestionSet = {
  id: string
  sourceEntityType: 'task'
  sourceEntityId: string
  kind: 'decomposition'
  status: SuggestionReviewStatus
  payload: DecomposeSuggestion | null
  model: string | null
  responseId: string | null
  errorMessage: string | null
  acceptedFields: DecompositionAcceptedField[]
  schemaVersion: 'v1'
  createdAt: string
  updatedAt: string
}

export type SuggestionSet = ExpansionSuggestionSet | DecompositionSuggestionSet

export type ExpansionSuggestionRecordInput = {
  sourceEntityType: SuggestionSourceEntityType
  sourceEntityId: string
  response: ExpandResponse
}

export type ExpansionSuggestionFailureInput = {
  sourceEntityType: SuggestionSourceEntityType
  sourceEntityId: string
  errorMessage: string
}

export type DecompositionSuggestionRecordInput = {
  sourceEntityId: string
  response: DecomposeResponse
}

export type DecompositionSuggestionFailureInput = {
  sourceEntityId: string
  errorMessage: string
}
