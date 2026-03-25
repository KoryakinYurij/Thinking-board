import type { NextFunction, Request, Response } from 'express'
import { isLlmConfigured } from '../llm'

export function checkLlmConfigured(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!isLlmConfigured()) {
    res.status(503).json({
      error: `LLM provider is not configured. Set OPENAI_API_KEY or OPENROUTER_API_KEY before using ${req.originalUrl}.`,
    })
    return
  }
  next()
}
