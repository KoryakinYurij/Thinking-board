import {
  decomposeRequestSchema,
  decomposeResponseSchema,
  type DecomposeRequest,
} from '../../shared/ai/contracts'
import { getOpenAIClient, getOpenAIModel } from './client'
import { decomposeSuggestionTextFormat } from './schemas'

export async function generateDecompositionSuggestion(input: DecomposeRequest) {
  const request = decomposeRequestSchema.parse(input)
  const client = getOpenAIClient()
  const model = getOpenAIModel()

  const response = await client.responses.parse({
    model,
    instructions:
      'You break committed tasks into smaller executable steps. Return concise structured output. Do not invent teams, workflows, or dependencies without justification.',
    input: buildDecomposePrompt(request),
    text: {
      format: decomposeSuggestionTextFormat,
    },
  })

  const parsed = response.output_parsed

  if (!parsed) {
    throw new Error('OpenAI returned no parsed decomposition output')
  }

  return decomposeResponseSchema.parse({
    suggestion: parsed,
    model,
    responseId: response.id ?? null,
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
