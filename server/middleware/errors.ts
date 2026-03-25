import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { LlmParseError, LlmValidationError, getProviderName } from '../llm'

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    let message = 'Invalid request payload'
    if (req.path.endsWith('/expand')) {
      message = 'Invalid expand request payload'
    } else if (req.path.endsWith('/decompose')) {
      message = 'Invalid decompose request payload'
    } else if (req.path.endsWith('/accept')) {
      message = 'Invalid accept suggestion payload'
    } else if (req.path.endsWith('/reject')) {
      message = 'Invalid reject suggestion payload'
    }

    res.status(400).json({
      error: message,
      issues: error.issues,
    })
    return
  }

  if (error instanceof LlmParseError) {
    res.status(502).json({
      error: 'LLM returned invalid JSON output',
      provider: getProviderName(),
    })
    return
  }

  if (error instanceof LlmValidationError) {
    res.status(502).json({
      error: 'LLM output failed validation',
      provider: getProviderName(),
      details: error.cause instanceof ZodError ? error.cause.issues : undefined,
    })
    return
  }

  const defaultMessage = req.path.includes('/ai') ? 'Unexpected AI error' : 'Internal server error'
  const message = error instanceof Error ? error.message : defaultMessage

  res.status(500).json({
    error: message,
  })
}
