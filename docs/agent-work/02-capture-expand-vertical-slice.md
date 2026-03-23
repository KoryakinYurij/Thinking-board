# Task: Capture To Expand Vertical Slice

## Goal

Deliver the first end-to-end AI value slice:

`capture item -> expand with AI -> review -> accept selected fields -> commit to task`

This is the highest-priority product slice after foundation hardening.

## Why This Exists

The repo docs identify this as the first vertical slice because it proves the product's core value without forcing subtask complexity too early.

## Scope

- ensure capture items can be created, stored, reviewed, and promoted through the intended flow
- wire `Expand with AI` for a capture item and committed task where the existing architecture supports it
- show pending, success, and failure review states for expansion suggestion sets
- support selective acceptance of expansion fields instead of all-or-nothing mutation
- commit accepted fields into canonical task data through an explicit acceptance write
- preserve auditable suggestion-set state after acceptance or rejection
- add or update regression coverage for the slice
- update docs if behavior or contract changes require it

## Non-Goals

- decomposition subtasks
- autonomous AI writes
- broad execution-surface redesign
- provider migration cleanup
- board-first planning features

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

- `src/features/capture/model.ts`
- `src/features/capture/store.ts`
- `src/features/capture/storage.ts`
- `src/features/ai/model.ts`
- `src/features/ai/store.ts`
- `src/lib/api/ai.ts`
- `src/components/TaskComposer.tsx`
- `src/components/CaptureInbox.tsx`
- `src/components/CaptureDetail.tsx`
- `src/components/CaptureExpansionPanel.tsx`
- `src/components/TaskDetail.tsx`
- `src/components/TaskExpansionPanel.tsx`
- `src/App.tsx`
- `shared/ai/contracts.ts`
- `server/routes/ai.ts`
- `server/acceptance/suggestions.ts`
- `server/llm/expand.ts`
- `server/llm/validation.ts`

## Constraints

- `AI suggestion set` is suggestion-first output, not source of truth
- acceptance must remain explicit and may be partial
- unaccepted AI output must not render as committed work
- the frontend must not call provider SDKs directly
- execution status must stay separate from AI review state
- avoid broad refactors outside the slice

## Deliverables

- working capture-to-review flow for rough intent
- expansion request path through the existing backend API layer
- review UI that makes AI-generated content distinguishable from committed task data
- selective acceptance controls for supported expansion fields
- deterministic task creation or update from accepted expansion output
- persisted suggestion-set review state that survives reload
- tests covering request, review, acceptance, rejection, and failure cases

## Acceptance Criteria

- a user can create a capture item without creating a committed task immediately
- a user can run `Expand with AI` from the intended capture or task detail surface
- the resulting expansion output is reviewable before any canonical task write happens
- the user can accept only selected fields from the expansion output
- rejected or failed expansion output does not mutate committed task data
- accepted results survive reload and remain distinguishable from pending or rejected output
- the slice satisfies the relevant checks in `docs/qa/kanban-checklist.md` and `docs/qa/ai-evals-checklist.md`

## Handoff Requirements

The completing agent must report:

- changed files
- user-visible flow now supported
- acceptance payload decisions
- docs updated
- tests run
- open risks before decomposition work begins

## Suggested Completion Check

Verify against:

- `docs/architecture/ai-api-and-structured-output-contracts.md`
- `docs/qa/kanban-checklist.md`
- `docs/qa/ai-evals-checklist.md`

