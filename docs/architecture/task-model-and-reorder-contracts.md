# Task Model And Reorder Contracts

## Purpose

This document defines the initial technical model for an `AI-assisted task execution app`.

It is intentionally narrow. The goal is to make capture, expansion, decomposition, acceptance, execution, and reorder behavior deterministic before implementation scales.

## Core Entity Shapes

### Capture Item

The MVP capture item model should assume these fields:

- `id`
- `raw_text`
- `normalized_title`
- `created_at`
- `updated_at`
- `archived_at`

Optional but safe to add in MVP if needed:
- `source`
- `tags`

Capture items are intake objects. They should not require execution status or board position.

### Task

The MVP task model should assume these fields:

- `id`
- `parent_task_id`
- `source_capture_id`
- `title`
- `description`
- `status`
- `position`
- `created_at`
- `updated_at`
- `completed_at`
- `archived_at`

Optional but safe to add in MVP if needed:
- `due_at`
- `priority`

### AI Suggestion Set

The MVP suggestion model should assume these fields:

- `id`
- `source_entity_type`
- `source_entity_id`
- `kind`
- `status`
- `payload`
- `created_at`
- `updated_at`

Where:
- `source_entity_type` is `capture_item` or `task`
- `kind` is `expansion` or `decomposition`
- `status` is a review state such as `pending`, `accepted`, `partially_accepted`, `rejected`, or `failed`
- `payload` is structured output, not arbitrary prose-only content

Do not add broad metadata bags in MVP unless they are explicitly tied to product value.

## Status Model

Default MVP execution statuses:
- `todo`
- `in_progress`
- `done`

Status meaning:
- `todo`: committed work exists and is not yet being actively worked
- `in_progress`: committed work is currently active
- `done`: committed work has been completed

Status rules:
- every committed task has exactly one execution status
- `done` is reversible through explicit reopen behavior
- status changes must update `updated_at`
- entering `done` should set `completed_at`
- leaving `done` should clear `completed_at`
- AI processing state must not reuse execution status fields

## Parent-Child Model

MVP recommendation:
- allow top-level tasks and subtasks through `parent_task_id`
- keep board projection limited to top-level committed tasks in MVP
- show subtasks primarily in task detail or checklist surfaces

This avoids turning the board into an unreadable mixed tree.

## Archive And Delete Rules

- `archived_at` means the object is preserved but hidden from the main active execution surfaces
- archived tasks are not deleted tasks
- delete is destructive removal and should be a separate action
- moving a task to `done` does not archive it
- archiving a task does not imply accepting or rejecting any pending suggestion set

## Acceptance Model

Acceptance is a first-class write operation.

Rules:
- AI output is not canonical data until accepted
- acceptance may be partial
- accepting expansion output may update task fields or notes
- accepting decomposition output may create subtasks or next actions
- rejected suggestions remain non-canonical
- failed acceptance writes must roll back cleanly

## Position Model

`position` is the stable sort key within a top-level task execution status column.

Rules:
- positions are ordered only relative to other top-level committed tasks in the same status
- tasks in different statuses do not compete for position
- subtasks do not participate in top-level board ordering in MVP
- after any move, each committed top-level task must have one clear final status and one clear final position
- the persisted order after reload must match the visible order before reload

Implementation guidance:
- the exact position representation may be integer, float, or string-based ordering
- choose the simplest approach that supports stable insert between neighbors
- hide the representation detail behind a reorder service or helper

## View Model

MVP execution projections:
- inbox or triage view shows raw capture items
- task detail view shows a selected capture item or task plus pending AI suggestion sets
- list or focus view shows committed actionable work
- board view shows committed top-level tasks by execution status

Board rendering must remain a projection of committed task state, not a competing planning model.

## Write Operations

### Create Capture Item

Input:
- raw_text

Effects:
- creates a capture item without requiring execution status
- sets created and updated timestamps

### Commit Capture Item To Task

Input:
- capture_item_id
- title
- optional description
- optional due_at
- optional priority

Effects:
- creates a top-level task
- links the task back to its source capture item
- assigns a valid position in `todo` unless another default is explicitly specified

### Expand With AI

Input:
- source entity id
- source entity type
- relevant context

Effects:
- creates a pending `AI suggestion set` of kind `expansion`
- does not mutate committed task data directly

### Decompose With AI

Input:
- task_id
- relevant context

Effects:
- creates a pending `AI suggestion set` of kind `decomposition`
- does not mutate committed task data directly

### Accept Suggestion Set

Input:
- suggestion_set_id
- selected fields, notes, or suggested subtasks

Effects:
- commits selected output into canonical task data
- updates suggestion set status to `accepted` or `partially_accepted`

### Update Task

Input may change:
- title
- description
- due_at
- priority

Effects:
- does not silently change status or position
- updates `updated_at`

### Complete Task

Effects:
- sets `status=done`
- sets `completed_at`
- assigns a valid position in `done`

### Reopen Task

Effects:
- changes `status` from `done` to a non-done status
- clears `completed_at`
- assigns a valid position in the target active status

### Archive Task

Effects:
- sets `archived_at`
- removes the task from active execution projections

### Restore Task

Effects:
- clears `archived_at`
- preserves the task status that existed before restore
- assigns a valid position at the end of that status column

## Reorder Contract

Every top-level task reorder or move action should be reducible to this intent:

- `task_id`
- `to_status`
- `before_task_id` or `after_task_id`, or an explicit empty-target placement

Guidelines:
- support moves within the same status
- support moves across statuses
- support dropping into an empty column
- avoid contracts that depend on stale client indices alone
- reject reorder attempts for capture items, pending suggestion sets, and uncommitted subtasks in MVP

Preferred semantic contract:
- identify the moved task
- identify the destination execution status
- identify neighboring tasks when relevant

This is safer than relying only on source and destination indexes in filtered or concurrently updated views.

## Filter Interaction Rules

- filtered views are projections, not separate lists
- if reorder is allowed while filtered, the resulting placement must still be defined in the full underlying column order
- if the product cannot guarantee correct filtered reorder semantics, disable reorder in filtered mode for MVP
- filtered views must not mix pending suggestion sets with committed tasks

MVP recommendation:
- allow filtering for viewing
- restrict reorder in filtered views until a clear full-order policy is implemented

## Optimistic Update Rules

Optimistic UI is allowed for:
- capture creation
- manual task edit
- task completion
- top-level task reorder

Only if all of these are true:
- rollback behavior is implemented
- failure returns the UI to a valid visible state
- duplicate local ghosts cannot remain after failure

AI generation itself should not silently optimistic-write canonical task data.

## Edge Cases To Design For

- capturing a rough idea with almost no structure
- expanding a capture item before it becomes a task
- expanding a task and accepting only some suggestions
- decomposing a task and accepting only some subtasks
- moving the only task in a column
- moving into an empty column
- reopening a task from `done`
- reloading after multiple moves and seeing the same order
- AI failure after a visible review state was opened

## MVP Recommendation

Prefer a simple architecture:
- one canonical store for committed execution data
- one canonical store for capture items
- one suggestion store for pending AI output
- board columns derived from top-level task status
- a single reorder service that owns move semantics

Do not create a board-first planning model unless the product later proves that execution surfaces are insufficient.
