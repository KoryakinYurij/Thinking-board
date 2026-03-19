import { useState } from 'react'
import type { FormEvent } from 'react'
import { PRIORITY_META, PRIORITY_ORDER } from '../features/tasks/model'
import type { TaskDraft, TaskPriority } from '../features/tasks/model'

type TaskComposerProps = {
  onCreateTask: (draft: TaskDraft) => boolean
}

function TaskComposer({ onCreateTask }: TaskComposerProps) {
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftDueAt, setDraftDueAt] = useState('')
  const [draftPriority, setDraftPriority] = useState<TaskPriority>('medium')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const wasCreated = onCreateTask({
      title: draftTitle,
      description: draftDescription,
      dueAt: draftDueAt || null,
      priority: draftPriority,
    })

    if (!wasCreated) {
      return
    }

    setDraftTitle('')
    setDraftDescription('')
    setDraftDueAt('')
    setDraftPriority('medium')
  }

  return (
    <aside className="composer panel">
      <div className="panel-heading">
        <p className="eyebrow">Quick capture</p>
        <h2>Drop in the next thing before it escapes.</h2>
      </div>

      <form className="composer-form" onSubmit={handleSubmit}>
        <label>
          <span>Task title</span>
          <input
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            placeholder="Rewrite the board, not your whole life"
            maxLength={120}
          />
        </label>

        <label>
          <span>Notes</span>
          <textarea
            value={draftDescription}
            onChange={(event) => setDraftDescription(event.target.value)}
            placeholder="Optional details, context, or a hard stop."
            rows={5}
          />
        </label>

        <div className="composer-row">
          <label>
            <span>Due</span>
            <input
              type="date"
              value={draftDueAt}
              onChange={(event) => setDraftDueAt(event.target.value)}
            />
          </label>

          <label>
            <span>Priority</span>
            <select
              value={draftPriority}
              onChange={(event) =>
                setDraftPriority(event.target.value as TaskPriority)
              }
            >
              {PRIORITY_ORDER.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_META[priority].label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button className="primary-button" type="submit">
          Add task to queue
        </button>
      </form>

      <div className="composer-footnote">
        <p>
          The form always creates into <strong>Open Loop</strong>. Status
          changes happen later and stay explicit.
        </p>
      </div>
    </aside>
  )
}

export default TaskComposer
