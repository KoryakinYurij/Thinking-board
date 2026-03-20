import { describe, expect, it } from 'vitest'
import {
  getLatestExpansionSuggestionSet,
  recordExpansionSuggestion,
  recordFailedExpansionSuggestion,
  updateExpansionSuggestionStatus,
} from './store'
import type { ExpandResponse } from '../../../shared/ai/contracts'

function makeExpandResponse(overrides: Partial<ExpandResponse> = {}): ExpandResponse {
  return {
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
      () => 'suggestion-1',
    )

    expect(next[0]).toMatchObject({
      id: 'suggestion-1',
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
      () => 'suggestion-1',
    )

    const next = updateExpansionSuggestionStatus(
      created,
      'suggestion-1',
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
          response: makeExpandResponse({ responseId: 'resp_old' }),
        },
        '2026-03-20T12:00:00.000Z',
        () => 'suggestion-old',
      ),
      {
        sourceEntityType: 'task',
        sourceEntityId: 'task-1',
        response: makeExpandResponse({ responseId: 'resp_new' }),
      },
      '2026-03-20T12:10:00.000Z',
      () => 'suggestion-new',
    )

    expect(getLatestExpansionSuggestionSet(items, 'task', 'task-1')?.id).toBe(
      'suggestion-new',
    )
  })
})
