import { zodTextFormat } from 'openai/helpers/zod'
import {
  decomposeSuggestionSchema,
  expandSuggestionSchema,
} from '../../shared/ai/contracts'

export const expandSuggestionTextFormat = zodTextFormat(
  expandSuggestionSchema,
  'expansion_suggestion_v1',
)

export const decomposeSuggestionTextFormat = zodTextFormat(
  decomposeSuggestionSchema,
  'decomposition_suggestion_v1',
)
