import type { TaskDraft } from '../tasks/model'

export type CaptureItem = {
  id: string
  rawText: string
  normalizedTitle: string
  createdAt: string
  updatedAt: string
  archivedAt: string | null
}

export type CapturePatch = Partial<Pick<CaptureItem, 'rawText'>>

export function buildTaskDraftFromCapture(
  captureItem: CaptureItem,
  overrides: Partial<TaskDraft> = {},
): TaskDraft {
  const rawText = captureItem.rawText.trim()

  return {
    title: overrides.title ?? deriveCaptureTitle(rawText),
    description: overrides.description ?? rawText,
    dueAt: overrides.dueAt ?? null,
    priority: overrides.priority ?? 'medium',
    sourceCaptureId: captureItem.id,
  }
}

export function deriveCaptureTitle(rawText: string) {
  const firstMeaningfulLine =
    rawText
      .split('\n')
      .map((line) => line.trim())
      .find(Boolean) ?? ''

  return firstMeaningfulLine.slice(0, 120)
}

