import { describe, expect, it } from 'vitest'
import { buildExpansionNotes } from './format'

const suggestion = {
  summary: 'Turn the rough task into a concrete implementation pass.',
  normalizedTitle: 'Refine the AI task workflow',
  desiredOutcome: 'A clearer and safer task execution path.',
  options: [
    {
      label: 'Thin slice',
      summary: 'Ship expansion review before adding decomposition.',
    },
  ],
  risks: [
    {
      label: 'Scope drift',
      impact: 'The task board can turn into a generic AI chat surface.',
    },
  ],
  assumptions: ['The current task model remains the source of truth.'],
  constraints: ['Do not auto-commit AI output without review.'],
  clarifyingQuestions: ['Should accepted AI notes stay editable afterward?'],
}

describe('AI expansion note formatting', () => {
  it('appends a structured AI expansion block to existing notes', () => {
    const result = buildExpansionNotes('Existing notes', suggestion)

    expect(result).toContain('Existing notes')
    expect(result).toContain('--- AI expansion ---')
    expect(result).toContain('Summary: Turn the rough task into a concrete implementation pass.')
    expect(result).toContain('- Thin slice: Ship expansion review before adding decomposition.')
  })

  it('replaces an older AI expansion block instead of duplicating it', () => {
    const result = buildExpansionNotes(
      [
        'Existing notes',
        '',
        '--- AI expansion ---',
        'Summary: Old summary',
        '--- end AI expansion ---',
      ].join('\n'),
      suggestion,
    )

    expect(result).toContain('Existing notes')
    expect(result).toContain('Summary: Turn the rough task into a concrete implementation pass.')
    expect(result).not.toContain('Summary: Old summary')
    expect(result.match(/--- AI expansion ---/g)).toHaveLength(1)
  })
})
