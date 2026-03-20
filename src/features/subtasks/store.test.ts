import { describe, expect, it } from 'vitest'
import {
  buildDecompositionAcceptance,
  buildNextActionNotes,
  buildSubtasksFromSuggestion,
  getLatestDecompositionSuggestionSet,
  recordDecompositionSuggestion,
  updateDecompositionSuggestionStatus,
} from './store'
import type { DecomposeResponse } from '../../../shared/ai/contracts'
import type { Task } from '../tasks/model'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? 'task-1',
    parentTaskId: overrides.parentTaskId,
    sourceCaptureId: overrides.sourceCaptureId ?? null,
    title: overrides.title ?? 'Parent task',
    description: overrides.description ?? 'Current description',
    status: overrides.status ?? 'todo',
    priority: overrides.priority ?? 'medium',
    position: overrides.position ?? 1000,
    createdAt: overrides.createdAt ?? '2026-03-20T08:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-03-20T08:00:00.000Z',
    completedAt: overrides.completedAt ?? null,
    archivedAt: overrides.archivedAt ?? null,
    dueAt: overrides.dueAt ?? null,
  }
}

function makeDecomposeResponse(
  overrides: Partial<DecomposeResponse> = {},
): DecomposeResponse {
  return {
    suggestion: {
      summary: 'Break the parent task into a thin execution sequence.',
      subtasks: [
        {
          title: 'Define the child task shape',
          description: 'Add a canonical child-task contract.',
          suggestedPriority: 'high',
          suggestedDueAt: null,
        },
        {
          title: 'Build acceptance helpers',
          description: 'Turn selected decomposition output into canonical records.',
          suggestedPriority: 'medium',
          suggestedDueAt: '2026-03-25',
        },
      ],
      nextActions: [
        {
          title: 'Freeze the payload',
          whyNow: 'Integration will drift without a locked response shape.',
        },
      ],
      dependencies: ['Decompose contract must be stable first.'],
      notes: ['Do not push child tasks onto the top-level board.'],
    },
    model: overrides.model ?? 'gpt-5',
    responseId: overrides.responseId ?? 'resp_decompose_1',
  }
}

describe('subtask decomposition store', () => {
  it('records and retrieves the latest decomposition suggestion set', () => {
    const older = recordDecompositionSuggestion(
      [],
      {
        taskId: 'task-1',
        response: makeDecomposeResponse({ responseId: 'old' }),
      },
      '2026-03-20T08:00:00.000Z',
      () => 'decompose-old',
    )

    const next = recordDecompositionSuggestion(
      older,
      {
        taskId: 'task-1',
        response: makeDecomposeResponse({ responseId: 'new' }),
      },
      '2026-03-20T09:00:00.000Z',
      () => 'decompose-new',
    )

    expect(getLatestDecompositionSuggestionSet(next, 'task-1')?.id).toBe(
      'decompose-new',
    )
  })

  it('builds canonical child tasks without polluting top-level board semantics', () => {
    const task = makeTask()
    const suggestion = makeDecomposeResponse().suggestion

    const subtasks = buildSubtasksFromSuggestion(
      task,
      suggestion,
      [],
      '2026-03-20T10:00:00.000Z',
      () => 'child-1',
    )

    expect(subtasks[0]).toMatchObject({
      parentTaskId: 'task-1',
      status: 'todo',
      position: 1000,
      priority: 'high',
    })
  })

  it('does not duplicate identical subtasks on repeated acceptance', () => {
    const task = makeTask()
    const suggestion = makeDecomposeResponse().suggestion
    const existing = buildSubtasksFromSuggestion(
      task,
      suggestion,
      [],
      '2026-03-20T10:00:00.000Z',
      () => 'child-1',
    )

    const repeated = buildSubtasksFromSuggestion(
      task,
      suggestion,
      existing,
      '2026-03-20T10:05:00.000Z',
      () => 'child-2',
    )

    expect(repeated).toEqual([])
  })

  it('replaces the previous decomposition note block instead of duplicating it', () => {
    const suggestion = makeDecomposeResponse().suggestion

    const result = buildNextActionNotes(
      [
        'Current description',
        '',
        '--- AI decomposition ---',
        'Summary: old',
        '--- end AI decomposition ---',
      ].join('\n'),
      suggestion,
    )

    expect(result).toContain('Current description')
    expect(result).toContain('Summary: Break the parent task into a thin execution sequence.')
    expect(result.match(/--- AI decomposition ---/g)).toHaveLength(1)
  })

  it('builds a partial acceptance result without mutating unrelated fields', () => {
    const task = makeTask()
    const suggestion = makeDecomposeResponse().suggestion

    const result = buildDecompositionAcceptance(
      task,
      suggestion,
      ['next_actions_notes'],
      [],
      '2026-03-20T11:00:00.000Z',
      () => 'child-1',
    )

    expect(result.acceptedFields).toEqual(['next_actions_notes'])
    expect(result.subtasks).toEqual([])
    expect(result.nextActionsNotesPatch).toContain('Next actions')
  })

  it('updates decomposition suggestion status and accepted fields', () => {
    const items = recordDecompositionSuggestion(
      [],
      {
        taskId: 'task-1',
        response: makeDecomposeResponse(),
      },
      '2026-03-20T12:00:00.000Z',
      () => 'decompose-1',
    )

    const next = updateDecompositionSuggestionStatus(
      items,
      'decompose-1',
      'partially_accepted',
      ['subtasks'],
      '2026-03-20T12:10:00.000Z',
    )

    expect(next[0]).toMatchObject({
      status: 'partially_accepted',
      acceptedFields: ['subtasks'],
      updatedAt: '2026-03-20T12:10:00.000Z',
    })
  })
})
