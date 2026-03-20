import { useState } from 'react'
import type { DecomposeResponse } from '../../shared/ai/contracts'
import type {
  DecompositionAcceptedField,
  DecompositionSuggestionSet,
} from '../features/ai/model'
import type { Task } from '../features/tasks/model'
import { decomposeWithAI } from '../lib/api/ai'

type TaskDecompositionPanelProps = {
  task: Task
  suggestionSet: DecompositionSuggestionSet | null
  onStoreDecompositionSuggestion: (
    taskId: string,
    response: DecomposeResponse,
  ) => void
  onStoreFailedDecompositionSuggestion: (taskId: string, errorMessage: string) => void
  onAcceptTaskDecompositionSuggestion: (
    suggestionSetId: string,
    taskId: string,
    acceptedFields: DecompositionAcceptedField[],
  ) => void
  onRejectSuggestionSet: (suggestionSetId: string) => void
}

function TaskDecompositionPanel({
  task,
  suggestionSet,
  onStoreDecompositionSuggestion,
  onStoreFailedDecompositionSuggestion,
  onAcceptTaskDecompositionSuggestion,
  onRejectSuggestionSet,
}: TaskDecompositionPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDecompose() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await decomposeWithAI({
        taskId: task.id,
        taskSnapshot: {
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueAt: task.dueAt,
        },
        acceptedContext: [],
        constraints: [],
        schemaVersion: 'v1',
      })

      onStoreDecompositionSuggestion(task.id, response)
    } catch (requestError) {
      const nextError =
        requestError instanceof Error
          ? requestError.message
          : 'Decomposition failed unexpectedly.'

      setError(nextError)
      onStoreFailedDecompositionSuggestion(task.id, nextError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="ai-surface">
      <div className="ai-surface-header">
        <div>
          <p className="eyebrow">Decompose</p>
          <h3>Break the task into smaller executable work.</h3>
        </div>

        <div className="ai-surface-actions">
          <button
            className="primary-button"
            type="button"
            disabled={isLoading}
            onClick={() => void handleDecompose()}
          >
            {isLoading ? 'Decomposing...' : 'Decompose with AI'}
          </button>
          <button
            type="button"
            disabled={isLoading || !suggestionSet}
            onClick={() => {
              setError(null)
              if (suggestionSet) {
                onRejectSuggestionSet(suggestionSet.id)
              }
            }}
          >
            Reject latest
          </button>
        </div>
      </div>

      {error ? (
        <div className="status-banner is-warning" role="status">
          <p>{error}</p>
        </div>
      ) : null}

      {suggestionSet?.status === 'failed' ? (
        <div className="status-banner is-warning" role="status">
          <p>{suggestionSet.errorMessage ?? 'Decomposition failed.'}</p>
        </div>
      ) : suggestionSet?.payload ? (
        <TaskDecompositionReview
          key={suggestionSet.id}
          suggestionSet={suggestionSet}
          onAcceptTaskDecompositionSuggestion={onAcceptTaskDecompositionSuggestion}
          taskId={task.id}
        />
      ) : (
        <p className="muted-note">
          Decomposition should create executable steps, not another workflow layer.
        </p>
      )}
    </section>
  )
}

type TaskDecompositionReviewProps = {
  suggestionSet: DecompositionSuggestionSet
  taskId: string
  onAcceptTaskDecompositionSuggestion: (
    suggestionSetId: string,
    taskId: string,
    acceptedFields: DecompositionAcceptedField[],
  ) => void
}

function TaskDecompositionReview({
  suggestionSet,
  taskId,
  onAcceptTaskDecompositionSuggestion,
}: TaskDecompositionReviewProps) {
  const payload = suggestionSet.payload
  const [acceptSubtasks, setAcceptSubtasks] = useState(true)
  const [acceptNextActionsNotes, setAcceptNextActionsNotes] = useState(true)
  const canAccept =
    Boolean(payload) &&
    suggestionSet.status === 'pending' &&
    (acceptSubtasks || acceptNextActionsNotes)

  if (!payload) {
    return null
  }

  const acceptedFields: DecompositionAcceptedField[] = []

  if (acceptSubtasks) {
    acceptedFields.push('subtasks')
  }

  if (acceptNextActionsNotes) {
    acceptedFields.push('next_actions_notes')
  }

  return (
    <div className="ai-review">
      <div className="ai-review-section">
        <p className="eyebrow">Plan summary</p>
        <p>{payload.summary}</p>
      </div>

      <div className="ai-review-section">
        <p className="eyebrow">Suggested subtasks</p>
        <ul className="ai-list">
          {payload.subtasks.map((subtask) => (
            <li key={`${suggestionSet.id}-${subtask.title}`}>
              <strong>{subtask.title}</strong>
              {`: ${subtask.description}`}
            </li>
          ))}
        </ul>
      </div>

      <div className="ai-review-section">
        <p className="eyebrow">Next actions</p>
        <ul className="ai-list">
          {payload.nextActions.map((action) => (
            <li key={`${suggestionSet.id}-${action.title}`}>
              <strong>{action.title}</strong>
              {`: ${action.whyNow}`}
            </li>
          ))}
        </ul>
      </div>

      {payload.dependencies.length > 0 ? (
        <div className="ai-review-section">
          <p className="eyebrow">Dependencies</p>
          <ul className="ai-list">
            {payload.dependencies.map((dependency) => (
              <li key={`${suggestionSet.id}-${dependency}`}>{dependency}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {payload.notes.length > 0 ? (
        <div className="ai-review-section">
          <p className="eyebrow">Notes</p>
          <ul className="ai-list">
            {payload.notes.map((note) => (
              <li key={`${suggestionSet.id}-${note}`}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="ai-selection">
        <label className="ai-toggle">
          <input
            type="checkbox"
            checked={acceptSubtasks}
            disabled={suggestionSet.status !== 'pending'}
            onChange={(event) => setAcceptSubtasks(event.target.checked)}
          />
          <span>Create canonical subtasks</span>
        </label>

        <label className="ai-toggle">
          <input
            type="checkbox"
            checked={acceptNextActionsNotes}
            disabled={suggestionSet.status !== 'pending'}
            onChange={(event) => setAcceptNextActionsNotes(event.target.checked)}
          />
          <span>Append next actions into the parent task notes</span>
        </label>
      </div>

      <div className="detail-actions">
        <button
          className="primary-button"
          type="button"
          disabled={!canAccept}
          onClick={() =>
            onAcceptTaskDecompositionSuggestion(
              suggestionSet.id,
              taskId,
              acceptedFields,
            )
          }
        >
          Accept selected
        </button>
      </div>

      <p className="muted-note">
        {suggestionSet.status === 'accepted'
          ? 'This decomposition suggestion was fully accepted.'
          : suggestionSet.status === 'partially_accepted'
            ? 'This decomposition suggestion was partially accepted.'
            : suggestionSet.status === 'rejected'
              ? 'This decomposition suggestion was rejected and kept only for traceability.'
              : `Model: ${suggestionSet.model ?? 'unknown'}`}
      </p>
    </div>
  )
}

export default TaskDecompositionPanel
