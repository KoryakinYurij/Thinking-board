import {
  PRIORITY_META,
  PRIORITY_ORDER,
  STATUS_META,
  STATUS_ORDER,
} from '../features/tasks/model'
import type {
  TaskPriorityFilter,
  TaskStatusFilter,
} from '../features/tasks/model'

type BoardFiltersProps = {
  search: string
  focusStatus: TaskStatusFilter
  priorityFilter: TaskPriorityFilter
  workspaceView: 'inbox' | 'board' | 'archive' | 'focus'
  inboxCount: number
  archivedCount: number
  dragDisabled: boolean
  onSearchChange: (value: string) => void
  onFocusStatusChange: (value: TaskStatusFilter) => void
  onPriorityFilterChange: (value: TaskPriorityFilter) => void
  onWorkspaceViewChange: (value: 'inbox' | 'board' | 'archive' | 'focus') => void
}

function BoardFilters({
  search,
  focusStatus,
  priorityFilter,
  workspaceView,
  inboxCount,
  archivedCount,
  dragDisabled,
  onSearchChange,
  onFocusStatusChange,
  onPriorityFilterChange,
  onWorkspaceViewChange,
}: BoardFiltersProps) {
  return (
    <section className="toolbar panel">
      <div className="panel-heading">
        <p className="eyebrow">Workspace lens</p>
        <h2>
          {workspaceView === 'inbox'
            ? 'Review intake without pretending it is already committed work.'
            : workspaceView === 'focus'
              ? 'Focus on execution and nothing else.'
              : workspaceView === 'board'
                ? 'Filter the projection without rewriting the truth.'
                : 'Review archived work without putting it back by accident.'}
        </h2>
      </div>

      <div className="view-switch" role="tablist" aria-label="Workspace view">
        <button
          type="button"
          className={workspaceView === 'inbox' ? 'is-active' : ''}
          onClick={() => onWorkspaceViewChange('inbox')}
        >
          Inbox ({inboxCount})
        </button>
        <button
          type="button"
          className={workspaceView === 'board' ? 'is-active' : ''}
          onClick={() => onWorkspaceViewChange('board')}
        >
          Board
        </button>
        <button
          type="button"
          className={workspaceView === 'archive' ? 'is-active' : ''}
          onClick={() => onWorkspaceViewChange('archive')}
        >
          Archive ({archivedCount})
        </button>
        <button
          type="button"
          className={workspaceView === 'focus' ? 'is-active' : ''}
          onClick={() => onWorkspaceViewChange('focus')}
        >
          Focus
        </button>
      </div>

      <div className="toolbar-grid">
        <label>
          <span>Search</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Title or note"
          />
        </label>

        <label>
          <span>Status focus</span>
          <select
            value={focusStatus}
            disabled={workspaceView === 'inbox' || workspaceView === 'focus'}
            onChange={(event) =>
              onFocusStatusChange(event.target.value as TaskStatusFilter)
            }
          >
            <option value="all">All columns</option>
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
            value={priorityFilter}
            disabled={workspaceView === 'inbox' || workspaceView === 'focus'}
            onChange={(event) =>
              onPriorityFilterChange(event.target.value as TaskPriorityFilter)
            }
          >
            <option value="all">Any priority</option>
            {PRIORITY_ORDER.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_META[priority].label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="toolbar-note">
        <p>
          {workspaceView === 'inbox'
            ? 'Capture items stay outside execution status until you commit them into tasks.'
            : workspaceView === 'archive'
            ? 'Restore sends a task back to the end of its current status lane.'
            : workspaceView === 'focus'
            ? 'In Focus view, you concentrate on the active execution surfaces. Distractions are minimized.'
            : dragDisabled
              ? 'Drag is paused while filters are active so order never becomes ambiguous.'
              : 'Drag is available because you are looking at the full board order.'}
        </p>
      </div>
    </section>
  )
}

export default BoardFilters
