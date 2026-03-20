import { useState } from 'react'
import CaptureExpansionPanel from './CaptureExpansionPanel'
import type { ExpansionAcceptedField, ExpansionSuggestionSet } from '../features/ai/model'
import type { ExpandResponse } from '../../shared/ai/contracts'
import { buildTaskDraftFromCapture } from '../features/capture/store'
import { formatDate } from '../features/tasks/format'
import type { CaptureItem } from '../features/capture/model'
import type { TaskDraft } from '../features/tasks/model'

type CaptureDetailProps = {
  selectedCaptureItem: CaptureItem | null
  suggestionSet: ExpansionSuggestionSet | null
  captureCount: number
  onOpenBoard: () => void
  onPatchCaptureItem: (itemId: string, rawText: string) => void
  onDeleteCaptureItem: (itemId: string) => void
  onCommitCaptureItemToTask: (itemId: string, draft: TaskDraft) => boolean
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

function CaptureDetail({
  selectedCaptureItem,
  suggestionSet,
  captureCount,
  onOpenBoard,
  onPatchCaptureItem,
  onDeleteCaptureItem,
  onCommitCaptureItemToTask,
  onStoreExpansionSuggestion,
  onStoreFailedExpansionSuggestion,
  onAcceptCaptureExpansionSuggestion,
  onRejectSuggestionSet,
}: CaptureDetailProps) {
  return (
    <aside className="detail panel">
      <div className="panel-heading">
        <p className="eyebrow">Capture detail</p>
        <h2>
          {selectedCaptureItem
            ? 'Develop the idea before you turn it into execution work.'
            : 'Select a capture item.'}
        </h2>
      </div>

      {selectedCaptureItem ? (
        <div className="detail-form">
          <label>
            <span>Derived title</span>
            <input value={selectedCaptureItem.normalizedTitle} readOnly />
          </label>

          <EditableCaptureField
            key={`${selectedCaptureItem.id}:${selectedCaptureItem.updatedAt}`}
            captureItem={selectedCaptureItem}
            onPatchCaptureItem={onPatchCaptureItem}
          />

          <CaptureExpansionPanel
            key={selectedCaptureItem.id}
            captureItem={selectedCaptureItem}
            suggestionSet={suggestionSet}
            onStoreExpansionSuggestion={onStoreExpansionSuggestion}
            onStoreFailedExpansionSuggestion={onStoreFailedExpansionSuggestion}
            onAcceptCaptureExpansionSuggestion={onAcceptCaptureExpansionSuggestion}
            onRejectSuggestionSet={onRejectSuggestionSet}
          />

          <div className="detail-pulse">
            <p>Captured {formatDate(selectedCaptureItem.createdAt)}</p>
            <p>Updated {formatDate(selectedCaptureItem.updatedAt)}</p>
          </div>

          <div className="detail-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() =>
                onCommitCaptureItemToTask(
                  selectedCaptureItem.id,
                  buildTaskDraftFromCapture(selectedCaptureItem),
                )
              }
            >
              Commit raw capture now
            </button>
            <button
              type="button"
              className="danger-button"
              onClick={() => onDeleteCaptureItem(selectedCaptureItem.id)}
            >
              Delete capture
            </button>
          </div>
        </div>
      ) : (
        <div className="empty-state detail-empty">
          <p>No capture item selected.</p>
          <span>Capture a rough idea on the left or pick one from the inbox.</span>
        </div>
      )}

      <footer className="detail-footer">
        <p>{captureCount} active capture items are waiting outside the board.</p>
        <button type="button" onClick={onOpenBoard}>
          Back to board
        </button>
      </footer>
    </aside>
  )
}

type EditableCaptureFieldProps = {
  captureItem: CaptureItem
  onPatchCaptureItem: (itemId: string, rawText: string) => void
}

function EditableCaptureField({
  captureItem,
  onPatchCaptureItem,
}: EditableCaptureFieldProps) {
  const [rawTextDraft, setRawTextDraft] = useState(captureItem.rawText)

  function commitRawTextDraft() {
    const trimmedDraft = rawTextDraft.trim()

    if (!trimmedDraft) {
      setRawTextDraft(captureItem.rawText)
      return
    }

    if (trimmedDraft !== captureItem.rawText) {
      onPatchCaptureItem(captureItem.id, trimmedDraft)
    }

    setRawTextDraft(trimmedDraft)
  }

  return (
    <label>
      <span>Raw capture</span>
      <textarea
        rows={12}
        value={rawTextDraft}
        onChange={(event) => setRawTextDraft(event.target.value)}
        onBlur={commitRawTextDraft}
      />
    </label>
  )
}

export default CaptureDetail
