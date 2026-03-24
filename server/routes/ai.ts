import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import {
  acceptDecompositionSuggestionRequestSchema,
  acceptExpansionSuggestionRequestSchema,
  decomposeRequestSchema,
  expandRequestSchema,
  rejectSuggestionRequestSchema,
} from '../../shared/ai/contracts'
import {
  acceptDecompositionSuggestion,
  acceptExpansionSuggestion,
  rejectSuggestion,
} from '../acceptance/suggestions'
import {
  generateDecompositionSuggestion,
  generateExpansionSuggestion,
} from '../llm'
import { checkLlmConfigured } from '../middleware/llm'
import {
  getSuggestionSet,
  saveSuggestionSet,
  updateSuggestionSetStatus,
} from '../store/suggestions'

const aiRouter = Router()

aiRouter.post('/expand', checkLlmConfigured, async (request, response) => {
  const parsedRequest = expandRequestSchema.parse(request.body)

  const suggestionSetId = randomUUID()
  const result = await generateExpansionSuggestion(parsedRequest, suggestionSetId)

  saveSuggestionSet({
    id: result.suggestionSetId,
    sourceEntityType: parsedRequest.sourceEntityType,
    sourceEntityId: parsedRequest.sourceEntityId ?? 'unknown',
    kind: 'expansion',
    status: 'pending',
    payload: result.suggestion,
    model: result.model,
    responseId: result.responseId,
    errorMessage: null,
    acceptedFields: [],
    schemaVersion: 'v1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  response.json(result)
})

aiRouter.post('/decompose', checkLlmConfigured, async (request, response) => {
  const parsedRequest = decomposeRequestSchema.parse(request.body)

  const suggestionSetId = randomUUID()
  const result = await generateDecompositionSuggestion(parsedRequest, suggestionSetId)

  saveSuggestionSet({
    id: result.suggestionSetId,
    sourceEntityType: 'task',
    sourceEntityId: parsedRequest.taskId,
    kind: 'decomposition',
    status: 'pending',
    payload: result.suggestion,
    model: result.model,
    responseId: result.responseId,
    errorMessage: null,
    acceptedFields: [],
    schemaVersion: 'v1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  response.json(result)
})

aiRouter.get('/suggestions/:id', (request, response) => {
  const suggestionSet = getSuggestionSet(request.params.id)

  if (!suggestionSet) {
    response.status(404).json({
      error: 'Suggestion set not found',
    })
    return
  }

  response.json(suggestionSet)
})

aiRouter.post('/suggestions/:id/accept', (request, response) => {
  const suggestionSetId = request.params.id
  const stored = getSuggestionSet(suggestionSetId)

  if (!stored) {
    response.status(404).json({
      error: 'Suggestion set not found',
    })
    return
  }

  if (stored.status !== 'pending') {
    response.status(409).json({
      error: `Suggestion set is already ${stored.status}`,
    })
    return
  }

  const payload =
    request.body?.kind === 'decomposition'
      ? acceptDecompositionSuggestionRequestSchema.parse({
          ...request.body,
          suggestionSetId,
          suggestion: stored.payload,
        })
      : acceptExpansionSuggestionRequestSchema.parse({
          ...request.body,
          suggestionSetId,
          suggestion: stored.payload,
        })

  const result =
    payload.kind === 'decomposition'
      ? acceptDecompositionSuggestion(payload)
      : acceptExpansionSuggestion(payload)

  updateSuggestionSetStatus(
    result.suggestionSetId,
    result.reviewStatus,
    result.acceptedFields as string[],
  )

  response.json(result)
})

aiRouter.post('/suggestions/:id/reject', (request, response) => {
  const suggestionSetId = request.params.id
  const stored = getSuggestionSet(suggestionSetId)

  if (!stored) {
    response.status(404).json({
      error: 'Suggestion set not found',
    })
    return
  }

  if (stored.status !== 'pending') {
    response.status(409).json({
      error: `Suggestion set is already ${stored.status}`,
    })
    return
  }

  const payload = rejectSuggestionRequestSchema.parse({
    ...request.body,
    suggestionSetId,
  })

  const result = rejectSuggestion(payload)

  updateSuggestionSetStatus(result.suggestionSetId, 'rejected')

  response.json(result)
})

export default aiRouter
