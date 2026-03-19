# Task Model And Reorder Contracts

## Purpose

This document defines the initial technical model for a `To Do app first, kanban second` product.

It is intentionally narrow. The goal is to make create, edit, complete, move, and reorder behavior deterministic before implementation starts.

## Core Task Shape

The MVP task model should assume these fields:

- `id`
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

Do not add broad metadata bags in MVP.

## Status Model

Default MVP statuses:
- `todo`
- `in_progress`
- `done`

Status meaning:
- `todo`: task exists and is not yet being actively worked
- `in_progress`: task is currently active
- `done`: task has been completed

Status rules:
- every task has exactly one status
- `done` is reversible through explicit reopen behavior
- status changes must update `updated_at`
- entering `done` should set `completed_at`
- leaving `done` should clear `completed_at`

## Archive And Delete Rules

- `archived_at` means the task is preserved but hidden from the main active board
- archived tasks are not deleted tasks
- delete is destructive removal and should be a separate action
- moving a task to `done` does not archive it

## Position Model

`position` is the stable sort key within a status column.

Rules:
- positions are ordered only relative to other tasks in the same status
- tasks in different statuses do not compete for position
- after any move, each task must have one clear final status and one clear final position
- the persisted order after reload must match the visible order before reload

Implementation guidance:
- the exact position representation may be integer, float, or string-based ordering
- choose the simplest approach that supports stable insert between neighbors
- hide the representation detail behind a reorder service or helper

## View Model

The kanban board should derive columns from status values.

MVP board projection:
- `todo` column shows tasks with `status=todo`
- `in_progress` column shows tasks with `status=in_progress`
- `done` column shows tasks with `status=done`

Board rendering must remain a projection of task state, not a separate competing model.

## Write Operations

### Create Task

Input:
- title
- optional description
- optional due_at
- optional priority

Effects:
- creates task in `todo` unless another default is explicitly specified
- assigns a valid position in the target status
- sets created and updated timestamps

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
- removes task from the active board projection

## Reorder Contract

Every reorder or move action should be reducible to this intent:

- `task_id`
- `to_status`
- `before_task_id` or `after_task_id`, or an explicit empty-target placement

Guidelines:
- support moves within the same status
- support moves across statuses
- support dropping into an empty column
- avoid contracts that depend on stale client indices alone

Preferred semantic contract:
- identify the moved task
- identify the destination status
- identify neighboring tasks when relevant

This is safer than relying only on source and destination indexes in filtered or concurrently updated views.

## Filter Interaction Rules

- filtered views are projections, not separate lists
- if reorder is allowed while filtered, the resulting placement must still be defined in the full underlying column order
- if the product cannot guarantee correct filtered reorder semantics, disable reorder in filtered mode for MVP

MVP recommendation:
- allow filtering for viewing
- restrict reorder in filtered views until a clear full-order policy is implemented

## Optimistic Update Rules

Optimistic UI is allowed for:
- create
- edit
- complete
- reorder

Only if all of these are true:
- rollback behavior is implemented
- failure returns the UI to a valid visible state
- duplicate local ghost tasks cannot remain after failure

## Edge Cases To Design For

- moving the only task in a column
- moving into an empty column
- moving to the top of a populated column
- moving to the bottom of a populated column
- reopening a task from `done`
- completing a task from any active status
- reloading after multiple moves and seeing the same order

## MVP Recommendation

Prefer a simple architecture:
- one canonical task store
- board columns derived from task status
- a single reorder service that owns move semantics

Do not create separate board-card entities unless the product later proves that task and board-card lifecycles are meaningfully different.
