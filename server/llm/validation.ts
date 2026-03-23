import { ZodError, type ZodType } from 'zod'

export class LlmValidationError extends Error {
  cause: ZodError | Error

  constructor(message: string, cause: ZodError | Error) {
    super(message)
    this.name = 'LlmValidationError'
    this.cause = cause
  }
}

export class LlmParseError extends Error {
  rawOutput: string

  constructor(message: string, rawOutput: string) {
    super(message)
    this.name = 'LlmParseError'
    this.rawOutput = rawOutput
  }
}

export function validateLlmOutput<T>(
  rawOutput: string,
  schema: ZodType<T>,
  context = 'output',
): T {
  let parsed: unknown

  try {
    parsed = JSON.parse(rawOutput)
  } catch {
    throw new LlmParseError(`LLM returned invalid JSON for ${context}`, rawOutput)
  }

  try {
    return schema.parse(parsed)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new LlmValidationError(
        `LLM output failed schema validation for ${context}`,
        error,
      )
    }

    throw error
  }
}
