import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Request, Response } from 'express'
import { checkLlmConfigured } from './llm'
import * as llm from '../llm'

vi.mock('../llm', () => ({
  isLlmConfigured: vi.fn()
}))

describe('checkLlmConfigured', () => {
  const mockRes = () => {
    const res: any = {}
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    return res
  }

  const mockNext = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls next() if LLM is configured', () => {
    vi.mocked(llm.isLlmConfigured).mockReturnValue(true)
    const res = mockRes()

    checkLlmConfigured({ originalUrl: '/api/ai/expand' } as Request, res as Response, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('returns 503 if LLM is not configured', () => {
    vi.mocked(llm.isLlmConfigured).mockReturnValue(false)
    const res = mockRes()

    checkLlmConfigured({ originalUrl: '/api/ai/expand' } as Request, res as Response, mockNext)

    expect(mockNext).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(503)
    expect(res.json).toHaveBeenCalledWith({
      error: 'LLM provider is not configured. Set OPENAI_API_KEY or OPENROUTER_API_KEY before using /api/ai/expand.'
    })
  })
})
