import { describe, expect, it } from 'vitest'
import { getSubtasksForTask } from './store'
import type { Task } from '../tasks/model'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? 'task-1',
    parentTaskId: overrides.parentTaskId,
    sourceCaptureId: overrides.sourceCaptureId ?? null,
    title: overrides.title ?? 'Parent task',
    description: overrides.description ?? 'Current description',
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

describe('getSubtasksForTask', () => {
  it('returns subtasks for a given parent task', () => {
    const tasks: Task[] = [
      makeTask({ id: 'task-1' }),
      makeTask({ id: 'sub-1', parentTaskId: 'task-1', position: 2000 }),
      makeTask({ id: 'sub-2', parentTaskId: 'task-1', position: 1000 }),
    ]

    const subtasks = getSubtasksForTask(tasks, 'task-1')
    expect(subtasks).toHaveLength(2)
    expect(subtasks[0].id).toBe('sub-2')
    expect(subtasks[1].id).toBe('sub-1')
  })

  it('excludes archived subtasks', () => {
    const tasks: Task[] = [
      makeTask({ id: 'task-1' }),
      makeTask({ id: 'sub-1', parentTaskId: 'task-1' }),
      makeTask({
        id: 'sub-2',
        parentTaskId: 'task-1',
        archivedAt: '2026-03-20T10:00:00.000Z',
      }),
    ]

    const subtasks = getSubtasksForTask(tasks, 'task-1')
    expect(subtasks).toHaveLength(1)
    expect(subtasks[0].id).toBe('sub-1')
  })

  it('returns empty array when no subtasks exist', () => {
    const tasks: Task[] = [makeTask({ id: 'task-1' })]
    expect(getSubtasksForTask(tasks, 'task-1')).toEqual([])
  })
})
