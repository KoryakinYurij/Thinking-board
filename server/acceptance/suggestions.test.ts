import { describe, expect, it } from 'vitest'
import type {
  AcceptDecompositionSuggestionRequest,
  AcceptExpansionSuggestionRequest,
  DecomposeSuggestion,
  ExpandSuggestion,
  RejectSuggestionRequest,
} from '../../shared/ai/contracts'
import {
  acceptDecompositionSuggestion,
  acceptExpansionSuggestion,
  rejectSuggestion,
} from './suggestions'

const EXPANSION_START_MARKER = '--- AI expansion ---'
const EXPANSION_END_MARKER = '--- end AI expansion ---'

function makeExpandSuggestion(
  overrides: Partial<ExpandSuggestion> = {},
): ExpandSuggestion {
  return {
    summary: 'Clarify the intent before execution.',
    normalizedTitle: 'Clarify the AI task workflow',
    desiredOutcome: 'A smaller and safer implementation plan.',
    options: [{ label: 'Thin slice', summary: 'Ship the review layer first.' }],
    risks: [{ label: 'Scope drift', impact: 'The board becomes a chat tool.' }],
    assumptions: ['The current task model remains canonical.'],
    constraints: ['Do not auto-commit AI output.'],
    clarifyingQuestions: ['Should accepted notes remain editable?'],
    ...overrides,
  }
}

function makeDecomposeSuggestion(
  overrides: Partial<DecomposeSuggestion> = {},
): DecomposeSuggestion {
  return {
    summary: 'Break into steps.',
    subtasks: [
      {
        title: 'Step 1',
        description: 'First step',
        suggestedPriority: 'high',
        suggestedDueAt: null,
      },
      {
        title: 'Step 2',
        description: 'Second step',
        suggestedPriority: null,
        suggestedDueAt: '2026-04-01',
      },
    ],
    nextActions: [{ title: 'Start here', whyNow: 'It unblocks everything.' }],
    dependencies: ['Needs API key'],
    notes: ['Consider edge cases.'],
    ...overrides,
  }
}

function makeExpandAcceptRequest(
  overrides: Partial<AcceptExpansionSuggestionRequest> = {},
): AcceptExpansionSuggestionRequest {
  return {
    suggestionSetId: 'suggestion-1',
    kind: 'expansion',
    sourceEntityType: 'task',
    sourceEntityId: 'task-1',
    acceptedFields: ['normalized_title', 'description_notes'],
    suggestion: makeExpandSuggestion(),
    currentDescription: '',
    fallbackTitle: 'Original title',
    sourceCaptureId: null,
    ...overrides,
  }
}

function makeDecomposeAcceptRequest(
  overrides: Partial<AcceptDecompositionSuggestionRequest> = {},
): AcceptDecompositionSuggestionRequest {
  return {
    suggestionSetId: 'suggestion-2',
    kind: 'decomposition',
    sourceEntityId: 'task-1',
    acceptedFields: ['subtasks', 'next_actions_notes'],
    suggestion: makeDecomposeSuggestion(),
    parentTask: {
      title: 'Parent task',
      description: 'Some description',
      priority: 'medium',
      dueAt: null,
    },
    existingSubtasks: [],
    ...overrides,
  }
}

describe('acceptExpansionSuggestion', () => {
  it('returns taskPatch when source is task and all fields accepted', () => {
    const result = acceptExpansionSuggestion(
      makeExpandAcceptRequest(),
      '2026-03-20T12:00:00.000Z',
    )

    expect(result.kind).toBe('expansion')
    expect(result.reviewStatus).toBe('accepted')
    expect(result.acceptedFields).toEqual(['normalized_title', 'description_notes'])
    expect(result.taskDraft).toBeNull()
    expect(result.taskPatch).not.toBeNull()
    expect(result.taskPatch!.title).toBe('Clarify the AI task workflow')
    expect(result.taskPatch!.description).toContain(EXPANSION_START_MARKER)
    expect(result.appliedAt).toBe('2026-03-20T12:00:00.000Z')
  })

  it('returns partially_accepted when only some fields accepted', () => {
    const result = acceptExpansionSuggestion(
      makeExpandAcceptRequest({ acceptedFields: ['normalized_title'] }),
    )

    expect(result.reviewStatus).toBe('partially_accepted')
    expect(result.acceptedFields).toEqual(['normalized_title'])
    expect(result.taskPatch!.title).toBe('Clarify the AI task workflow')
    expect(result.taskPatch!.description).toBeUndefined()
  })

  it('returns partially_accepted when only description_notes accepted', () => {
    const result = acceptExpansionSuggestion(
      makeExpandAcceptRequest({ acceptedFields: ['description_notes'] }),
    )

    expect(result.reviewStatus).toBe('partially_accepted')
    expect(result.taskPatch!.title).toBeUndefined()
    expect(result.taskPatch!.description).toContain(EXPANSION_START_MARKER)
  })

  it('returns taskDraft when source is capture_item', () => {
    const result = acceptExpansionSuggestion(
      makeExpandAcceptRequest({
        sourceEntityType: 'capture_item',
        sourceCaptureId: 'capture-1',
        fallbackTitle: 'My rough idea',
      }),
    )

    expect(result.taskPatch).toBeNull()
    expect(result.taskDraft).not.toBeNull()
    expect(result.taskDraft!.title).toBe('Clarify the AI task workflow')
    expect(result.taskDraft!.priority).toBe('medium')
    expect(result.taskDraft!.dueAt).toBeNull()
    expect(result.taskDraft!.sourceCaptureId).toBe('capture-1')
    expect(result.taskDraft!.description).toContain(EXPANSION_START_MARKER)
  })

  it('uses fallbackTitle when title field not accepted for capture_item', () => {
    const result = acceptExpansionSuggestion(
      makeExpandAcceptRequest({
        sourceEntityType: 'capture_item',
        acceptedFields: ['description_notes'],
        fallbackTitle: 'My rough idea',
      }),
    )

    expect(result.taskDraft!.title).toBe('My rough idea')
  })

  it('strips previous AI expansion block on re-acceptance', () => {
    const existingDescription = [
      'Some existing notes.',
      '',
      EXPANSION_START_MARKER,
      'Summary: Old summary',
      'Desired outcome: Old outcome',
      EXPANSION_END_MARKER,
      '',
      'Post-expansion notes.',
    ].join('\n')

    const result = acceptExpansionSuggestion(
      makeExpandAcceptRequest({
        currentDescription: existingDescription,
        acceptedFields: ['description_notes'],
      }),
    )

    expect(result.taskPatch!.description).not.toContain('Old summary')
    expect(result.taskPatch!.description).toContain('Some existing notes')
    expect(result.taskPatch!.description).toContain('Post-expansion notes')
    expect(result.taskPatch!.description).toContain('Summary: Clarify the intent')
  })
})

