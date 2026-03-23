export type LlmProvider = 'openai' | 'openrouter'

export interface LlmConfig {
  provider: LlmProvider
  apiKey: string
  model: string
  baseUrl?: string
  defaultHeaders?: Record<string, string>
}

const OPENAI_DEFAULT_MODEL = 'gpt-5'
const OPENROUTER_DEFAULT_MODEL = 'openai/gpt-5'
const OPENROUTER_DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1'

function getOpenAIConfig(): LlmConfig | null {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return null
  }

  return {
    provider: 'openai',
    apiKey,
    model: process.env.OPENAI_MODEL || OPENAI_DEFAULT_MODEL,
    baseUrl: process.env.OPENAI_BASE_URL || undefined,
  }
}

function getOpenRouterConfig(): LlmConfig | null {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return null
  }

  return {
    provider: 'openrouter',
    apiKey,
    model: process.env.OPENROUTER_MODEL || OPENROUTER_DEFAULT_MODEL,
    baseUrl: process.env.OPENROUTER_BASE_URL || OPENROUTER_DEFAULT_BASE_URL,
    defaultHeaders: {
      'HTTP-Referer':
        process.env.OPENROUTER_REFERER || 'https://thinking-board.app',
      'X-Title': process.env.OPENROUTER_TITLE || 'Thinking Board',
    },
  }
}

export function getLlmConfig(): LlmConfig | null {
  const providerOverride = process.env.LLM_PROVIDER as LlmProvider | undefined

  if (providerOverride === 'openai') {
    return getOpenAIConfig()
  }

  if (providerOverride === 'openrouter') {
    return getOpenRouterConfig()
  }

  const openRouterConfig = getOpenRouterConfig()
  if (openRouterConfig) {
    return openRouterConfig
  }

  return getOpenAIConfig()
}

export function isLlmConfigured(): boolean {
  return getLlmConfig() !== null
}

export function getProviderName(): string {
  return getLlmConfig()?.provider ?? 'none'
}
