import type { CaptureItem } from '../features/capture/model'
import { formatDate, truncate } from '../features/tasks/format'

type CaptureInboxProps = {
  items: CaptureItem[]
  totalCount: number
  selectedCaptureItemId: string | null
  onSelectCaptureItem: (itemId: string) => void
  onCommitCaptureItem: (itemId: string) => void
  onDeleteCaptureItem: (itemId: string) => void
}

function CaptureInbox({
  items,
  totalCount,
  selectedCaptureItemId,
  onSelectCaptureItem,
  onCommitCaptureItem,
  onDeleteCaptureItem,
}: CaptureInboxProps) {
  return (
    <section className="archive-view panel">
      <div className="panel-heading">
        <p className="eyebrow">Inbox</p>
        <h2>Keep raw ideas separate until they deserve execution status.</h2>
      </div>

      <div className="archive-summary">
        <p>
          <strong>{items.length}</strong> shown
        </p>
        <span>{totalCount} active capture items</span>
      </div>

      {items.length === 0 ? (
        <div className="empty-state archive-empty">
          <p>Your inbox is clear right now.</p>
          <span>Capture a rough idea on the left before it turns into accidental scope.</span>
        </div>
      ) : (
        <div className="archive-list">
          {items.map((item) => (
            <article
              key={item.id}
              className={`archive-card ${selectedCaptureItemId === item.id ? 'is-selected' : ''}`}
              tabIndex={0}
              onClick={() => onSelectCaptureItem(item.id)}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) {
                  return
                }

                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelectCaptureItem(item.id)
                }
              }}
            >
              <div className="archive-card-header">
                <span>Captured {formatDate(item.updatedAt)}</span>
                <span>{item.rawText.trim().length} chars</span>
              </div>

              <div className="archive-card-body">
                <h3>{item.normalizedTitle}</h3>
                <p>{truncate(item.rawText, 160)}</p>
              </div>

              <div className="archive-card-actions">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onSelectCaptureItem(item.id)
                  }}
                >
                  Review
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onCommitCaptureItem(item.id)
                  }}
                >
                  Commit now
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDeleteCaptureItem(item.id)
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default CaptureInbox
