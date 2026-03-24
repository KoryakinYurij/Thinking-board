import { describe, expect, it, vi } from 'vitest'
import { render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskDetail from './TaskDetail'
import type { Task } from '../features/tasks/model'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? 'task-1',
    parentTaskId: overrides.parentTaskId,
    sourceCaptureId: overrides.sourceCaptureId ?? null,
    title: overrides.title ?? 'Test task',
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

const noop = vi.fn()

function renderDetail(selectedTask: Task | null = null) {
  const onPatchTask = vi.fn()

  const { container } = render(
    <TaskDetail
      viewMode="board"
      selectedTask={selectedTask}
      expansionSuggestionSet={null}
      decompositionSuggestionSet={null}
      subtasks={[]}
      archivedCount={0}
      onOpenArchive={noop}
      onOpenBoard={noop}
      onPatchTask={onPatchTask}
      onSetTaskStatus={noop}
      onArchiveTask={noop}
      onRestoreTask={noop}
      onDeleteTask={noop}
      onStoreExpansionSuggestion={noop}
      onStoreFailedExpansionSuggestion={noop}
      onAcceptTaskExpansionSuggestion={noop}
      onRejectSuggestionSet={noop}
      onStoreDecompositionSuggestion={noop}
      onStoreFailedDecompositionSuggestion={noop}
      onAcceptTaskDecompositionSuggestion={noop}
    />,
  )

  const panel = container.querySelector<HTMLElement>('.detail.panel')!
  const scope = within(panel)

  return { onPatchTask, scope }
}

describe('TaskDetail editable title', () => {
  it('shows an error when the user clears the title and blurs', async () => {
    const user = userEvent.setup()
    const { scope } = renderDetail(makeTask({ title: 'Keep me' }))

    const input = scope.getByLabelText('Title')
    await user.clear(input)
    await user.tab()

    expect(scope.getByRole('alert')).toHaveTextContent('Title cannot be empty.')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('keeps the empty draft on first failed blur so the user sees the problem', async () => {
    const user = userEvent.setup()
    const { scope } = renderDetail(makeTask({ title: 'Keep me' }))

    const input = scope.getByLabelText('Title')
    await user.clear(input)
    await user.tab()

    expect(input).toHaveValue('')
    expect(scope.getByRole('alert')).toBeInTheDocument()
  })

  it('reverts to original title on second failed blur', async () => {
    const user = userEvent.setup()
    const { scope } = renderDetail(makeTask({ title: 'Keep me' }))

    const input = scope.getByLabelText('Title')
    await user.clear(input)
    await user.tab()

    expect(input).toHaveValue('')
    expect(scope.getByRole('alert')).toBeInTheDocument()

    await user.click(input)
    await user.tab()

    expect(input).toHaveValue('Keep me')
    expect(scope.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('reverts to original title on Escape without committing', async () => {
    const user = userEvent.setup()
    const { onPatchTask, scope } = renderDetail(makeTask({ title: 'Keep me' }))

    const input = scope.getByLabelText('Title')
    await user.clear(input)
    await user.keyboard('{Escape}')

    expect(input).toHaveValue('Keep me')
    expect(scope.queryByRole('alert')).not.toBeInTheDocument()
    expect(onPatchTask).not.toHaveBeenCalled()
  })

  it('clears the error when the user starts typing again', async () => {
    const user = userEvent.setup()
    const { scope } = renderDetail(makeTask({ title: 'Keep me' }))

    const input = scope.getByLabelText('Title')
    await user.clear(input)
    await user.tab()

    expect(scope.getByRole('alert')).toBeInTheDocument()

    await user.type(input, 'N')

    expect(scope.queryByRole('alert')).not.toBeInTheDocument()
    expect(input).not.toHaveAttribute('aria-invalid')
  })

  it('commits a valid title change on blur', async () => {
    const user = userEvent.setup()
    const { onPatchTask, scope } = renderDetail(makeTask({ title: 'Original' }))

    const input = scope.getByLabelText('Title')
    await user.clear(input)
    await user.type(input, 'Updated title')
    await user.tab()

    expect(onPatchTask).toHaveBeenCalledWith('task-1', { title: 'Updated title' })
    expect(scope.queryByRole('alert')).not.toBeInTheDocument()
  })
})