describe('acceptDecompositionSuggestion', () => {
  it('returns accepted when all fields accepted', () => {
    const result = acceptDecompositionSuggestion(
      makeDecomposeAcceptRequest(),
      '2026-03-20T12:00:00.000Z',
    )

    expect(result.kind).toBe('decomposition')
    expect(result.reviewStatus).toBe('accepted')
    expect(result.acceptedFields).toEqual(['subtasks', 'next_actions_notes'])
    expect(result.taskPatch).not.toBeNull()
    expect(result.taskPatch!.description).toContain('--- AI decomposition ---')
    expect(result.subtaskDrafts).toHaveLength(2)
    expect(result.appliedAt).toBe('2026-03-20T12:00:00.000Z')
  })

  it('returns partially_accepted when only subtasks accepted', () => {
    const result = acceptDecompositionSuggestion(
      makeDecomposeAcceptRequest({ acceptedFields: ['subtasks'] }),
    )

    expect(result.reviewStatus).toBe('partially_accepted')
    expect(result.taskPatch).toBeNull()
    expect(result.subtaskDrafts).toHaveLength(2)
  })

  it('returns partially_accepted when only next_actions_notes accepted', () => {
    const result = acceptDecompositionSuggestion(
      makeDecomposeAcceptRequest({ acceptedFields: ['next_actions_notes'] }),
    )

    expect(result.reviewStatus).toBe('partially_accepted')
    expect(result.taskPatch).not.toBeNull()
    expect(result.subtaskDrafts).toHaveLength(0)
  })

  it('deduplicates existing subtasks', () => {
    const result = acceptDecompositionSuggestion(
      makeDecomposeAcceptRequest({
        existingSubtasks: [
          { title: 'Step 1', description: 'First step', position: 1000 },
        ],
      }),
    )

    expect(result.subtaskDrafts).toHaveLength(1)
    expect(result.subtaskDrafts[0].title).toBe('Step 2')
  })

  it('assigns correct positions after existing subtasks', () => {
    const result = acceptDecompositionSuggestion(
      makeDecomposeAcceptRequest({
        existingSubtasks: [
          { title: 'Existing', description: 'Already here', position: 3000 },
        ],
      }),
    )

    expect(result.subtaskDrafts[0].position).toBe(4000)
    expect(result.subtaskDrafts[1].position).toBe(5000)
  })

  it('normalizes null priority to medium', () => {
    const result = acceptDecompositionSuggestion(
      makeDecomposeAcceptRequest({ acceptedFields: ['subtasks'] }),
    )

    const step2 = result.subtaskDrafts.find((s) => s.title === 'Step 2')
    expect(step2!.priority).toBe('medium')
  })
})

describe('rejectSuggestion', () => {
  it('returns rejected for expansion', () => {
    const input: RejectSuggestionRequest = {
      suggestionSetId: 'suggestion-1',
      kind: 'expansion',
    }
    const result = rejectSuggestion(input, '2026-03-20T12:00:00.000Z')

    expect(result.suggestionSetId).toBe('suggestion-1')
    expect(result.kind).toBe('expansion')
    expect(result.reviewStatus).toBe('rejected')
    expect(result.appliedAt).toBe('2026-03-20T12:00:00.000Z')
  })

  it('returns rejected for decomposition', () => {
    const input: RejectSuggestionRequest = {
      suggestionSetId: 'suggestion-2',
      kind: 'decomposition',
    }
    const result = rejectSuggestion(input)

    expect(result.kind).toBe('decomposition')
    expect(result.reviewStatus).toBe('rejected')
  })
})
