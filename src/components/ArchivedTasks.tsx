import { formatDate, getDueState, truncate } from '../features/tasks/format'
import { PRIORITY_META, STATUS_META } from '../features/tasks/model'
import type { Task } from '../features/tasks/model'

type ArchivedTasksProps = {
  tasks: Task[]
  totalCount: number
  selectedTaskId: string | null
  onSelectTask: (taskId: string) => void
  onRestoreTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
}

function ArchivedTasks({
  tasks,
  totalCount,
  selectedTaskId,
  onSelectTask,
  onRestoreTask,
  onDeleteTask,
}: ArchivedTasksProps) {
  return (
    <section className="archive-view panel">
      <div className="panel-heading">
        <p className="eyebrow">Archive review</p>
        <h2>Bring back only what belongs on the active board.</h2>
      </div>

      <div className="archive-summary">
        <p>
          <strong>{tasks.length}</strong> shown
        </p>
        <span>{totalCount} archived tasks total</span>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state archive-empty">
          <p>Nothing archived matches the current lens.</p>
          <span>Clear filters or archive a completed task to review it here.</span>
        </div>
      ) : (
        <div className="archive-list">
          {tasks.map((task) => (
            <ArchivedTaskCard
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              onSelectTask={onSelectTask}
              onRestoreTask={onRestoreTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>
      )}
    </section>
  )
}

type ArchivedTaskCardProps = {
  task: Task
  isSelected: boolean
  onSelectTask: (taskId: string) => void
  onRestoreTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
}

function ArchivedTaskCard({
  task,
  isSelected,
  onSelectTask,
  onRestoreTask,
  onDeleteTask,
}: ArchivedTaskCardProps) {
  const dueState = getDueState(task.dueAt, true)

  return (
    <article
      className={`archive-card ${isSelected ? 'is-selected' : ''}`}
      tabIndex={0}
      onClick={() => onSelectTask(task.id)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelectTask(task.id)
        }
      }}
    >
      <div className="archive-card-header">
        <span
          className="priority-pill"
          style={{
            ['--priority-accent' as string]: PRIORITY_META[task.priority].accent,
          }}
        >
          {PRIORITY_META[task.priority].label}
        </span>
        <span>{STATUS_META[task.status].label}</span>
      </div>

      <div className="archive-card-body">
        <h3>{task.title}</h3>
        <p>{truncate(task.description.trim() || 'No notes attached.', 160)}</p>
      </div>

      <div className="archive-card-meta">
        <span>
          Archived {task.archivedAt ? formatDate(task.archivedAt) : 'recently'}
        </span>
        <span className={`due-chip is-${dueState.tone}`} title={dueState.detail}>
          <strong>{dueState.label}</strong>
          <small>{dueState.detail}</small>
        </span>
      </div>

      <div className="archive-card-actions">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onSelectTask(task.id)
          }}
        >
          Inspect
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={(event) => {
            event.stopPropagation()
            onRestoreTask(task.id)
          }}
        >
          Restore
        </button>
        <button
          type="button"
          className="danger-button"
          onClick={(event) => {
            event.stopPropagation()
            onDeleteTask(task.id)
          }}
        >
          Delete
        </button>
      </div>
    </article>
  )
}

export default ArchivedTasks
