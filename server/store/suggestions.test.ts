import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import {
  getSuggestionSet,
  resetSuggestionStoreForTests,
  saveSuggestionSet,
  setSuggestionStoreFilePathForTests,
  updateSuggestionSetStatus,
} from './suggestions'

function makeStoredSuggestionSet() {
  return {
    id: 'suggestion-1',
    sourceEntityType: 'task' as const,
    sourceEntityId: 'task-1',
    kind: 'expansion' as const,
    status: 'pending' as const,
    payload: {
      summary: 'Clarify',
      normalizedTitle: 'Clarify task',
      desiredOutcome: 'Safer acceptance flow',
      options: [],
      risks: [],
      assumptions: [],
      constraints: [],
      clarifyingQuestions: [],
    },
    model: 'gpt-5',
    responseId: 'resp-1',
    errorMessage: null,
    acceptedFields: [],
    schemaVersion: 'v1' as const,
    createdAt: '2026-03-24T10:00:00.000Z',
    updatedAt: '2026-03-24T10:00:00.000Z',
  }
}

let tempDirectory: string | null = null

afterEach(() => {
  resetSuggestionStoreForTests()

  if (tempDirectory) {
    rmSync(tempDirectory, { recursive: true, force: true })
    tempDirectory = null
  }
})

describe('suggestion store persistence', () => {
  it('hydrates saved suggestion sets after the in-memory cache resets', () => {
    tempDirectory = mkdtempSync(join(tmpdir(), 'suggestion-store-'))
    const storePath = join(tempDirectory, 'ai-suggestions.json')
    setSuggestionStoreFilePathForTests(storePath)

    saveSuggestionSet(makeStoredSuggestionSet())

    resetSuggestionStoreForTests()
    setSuggestionStoreFilePathForTests(storePath)

    expect(getSuggestionSet('suggestion-1')).toMatchObject({
      id: 'suggestion-1',
      status: 'pending',
    })
  })

  it('persists status updates to disk', () => {
    tempDirectory = mkdtempSync(join(tmpdir(), 'suggestion-store-'))
    const storePath = join(tempDirectory, 'ai-suggestions.json')
    setSuggestionStoreFilePathForTests(storePath)

    saveSuggestionSet(makeStoredSuggestionSet())
    updateSuggestionSetStatus('suggestion-1', 'accepted', [
      'normalized_title',
      'description_notes',
    ])

    const persisted = JSON.parse(readFileSync(storePath, 'utf8')) as Array<{
      id: string
      status: string
      acceptedFields: string[]
    }>

    expect(persisted).toEqual([
      expect.objectContaining({
        id: 'suggestion-1',
        status: 'accepted',
        acceptedFields: ['normalized_title', 'description_notes'],
      }),
    ])
  })
})
