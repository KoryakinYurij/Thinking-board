import { Router } from 'express'
import { ZodError } from 'zod'
import {
  decomposeRequestSchema,
  expandRequestSchema,
} from '../../shared/ai/contracts'
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
  response.status(501).json({
    error:
      `Suggestion accept is not implemented yet for ${request.params.id}. ` +
      'Acceptance still runs through the app state boundary.',
  })
})

aiRouter.post('/suggestions/:id/reject', (request, response) => {
  response.status(501).json({
    error:
      `Suggestion reject is not implemented yet for ${request.params.id}. ` +
      'Rejection still runs through the app state boundary.',
  })
})

export default aiRouter
