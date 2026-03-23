# Task: Decomposition Review And Acceptance

## Goal

Deliver safe decomposition review so a committed task can generate proposed executable child work and the user can accept only the useful parts into canonical subtasks.

## Why This Exists

Decomposition is a distinct product capability from expansion. It should start only after the expansion review and acceptance model is working well enough to reuse its patterns safely.

## Scope

- wire `Decompose with AI` for committed tasks through the backend route layer
- ensure decomposition suggestion sets are persisted and reviewable
- present ordered subtasks and next actions clearly in the review UI
- support partial accept and reject controls for decomposition output
- create canonical subtasks only from accepted decomposition items
- prevent repeated acceptance from duplicating committed child work
- keep board projection limited to top-level committed tasks while exposing subtasks in the appropriate detail surfaces
- add or update regression coverage and docs where behavior changes

## Non-Goals

- board rendering of subtasks as first-class cards
- new workflow columns
- autonomous task breakdown without review
- generic planning workspace outside the task-detail AI surface
- unrelated provider-layer cleanup

## Required Reading

- `AGENTS.md`
- `docs/product/mvp-scope.md`
- `docs/domain/todo-kanban-rules.md`
- `docs/domain/capture-expand-decompose-lifecycle.md`
- `docs/architecture/task-model-and-reorder-contracts.md`
- `docs/architecture/implementation-bridge.md`
- `docs/architecture/ai-api-and-structured-output-contracts.md`
- `docs/product/implementation-roadmap.md`
- `docs/product/ai-surface-and-user-flows.md`
- `docs/qa/kanban-checklist.md`
- `docs/qa/ai-evals-checklist.md`

## Likely Affected Areas

- `src/features/subtasks/model.ts`
- `src/features/subtasks/store.ts`
- `src/features/subtasks/api.ts`
- `src/features/ai/model.ts`
- `src/features/ai/store.ts`
- `src/components/TaskDetail.tsx`
- `src/components/TaskDecompositionPanel.tsx`
- `src/App.tsx`
- `shared/ai/contracts.ts`
- `server/routes/ai.ts`
- `server/acceptance/suggestions.ts`
- `server/llm/decompose.ts`
- `server/llm/validation.ts`

## Dependencies

- the capture and expansion acceptance model should already be stable enough to reuse
- if acceptance status or suggestion persistence is still changing, coordinate with the expansion slice before landing conflicting changes

## Constraints

- decomposition must stay distinct from expansion in UI, docs, and data contracts
- suggested subtasks are not canonical until explicitly accepted
- rejected suggestions must not pollute committed task or subtask data
- task execution status must remain independent from AI review status
- top-level board semantics must remain unchanged

## Deliverables

- decomposition request path through the existing backend API
- review UI for ordered subtasks, next actions, and relevant notes
- explicit partial acceptance workflow for decomposition output
- canonical subtask creation with parent linkage only for accepted items
- idempotent or duplicate-safe acceptance behavior
- regression tests for review status, partial acceptance, rejection, retry, and duplicate-prevention paths

## Acceptance Criteria

- a user can run `Decompose with AI` on a committed task
- the resulting decomposition output is reviewable before any subtask write occurs
- the user can accept only selected subtasks or next actions
- accepted items become canonical child work under the correct parent task
- rejected or failed decomposition output does not create subtasks
- repeated acceptance attempts do not duplicate committed subtasks
- committed subtasks do not appear as top-level board cards unless the product spec changes
- the slice satisfies the relevant checks in `docs/qa/kanban-checklist.md` and `docs/qa/ai-evals-checklist.md`

## Handoff Requirements

The completing agent must report:

- changed files
- acceptance and duplicate-prevention strategy
- docs updated
- tests run
- remaining risks for later execution-surface work

## Suggested Completion Check

Verify against:

- `docs/domain/capture-expand-decompose-lifecycle.md`
- `docs/architecture/task-model-and-reorder-contracts.md`
- `docs/qa/kanban-checklist.md`
- `docs/qa/ai-evals-checklist.md`
