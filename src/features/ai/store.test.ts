import { describe, expect, it } from 'vitest'
import {
  getLatestSuggestionSet,
  recordDecompositionSuggestion,
  getLatestExpansionSuggestionSet,
  recordExpansionSuggestion,
  recordFailedExpansionSuggestion,
  updateExpansionSuggestionStatus,
} from './store'
import type { DecomposeResponse, ExpandResponse } from '../../../shared/ai/contracts'

function makeExpandResponse(overrides: Partial<ExpandResponse> = {}): ExpandResponse {
  return {
    suggestionSetId: overrides.suggestionSetId ?? 'suggestion-expand-1',
    suggestion: {
      summary: 'Clarify the intent before execution.',
      normalizedTitle: 'Clarify the AI task workflow',
      desiredOutcome: 'A smaller and safer implementation plan.',
      options: [{ label: 'Thin slice', summary: 'Ship the review layer first.' }],
      risks: [{ label: 'Scope drift', impact: 'The board becomes a chat tool.' }],
      assumptions: ['The current task model remains canonical.'],
      constraints: ['Do not auto-commit AI output.'],
      clarifyingQuestions: ['Should accepted notes remain editable?'],
    },
    model: overrides.model ?? 'gpt-5',
    responseId: overrides.responseId ?? 'resp_123',
  }
}

function makeDecomposeResponse(
  overrides: Partial<DecomposeResponse> = {},
): DecomposeResponse {
  return {
    suggestionSetId: overrides.suggestionSetId ?? 'suggestion-decompose-1',
    suggestion: {
      summary: 'Break the task into steps.',
      subtasks: [],
      nextActions: [],
      dependencies: [],
      notes: [],
    },
    model: overrides.model ?? 'gpt-5',
    responseId: overrides.responseId ?? 'resp_decompose_123',
  }
}

describe('AI suggestion store', () => {
  it('records a pending expansion suggestion set', () => {
    const next = recordExpansionSuggestion(
      [],
      {
        sourceEntityType: 'task',
        sourceEntityId: 'task-1',
        response: makeExpandResponse(),
      },
      '2026-03-20T12:00:00.000Z',
    )

    expect(next[0]).toMatchObject({
      id: 'suggestion-expand-1',
      sourceEntityType: 'task',
      sourceEntityId: 'task-1',
      status: 'pending',
      acceptedFields: [],
      model: 'gpt-5',
    })
  })

  it('records a failed expansion suggestion set', () => {
    const next = recordFailedExpansionSuggestion(
      [],
      {
        sourceEntityType: 'capture_item',
        sourceEntityId: 'capture-1',
        errorMessage: 'OpenAI is not configured.',
      },
      '2026-03-20T12:05:00.000Z',
      () => 'suggestion-failed',
    )

    expect(next[0]).toMatchObject({
      id: 'suggestion-failed',
      status: 'failed',
      errorMessage: 'OpenAI is not configured.',
      payload: null,
    })
  })

  it('updates acceptance status and accepted fields', () => {
    const created = recordExpansionSuggestion(
      [],
      {
        sourceEntityType: 'task',
        sourceEntityId: 'task-1',
        response: makeExpandResponse(),
      },
      '2026-03-20T12:00:00.000Z',
    )

    const next = updateExpansionSuggestionStatus(
      created,
      'suggestion-expand-1',
      'partially_accepted',
      ['normalized_title'],
      '2026-03-20T12:06:00.000Z',
    )

    expect(next[0]).toMatchObject({
      status: 'partially_accepted',
      acceptedFields: ['normalized_title'],
      updatedAt: '2026-03-20T12:06:00.000Z',
    })
  })

  it('returns the latest suggestion set for a specific entity', () => {
    const items = recordExpansionSuggestion(
      recordExpansionSuggestion(
        [],
        {
          sourceEntityType: 'task',
          sourceEntityId: 'task-1',
          response: makeExpandResponse({
            suggestionSetId: 'suggestion-old',
            responseId: 'resp_old',
          }),
        },
        '2026-03-20T12:00:00.000Z',
      ),
      {
        sourceEntityType: 'task',
        sourceEntityId: 'task-1',
        response: makeExpandResponse({
          suggestionSetId: 'suggestion-new',
          responseId: 'resp_new',
        }),
      },
      '2026-03-20T12:10:00.000Z',
    )

    expect(getLatestExpansionSuggestionSet(items, 'task', 'task-1')?.id).toBe(
      'suggestion-new',
    )
  })

  it('reuses the server-issued suggestionSetId instead of generating a local one', () => {
    const next = recordExpansionSuggestion([], {
      sourceEntityType: 'capture_item',
      sourceEntityId: 'capture-1',
      response: makeExpandResponse({ suggestionSetId: 'server-issued-id' }),
    })

    expect(next[0]?.id).toBe('server-issued-id')
  })

  it('reuses the server-issued suggestionSetId for decomposition suggestions too', () => {
    const items = recordDecompositionSuggestion([], {
      sourceEntityId: 'task-1',
      response: makeDecomposeResponse({ suggestionSetId: 'decompose-server-id' }),
    })

    expect(
      getLatestSuggestionSet(items, 'decomposition', 'task', 'task-1')?.id,
    ).toBe('decompose-server-id')
  })
})
