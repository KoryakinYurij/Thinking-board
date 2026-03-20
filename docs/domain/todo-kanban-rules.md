# AI Task Execution Rules

## Domain Priority

Committed `task` data is the source of truth for execution.

`capture item` is an intake object.
`AI suggestion set` is a proposal.
Kanban is a representation layer for committed work.

The board must not define task meaning in a way that conflicts with task lifecycle rules, and AI output must not bypass acceptance into canonical task data.

## Core Entities

### Capture Item

A capture item is raw user intent. It may contain:
- id
- raw text
- optional normalized title
- timestamps
- optional links to generated AI suggestion sets

A capture item may remain rough and does not need to be fully structured immediately.

### Task

A task is a committed execution object. A task may contain:
- id
- optional `parent_task_id`
- optional `source_capture_id`
- title
- description or notes
- status
- position
- timestamps
- optional metadata such as due date or priority

### Subtask

A subtask is a task with a parent task. It is still execution work, not only display metadata.

### AI Suggestion Set

An AI suggestion set is reviewable output linked to a capture item or task. It may contain:
- expansion output
- decomposition output
- clarifying questions
- suggested fields or notes
- suggested subtasks or next actions

It is not committed work until accepted.

### Board

A board is a projection of committed top-level tasks by execution status. In MVP, board behavior should stay simple and secondary to capture, review, and execution quality.

## Lifecycle Rules

- A capture item may exist before any committed task is created.
- A task should always have a valid execution status.
- Completing a task is a domain action, not only a visual move.
- Reopening a task is valid and should produce a clear status change.
- Deleting a task is not the same as completing it.
- Archiving a task is not the same as deleting it.
- Restoring an archived task returns it to the active execution surfaces in its existing status lane.
- A task should not become unreachable because of a board-only action.
- A failed AI run must not create partial committed task mutations.

## AI Rules

- Expansion and decomposition are different operations and must stay different in product language and data contracts.
- Expansion may improve clarity, scope, risk awareness, and task framing.
- Decomposition may propose phases, subtasks, or next actions.
- AI output must be reviewable before acceptance.
- AI output may be accepted partially.
- Rejected suggestions must not pollute committed task data.
- AI must not invent execution statuses or columns in MVP.
- AI process states must not be represented as task execution statuses.

## Column Rules

- Each MVP column must have a defined execution meaning.
- Moving a task between columns changes task execution status, not AI planning state.
- Column order may affect presentation, but must not create hidden business meaning beyond documented workflow order.
- Empty columns are valid and should render cleanly.
- Unaccepted AI suggestions must never appear as committed board cards.

## Reorder Rules

- Reordering within a column changes display order only.
- Moving across columns changes both grouping and execution status.
- Each move must result in a deterministic final `position`.
- Persisted order must be stable after refresh.
- Reorder logic must work for first item, middle item, last item, and empty target column.
- Reorder semantics apply only to committed tasks, not to raw capture items or pending suggestion sets.

## Filter Rules

- Filters change what is shown, not the underlying task data.
- Reorder actions under a filtered view must have predictable results.
- If filtered reorder behavior is restricted, the UI must communicate that clearly.
- Text search and status filtering must not make committed tasks appear lost after status changes.
- Pending suggestion sets must not be mistaken for filtered-out committed tasks.

## UX Rules

- Users must be able to run AI actions from capture or task detail surfaces without relying on the board.
- Users must be able to accept or reject AI output clearly.
- Users must be able to change task status without drag-and-drop.
- Mobile users must have a reliable non-hover interaction model.
- Long titles, empty descriptions, and many tasks must not break the board.
- Completion should remain available from both task detail and quick execution surfaces.

## State Integrity

- UI state and persisted state must converge after successful writes.
- Optimistic updates are allowed only if rollback behavior is defined.
- Failed AI calls must restore a consistent visible state.
- Failed task moves must restore a consistent task state.
- No task should exist in two columns at once.
- No task should disappear because of stale client order calculations.
- No pending suggestion set should silently auto-commit itself into task data.

## MVP Default Workflow

Unless the product specification changes, assume a simple execution workflow such as:
- `todo`
- `in_progress`
- `done`

Additional execution statuses must be justified by product value, not by UI novelty or AI output shape.

## Non-Goals For MVP

- arbitrary user-defined workflow engines
- board-first modeling where tasks are subordinate to cards
- autonomous AI planning stages mapped into columns
- enterprise dependency graphs
- advanced swimlanes
