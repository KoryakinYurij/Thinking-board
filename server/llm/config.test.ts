import { afterEach, describe, expect, it } from 'vitest'
import {
  getLlmConfig,
  getProviderName,
  isLlmConfigured,
  type LlmConfig,
} from './config'

const ORIGINAL_ENV = { ...process.env }

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('llm config', () => {
  it('returns null when no provider is configured', () => {
    delete process.env.OPENAI_API_KEY
    delete process.env.OPENROUTER_API_KEY
    delete process.env.LLM_PROVIDER

    expect(getLlmConfig()).toBeNull()
    expect(isLlmConfigured()).toBe(false)
    expect(getProviderName()).toBe('none')
  })

  it('prefers OpenRouter during auto-detection', () => {
    process.env.OPENAI_API_KEY = 'sk-openai'
    process.env.OPENROUTER_API_KEY = 'sk-openrouter'

    const config = getLlmConfig() as LlmConfig

    expect(config.provider).toBe('openrouter')
    expect(config.baseUrl).toBe('https://openrouter.ai/api/v1')
  })

  it('respects explicit OpenAI provider override', () => {
    process.env.OPENAI_API_KEY = 'sk-openai'
    process.env.OPENROUTER_API_KEY = 'sk-openrouter'
    process.env.LLM_PROVIDER = 'openai'

    const config = getLlmConfig() as LlmConfig

    expect(config.provider).toBe('openai')
    expect(config.model).toBe('gpt-5')
  })

  it('returns null for explicit provider when that provider is missing', () => {
    process.env.OPENAI_API_KEY = 'sk-openai'
    process.env.LLM_PROVIDER = 'openrouter'

    expect(getLlmConfig()).toBeNull()
  })
})
