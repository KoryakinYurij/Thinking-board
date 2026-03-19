# To Do Kanban Rules

## Domain Priority

`task` is the source of truth.

Kanban is a representation layer for organizing and progressing tasks. The board must not define task meaning in a way that conflicts with task lifecycle rules.

## Core Entities

### Task

A task is the main product object. A task may contain:
- id
- title
- description or notes
- status
- position
- timestamps such as created and updated
- optional metadata such as due date or priority

### Column

A column is a grouping surface for tasks. In MVP, a column should map to a clear task status or workflow stage, not to an arbitrary visual bucket.

### Board

A board is the container for columns and the current task view. In MVP, board behavior should stay simple and secondary to task behavior.

## Lifecycle Rules

- A task should always have a valid status.
- Completing a task is a domain action, not only a visual move.
- Reopening a task is valid and should produce a clear status change.
- Deleting a task is not the same as completing it.
- Archiving a task is not the same as deleting it.
- A task should not become unreachable because of a board-only action.

## Column Rules

- Each MVP column must have a defined semantic meaning.
- Moving a task between columns changes task status or workflow stage.
- Column order may affect presentation, but must not create hidden business meaning beyond documented workflow order.
- Empty columns are valid and should render cleanly.

## Reorder Rules

- Reordering within a column changes display order only.
- Moving across columns changes both grouping and status.
- Each move must result in a deterministic final `position`.
- Persisted order must be stable after refresh.
- Reorder logic must work for first item, middle item, last item, and empty target column.

## Filter Rules

- Filters change what is shown, not the underlying task data.
- Reorder actions under a filtered view must have predictable results.
- If filtered reorder behavior is restricted, the UI must communicate that clearly.
- Text search and status filtering must not make tasks appear lost after status changes.

## UX Rules

- Users must be able to change status without drag-and-drop.
- Mobile users must have a reliable non-hover interaction model.
- Long titles, empty descriptions, and many tasks must not break the board.
- Completion should be available from both task detail and quick board interaction.

## State Integrity

- UI state and persisted state must converge after successful writes.
- Optimistic updates are allowed only if rollback behavior is defined.
- Failed moves must restore a consistent task state.
- No task should exist in two columns at once.
- No task should disappear because of stale client order calculations.

## MVP Default Workflow

Unless the product specification changes, assume a simple status-oriented workflow such as:
- `todo`
- `in_progress`
- `done`

Additional statuses must be justified by product value, not by UI novelty.

## Non-Goals For MVP

- arbitrary user-defined workflow engines
- dependency graphs between tasks
- advanced swimlanes
- board-first modeling where tasks are subordinate to cards
