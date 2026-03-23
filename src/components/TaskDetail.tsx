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
              <div className="panel-heading">
                <p className="eyebrow">Subtasks</p>
                <h3>Work the smaller pieces directly.</h3>
              </div>

              <div className="subtask-list">
                {subtasks.map((subtask, index) => (
                  <EditableSubtaskCard
                    key={subtask.id}
                    subtask={subtask}
                    index={index}
                    onPatchTask={onPatchTask}
                    onSetTaskStatus={onSetTaskStatus}
                    onDeleteTask={onDeleteTask}
                  />
                ))}
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

type EditableSubtaskCardProps = {
  subtask: Task
  index: number
  onPatchTask: (taskId: string, updates: TaskPatch) => void
  onSetTaskStatus: (taskId: string, status: TaskStatus) => void
  onDeleteTask: (taskId: string) => void
}

function EditableSubtaskCard({
  subtask,
  index,
  onPatchTask,
  onSetTaskStatus,
  onDeleteTask,
}: EditableSubtaskCardProps) {
  const [titleDraft, setTitleDraft] = useState(subtask.title)
  const [notesDraft, setNotesDraft] = useState(subtask.description)
  const dueState = getDueState(subtask.dueAt, subtask.status === 'done')

  function commitTitleDraft() {
    const trimmedTitle = titleDraft.trim()

    if (!trimmedTitle) {
      setTitleDraft(subtask.title)
      return
    }

    if (trimmedTitle !== subtask.title) {
      onPatchTask(subtask.id, { title: trimmedTitle })
    }

    setTitleDraft(trimmedTitle)
  }

  function commitNotesDraft() {
    const trimmedNotes = notesDraft.trim()

    if (trimmedNotes !== subtask.description) {
      onPatchTask(subtask.id, { description: trimmedNotes })
    }

    setNotesDraft(trimmedNotes)
  }

  return (
    <article className={`subtask-card is-${subtask.status}`}>
      <div className="subtask-card-header">
        <div className="subtask-card-kicker">
          <p className="eyebrow">Subtask {index + 1}</p>
          <h4>{subtask.title}</h4>
        </div>

        <label className="subtask-status-field">
          <span>Status</span>
          <select
            value={subtask.status}
            onChange={(event) =>
              onSetTaskStatus(subtask.id, event.target.value as TaskStatus)
            }
          >
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {STATUS_META[status].label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="subtask-grid">
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

        <label className="subtask-notes-field">
          <span>Notes</span>
          <textarea
            rows={4}
            value={notesDraft}
            onChange={(event) => setNotesDraft(event.target.value)}
            onBlur={commitNotesDraft}
          />
        </label>
      </div>

      <div className="subtask-meta">
        <span className={`due-chip is-${dueState.tone}`} title={dueState.detail}>
          <strong>{dueState.label}</strong>
          <small>{dueState.detail}</small>
        </span>
        <span>Updated {formatDate(subtask.updatedAt)}</span>
      </div>

      <div className="subtask-actions">
        <button
          type="button"
          onClick={() => onSetTaskStatus(subtask.id, 'todo')}
          disabled={subtask.status === 'todo'}
        >
          Set open
        </button>
        <button
          type="button"
          onClick={() => onSetTaskStatus(subtask.id, 'in_progress')}
          disabled={subtask.status === 'in_progress'}
        >
          Start
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={() => onSetTaskStatus(subtask.id, 'done')}
          disabled={subtask.status === 'done'}
        >
          Done
        </button>
        <button
          type="button"
          className="danger-button"
          onClick={() => onDeleteTask(subtask.id)}
        >
          Delete
        </button>
      </div>
    </article>
  )
}

export default TaskDetail
