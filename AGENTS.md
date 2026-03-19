## Project Identity

This repository is a `To Do app first` and a `Kanban app second`.

Core product priority:
- fast task capture
- fast task editing
- fast task completion
- clear task status
- kanban as an organization and review surface

Non-goal for MVP:
- building a general-purpose Jira or Trello clone

## Required Reading Order

Agents working in this repository must read these documents before making material changes:

1. `AGENTS.md`
2. `docs/product/mvp-scope.md`
3. `docs/domain/todo-kanban-rules.md`
4. `docs/architecture/task-model-and-reorder-contracts.md`
5. `docs/product/implementation-roadmap.md`
6. `docs/qa/kanban-checklist.md` before closing a feature or fix

## Decision Rules

- Treat `task` as the primary domain entity.
- Treat `board`, `column`, and kanban layout as task organization mechanisms.
- Do not introduce enterprise workflow complexity unless it is explicitly added to the product scope.
- Prefer simple, explainable state transitions over flexible but ambiguous modeling.
- A drag-and-drop action must have a clear domain meaning, not only a visual effect.
- If UI behavior and domain rules conflict, domain rules win.

## When To Use Which Agent

- `code-mapper`: use before changing an existing code path, once the codebase exists.
- `api-designer`: use when defining task, column, reorder, filter, persistence, or sync contracts.
- `ui-designer`: use when designing board layout, task cards, task edit flows, mobile behavior, or drag-and-drop UX.
- `fullstack-developer`: use for a vertical feature that spans UI, state, and API.
- `backend-developer`: use for focused backend work after the affected paths are known.
- `test-automator`: use after each completed feature or bug fix to add or refine regression coverage.
- `browser-debugger`: use when a bug reproduces only in the browser, especially drag-drop, scroll, overlay, hydration, or local state issues.
- `multi-agent-coordinator`: use only for large multi-step work with clear parallel slices.

## Implementation Priorities

Build in this order unless the user explicitly redirects:

1. task model and lifecycle
2. task create, edit, complete flows
3. kanban columns and task grouping
4. drag-and-drop reorder and move semantics
5. persistence
6. filters and search
7. mobile polish and accessibility
8. broader automation and edge-case hardening

## Expectations For Changes

- New features must align with `docs/product/mvp-scope.md`.
- Domain changes must update `docs/domain/todo-kanban-rules.md` in the same task.
- Behavior changes affecting validation or regressions must update `docs/qa/kanban-checklist.md`.
- If a proposed feature expands scope, document whether it is MVP or post-MVP before implementing it.

## Review Standard

When reviewing or finishing work, prioritize:
- domain correctness
- regression risk around reorder and completion state
- empty, loading, and error states
- mobile usability
- keyboard and accessibility basics for task actions
