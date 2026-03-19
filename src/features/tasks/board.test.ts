import { describe, expect, it } from 'vitest'
import {
  archiveTask,
  buildColumns,
  createTask,
  getActiveTasks,
  moveTask,
  moveTaskWithinStatus,
  setTaskStatus,
} from './board'
import type { Task } from './model'

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? 'task-id',
    title: overrides.title ?? 'Task title',
    description: overrides.description ?? '',
    status: overrides.status ?? 'todo',
    priority: overrides.priority ?? 'medium',
    position: overrides.position ?? 1000,
    createdAt: overrides.createdAt ?? '2026-03-19T08:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-03-19T08:00:00.000Z',
    completedAt: overrides.completedAt ?? null,
    archivedAt: overrides.archivedAt ?? null,
    dueAt: overrides.dueAt ?? null,
  }
}

describe('task board operations', () => {
  it('creates a trimmed todo task at the next stable position', () => {
    const tasks = [
      makeTask({ id: 'a', position: 1000 }),
      makeTask({ id: 'b', position: 2000 }),
    ]

    const next = createTask(
      tasks,
      {
        title: '  New task  ',
        description: '  carry details  ',
        dueAt: null,
        priority: 'high',
      },
      '2026-03-19T10:00:00.000Z',
      () => 'new-task',
    )

    const created = next.find((task) => task.id === 'new-task')

    expect(created).toMatchObject({
      id: 'new-task',
      title: 'New task',
      description: 'carry details',
      status: 'todo',
      priority: 'high',
      position: 3000,
      completedAt: null,
    })
  })

  it('sets completedAt when moving to done and clears it on reopen', () => {
    const tasks = [makeTask({ id: 'a', status: 'todo', position: 1000 })]

    const completed = setTaskStatus(
      tasks,
      'a',
      'done',
      '2026-03-19T11:00:00.000Z',
    )
    const reopened = setTaskStatus(
      completed,
      'a',
      'todo',
      '2026-03-19T12:00:00.000Z',
    )

    expect(completed.find((task) => task.id === 'a')).toMatchObject({
      status: 'done',
      completedAt: '2026-03-19T11:00:00.000Z',
    })
    expect(reopened.find((task) => task.id === 'a')).toMatchObject({
      status: 'todo',
      completedAt: null,
    })
  })

  it('moves a task before a target task in another column', () => {
    const tasks = [
      makeTask({ id: 'todo-a', status: 'todo', position: 1000 }),
      makeTask({ id: 'progress-a', status: 'in_progress', position: 1000 }),
      makeTask({ id: 'progress-b', status: 'in_progress', position: 2000 }),
    ]

    const next = moveTask(
      tasks,
      'todo-a',
      {
        toStatus: 'in_progress',
        beforeTaskId: 'progress-b',
      },
      '2026-03-19T13:00:00.000Z',
    )

    const columns = buildColumns(getActiveTasks(next))

    expect(columns.in_progress.map((task) => task.id)).toEqual([
      'progress-a',
      'todo-a',
      'progress-b',
    ])
    expect(next.find((task) => task.id === 'todo-a')).toMatchObject({
      status: 'in_progress',
      completedAt: null,
    })
  })

  it('reorders a task within its current column and rewrites stable positions', () => {
    const tasks = [
      makeTask({ id: 'a', position: 1000 }),
      makeTask({ id: 'b', position: 2000 }),
      makeTask({ id: 'c', position: 3000 }),
    ]

    const next = moveTaskWithinStatus(
      tasks,
      'c',
      -1,
      '2026-03-19T14:00:00.000Z',
    )

    const column = buildColumns(getActiveTasks(next)).todo

    expect(column.map((task) => task.id)).toEqual(['a', 'c', 'b'])
    expect(column.map((task) => task.position)).toEqual([1000, 2000, 3000])
  })

  it('archives a task without deleting it from the underlying dataset', () => {
    const tasks = [
      makeTask({ id: 'a' }),
      makeTask({ id: 'b' }),
    ]

    const next = archiveTask(tasks, 'a', '2026-03-19T15:00:00.000Z')
    const archived = next.find((task) => task.id === 'a')

    expect(next).toHaveLength(2)
    expect(getActiveTasks(next).map((task) => task.id)).toEqual(['b'])
    expect(archived?.archivedAt).toBe('2026-03-19T15:00:00.000Z')
  })
})
