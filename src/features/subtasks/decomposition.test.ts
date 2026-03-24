import { describe, expect, it, test } from 'vitest'
import * as contracts from '../../../shared/ai/contracts'

const hasDecomposeContracts =
  'decomposeRequestSchema' in contracts && 'decomposeResponseSchema' in contracts

describe('decomposition contract coverage', () => {
  if (hasDecomposeContracts) {
    const decomposeRequestSchema = contracts.decomposeRequestSchema
    const decomposeResponseSchema = contracts.decomposeResponseSchema

    it('accepts the frozen decompose request shape', () => {
      const parsed = decomposeRequestSchema.parse({
        taskId: 'task-1',
        taskSnapshot: {
          title: 'Break this task down',
          description: 'Need a smaller plan with next actions.',
          priority: 'high',
          dueAt: null,
        },
        acceptedContext: ['User already accepted the task title and summary.'],
        constraints: ['Do not create top-level board tasks by accident.'],
        schemaVersion: 'v1',
      })

      expect(parsed).toMatchObject({
        taskId: 'task-1',
        schemaVersion: 'v1',
        acceptedContext: ['User already accepted the task title and summary.'],
      })
    })

    it('accepts the frozen decompose response shape', () => {
      const parsed = decomposeResponseSchema.parse({
        suggestionSetId: 'suggestion-decompose-1',
        suggestion: {
          summary: 'Turn the task into a short execution plan.',
          subtasks: [
            {
              title: 'Define the decomposition payload',
              description: 'Lock the structure before wiring UI and server.',
              suggestedPriority: 'high',
              suggestedDueAt: null,
            },
          ],
          nextActions: [
            {
              title: 'Wire the first accepted subtask path',
              whyNow: 'It proves the decomposition acceptance model end-to-end.',
            },
          ],
          dependencies: ['Need the shared contract frozen first.'],
          notes: ['Keep accepted subtasks out of top-level board ordering.'],
        },
        model: 'gpt-5',
        responseId: 'resp_decompose_1',
      })

      expect(parsed.suggestion.subtasks[0]).toMatchObject({
        title: 'Define the decomposition payload',
        suggestedPriority: 'high',
      })
      expect(parsed.suggestion.nextActions[0].whyNow).toContain('proves')
    })
  } else {
    test.todo(
      'exports decomposeRequestSchema and decomposeResponseSchema from shared/ai/contracts',
    )
  }
})

