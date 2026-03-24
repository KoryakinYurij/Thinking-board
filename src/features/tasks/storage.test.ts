import { describe, expect, it, vi } from 'vitest'
import { loadTasks, saveTasks, STORAGE_KEY } from './storage'
import type { Task } from './model'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? 'task-id',
    title: overrides.title ?? 'Task title',
    description: overrides.description ?? '',
    status: overrides.status ?? 'todo',
    priority: overrides.priority ?? 'medium',
    position: overrides.position ?? 1000,
    createdAt: overrides.createdAt ?? '2026-03-20T08:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-03-20T08:00:00.000Z',
    completedAt: overrides.completedAt ?? null,
    archivedAt: overrides.archivedAt ?? null,
    dueAt: overrides.dueAt ?? null,
  }
}

describe('task storage', () => {
  it('keeps an intentionally empty saved dataset after reload', () => {
    const storage = {
      getItem: vi.fn(() => '[]'),
      setItem: vi.fn(),
    }

    expect(loadTasks(storage)).toEqual([])
  })

  it('returns empty when localStorage has no entry for the key', () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    }

    expect(loadTasks(storage)).toEqual([])
  })

  it('returns empty when localStorage contains corrupt data', () => {
    const storage = {
      getItem: vi.fn(() => 'not-json{{}'),
      setItem: vi.fn(),
    }

    expect(loadTasks(storage)).toEqual([])
  })

  it('returns empty when stored value is not an array', () => {
    const storage = {
      getItem: vi.fn(() => '{"title":"lone task"}'),
      setItem: vi.fn(),
    }

    expect(loadTasks(storage)).toEqual([])
  })

  it('returns an error result instead of throwing on failed writes', () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(() => {
        throw new Error('quota exceeded')
      }),
    }

    const result = saveTasks([makeTask()], storage)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toContain('quota exceeded')
    }
  })

  it('writes the expected storage key on successful save', () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    }

    const result = saveTasks([makeTask()], storage)

    expect(result).toEqual({ ok: true })
    expect(storage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"task-id"'),
    )
  })
})
