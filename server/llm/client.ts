import OpenAI from 'openai'
import type { ResponseFormatTextJSONSchemaConfig } from 'openai/resources/responses/responses'
import { getLlmConfig, type LlmConfig, type LlmProvider } from './config'

interface CompletionParams {
  instructions: string
  input: string
  format: ResponseFormatTextJSONSchemaConfig
}

interface CompletionResult {
  model: string
  provider: LlmProvider
  responseId: string | null
  outputText: string
}

export interface LlmClient {
  generateStructuredOutput: (params: CompletionParams) => Promise<CompletionResult>
}

let client: OpenAI | null = null
let currentConfigKey: string | null = null

function serializeConfig(config: LlmConfig) {
  return JSON.stringify({
    provider: config.provider,
    apiKey: config.apiKey,
    model: config.model,
    baseUrl: config.baseUrl ?? null,
    defaultHeaders: config.defaultHeaders ?? null,
  })
}

export function getLlmClient(): LlmClient {
  const config = getLlmConfig()

  if (!config) {
    throw new Error(
      'LLM provider is not configured. Set OPENAI_API_KEY or OPENROUTER_API_KEY.',
    )
  }

  const configKey = serializeConfig(config)

  if (!client || currentConfigKey !== configKey) {
    client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      defaultHeaders: config.defaultHeaders,
    })
    currentConfigKey = configKey
  }

  return {
    async generateStructuredOutput({ instructions, input, format }) {
      const sdk = client

      if (!sdk) {
        throw new Error('LLM client is not initialized')
      }

      const response = await sdk.responses.create({
        model: config.model,
        instructions,
        input,
        text: {
          format,
        },
      })

      if (!response.output_text) {
        throw new Error('LLM returned no output text')
      }

      return {
        model: config.model,
        provider: config.provider,
        responseId: response.id ?? null,
        outputText: response.output_text,
      }
    },
  }
}

export function clearLlmClient() {
  client = null
  currentConfigKey = null
}
