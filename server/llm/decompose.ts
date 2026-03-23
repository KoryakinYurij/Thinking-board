import {
  decomposeRequestSchema,
  decomposeResponseSchema,
  decomposeSuggestionSchema,
  type DecomposeRequest,
} from '../../shared/ai/contracts'
import { getLlmClient } from './client'
import { decomposeSuggestionTextFormat } from './schemas'
import { validateLlmOutput } from './validation'

export async function generateDecompositionSuggestion(input: DecomposeRequest) {
  const request = decomposeRequestSchema.parse(input)
  const client = getLlmClient()

  const response = await client.generateStructuredOutput({
    instructions:
      'You break committed tasks into smaller executable steps. Return concise structured output. Do not invent teams, workflows, or dependencies without justification.',
    input: buildDecomposePrompt(request),
    format: decomposeSuggestionTextFormat,
  })

  const suggestion = validateLlmOutput(
    response.outputText,
    decomposeSuggestionSchema,
    'decomposition suggestion',
  )

  return decomposeResponseSchema.parse({
    suggestion,
    model: response.model,
    responseId: response.responseId,
  })
}

function buildDecomposePrompt(input: DecomposeRequest) {
  return [
    'Decompose the following committed task into smaller executable work.',
    'Keep the output practical, concrete, and ordered.',
    'Subtasks should be meaningful execution units, not trivial restatements.',
    '',
    `task_id: ${input.taskId}`,
    '',
    'task_snapshot:',
    JSON.stringify(input.taskSnapshot, null, 2),
    '',
    'accepted_context:',
    JSON.stringify(input.acceptedContext, null, 2),
    '',
    'constraints:',
    JSON.stringify(input.constraints, null, 2),
  ].join('\n')
}
