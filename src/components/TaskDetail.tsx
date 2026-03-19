import {
  PRIORITY_META,
  PRIORITY_ORDER,
  STATUS_META,
  STATUS_ORDER,
} from '../features/tasks/model'
import { formatDate } from '../features/tasks/format'
import type {
  Task,
  TaskPatch,
  TaskPriority,
  TaskStatus,
} from '../features/tasks/model'

type TaskDetailProps = {
  selectedTask: Task | null
  archivedCount: number
  onPatchTask: (taskId: string, updates: TaskPatch) => void
  onSetTaskStatus: (taskId: string, status: TaskStatus) => void
  onArchiveTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
}

function TaskDetail({
  selectedTask,
  archivedCount,
  onPatchTask,
  onSetTaskStatus,
  onArchiveTask,
  onDeleteTask,
}: TaskDetailProps) {
  return (
    <aside className="detail panel">
      <div className="panel-heading">
        <p className="eyebrow">Task detail</p>
        <h2>{selectedTask ? 'Edit the task, not the whole board.' : 'Select a task.'}</h2>
      </div>

      {selectedTask ? (
        <div className="detail-form">
          <label>
            <span>Title</span>
            <input
              value={selectedTask.title}
              onChange={(event) =>
                onPatchTask(selectedTask.id, {
                  title: event.target.value.slice(0, 120),
                })
              }
            />
          </label>

          <label>
            <span>Notes</span>
            <textarea
              rows={9}
              value={selectedTask.description}
              onChange={(event) =>
                onPatchTask(selectedTask.id, {
                  description: event.target.value,
                })
              }
            />
          </label>

          <div className="detail-grid">
            <label>
              <span>Status</span>
              <select
                value={selectedTask.status}
                onChange={(event) =>
                  onSetTaskStatus(selectedTask.id, event.target.value as TaskStatus)
                }
              >
                {STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_META[status].label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Priority</span>
              <select
                value={selectedTask.priority}
                onChange={(event) =>
                  onPatchTask(selectedTask.id, {
                    priority: event.target.value as TaskPriority,
                  })
                }
              >
                {PRIORITY_ORDER.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_META[priority].label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Due date</span>
              <input
                type="date"
                value={selectedTask.dueAt ?? ''}
                onChange={(event) =>
                  onPatchTask(selectedTask.id, { dueAt: event.target.value || null })
                }
              />
            </label>
          </div>

          <div className="detail-pulse">
            <p>Created {formatDate(selectedTask.createdAt)}</p>
            <p>Updated {formatDate(selectedTask.updatedAt)}</p>
            <p>
              {selectedTask.completedAt
                ? `Completed ${formatDate(selectedTask.completedAt)}`
                : 'Not completed yet'}
            </p>
          </div>

          <div className="detail-actions">
            {selectedTask.status === 'done' ? (
              <button
                className="primary-button"
                type="button"
                onClick={() => onSetTaskStatus(selectedTask.id, 'todo')}
              >
                Reopen into queue
              </button>
            ) : (
              <button
                className="primary-button"
                type="button"
                onClick={() => onSetTaskStatus(selectedTask.id, 'done')}
              >
                Mark complete
              </button>
            )}

            <button type="button" onClick={() => onArchiveTask(selectedTask.id)}>
              Archive
            </button>
            <button
              type="button"
              className="danger-button"
              onClick={() => onDeleteTask(selectedTask.id)}
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="empty-state detail-empty">
          <p>No active task selected.</p>
          <span>Create one on the left or click a card in the board.</span>
        </div>
      )}

      <footer className="detail-footer">
        <p>{archivedCount} archived tasks are kept out of the main board.</p>
      </footer>
    </aside>
  )
}

export default TaskDetail
