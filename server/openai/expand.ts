import {
  expandRequestSchema,
  expandResponseSchema,
  type ExpandRequest,
} from '../../shared/ai/contracts'
import { getOpenAIClient, getOpenAIModel } from './client'
import { expandSuggestionTextFormat } from './schemas'

export async function generateExpansionSuggestion(input: ExpandRequest) {
  const request = expandRequestSchema.parse(input)
  const client = getOpenAIClient()
  const model = getOpenAIModel()

  const response = await client.responses.parse({
    model,
    instructions:
      'You expand rough task ideas into clearer execution intent. Return concise structured output. Do not invent status systems, teams, or enterprise workflow complexity.',
    input: buildExpandPrompt(request),
    text: {
      format: expandSuggestionTextFormat,
    },
  })

  const parsed = response.output_parsed

  if (!parsed) {
    throw new Error('OpenAI returned no parsed expansion output')
  }

  return expandResponseSchema.parse({
    suggestion: parsed,
    model,
    responseId: response.id ?? null,
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
