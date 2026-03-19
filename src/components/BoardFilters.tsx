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
  dragDisabled: boolean
  onSearchChange: (value: string) => void
  onFocusStatusChange: (value: TaskStatusFilter) => void
  onPriorityFilterChange: (value: TaskPriorityFilter) => void
}

function BoardFilters({
  search,
  focusStatus,
  priorityFilter,
  dragDisabled,
  onSearchChange,
  onFocusStatusChange,
  onPriorityFilterChange,
}: BoardFiltersProps) {
  return (
    <section className="toolbar panel">
      <div className="panel-heading">
        <p className="eyebrow">Board lens</p>
        <h2>Filter the projection without rewriting the truth.</h2>
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
          {dragDisabled
            ? 'Drag is paused while filters are active so order never becomes ambiguous.'
            : 'Drag is available because you are looking at the full board order.'}
        </p>
      </div>
    </section>
  )
}

export default BoardFilters
