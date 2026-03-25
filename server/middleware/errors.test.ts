import { describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'
import { z, ZodError } from 'zod'
import { errorHandler } from './errors'
import { LlmParseError, LlmValidationError } from '../llm'

vi.mock('../llm', () => ({
  getProviderName: () => 'test-provider',
  LlmParseError: class extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'LlmParseError'
    }
  },
  LlmValidationError: class extends Error {
    cause: any
    constructor(message: string, cause: any) {
      super(message)
      this.name = 'LlmValidationError'
      this.cause = cause
    }
  }
}))

describe('errorHandler', () => {
  const mockRes = () => {
    const res: any = {}
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    return res
  }

  it('handles ZodError with path-specific messages', () => {
    const res = mockRes()
    const error = new ZodError([])

    errorHandler(error, { path: '/api/ai/expand' } as Request, res as Response, vi.fn())
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid expand request payload' }))

    errorHandler(error, { path: '/api/ai/decompose' } as Request, res as Response, vi.fn())
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid decompose request payload' }))
  })

  it('handles LlmParseError with 502', () => {
    const res = mockRes()
    const error = new LlmParseError('boom', 'not-json')

    errorHandler(error, { path: '/api/ai/expand' } as Request, res as Response, vi.fn())
    expect(res.status).toHaveBeenCalledWith(502)
    expect(res.json).toHaveBeenCalledWith({
      error: 'LLM returned invalid JSON output',
      provider: 'test-provider'
    })
  })

  it('handles LlmValidationError with 502 and details', () => {
    const res = mockRes()
    const parsed = z.object({ test: z.string() }).safeParse({})
    const zodError = parsed.success ? new ZodError([]) : parsed.error
    const error = new LlmValidationError('validation failed', zodError)

    errorHandler(error, { path: '/api/ai/expand' } as Request, res as Response, vi.fn())
    expect(res.status).toHaveBeenCalledWith(502)
    expect(res.json).toHaveBeenCalledWith({
      error: 'LLM output failed validation',
      provider: 'test-provider',
      details: zodError.issues
    })
  })

  it('handles generic errors with 500', () => {
    const res = mockRes()
    const error = new Error('generic error')

    errorHandler(error, { path: '/api/ai/expand' } as Request, res as Response, vi.fn())
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: 'generic error' })
  })
})
