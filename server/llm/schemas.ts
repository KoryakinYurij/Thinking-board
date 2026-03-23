import type { ResponseFormatTextJSONSchemaConfig } from 'openai/resources/responses/responses'
import { z } from 'zod'
import {
  decomposeSuggestionSchema,
  expandSuggestionSchema,
} from '../../shared/ai/contracts'

function buildTextJsonSchemaFormat(
  schema: z.ZodType,
  name: string,
  description: string,
): ResponseFormatTextJSONSchemaConfig {
  return {
    type: 'json_schema',
    name,
    description,
    strict: true,
    schema: z.toJSONSchema(schema, {
      target: 'draft-7',
    }) as Record<string, unknown>,
  }
}

export const expandSuggestionTextFormat = buildTextJsonSchemaFormat(
  expandSuggestionSchema,
  'expansion_suggestion_v1',
  'Structured expansion suggestion for a capture item or task.',
)

export const decomposeSuggestionTextFormat = buildTextJsonSchemaFormat(
  decomposeSuggestionSchema,
  'decomposition_suggestion_v1',
  'Structured decomposition suggestion for a committed task.',
)
