import { Router } from 'express'
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

    const result = await generateExpansionSuggestion(parsedRequest)
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

    const result = await generateDecompositionSuggestion(parsedRequest)
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
    const payload =
      request.body?.kind === 'decomposition'
        ? acceptDecompositionSuggestionRequestSchema.parse({
            ...request.body,
            suggestionSetId: request.params.id,
          })
        : acceptExpansionSuggestionRequestSchema.parse({
            ...request.body,
            suggestionSetId: request.params.id,
          })

    const result =
      payload.kind === 'decomposition'
        ? acceptDecompositionSuggestion(payload)
        : acceptExpansionSuggestion(payload)

    const acceptedFields = result.acceptedFields as string[]
    const allAccepted =
      payload.kind === 'expansion'
        ? acceptedFields.length === 2
        : acceptedFields.length === 2

    saveSuggestionSet({
      id: result.suggestionSetId,
      sourceEntityType:
        payload.kind === 'expansion' ? payload.sourceEntityType : 'task',
      sourceEntityId:
        payload.kind === 'expansion'
          ? payload.sourceEntityId
          : payload.sourceEntityId,
      kind: result.kind,
      status: allAccepted ? 'accepted' : 'partially_accepted',
      payload: payload.suggestion,
      model: null,
      responseId: null,
      errorMessage: null,
      acceptedFields: result.acceptedFields,
      schemaVersion: 'v1',
      createdAt: result.appliedAt,
      updatedAt: result.appliedAt,
    })

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
    const payload = rejectSuggestionRequestSchema.parse({
      ...request.body,
      suggestionSetId: request.params.id,
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
