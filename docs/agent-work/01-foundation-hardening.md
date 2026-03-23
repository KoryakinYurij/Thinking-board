# Task: Foundation Hardening

## Goal

Stabilize the current app foundation so later AI workflow work does not inherit broken persistence, invalid task writes, or fragile keyboard behavior.

## Why This Exists

The current bridge docs explicitly call out foundation issues that should be fixed before treating the local-first execution layer as stable:

- empty persisted state fallback
- localStorage write failure handling
- blank title on edit
- keyboard selection basics

This brief is the lowest-risk parallel workstream and should generally land first.

## Scope

- fix persisted empty-state behavior so an intentionally empty store does not re-seed tasks
- harden local storage write and read failure handling for task, capture, AI suggestion, and subtask local stores where applicable
- block invalid blank-title task edits
- improve keyboard basics for selection and primary execution interactions already present in the UI
- add or update regression tests for the changed behavior
- update QA docs only if new risk areas are introduced

## Non-Goals

- new AI flows
- provider or prompt changes
- new execution statuses
- kanban redesign
- broad visual polish unrelated to correctness or accessibility

## Required Reading

- `AGENTS.md`
- `docs/product/mvp-scope.md`
- `docs/domain/todo-kanban-rules.md`
- `docs/domain/capture-expand-decompose-lifecycle.md`
- `docs/architecture/task-model-and-reorder-contracts.md`
- `docs/architecture/implementation-bridge.md`
- `docs/product/implementation-roadmap.md`
- `docs/qa/kanban-checklist.md`

## Likely Affected Areas

- `src/features/tasks/storage.ts`
- `src/features/tasks/storage.test.ts`
- `src/features/capture/storage.ts`
- `src/features/capture/store.ts`
- `src/features/ai/storage.ts`
- `src/features/ai/store.ts`
- `src/features/subtasks/store.ts`
- `src/components/TaskDetail.tsx`
- `src/components/TaskComposer.tsx`
- `src/components/CaptureInbox.tsx`
- `src/App.tsx`

## Constraints

- do not weaken the distinction between `capture item`, `task`, `subtask`, and `AI suggestion set`
- do not auto-commit AI output as part of storage error handling changes
- do not encode AI review state into task status fields
- preserve board behavior as a projection of committed top-level tasks
- keep fixes narrow and deterministic

## Deliverables

- deterministic local persistence with no empty-array reseed bug
- visible or recoverable storage failure behavior instead of silent corruption
- task-edit validation that rejects blank committed task titles
- improved keyboard handling for selection and primary non-drag task actions
- regression tests covering failure and edge cases introduced by the fixes

## Acceptance Criteria

- an intentionally empty persisted task state remains empty after reload
- storage failures do not silently leave impossible or misleading UI state behind
- a user cannot save a committed task with a blank title through the normal edit flow
- keyboard users can reach and trigger core selection or execution actions without hover-only affordances
- changed behavior is covered by automated tests where practical

## Handoff Requirements

The completing agent must report:

- changed files
- behavior fixed
- assumptions made
- remaining risks or follow-ups
- tests run

## Suggested Completion Check

Verify against:

- `docs/qa/kanban-checklist.md`
- affected store or component tests

