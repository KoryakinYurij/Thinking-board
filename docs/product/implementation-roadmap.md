# Implementation Roadmap

## Goal

Ship a small but correct `To Do app` with a kanban view, without overbuilding the board model.

## Phase 1: Project Scaffold

Deliverables:
- chosen app stack
- base project structure
- linting and formatting
- minimal app shell

Exit criteria:
- repository can run locally
- there is a clear place for domain models, UI, and persistence code

## Phase 2: Task Domain First

Deliverables:
- task type or schema
- task create flow
- task edit flow
- task complete and reopen flows

Exit criteria:
- a user can manage tasks without depending on kanban drag-and-drop
- completion behavior matches `docs/domain/todo-kanban-rules.md`

## Phase 3: Kanban Projection

Deliverables:
- status-based columns
- task cards
- board layout for desktop and mobile
- empty states for each column

Exit criteria:
- tasks appear in the correct column based on status
- the board reads as a projection of task state

## Phase 4: Reorder And Move Semantics

Deliverables:
- within-column reorder
- cross-column move
- non-drag fallback controls for status change
- stable persistence of order

Exit criteria:
- moved tasks keep the same order after refresh
- drag-and-drop is not the only way to change status
- empty-column and edge insertions work

## Phase 5: Persistence

Deliverables:
- saved task state
- saved ordering
- recovery after reload

Exit criteria:
- create, edit, complete, and move operations survive refresh
- failed writes do not leave inconsistent visible state

## Phase 6: Filters

Deliverables:
- text search
- status filtering
- clear filter reset behavior

Exit criteria:
- filtered views are predictable
- reorder behavior under filters is either correct or intentionally disabled

## Phase 7: QA And Hardening

Deliverables:
- automated regression coverage for CRUD and reorder
- mobile verification
- accessibility pass on primary actions
- error and empty state cleanup

Exit criteria:
- `docs/qa/kanban-checklist.md` is satisfied for shipped MVP behavior

## Agent Workflow By Phase

- Phase 1: `fullstack-developer` or direct implementation
- Phase 2: `api-designer` first, then `fullstack-developer`
- Phase 3: `ui-designer` first, then `fullstack-developer`
- Phase 4: `api-designer` plus `ui-designer`, then `fullstack-developer`
- Phase 5: `backend-developer` if persistence is server-backed
- Phase 6: `fullstack-developer`
- Phase 7: `test-automator`, then `browser-debugger` for UI-only issues

## Scope Control Rules

- If a task does not strengthen task management or kanban clarity, defer it.
- If a feature adds a new domain concept, document it before implementing.
- If a feature makes completion slower or less obvious, reject or redesign it.
- If a feature depends on drag-and-drop without a fallback interaction, it is not MVP-complete.
