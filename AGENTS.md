## Project Identity

This repository is an `AI-assisted task execution app`.

The product helps users:
- capture raw ideas quickly
- expand an idea with AI into clearer intent, scope, options, and constraints
- decompose a task with AI into smaller executable steps
- accept only the useful AI output
- execute accepted work through todo, list, focus, and kanban surfaces

Core product priority:
- fast capture of messy user intent
- useful AI-assisted expansion
- useful AI-assisted decomposition
- clear acceptance of AI suggestions before data changes
- efficient execution of committed work

Non-goal for MVP:
- building a generic AI chat app
- building a general-purpose Jira or Trello clone
- building autonomous agents that rewrite user data without review

## Required Reading Order

Agents working in this repository must read these documents before making material changes:

1. `AGENTS.md`
2. `docs/product/mvp-scope.md`
3. `docs/domain/todo-kanban-rules.md`
4. `docs/domain/capture-expand-decompose-lifecycle.md`
5. `docs/architecture/task-model-and-reorder-contracts.md`
6. `docs/architecture/implementation-bridge.md`
7. `docs/architecture/ai-api-and-structured-output-contracts.md`
8. `docs/product/implementation-roadmap.md`
9. `docs/product/ai-surface-and-user-flows.md`
10. `docs/qa/kanban-checklist.md`
11. `docs/qa/ai-evals-checklist.md` before closing an AI feature or fix

## Critical Terms

- `capture item`
  Raw unstructured user input that may later become a task.

- `task`
  A committed execution unit.

- `subtask`
  A child execution unit under a task.

- `expansion`
  AI develops an idea or rough task by adding clarity, scope, risks, options, assumptions, constraints, or missing questions.

- `decomposition`
  AI breaks a task into smaller executable phases, subtasks, or next actions.

- `AI suggestion set`
  Structured AI output that is reviewable and accept/rejectable, but not yet canonical data.

## Decision Rules

- Treat committed `task` data as the source of truth for execution.
- Treat `capture item` as intake state, not automatically as committed work.
- Treat `AI suggestion set` as suggestion-first output, never as source of truth until accepted.
- Keep execution status separate from AI processing state.
- Treat `board`, `list`, and `focus` as execution surfaces, not as the AI planning engine.
- Do not let kanban columns represent expansion or decomposition stages.
- Do not introduce enterprise workflow complexity unless it is explicitly added to product scope.
- Prefer simple, explainable acceptance flows over magical AI mutation.
- If UI behavior and domain rules conflict, domain rules win.

## When To Use Which Agent

- `code-mapper`: use before changing an existing code path, once the codebase exists.
- `api-designer`: use when defining capture, task, subtask, suggestion, acceptance, persistence, or AI API contracts.
- `ui-designer`: use when designing capture flows, inbox or triage views, AI review flows, task detail AI surfaces, mobile behavior, or execution views.
- `fullstack-developer`: use for a vertical feature that spans UI, state, and API.
- `backend-developer`: use for focused backend work after the affected paths are known, especially for the AI API or persistence boundary.
- `test-automator`: use after each completed AI feature or bug fix to add or refine regression coverage.
- `browser-debugger`: use when a bug reproduces only in the browser, especially focus, scrolling, overlay, selection, or AI review UI issues.
- `multi-agent-coordinator`: use only for large multi-step work with clear parallel slices.

## Implementation Priorities

Build in this order unless the user explicitly redirects:

1. docs and terminology reset
2. capture, task, subtask, and suggestion domain contracts
3. AI API and structured output contracts
4. capture and triage flow
5. expansion flow
6. decomposition flow
7. execution surfaces such as list, focus, and board
8. persistence and sync hardening
9. evals, failure handling, accessibility, and edge-case hardening

## Expectations For Changes

- New features must align with `docs/product/mvp-scope.md`.
- Domain changes must update `docs/domain/todo-kanban-rules.md` and `docs/domain/capture-expand-decompose-lifecycle.md` in the same task.
- AI API or output-shape changes must update `docs/architecture/ai-api-and-structured-output-contracts.md`.
- Behavior changes affecting validation, acceptance, or regressions must update `docs/qa/kanban-checklist.md` and `docs/qa/ai-evals-checklist.md` as appropriate.
- If a proposed feature expands scope, document whether it is MVP or post-MVP before implementing it.
- Do not ship AI-generated writes that bypass explicit user review unless the product spec explicitly allows that path.

## Review Standard

When reviewing or finishing work, prioritize:
- domain correctness
- AI output usefulness and safety
- acceptance and rollback semantics
- regression risk around committed task data
- empty, loading, and error states
- mobile usability
- keyboard and accessibility basics for capture, review, and execution actions
