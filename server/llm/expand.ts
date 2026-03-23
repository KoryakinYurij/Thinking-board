import {
  expandRequestSchema,
  expandResponseSchema,
  expandSuggestionSchema,
  type ExpandRequest,
} from '../../shared/ai/contracts'
import { getLlmClient } from './client'
import { expandSuggestionTextFormat } from './schemas'
import { validateLlmOutput } from './validation'

export async function generateExpansionSuggestion(input: ExpandRequest) {
  const request = expandRequestSchema.parse(input)
  const client = getLlmClient()

  const response = await client.generateStructuredOutput({
    instructions:
      'You expand rough task ideas into clearer execution intent. Return concise structured output. Do not invent status systems, teams, or enterprise workflow complexity.',
    input: buildExpandPrompt(request),
    format: expandSuggestionTextFormat,
  })

  const suggestion = validateLlmOutput(
    response.outputText,
    expandSuggestionSchema,
    'expansion suggestion',
  )

  return expandResponseSchema.parse({
    suggestion,
    model: response.model,
    responseId: response.responseId,
  })
}

function buildExpandPrompt(input: ExpandRequest) {
  return [
    'Expand the following idea or task without turning it into a full project-management system.',
    'Keep the output useful, concrete, and concise.',
    '',
    `source_entity_type: ${input.sourceEntityType}`,
    `source_entity_id: ${input.sourceEntityId ?? 'unknown'}`,
    '',
    'raw_text:',
    input.rawText,
    '',
    'existing_task:',
    JSON.stringify(input.existingTask ?? null, null, 2),
    '',
    'context_documents:',
    JSON.stringify(input.contextDocuments, null, 2),
  ].join('\n')
}
