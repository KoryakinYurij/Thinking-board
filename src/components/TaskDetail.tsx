import { useState } from 'react'
import TaskDecompositionPanel from './TaskDecompositionPanel'
import TaskExpansionPanel from './TaskExpansionPanel'
import type {
  DecompositionAcceptedField,
  DecompositionSuggestionSet,
  ExpansionAcceptedField,
  ExpansionSuggestionSet,
} from '../features/ai/model'
import type { DecomposeResponse, ExpandResponse } from '../../shared/ai/contracts'
import {
  PRIORITY_META,
  PRIORITY_ORDER,
  STATUS_META,
  STATUS_ORDER,
} from '../features/tasks/model'
import { formatDate, getDueState } from '../features/tasks/format'
import type {
  Task,
  TaskPatch,
  TaskPriority,
  TaskStatus,
} from '../features/tasks/model'

type TaskDetailProps = {
  viewMode: 'board' | 'archive'
  selectedTask: Task | null
  expansionSuggestionSet: ExpansionSuggestionSet | null
  decompositionSuggestionSet: DecompositionSuggestionSet | null
  subtasks: Task[]
  archivedCount: number
  onOpenArchive: () => void
  onOpenBoard: () => void
  onPatchTask: (taskId: string, updates: TaskPatch) => void
  onSetTaskStatus: (taskId: string, status: TaskStatus) => void
  onArchiveTask: (taskId: string) => void
  onRestoreTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onStoreExpansionSuggestion: (
    sourceEntityType: 'capture_item' | 'task',
    sourceEntityId: string,
    response: ExpandResponse,
  ) => void
  onStoreFailedExpansionSuggestion: (
    sourceEntityType: 'capture_item' | 'task',
    sourceEntityId: string,
    errorMessage: string,
  ) => void
  onAcceptTaskExpansionSuggestion: (
    suggestionSetId: string,
    taskId: string,
    updates: TaskPatch,
    acceptedFields: ExpansionAcceptedField[],
  ) => void
  onRejectSuggestionSet: (suggestionSetId: string) => void
  onStoreDecompositionSuggestion: (
    taskId: string,
    response: DecomposeResponse,
  ) => void
  onStoreFailedDecompositionSuggestion: (
    taskId: string,
    errorMessage: string,
  ) => void
  onAcceptTaskDecompositionSuggestion: (
    suggestionSetId: string,
    taskId: string,
    acceptedFields: DecompositionAcceptedField[],
  ) => void
}

