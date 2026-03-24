import { describe, expect, it } from 'vitest'
import {
  archiveCaptureItem,
  buildTaskDraftFromCapture,
  createCaptureItem,
  patchCaptureItem,
} from './store'
import type { CaptureItem } from './model'

function makeCaptureItem(overrides: Partial<CaptureItem> = {}): CaptureItem {
  return {
    id: overrides.id ?? 'capture-id',
    rawText: overrides.rawText ?? 'Rough idea',
    normalizedTitle: overrides.normalizedTitle ?? 'Rough idea',
    createdAt: overrides.createdAt ?? '2026-03-20T08:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-03-20T08:00:00.000Z',
    archivedAt: overrides.archivedAt ?? null,
  }
}

describe('capture item store', () => {
  it('creates a trimmed capture item with a derived title', () => {
    const next = createCaptureItem(
      [],
      '  Build a real capture inbox\n\nwith AI review later  ',
      '2026-03-20T08:00:00.000Z',
      () => 'new-capture',
    )

    expect(next[0]).toMatchObject({
      id: 'new-capture',
      rawText: 'Build a real capture inbox\n\nwith AI review later',
      normalizedTitle: 'Build a real capture inbox',
    })
  })

  it('returns original items when raw text is empty or only whitespace', () => {
    const original = [makeCaptureItem()]
    const next = createCaptureItem(original, '   \n \t  ')
    expect(next).toBe(original)
  })

  it('correctly initializes all fields of a new capture item', () => {
    const timestamp = '2026-03-20T12:00:00.000Z'
    const next = createCaptureItem([], 'Field check', timestamp, () => 'fixed-id')

    expect(next[0]).toEqual({
      id: 'fixed-id',
      rawText: 'Field check',
      normalizedTitle: 'Field check',
      createdAt: timestamp,
      updatedAt: timestamp,
      archivedAt: null,
    })
  })

  it('prepends the new item and maintains sort order by updatedAt', () => {
    const olderItem = makeCaptureItem({
      id: 'older',
      updatedAt: '2026-03-20T10:00:00.000Z',
    })
    const newerTimestamp = '2026-03-20T11:00:00.000Z'

    const next = createCaptureItem([olderItem], 'Newer item', newerTimestamp, () => 'newer')

    expect(next).toHaveLength(2)
    expect(next[0].id).toBe('newer')
    expect(next[1].id).toBe('older')
  })

  it('updates normalized title when raw text changes', () => {
    const next = patchCaptureItem(
      [makeCaptureItem()],
      'capture-id',
      { rawText: 'Sharpen the intake model\n\nbefore touching board flows' },
      '2026-03-20T09:00:00.000Z',
    )

    expect(next[0]).toMatchObject({
      normalizedTitle: 'Sharpen the intake model',
      updatedAt: '2026-03-20T09:00:00.000Z',
    })
  })

  it('archives a capture item after commit without deleting it outright', () => {
    const next = archiveCaptureItem(
      [makeCaptureItem()],
      'capture-id',
      '2026-03-20T10:00:00.000Z',
    )

    expect(next[0]).toMatchObject({
      archivedAt: '2026-03-20T10:00:00.000Z',
      updatedAt: '2026-03-20T10:00:00.000Z',
    })
  })

  it('builds a task draft from raw capture text', () => {
    const draft = buildTaskDraftFromCapture(
      makeCaptureItem({
        id: 'capture-1',
        rawText: 'Break the idea into something executable\n\nStart with the inbox',
      }),
    )

    expect(draft).toMatchObject({
      title: 'Break the idea into something executable',
      description:
        'Break the idea into something executable\n\nStart with the inbox',
      priority: 'medium',
      dueAt: null,
      sourceCaptureId: 'capture-1',
    })
  })
})
