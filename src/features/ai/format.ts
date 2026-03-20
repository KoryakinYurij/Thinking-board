import type { ExpandSuggestion } from '../../../shared/ai/contracts'

const EXPANSION_START_MARKER = '--- AI expansion ---'
const EXPANSION_END_MARKER = '--- end AI expansion ---'

export function buildExpansionNotes(
  currentDescription: string,
  suggestion: ExpandSuggestion,
) {
  const baseDescription = stripExistingExpansionNotes(currentDescription)
  const sections = [
    baseDescription,
    [
      EXPANSION_START_MARKER,
      `Summary: ${suggestion.summary}`,
      `Desired outcome: ${suggestion.desiredOutcome}`,
      formatLabeledItems('Options', suggestion.options, (option) =>
        `${option.label}: ${option.summary}`,
      ),
      formatLabeledItems('Risks', suggestion.risks, (risk) =>
        `${risk.label}: ${risk.impact}`,
      ),
      formatStringList('Assumptions', suggestion.assumptions),
      formatStringList('Constraints', suggestion.constraints),
      formatStringList('Clarifying questions', suggestion.clarifyingQuestions),
      EXPANSION_END_MARKER,
    ]
      .filter(Boolean)
      .join('\n'),
  ].filter(Boolean)

  return sections.join('\n\n')
}

function stripExistingExpansionNotes(description: string) {
  const startIndex = description.indexOf(EXPANSION_START_MARKER)
  const endIndex = description.indexOf(EXPANSION_END_MARKER)

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return description.trim()
  }

  const beforeBlock = description.slice(0, startIndex).trimEnd()
  const afterBlock = description
    .slice(endIndex + EXPANSION_END_MARKER.length)
    .trimStart()

  return [beforeBlock, afterBlock].filter(Boolean).join('\n\n').trim()
}

function formatLabeledItems<T>(
  heading: string,
  items: T[],
  renderItem: (item: T) => string,
) {
  if (items.length === 0) {
    return ''
  }

  return [heading, ...items.map((item) => `- ${renderItem(item)}`)].join('\n')
}

function formatStringList(heading: string, items: string[]) {
  if (items.length === 0) {
    return ''
  }

  return [heading, ...items.map((item) => `- ${item}`)].join('\n')
}

