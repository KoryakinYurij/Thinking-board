import type { DecomposeResponse, DecomposeSuggestion } from '../../../shared/ai/contracts'
import type {
  DecompositionAcceptedField,
  DecompositionSuggestionSet,
  SuggestionReviewStatus,
} from '../ai/model'
import type { Subtask, Task, TaskPriority } from '../tasks/model'

const SUBTASK_POSITION_STEP = 1000
const DECOMPOSITION_START_MARKER = '--- AI decomposition ---'
const DECOMPOSITION_END_MARKER = '--- end AI decomposition ---'

export type DecompositionAcceptanceResult = {
  acceptedFields: DecompositionAcceptedField[]
  subtasks: Subtask[]
  nextActionsNotesPatch: string | null
}

export function getSubtasksForTask(tasks: Task[], parentTaskId: string) {
  return sortSubtasks(
    tasks.filter(
      (task): task is Subtask =>
        Boolean(task.parentTaskId) &&
        task.parentTaskId === parentTaskId &&
        !task.archivedAt,
    ),
  )
}

export function recordDecompositionSuggestion(
  items: DecompositionSuggestionSet[],
  input: { taskId: string; response: DecomposeResponse },
  timestamp = new Date().toISOString(),
  createId: () => string = () => crypto.randomUUID(),
) {
  const nextItem: DecompositionSuggestionSet = {
    id: createId(),
    sourceEntityType: 'task',
    sourceEntityId: input.taskId,
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

  return sortDecompositionSuggestionSets([nextItem, ...items])
}

export function recordFailedDecompositionSuggestion(
  items: DecompositionSuggestionSet[],
  input: { taskId: string; errorMessage: string },
  timestamp = new Date().toISOString(),
  createId: () => string = () => crypto.randomUUID(),
) {
  const nextItem: DecompositionSuggestionSet = {
    id: createId(),
    sourceEntityType: 'task',
    sourceEntityId: input.taskId,
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

  return sortDecompositionSuggestionSets([nextItem, ...items])
}

export function updateDecompositionSuggestionStatus(
  items: DecompositionSuggestionSet[],
  suggestionSetId: string,
  status: SuggestionReviewStatus,
  acceptedFields: DecompositionAcceptedField[] = [],
  timestamp = new Date().toISOString(),
) {
  return sortDecompositionSuggestionSets(
    items.map((item) =>
      item.id === suggestionSetId
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

export function getLatestDecompositionSuggestionSet(
  items: DecompositionSuggestionSet[],
  taskId: string,
) {
  return (
    sortDecompositionSuggestionSets(items).find(
      (item) => item.sourceEntityId === taskId,
    ) ?? null
  )
}

export function buildSubtasksFromSuggestion(
  parentTask: Task,
  suggestion: DecomposeSuggestion,
  existingSubtasks: Subtask[],
  timestamp = new Date().toISOString(),
  createId: () => string = () => crypto.randomUUID(),
) {
  const existingKeys = new Set(
    existingSubtasks.map((task) => `${task.title.trim()}::${task.description.trim()}`),
  )
  const startingPosition =
    existingSubtasks.length === 0
      ? SUBTASK_POSITION_STEP
      : Math.max(...existingSubtasks.map((task) => task.position)) +
        SUBTASK_POSITION_STEP

  return suggestion.subtasks
    .filter((subtask) => {
      const nextKey = `${subtask.title.trim()}::${subtask.description.trim()}`
      return !existingKeys.has(nextKey)
    })
    .map(
      (subtask, index): Subtask => ({
        id: createId(),
        parentTaskId: parentTask.id,
        sourceCaptureId: null,
        title: subtask.title.trim(),
        description: subtask.description.trim(),
        status: 'todo',
        priority: normalizeSubtaskPriority(subtask.suggestedPriority),
        position: startingPosition + index * SUBTASK_POSITION_STEP,
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: null,
        archivedAt: null,
        dueAt: subtask.suggestedDueAt,
      }),
    )
}

export function buildNextActionNotes(
  currentDescription: string,
  suggestion: DecomposeSuggestion,
) {
  const lines = [
    stripExistingNextActionsNotes(currentDescription),
    [
      DECOMPOSITION_START_MARKER,
      `Summary: ${suggestion.summary}`,
      suggestion.nextActions.length > 0 ? 'Next actions' : '',
      ...suggestion.nextActions.map(
        (action) => `- ${action.title}: ${action.whyNow}`,
      ),
      suggestion.dependencies.length > 0 ? 'Dependencies' : '',
      ...suggestion.dependencies.map((dependency) => `- ${dependency}`),
      suggestion.notes.length > 0 ? 'Notes' : '',
      ...suggestion.notes.map((note) => `- ${note}`),
      DECOMPOSITION_END_MARKER,
    ]
      .filter(Boolean)
      .join('\n'),
  ].filter(Boolean)

  return lines.join('\n\n')
}

export function buildDecompositionAcceptance(
  parentTask: Task,
  suggestion: DecomposeSuggestion,
  acceptedFields: DecompositionAcceptedField[],
  existingSubtasks: Subtask[],
  timestamp = new Date().toISOString(),
  createId: () => string = () => crypto.randomUUID(),
): DecompositionAcceptanceResult {
  return {
    acceptedFields,
    subtasks: acceptedFields.includes('subtasks')
      ? buildSubtasksFromSuggestion(
          parentTask,
          suggestion,
          existingSubtasks,
          timestamp,
          createId,
        )
      : [],
    nextActionsNotesPatch: acceptedFields.includes('next_actions_notes')
      ? buildNextActionNotes(parentTask.description, suggestion)
      : null,
  }
}

function sortSubtasks(tasks: Subtask[]) {
  return [...tasks].sort((left, right) => left.position - right.position)
}

function sortDecompositionSuggestionSets(items: DecompositionSuggestionSet[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )
}

function stripExistingNextActionsNotes(description: string) {
  const startIndex = description.indexOf(DECOMPOSITION_START_MARKER)
  const endIndex = description.indexOf(DECOMPOSITION_END_MARKER)

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return description.trim()
  }

  const beforeBlock = description.slice(0, startIndex).trimEnd()
  const afterBlock = description
    .slice(endIndex + DECOMPOSITION_END_MARKER.length)
    .trimStart()

  return [beforeBlock, afterBlock].filter(Boolean).join('\n\n').trim()
}

function normalizeSubtaskPriority(priority: TaskPriority | null): TaskPriority {
  return priority ?? 'medium'
}