function TaskDetail({
  viewMode,
  selectedTask,
  expansionSuggestionSet,
  decompositionSuggestionSet,
  subtasks,
  archivedCount,
  onOpenArchive,
  onOpenBoard,
  onPatchTask,
  onSetTaskStatus,
  onArchiveTask,
  onRestoreTask,
  onDeleteTask,
  onStoreExpansionSuggestion,
  onStoreFailedExpansionSuggestion,
  onAcceptTaskExpansionSuggestion,
  onRejectSuggestionSet,
  onStoreDecompositionSuggestion,
  onStoreFailedDecompositionSuggestion,
  onAcceptTaskDecompositionSuggestion,
}: TaskDetailProps) {
  const isArchived = Boolean(selectedTask?.archivedAt)
  const dueState = selectedTask
    ? getDueState(selectedTask.dueAt, selectedTask.status === 'done')
    : null
  return (
    <aside className="detail panel">
      <div className="panel-heading">
        <p className="eyebrow">Task detail</p>
        <h2>
          {selectedTask
            ? isArchived
              ? 'Archived tasks stay editable, but restore decides when they return.'
              : 'Edit the task, not the whole board.'
            : viewMode === 'archive'
              ? 'Select an archived task.'
              : 'Select a task.'}
        </h2>
      </div>

      {selectedTask ? (
        <div className="detail-form">
          <EditableTitleField
            key={`${selectedTask.id}:${selectedTask.title}`}
            task={selectedTask}
            onPatchTask={onPatchTask}
          />

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
                disabled={isArchived}
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

          {dueState ? (
            <div className={`deadline-panel is-${dueState.tone}`}>
              <p className="eyebrow">Deadline pulse</p>
              <strong>{dueState.label}</strong>
              <span>{dueState.detail}</span>
            </div>
          ) : null}

          {!isArchived ? (
            <TaskExpansionPanel
              key={selectedTask.id}
              task={selectedTask}
              suggestionSet={expansionSuggestionSet}
              onStoreExpansionSuggestion={onStoreExpansionSuggestion}
              onStoreFailedExpansionSuggestion={onStoreFailedExpansionSuggestion}
              onAcceptTaskExpansionSuggestion={onAcceptTaskExpansionSuggestion}
              onRejectSuggestionSet={onRejectSuggestionSet}
            />
          ) : null}

          {!isArchived ? (
            <TaskDecompositionPanel
              key={`${selectedTask.id}:decompose`}
              task={selectedTask}
              suggestionSet={decompositionSuggestionSet}
              onStoreDecompositionSuggestion={onStoreDecompositionSuggestion}
              onStoreFailedDecompositionSuggestion={
                onStoreFailedDecompositionSuggestion
              }
              onAcceptTaskDecompositionSuggestion={
                onAcceptTaskDecompositionSuggestion
              }
              onRejectSuggestionSet={onRejectSuggestionSet}
            />
          ) : null}

          {subtasks.length > 0 ? (
            <section className="subtask-panel">
              <div className="ai-review-section">
                <p className="eyebrow">Subtasks</p>
                <ul className="ai-list">
                  {subtasks.map((subtask) => (
                    <li key={subtask.id}>
                      <strong>{subtask.title}</strong>
                      {subtask.description ? `: ${subtask.description}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          {isArchived ? (
            <p className="muted-note">
              Restore sends this task to the end of the{' '}
              {STATUS_META[selectedTask.status].label} lane.
            </p>
          ) : null}

          <div className="detail-pulse">
            <p>Created {formatDate(selectedTask.createdAt)}</p>
            <p>Updated {formatDate(selectedTask.updatedAt)}</p>
            <p>
              {selectedTask.completedAt
                ? `Completed ${formatDate(selectedTask.completedAt)}`
                : 'Not completed yet'}
            </p>
            {selectedTask.archivedAt ? (
              <p>Archived {formatDate(selectedTask.archivedAt)}</p>
            ) : null}
          </div>

          <div className="detail-actions">
            {isArchived ? (
              <button
                className="primary-button"
                type="button"
                onClick={() => onRestoreTask(selectedTask.id)}
              >
                Restore to {STATUS_META[selectedTask.status].label}
              </button>
            ) : selectedTask.status === 'done' ? (
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

            {!isArchived ? (
              <button type="button" onClick={() => onArchiveTask(selectedTask.id)}>
                Archive
              </button>
            ) : null}
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
          <p>
            {viewMode === 'archive'
              ? 'No archived task selected.'
              : 'No active task selected.'}
          </p>
          <span>
            {viewMode === 'archive'
              ? 'Pick an item from the archive review to inspect or restore it.'
              : 'Create one on the left or click a card in the board.'}
          </span>
        </div>
      )}

      <footer className="detail-footer">
        <p>{archivedCount} archived tasks are kept out of the main board.</p>
        <button
          type="button"
          onClick={viewMode === 'archive' ? onOpenBoard : onOpenArchive}
        >
          {viewMode === 'archive' ? 'Back to board' : 'Review archive'}
        </button>
      </footer>
    </aside>
  )
}

type EditableTitleFieldProps = {
  task: Task
  onPatchTask: (taskId: string, updates: TaskPatch) => void
}

function EditableTitleField({ task, onPatchTask }: EditableTitleFieldProps) {
  const [titleDraft, setTitleDraft] = useState(task.title)

  function commitTitleDraft() {
    const trimmedTitle = titleDraft.trim()

    if (!trimmedTitle) {
      setTitleDraft(task.title)
      return
    }

    if (trimmedTitle !== task.title) {
      onPatchTask(task.id, { title: trimmedTitle })
    }

    setTitleDraft(trimmedTitle)
  }

  return (
    <label>
      <span>Title</span>
      <input
        value={titleDraft}
        maxLength={120}
        onChange={(event) => setTitleDraft(event.target.value)}
        onBlur={commitTitleDraft}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur()
          }
        }}
      />
    </label>
  )
}

export default TaskDetail
