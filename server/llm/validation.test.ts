import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  LlmParseError,
  LlmValidationError,
  validateLlmOutput,
} from './validation'

describe('llm validation', () => {
  const schema = z
    .object({
      name: z.string(),
      count: z.number(),
    })
    .strict()

  it('parses valid structured output', () => {
    const result = validateLlmOutput('{"name":"ok","count":1}', schema)

    expect(result).toEqual({
      name: 'ok',
      count: 1,
    })
  })

  it('throws parse error for invalid json', () => {
    expect(() => validateLlmOutput('not-json', schema)).toThrow(LlmParseError)
  })

  it('throws validation error for schema mismatch', () => {
    expect(() => validateLlmOutput('{"name":"ok","count":"1"}', schema)).toThrow(
      LlmValidationError,
    )
  })

  it('rejects extra fields when schema is strict', () => {
    expect(() =>
      validateLlmOutput('{"name":"ok","count":1,"extra":true}', schema),
    ).toThrow(LlmValidationError)
  })
})
