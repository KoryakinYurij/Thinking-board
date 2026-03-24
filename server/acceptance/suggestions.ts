import type {
  AcceptDecompositionSuggestionRequest,
  AcceptDecompositionSuggestionResponse,
  AcceptExpansionSuggestionRequest,
  AcceptExpansionSuggestionResponse,
  CurrentSubtaskSnapshot,
  DecomposeSuggestion,
  ExpandSuggestion,
  RejectSuggestionRequest,
  RejectSuggestionResponse,
  TaskPriority,
} from '../../shared/ai/contracts'

const EXPANSION_START_MARKER = '--- AI expansion ---'
const EXPANSION_END_MARKER = '--- end AI expansion ---'
const DECOMPOSITION_START_MARKER = '--- AI decomposition ---'
const DECOMPOSITION_END_MARKER = '--- end AI decomposition ---'
const SUBTASK_POSITION_STEP = 1000

const EXPANSION_ACCEPTABLE_FIELDS = [
  'normalized_title',
  'description_notes',
] as const

const DECOMPOSITION_ACCEPTABLE_FIELDS = [
  'subtasks',
  'next_actions_notes',
] as const

function isAllAccepted(
  acceptedFields: readonly string[],
  acceptableFields: readonly string[],
): boolean {
  return acceptableFields.every((field) => acceptedFields.includes(field))
}

export function acceptExpansionSuggestion(
  input: AcceptExpansionSuggestionRequest,
  appliedAt = new Date().toISOString(),
): AcceptExpansionSuggestionResponse {
  const reviewStatus = isAllAccepted(
    input.acceptedFields,
    EXPANSION_ACCEPTABLE_FIELDS,
  )
    ? 'accepted'
    : 'partially_accepted'

  if (input.sourceEntityType === 'task') {
    return {
      suggestionSetId: input.suggestionSetId,
      kind: 'expansion',
      reviewStatus,
      acceptedFields: input.acceptedFields,
      taskPatch: {
        ...(input.acceptedFields.includes('normalized_title')
          ? { title: input.suggestion.normalizedTitle }
          : {}),
        ...(input.acceptedFields.includes('description_notes')
          ? {
              description: buildExpansionNotes(
                input.currentDescription,
                input.suggestion,
              ),
            }
          : {}),
      },
      taskDraft: null,
      appliedAt,
    }
  }

  return {
    suggestionSetId: input.suggestionSetId,
    kind: 'expansion',
    reviewStatus,
    acceptedFields: input.acceptedFields,
    taskPatch: null,
    taskDraft: {
      title: input.acceptedFields.includes('normalized_title')
        ? input.suggestion.normalizedTitle
        : input.fallbackTitle.trim(),
      description: input.acceptedFields.includes('description_notes')
        ? buildExpansionNotes('', input.suggestion)
        : '',
      priority: 'medium',
      dueAt: null,
      sourceCaptureId: input.sourceCaptureId ?? null,
    },
    appliedAt,
  }
}

export function acceptDecompositionSuggestion(
  input: AcceptDecompositionSuggestionRequest,
  appliedAt = new Date().toISOString(),
): AcceptDecompositionSuggestionResponse {
  const reviewStatus = isAllAccepted(
    input.acceptedFields,
    DECOMPOSITION_ACCEPTABLE_FIELDS,
  )
    ? 'accepted'
    : 'partially_accepted'

  return {
    suggestionSetId: input.suggestionSetId,
    kind: 'decomposition',
    reviewStatus,
    acceptedFields: input.acceptedFields,
    taskPatch: input.acceptedFields.includes('next_actions_notes')
      ? {
          description: buildDecompositionNotes(
            input.parentTask.description,
            input.suggestion,
          ),
        }
      : null,
    subtaskDrafts: input.acceptedFields.includes('subtasks')
      ? buildAcceptedSubtaskDrafts(input.suggestion, input.existingSubtasks)
      : [],
    appliedAt,
  }
}

export function rejectSuggestion(
  input: RejectSuggestionRequest,
  appliedAt = new Date().toISOString(),
): RejectSuggestionResponse {
  return {
    suggestionSetId: input.suggestionSetId,
    kind: input.kind,
    reviewStatus: 'rejected',
    appliedAt,
  }
}

function buildExpansionNotes(
  currentDescription: string,
  suggestion: ExpandSuggestion,
) {
  const baseDescription = stripBlock(
    currentDescription,
    EXPANSION_START_MARKER,
    EXPANSION_END_MARKER,
  )
  const sections = [
    baseDescription,
    [
      EXPANSION_START_MARKER,
      `Summary: ${suggestion.summary}`,
      `Desired outcome: ${suggestion.desiredOutcome}`,
      formatLabeledItems('Options', suggestion.options, (option) =>
        `${option.label}: ${option.summary}`,
      ),
      formatLabeledItems('Risks', suggestion.risks, (risk) =>
        `${risk.label}: ${risk.impact}`,
      ),
      formatStringList('Assumptions', suggestion.assumptions),
      formatStringList('Constraints', suggestion.constraints),
      formatStringList('Clarifying questions', suggestion.clarifyingQuestions),
      EXPANSION_END_MARKER,
    ]
      .filter(Boolean)
      .join('\n'),
  ].filter(Boolean)

  return sections.join('\n\n')
}

function buildDecompositionNotes(
  currentDescription: string,
  suggestion: DecomposeSuggestion,
) {
  const baseDescription = stripBlock(
    currentDescription,
    DECOMPOSITION_START_MARKER,
    DECOMPOSITION_END_MARKER,
  )

  const sections = [
    baseDescription,
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

  return sections.join('\n\n')
}

function buildAcceptedSubtaskDrafts(
  suggestion: DecomposeSuggestion,
  existingSubtasks: CurrentSubtaskSnapshot[],
) {
  const existingKeys = new Set(
    existingSubtasks.map(
      (task) => `${task.title.trim()}::${task.description.trim()}`,
    ),
  )
  const startingPosition =
    existingSubtasks.length === 0
      ? SUBTASK_POSITION_STEP
      : Math.max(...existingSubtasks.map((task) => task.position)) +
        SUBTASK_POSITION_STEP

  return suggestion.subtasks
    .filter((subtask) => {
      const key = `${subtask.title.trim()}::${subtask.description.trim()}`
      return !existingKeys.has(key)
    })
    .map((subtask, index) => ({
      title: subtask.title.trim(),
      description: subtask.description.trim(),
      priority: normalizePriority(subtask.suggestedPriority),
      dueAt: subtask.suggestedDueAt,
      position: startingPosition + index * SUBTASK_POSITION_STEP,
    }))
}

function stripBlock(description: string, startMarker: string, endMarker: string) {
  const startIndex = description.indexOf(startMarker)
  const endIndex = description.indexOf(endMarker)

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return description.trim()
  }

  const beforeBlock = description.slice(0, startIndex).trimEnd()
  const afterBlock = description
    .slice(endIndex + endMarker.length)
    .trimStart()

  return [beforeBlock, afterBlock].filter(Boolean).join('\n\n').trim()
}

function formatLabeledItems<T>(
  heading: string,
  items: T[],
  renderItem: (item: T) => string,
) {
  if (items.length === 0) {
    return ''
  }

  return [heading, ...items.map((item) => `- ${renderItem(item)}`)].join('\n')
}

function formatStringList(heading: string, items: string[]) {
  if (items.length === 0) {
    return ''
  }

  return [heading, ...items.map((item) => `- ${item}`)].join('\n')
}

function normalizePriority(priority: TaskPriority | null): TaskPriority {
  return priority ?? 'medium'
}
