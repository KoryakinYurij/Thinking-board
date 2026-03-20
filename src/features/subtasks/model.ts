import type { DecomposeResponse, DecomposeSuggestion } from '../../../shared/ai/contracts'
import type { Subtask } from '../tasks/model'

export type DecompositionAcceptedField = 'subtasks' | 'next_actions_notes'

export type TaskDecompositionSuggestionSet = {
  id: string
  sourceEntityId: string
  kind: 'decomposition'
  status: 'pending' | 'accepted' | 'partially_accepted' | 'rejected' | 'failed'
  payload: DecomposeSuggestion | null
  model: string | null
  responseId: string | null
  errorMessage: string | null
  acceptedFields: DecompositionAcceptedField[]
  schemaVersion: 'v1'
  createdAt: string
  updatedAt: string
}

export type DecompositionSuggestionRecordInput = {
  taskId: string
  response: DecomposeResponse
}

export type DecompositionSuggestionFailureInput = {
  taskId: string
  errorMessage: string
}

export type DecompositionAcceptanceResult = {
  acceptedFields: DecompositionAcceptedField[]
  subtasks: Subtask[]
  nextActionsNotesPatch: string | null
}
