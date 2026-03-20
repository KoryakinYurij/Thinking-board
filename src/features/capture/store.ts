import { buildTaskDraftFromCapture, deriveCaptureTitle } from './model'
import type { CaptureItem, CapturePatch } from './model'

export function sortCaptureItems(items: CaptureItem[]) {
  return [...items].sort((left, right) => {
    if (left.archivedAt && !right.archivedAt) return 1
    if (!left.archivedAt && right.archivedAt) return -1

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  })
}

export function getActiveCaptureItems(items: CaptureItem[]) {
  return items.filter((item) => !item.archivedAt)
}

export function createCaptureItem(
  items: CaptureItem[],
  rawText: string,
  timestamp = new Date().toISOString(),
  createId: () => string = () => crypto.randomUUID(),
) {
  const normalizedRawText = rawText.trim()

  if (!normalizedRawText) {
    return items
  }

  const nextItem: CaptureItem = {
    id: createId(),
    rawText: normalizedRawText,
    normalizedTitle: deriveCaptureTitle(normalizedRawText) || 'Untitled capture',
    createdAt: timestamp,
    updatedAt: timestamp,
    archivedAt: null,
  }

  return sortCaptureItems([nextItem, ...items])
}

export function patchCaptureItem(
  items: CaptureItem[],
  itemId: string,
  updates: CapturePatch,
  timestamp = new Date().toISOString(),
) {
  return sortCaptureItems(
    items.map((item) => {
      if (item.id !== itemId) {
        return item
      }

      const nextRawText =
        typeof updates.rawText === 'string' ? updates.rawText.trim() : item.rawText
      const normalizedTitle = deriveCaptureTitle(nextRawText) || item.normalizedTitle

      return {
        ...item,
        rawText: nextRawText,
        normalizedTitle,
        updatedAt: timestamp,
      }
    }),
  )
}

export function archiveCaptureItem(
  items: CaptureItem[],
  itemId: string,
  timestamp = new Date().toISOString(),
) {
  return sortCaptureItems(
    items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            archivedAt: timestamp,
            updatedAt: timestamp,
          }
        : item,
    ),
  )
}

export function deleteCaptureItem(items: CaptureItem[], itemId: string) {
  return items.filter((item) => item.id !== itemId)
}

export { buildTaskDraftFromCapture }
export type { CaptureItem }

