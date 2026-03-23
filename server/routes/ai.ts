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
import { isOpenAIConfigured } from '../openai/client'
import { generateDecompositionSuggestion } from '../openai/decompose'
import { generateExpansionSuggestion } from '../openai/expand'

const aiRouter = Router()

aiRouter.post('/expand', async (request, response) => {
  try {
    const parsedRequest = expandRequestSchema.parse(request.body)

    if (!isOpenAIConfigured()) {
      response.status(503).json({
        error: 'OpenAI is not configured. Set OPENAI_API_KEY before using /api/ai/expand.',
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

    response.status(500).json({
      error:
        error instanceof Error ? error.message : 'Unexpected AI expansion error',
    })
  }
})

aiRouter.post('/decompose', async (request, response) => {
  try {
    const parsedRequest = decomposeRequestSchema.parse(request.body)

    if (!isOpenAIConfigured()) {
      response.status(503).json({
        error:
          'OpenAI is not configured. Set OPENAI_API_KEY before using /api/ai/decompose.',
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

    response.status(500).json({
      error:
        error instanceof Error ? error.message : 'Unexpected AI decomposition error',
    })
  }
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

    response.json(rejectSuggestion(payload))
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
