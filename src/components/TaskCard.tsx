import type { KeyboardEvent } from 'react'
import { formatDate, getDueState, truncate } from '../features/tasks/format'
import {
  PRIORITY_META,
  STATUS_ORDER,
} from '../features/tasks/model'
import type {
  MovePlacement,
  Task,
  TaskStatus,
} from '../features/tasks/model'

type TaskCardProps = {
  task: Task
  index: number
  columnLength: number
  isSelected: boolean
  dragTaskId: string | null
  dragDisabled: boolean
  onSelectTask: (taskId: string) => void
  onDragStartTask: (taskId: string) => void
  onClearDrag: () => void
  onMoveTask: (taskId: string, placement: MovePlacement) => void
  onMoveTaskWithinStatus: (taskId: string, direction: -1 | 1) => void
  onSetTaskStatus: (taskId: string, status: TaskStatus) => void
}

function handleTaskKeyDown(
  event: KeyboardEvent<HTMLElement>,
  taskId: string,
  onSelectTask: (taskId: string) => void
) {
  if (event.target !== event.currentTarget) {
    return
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onSelectTask(taskId)
    return
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const card = event.currentTarget
    const list = card.closest('.column-list')
    if (!list) return
    const cards = Array.from(
      list.querySelectorAll<HTMLElement>('.task-card[tabindex]'),
    )
    const currentIdx = cards.indexOf(card)
    const nextIdx =
      event.key === 'ArrowDown'
        ? Math.min(currentIdx + 1, cards.length - 1)
        : Math.max(currentIdx - 1, 0)
    cards[nextIdx]?.focus()
  }
}

function TaskTopline({ priority, updatedAt }: { priority: Task['priority']; updatedAt: string }) {
  return (
    <div className="task-topline">
      <span
        className="priority-pill"
        style={{
          ['--priority-accent' as string]: PRIORITY_META[priority].accent,
        }}
      >
        {PRIORITY_META[priority].label}
      </span>
      <span>{formatDate(updatedAt)}</span>
    </div>
  )
}

function TaskMeta({
  dueState,
  index,
}: {
  dueState: ReturnType<typeof getDueState>
  index: number
}) {
  return (
    <div className="task-meta">
      <span className={`due-chip is-${dueState.tone}`} title={dueState.detail}>
        <strong>{dueState.label}</strong>
        <small>{dueState.detail}</small>
      </span>
      <span>{index + 1} in lane</span>
    </div>
  )
}

type TaskActionsProps = {
  task: Task
  index: number
  columnLength: number
  onSelectTask: (taskId: string) => void
  onMoveTaskWithinStatus: (taskId: string, direction: -1 | 1) => void
  onSetTaskStatus: (taskId: string, status: TaskStatus) => void
}

function TaskActions({
  task,
  index,
  columnLength,
  onSelectTask,
  onMoveTaskWithinStatus,
  onSetTaskStatus,
}: TaskActionsProps) {
  const canMoveBackward = STATUS_ORDER.indexOf(task.status) > 0
  const canMoveForward = STATUS_ORDER.indexOf(task.status) < STATUS_ORDER.length - 1

  return (
    <div className="task-actions">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onSelectTask(task.id)
        }}
      >
        Open
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onMoveTaskWithinStatus(task.id, -1)
        }}
        disabled={index === 0}
      >
        Earlier
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onMoveTaskWithinStatus(task.id, 1)
        }}
        disabled={index === columnLength - 1}
      >
        Later
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          if (canMoveBackward) {
            onSetTaskStatus(
              task.id,
              STATUS_ORDER[STATUS_ORDER.indexOf(task.status) - 1],
            )
          }
        }}
        disabled={!canMoveBackward}
      >
        Back
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()

          if (task.status === 'done') {
            onSetTaskStatus(task.id, 'todo')
            return
          }

          if (canMoveForward) {
            onSetTaskStatus(
              task.id,
              STATUS_ORDER[STATUS_ORDER.indexOf(task.status) + 1],
            )
          }
        }}
      >
        {task.status === 'done' ? 'Reopen' : 'Advance'}
      </button>
    </div>
  )
}

function TaskCard({
  task,
  index,
  columnLength,
  isSelected,
  dragTaskId,
  dragDisabled,
  onSelectTask,
  onDragStartTask,
  onClearDrag,
  onMoveTask,
  onMoveTaskWithinStatus,
  onSetTaskStatus,
}: TaskCardProps) {
  const previewText = task.description.trim() || 'No notes attached.'
  const dueState = getDueState(task.dueAt, task.status === 'done')

  return (
    <article
      className={`task-card ${isSelected ? 'is-selected' : ''}`}
      draggable={!dragDisabled}
      tabIndex={0}
      onDragStart={() => onDragStartTask(task.id)}
      onDragEnd={onClearDrag}
      onDragOver={(event) => {
        if (!dragDisabled) {
          event.preventDefault()
        }
      }}
      onDrop={(event) => {
        if (!dragDisabled && dragTaskId && dragTaskId !== task.id) {
          event.preventDefault()
          onMoveTask(dragTaskId, {
            toStatus: task.status,
            beforeTaskId: task.id,
          })
          onClearDrag()
        }
      }}
      onClick={() => onSelectTask(task.id)}
      onKeyDown={(event) => handleTaskKeyDown(event, task.id, onSelectTask)}
    >
      <TaskTopline priority={task.priority} updatedAt={task.updatedAt} />

      <h4>{task.title}</h4>
      <p>{truncate(previewText, 110)}</p>

      <TaskMeta dueState={dueState} index={index} />

      <TaskActions
        task={task}
        index={index}
        columnLength={columnLength}
        onSelectTask={onSelectTask}
        onMoveTaskWithinStatus={onMoveTaskWithinStatus}
        onSetTaskStatus={onSetTaskStatus}
      />
    </article>
  )
}

export default TaskCard
