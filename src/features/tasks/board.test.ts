import { describe, expect, it } from 'vitest'
import {
  archiveTask,
  buildColumns,
  createTask,
  deleteTask,
  getActiveTasks,
  moveTask,
  moveTaskWithinStatus,
  patchTask,
  restoreTask,
  setTaskStatus,
  sortTasks,
} from './board'
import type { Task } from './model'

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? 'task-id',
    parentTaskId: overrides.parentTaskId,
    sourceCaptureId: overrides.sourceCaptureId ?? null,
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

  it('refuses to replace a title with blank text during patching', () => {
    const tasks = [makeTask({ id: 'a', title: 'Keep title' })]

    const next = patchTask(
      tasks,
      'a',
      { title: '   ' },
      '2026-03-20T09:00:00.000Z',
    )

    expect(next.find((task) => task.id === 'a')).toMatchObject({
      title: 'Keep title',
      updatedAt: '2026-03-20T09:00:00.000Z',
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

  it('archives descendant subtasks together with their parent task', () => {
    const tasks = [
      makeTask({ id: 'parent' }),
      makeTask({ id: 'child', parentTaskId: 'parent', archivedAt: null }),
    ]

    const next = archiveTask(tasks, 'parent', '2026-03-20T10:00:00.000Z')

    expect(next.find((task) => task.id === 'parent')).toMatchObject({
      archivedAt: '2026-03-20T10:00:00.000Z',
    })
    expect(next.find((task) => task.id === 'child')).toMatchObject({
      archivedAt: '2026-03-20T10:00:00.000Z',
    })
  })

  it('restores an archived task to the end of its existing status lane', () => {
    const tasks = [
      makeTask({ id: 'todo-a', status: 'todo', position: 1000 }),
      makeTask({ id: 'todo-b', status: 'todo', position: 2000 }),
      makeTask({
        id: 'todo-archived',
        status: 'todo',
        position: 1000,
        archivedAt: '2026-03-19T15:00:00.000Z',
      }),
    ]

    const next = restoreTask(tasks, 'todo-archived', '2026-03-19T16:00:00.000Z')
    const columns = buildColumns(getActiveTasks(next))
    const restored = next.find((task) => task.id === 'todo-archived')

    expect(columns.todo.map((task) => task.id)).toEqual([
      'todo-a',
      'todo-b',
      'todo-archived',
    ])
    expect(restored).toMatchObject({
      archivedAt: null,
      updatedAt: '2026-03-19T16:00:00.000Z',
      position: 3000,
      status: 'todo',
    })
  })

  it('restores descendant subtasks together with their parent task', () => {
    const tasks = [
      makeTask({
        id: 'parent',
        archivedAt: '2026-03-20T10:00:00.000Z',
      }),
      makeTask({
        id: 'child',
        parentTaskId: 'parent',
        archivedAt: '2026-03-20T10:00:00.000Z',
      }),
    ]

    const next = restoreTask(tasks, 'parent', '2026-03-20T11:00:00.000Z')

    expect(next.find((task) => task.id === 'parent')).toMatchObject({
      archivedAt: null,
      updatedAt: '2026-03-20T11:00:00.000Z',
    })
    expect(next.find((task) => task.id === 'child')).toMatchObject({
      archivedAt: null,
      updatedAt: '2026-03-20T11:00:00.000Z',
    })
  })

  it('deletes descendant subtasks when deleting a parent task', () => {
    const tasks = [
      makeTask({ id: 'parent' }),
      makeTask({ id: 'child-a', parentTaskId: 'parent' }),
      makeTask({ id: 'child-b', parentTaskId: 'parent' }),
      makeTask({ id: 'sibling' }),
    ]

    const next = deleteTask(tasks, 'parent')

    expect(next.map((task) => task.id)).toEqual(['sibling'])
  })

  it('updates subtask status without dropping it from the dataset', () => {
    const tasks = [
      makeTask({ id: 'parent' }),
      makeTask({
        id: 'child',
        parentTaskId: 'parent',
        status: 'todo',
        position: 1000,
      }),
    ]

    const next = setTaskStatus(
      tasks,
      'child',
      'done',
      '2026-03-20T12:00:00.000Z',
    )

    expect(next).toHaveLength(2)
    expect(next.find((task) => task.id === 'child')).toMatchObject({
      status: 'done',
      completedAt: '2026-03-20T12:00:00.000Z',
      parentTaskId: 'parent',
    })
  })

  it('preserves active subtasks when mutating the top-level board', () => {
    const tasks = [
      makeTask({ id: 'parent', status: 'todo', position: 1000 }),
      makeTask({ id: 'top-level', status: 'todo', position: 2000 }),
      makeTask({
        id: 'child',
        parentTaskId: 'parent',
        status: 'in_progress',
        position: 1000,
      }),
    ]

    const next = moveTaskWithinStatus(
      tasks,
      'top-level',
      -1,
      '2026-03-20T13:00:00.000Z',
    )

    expect(next.find((task) => task.id === 'child')).toMatchObject({
      id: 'child',
      parentTaskId: 'parent',
      status: 'in_progress',
    })
  })
})

describe('sortTasks', () => {
  it('sorts active tasks before archived tasks', () => {
    const tasks = [
      makeTask({ id: 'archived', archivedAt: '2026-03-19T15:00:00.000Z' }),
      makeTask({ id: 'active', archivedAt: null }),
    ]

    const sorted = sortTasks(tasks)
    expect(sorted.map((t) => t.id)).toEqual(['active', 'archived'])
  })

  it('sorts tasks by status order', () => {
    const tasks = [
      makeTask({ id: 'done', status: 'done' }),
      makeTask({ id: 'todo', status: 'todo' }),
      makeTask({ id: 'progress', status: 'in_progress' }),
    ]

    const sorted = sortTasks(tasks)
    expect(sorted.map((t) => t.id)).toEqual(['todo', 'progress', 'done'])
  })

  it('sorts tasks by priority when positions are equal', () => {
    const tasks = [
      makeTask({ id: 'low', priority: 'low', position: 1000 }),
      makeTask({ id: 'high', priority: 'high', position: 1000 }),
      makeTask({ id: 'medium', priority: 'medium', position: 1000 }),
    ]

    const sorted = sortTasks(tasks)
    expect(sorted.map((t) => t.id)).toEqual(['high', 'medium', 'low'])
  })

  it('sorts tasks by position even if priorities differ', () => {
    const tasks = [
      makeTask({ id: 'low-pos-2', priority: 'low', position: 2000 }),
      makeTask({ id: 'high-pos-1', priority: 'high', position: 1000 }),
    ]

    const sorted = sortTasks(tasks)
    expect(sorted.map((t) => t.id)).toEqual(['high-pos-1', 'low-pos-2'])
  })

  it('preserves stable sort for identical status, priority, and position', () => {
    const tasks = [
      makeTask({ id: 'task-1', status: 'todo', priority: 'medium', position: 1000 }),
      makeTask({ id: 'task-2', status: 'todo', priority: 'medium', position: 1000 }),
    ]

    const sorted = sortTasks(tasks)
    // Array.sort is stable in modern JS engines
    expect(sorted.map((t) => t.id)).toEqual(['task-1', 'task-2'])
  })
})
