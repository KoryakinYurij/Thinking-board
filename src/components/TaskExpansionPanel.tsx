import { useState } from 'react'
import { buildExpansionNotes } from '../features/ai/format'
import type {
  ExpansionAcceptedField,
  ExpansionSuggestionSet,
} from '../features/ai/model'
import type { Task, TaskPatch } from '../features/tasks/model'
import { expandWithAI } from '../lib/api/ai'
import type { ExpandResponse } from '../../shared/ai/contracts'

type TaskExpansionPanelProps = {
  task: Task
  suggestionSet: ExpansionSuggestionSet | null
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
}

function TaskExpansionPanel({
  task,
  suggestionSet,
  onStoreExpansionSuggestion,
  onStoreFailedExpansionSuggestion,
  onAcceptTaskExpansionSuggestion,
  onRejectSuggestionSet,
}: TaskExpansionPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExpand() {
    setIsLoading(true)
    setError(null)

    try {
      const rawText = [task.title.trim(), task.description.trim()]
        .filter(Boolean)
        .join('\n\n')

      const response = await expandWithAI({
        sourceEntityType: 'task',
        sourceEntityId: task.id,
        rawText,
        existingTask: {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueAt: task.dueAt,
        },
        contextDocuments: [],
        schemaVersion: 'v1',
      })

      onStoreExpansionSuggestion('task', task.id, response)
    } catch (requestError) {
      const nextError =
        requestError instanceof Error
          ? requestError.message
          : 'Expansion failed unexpectedly.'

      setError(nextError)
      onStoreFailedExpansionSuggestion('task', task.id, nextError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="ai-surface">
      <div className="ai-surface-header">
        <div>
          <p className="eyebrow">AI workspace</p>
          <h3>Develop the task before you add more execution noise.</h3>
        </div>

        <div className="ai-surface-actions">
          <button
            className="primary-button"
            type="button"
            disabled={isLoading}
            onClick={() => void handleExpand()}
          >
            {isLoading ? 'Expanding...' : 'Expand with AI'}
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
          <p>{suggestionSet.errorMessage ?? 'Expansion failed.'}</p>
        </div>
      ) : suggestionSet?.payload ? (
        <TaskExpansionReview
          key={suggestionSet.id}
          suggestionSet={suggestionSet}
          task={task}
          onAcceptTaskExpansionSuggestion={onAcceptTaskExpansionSuggestion}
        />
      ) : (
        <p className="muted-note">
          Expansion makes the task clearer before you change status, priority, or scope.
        </p>
      )}
    </section>
  )
}

type TaskExpansionReviewProps = {
  suggestionSet: ExpansionSuggestionSet
  task: Task
  onAcceptTaskExpansionSuggestion: (
    suggestionSetId: string,
    taskId: string,
    updates: TaskPatch,
    acceptedFields: ExpansionAcceptedField[],
  ) => void
}

function TaskExpansionReview({
  suggestionSet,
  task,
  onAcceptTaskExpansionSuggestion,
}: TaskExpansionReviewProps) {
  const [applyTitle, setApplyTitle] = useState(true)
  const [appendNotes, setAppendNotes] = useState(false)
  const isAccepted = suggestionSet.status === 'accepted'
  const isPartiallyAccepted = suggestionSet.status === 'partially_accepted'
  const isRejected = suggestionSet.status === 'rejected'
  const canAccept =
    suggestionSet.status === 'pending' && (applyTitle || appendNotes)

  function handleAcceptSelected() {
    if (!suggestionSet.payload || !canAccept) {
      return
    }

    const updates: TaskPatch = {}
    const acceptedFields: ExpansionAcceptedField[] = []

    if (applyTitle) {
      updates.title = suggestionSet.payload.normalizedTitle
      acceptedFields.push('normalized_title')
    }

    if (appendNotes) {
      updates.description = buildExpansionNotes(task.description, suggestionSet.payload)
      acceptedFields.push('description_notes')
    }

    onAcceptTaskExpansionSuggestion(
      suggestionSet.id,
      task.id,
      updates,
      acceptedFields,
    )
  }

  return (
    <div className="ai-review">
      <div className="ai-review-section">
        <p className="eyebrow">Suggested title</p>
        <strong>{suggestionSet.payload?.normalizedTitle}</strong>
      </div>

      <div className="ai-review-section">
        <p className="eyebrow">Summary</p>
        <p>{suggestionSet.payload?.summary}</p>
      </div>

      <div className="ai-review-section">
        <p className="eyebrow">Desired outcome</p>
        <p>{suggestionSet.payload?.desiredOutcome}</p>
      </div>

      <ExpansionList
        title="Options"
        items={
          suggestionSet.payload?.options.map(
            (option) => `${option.label}: ${option.summary}`,
          ) ?? []
        }
      />
      <ExpansionList
        title="Risks"
        items={
          suggestionSet.payload?.risks.map(
            (risk) => `${risk.label}: ${risk.impact}`,
          ) ?? []
        }
      />
      <ExpansionList
        title="Assumptions"
        items={suggestionSet.payload?.assumptions ?? []}
      />
      <ExpansionList
        title="Constraints"
        items={suggestionSet.payload?.constraints ?? []}
      />
      <ExpansionList
        title="Clarifying questions"
        items={suggestionSet.payload?.clarifyingQuestions ?? []}
      />

      <div className="ai-selection">
        <label className="ai-toggle">
          <input
            type="checkbox"
            checked={applyTitle}
            disabled={suggestionSet.status !== 'pending'}
            onChange={(event) => setApplyTitle(event.target.checked)}
          />
          <span>Apply normalized title</span>
        </label>

        <label className="ai-toggle">
          <input
            type="checkbox"
            checked={appendNotes}
            disabled={suggestionSet.status !== 'pending'}
            onChange={(event) => setAppendNotes(event.target.checked)}
          />
          <span>Append AI notes into the task description</span>
        </label>
      </div>

      <div className="detail-actions">
        <button
          className="primary-button"
          type="button"
          disabled={!canAccept}
          onClick={handleAcceptSelected}
        >
          Accept selected
        </button>
      </div>

      <p className="muted-note">
        {isAccepted
          ? 'This suggestion set was fully accepted.'
          : isPartiallyAccepted
            ? 'This suggestion set was partially accepted.'
            : isRejected
              ? 'This suggestion set was rejected and kept only for traceability.'
              : `Model: ${suggestionSet.model ?? 'unknown'}`}
      </p>
    </div>
  )
}

type ExpansionListProps = {
  title: string
  items: string[]
}

function ExpansionList({ title, items }: ExpansionListProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="ai-review-section">
      <p className="eyebrow">{title}</p>
      <ul className="ai-list">
        {items.map((item) => (
          <li key={`${title}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default TaskExpansionPanel
