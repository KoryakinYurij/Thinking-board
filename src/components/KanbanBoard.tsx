import { formatDate, truncate } from '../features/tasks/format'
import {
  PRIORITY_META,
  STATUS_META,
  STATUS_ORDER,
} from '../features/tasks/model'
import type {
  ColumnMap,
  MovePlacement,
  Task,
  TaskStatus,
} from '../features/tasks/model'

type KanbanBoardProps = {
  visibleStatuses: TaskStatus[]
  filteredColumns: ColumnMap
  allColumns: ColumnMap
  selectedTaskId: string | null
  dragTaskId: string | null
  dragDisabled: boolean
  onSelectTask: (taskId: string) => void
  onDragStartTask: (taskId: string) => void
  onClearDrag: () => void
  onMoveTask: (taskId: string, placement: MovePlacement) => void
  onMoveTaskWithinStatus: (taskId: string, direction: -1 | 1) => void
  onSetTaskStatus: (taskId: string, status: TaskStatus) => void
}

function KanbanBoard({
  visibleStatuses,
  filteredColumns,
  allColumns,
  selectedTaskId,
  dragTaskId,
  dragDisabled,
  onSelectTask,
  onDragStartTask,
  onClearDrag,
  onMoveTask,
  onMoveTaskWithinStatus,
  onSetTaskStatus,
}: KanbanBoardProps) {
  return (
    <section className="board">
      {visibleStatuses.map((status) => {
        const meta = STATUS_META[status]
        const columnTasks = filteredColumns[status]
        const fullCount = allColumns[status].length

        return (
          <section
            key={status}
            className="column"
            onDragOver={(event) => {
              if (!dragDisabled) {
                event.preventDefault()
              }
            }}
            onDrop={(event) => {
              if (!dragDisabled && dragTaskId) {
                event.preventDefault()
                onMoveTask(dragTaskId, { toStatus: status })
                onClearDrag()
              }
            }}
          >
            <header
              className="column-header"
              style={{ ['--column-accent' as string]: meta.accent }}
            >
              <div>
                <p>{meta.eyebrow}</p>
                <h3>{meta.label}</h3>
              </div>
              <div className="column-count">
                <strong>{columnTasks.length}</strong>
                <span>/ {fullCount}</span>
              </div>
            </header>

            <p className="column-note">{meta.note}</p>

            <div className="column-list">
              {columnTasks.length === 0 ? (
                <div className="empty-state">
                  <p>Nothing here right now.</p>
                  <span>
                    {status === 'done'
                      ? 'Completed tasks will stack here until archived.'
                      : 'Move a task in or create something new.'}
                  </span>
                </div>
              ) : (
                columnTasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    columnLength={columnTasks.length}
                    isSelected={selectedTaskId === task.id}
                    dragTaskId={dragTaskId}
                    dragDisabled={dragDisabled}
                    onSelectTask={onSelectTask}
                    onDragStartTask={onDragStartTask}
                    onClearDrag={onClearDrag}
                    onMoveTask={onMoveTask}
                    onMoveTaskWithinStatus={onMoveTaskWithinStatus}
                    onSetTaskStatus={onSetTaskStatus}
                  />
                ))
              )}
            </div>
          </section>
        )
      })}
    </section>
  )
}

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
  const canMoveBackward = STATUS_ORDER.indexOf(task.status) > 0
  const canMoveForward = STATUS_ORDER.indexOf(task.status) < STATUS_ORDER.length - 1
  const previewText = task.description.trim() || 'No notes attached.'

  return (
    <article
      className={`task-card ${isSelected ? 'is-selected' : ''}`}
      draggable={!dragDisabled}
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
    >
      <div className="task-topline">
        <span
          className="priority-pill"
          style={{
            ['--priority-accent' as string]: PRIORITY_META[task.priority].accent,
          }}
        >
          {PRIORITY_META[task.priority].label}
        </span>
        <span>{formatDate(task.updatedAt)}</span>
      </div>

      <h4>{task.title}</h4>
      <p>{truncate(previewText, 110)}</p>

      <div className="task-meta">
        <span>{task.dueAt ? `Due ${formatDate(task.dueAt)}` : 'No date'}</span>
        <span>{index + 1} in lane</span>
      </div>

      <div className="task-actions">
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
    </article>
  )
}

export default KanbanBoard
