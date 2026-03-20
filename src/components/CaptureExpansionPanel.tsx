import { useState } from 'react'
import { buildTaskDraftFromCapture } from '../features/capture/store'
import { buildExpansionNotes } from '../features/ai/format'
import type {
  ExpansionAcceptedField,
  ExpansionSuggestionSet,
} from '../features/ai/model'
import { expandWithAI } from '../lib/api/ai'
import type { CaptureItem } from '../features/capture/model'
import type { TaskDraft } from '../features/tasks/model'
import type { ExpandResponse } from '../../shared/ai/contracts'

type CaptureExpansionPanelProps = {
  captureItem: CaptureItem
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
  onAcceptCaptureExpansionSuggestion: (
    suggestionSetId: string,
    itemId: string,
    draft: TaskDraft,
    acceptedFields: ExpansionAcceptedField[],
  ) => boolean
  onRejectSuggestionSet: (suggestionSetId: string) => void
}

function CaptureExpansionPanel({
  captureItem,
  suggestionSet,
  onStoreExpansionSuggestion,
  onStoreFailedExpansionSuggestion,
  onAcceptCaptureExpansionSuggestion,
  onRejectSuggestionSet,
}: CaptureExpansionPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExpand() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await expandWithAI({
        sourceEntityType: 'capture_item',
        sourceEntityId: captureItem.id,
        rawText: captureItem.rawText,
        contextDocuments: [],
        schemaVersion: 'v1',
      })

      onStoreExpansionSuggestion('capture_item', captureItem.id, response)
    } catch (requestError) {
      const nextError =
        requestError instanceof Error
          ? requestError.message
          : 'Expansion failed unexpectedly.'

      setError(nextError)
      onStoreFailedExpansionSuggestion('capture_item', captureItem.id, nextError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="ai-surface">
      <div className="ai-surface-header">
        <div>
          <p className="eyebrow">AI workspace</p>
          <h3>Develop the idea before you promote it into committed work.</h3>
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
        <CaptureExpansionReview
          key={suggestionSet.id}
          suggestionSet={suggestionSet}
          captureItem={captureItem}
          onAcceptCaptureExpansionSuggestion={onAcceptCaptureExpansionSuggestion}
        />
      ) : (
        <p className="muted-note">
          Expansion should sharpen the idea before it earns a board position.
        </p>
      )}
    </section>
  )
}

type CaptureExpansionReviewProps = {
  suggestionSet: ExpansionSuggestionSet
  captureItem: CaptureItem
  onAcceptCaptureExpansionSuggestion: (
    suggestionSetId: string,
    itemId: string,
    draft: TaskDraft,
    acceptedFields: ExpansionAcceptedField[],
  ) => boolean
}

function CaptureExpansionReview({
  suggestionSet,
  captureItem,
  onAcceptCaptureExpansionSuggestion,
}: CaptureExpansionReviewProps) {
  const [applyTitle, setApplyTitle] = useState(true)
  const [appendNotes, setAppendNotes] = useState(true)
  const isAccepted = suggestionSet.status === 'accepted'
  const isPartiallyAccepted = suggestionSet.status === 'partially_accepted'
  const isRejected = suggestionSet.status === 'rejected'
  const canAccept =
    suggestionSet.status === 'pending' && (applyTitle || appendNotes)

  function handleCommitSelected() {
    if (!suggestionSet.payload || !canAccept) {
      return
    }

    const baseDraft = buildTaskDraftFromCapture(captureItem)
    const acceptedFields: ExpansionAcceptedField[] = []

    const nextDraft: TaskDraft = {
      ...baseDraft,
      title: applyTitle ? suggestionSet.payload.normalizedTitle : baseDraft.title,
      description: appendNotes
        ? buildExpansionNotes(baseDraft.description, suggestionSet.payload)
        : baseDraft.description,
    }

    if (applyTitle) {
      acceptedFields.push('normalized_title')
    }

    if (appendNotes) {
      acceptedFields.push('description_notes')
    }

    onAcceptCaptureExpansionSuggestion(
      suggestionSet.id,
      captureItem.id,
      nextDraft,
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
          <span>Use the AI title when creating the task</span>
        </label>

        <label className="ai-toggle">
          <input
            type="checkbox"
            checked={appendNotes}
            disabled={suggestionSet.status !== 'pending'}
            onChange={(event) => setAppendNotes(event.target.checked)}
          />
          <span>Append AI notes into the created task description</span>
        </label>
      </div>

      <div className="detail-actions">
        <button
          className="primary-button"
          type="button"
          disabled={!canAccept}
          onClick={handleCommitSelected}
        >
          Create task from selected
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

export default CaptureExpansionPanel
