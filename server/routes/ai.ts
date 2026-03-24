import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { ZodError } from 'zod'
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
  getProviderName,
  isLlmConfigured,
  LlmParseError,
  LlmValidationError,
} from '../llm'
import {
  getSuggestionSet,
  saveSuggestionSet,
  updateSuggestionSetStatus,
} from '../store/suggestions'

const aiRouter = Router()

aiRouter.post('/expand', async (request, response) => {
  try {
    const parsedRequest = expandRequestSchema.parse(request.body)

    if (!isLlmConfigured()) {
      response.status(503).json({
        error:
          'LLM provider is not configured. Set OPENAI_API_KEY or OPENROUTER_API_KEY before using /api/ai/expand.',
      })
      return
    }

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
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: 'Invalid expand request payload',
        issues: error.issues,
      })
      return
    }

    if (error instanceof LlmParseError) {
      response.status(502).json({
        error: 'LLM returned invalid JSON output',
        provider: getProviderName(),
      })
      return
    }

    if (error instanceof LlmValidationError) {
      response.status(502).json({
        error: 'LLM output failed validation',
        provider: getProviderName(),
        details: error.cause instanceof ZodError ? error.cause.issues : undefined,
      })
      return
    }

    response.status(500).json({
      error:
        error instanceof Error ? error.message : 'Unexpected AI expansion error',
    })
  }
})

aiRouter.post('/decompose', async (request, response) => {
  try {
    const parsedRequest = decomposeRequestSchema.parse(request.body)

    if (!isLlmConfigured()) {
      response.status(503).json({
        error:
          'LLM provider is not configured. Set OPENAI_API_KEY or OPENROUTER_API_KEY before using /api/ai/decompose.',
      })
      return
    }

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
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: 'Invalid decompose request payload',
        issues: error.issues,
      })
      return
    }

    if (error instanceof LlmParseError) {
      response.status(502).json({
        error: 'LLM returned invalid JSON output',
        provider: getProviderName(),
      })
      return
    }

    if (error instanceof LlmValidationError) {
      response.status(502).json({
        error: 'LLM output failed validation',
        provider: getProviderName(),
        details: error.cause instanceof ZodError ? error.cause.issues : undefined,
      })
      return
    }

    response.status(500).json({
      error:
        error instanceof Error ? error.message : 'Unexpected AI decomposition error',
    })
  }
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
  try {
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
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: 'Invalid accept suggestion payload',
        issues: error.issues,
      })
      return
    }

    response.status(500).json({
      error:
        error instanceof Error ? error.message : 'Unexpected suggestion accept error',
    })
  }
})

aiRouter.post('/suggestions/:id/reject', (request, response) => {
  try {
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
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: 'Invalid reject suggestion payload',
        issues: error.issues,
      })
      return
    }

    response.status(500).json({
      error:
        error instanceof Error ? error.message : 'Unexpected suggestion reject error',
    })
  }
})

export default aiRouter
