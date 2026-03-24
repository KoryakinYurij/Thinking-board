import TaskCard from './TaskCard'
import {
  STATUS_META,
} from '../features/tasks/model'
import type {
  ColumnMap,
  MovePlacement,
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

export default KanbanBoard
