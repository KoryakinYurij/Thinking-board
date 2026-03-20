# Implementation Roadmap

## Goal

Ship a small but correct `AI-assisted task execution app` that turns rough user intent into accepted executable work without overbuilding the board model.

## Phase 1: Documentation And Terminology Reset

Deliverables:
- rewritten repo identity and product docs
- locked terminology for capture, expansion, decomposition, task, subtask, and suggestion set
- aligned QA guidance

Exit criteria:
- a new contributor can read the docs and correctly describe the product
- no doc still frames board polish as the next main priority

## Phase 2: Domain And Contract Definition

Deliverables:
- capture item schema
- task and subtask schema
- suggestion set schema
- acceptance semantics
- board projection rules for committed tasks only

Exit criteria:
- expansion and decomposition are modeled distinctly
- execution status and AI processing state are clearly separated

## Phase 3: AI API Foundation

Deliverables:
- backend or BFF entry point for AI calls
- structured output contracts
- error and timeout handling
- persistence boundaries for prompts, outputs, and acceptance writes

Exit criteria:
- the frontend does not need model secrets
- AI output is machine-parseable and reviewable

## Phase 4: Capture And Triage

Deliverables:
- quick capture surface
- inbox or triage view
- capture item storage
- promotion path from capture item to task

Exit criteria:
- a user can store a rough idea without over-structuring it

## Phase 5: Expansion Flow

Deliverables:
- `Expand with AI`
- review UI for expansion output
- selective acceptance into task fields or notes

Exit criteria:
- AI can improve clarity without forcing decomposition yet

## Phase 6: Decomposition Flow

Deliverables:
- `Decompose with AI`
- generated subtasks or next actions
- partial accept and reject controls

Exit criteria:
- AI can produce useful executable steps
- the user can accept only the useful steps

## Phase 7: Execution Surfaces

Deliverables:
- list or focus view
- board projection for committed top-level tasks
- task detail with parent-child visibility
- completion, archive, and restore flows aligned to the new model

Exit criteria:
- accepted work is easy to execute
- the board reads as an execution surface, not the planning brain

## Phase 8: QA, Evals, And Hardening

Deliverables:
- automated regression coverage for capture, acceptance, and execution flows
- mobile verification
- accessibility pass on primary actions
- AI eval checklist coverage
- error, empty state, and failure cleanup

Exit criteria:
- `docs/qa/kanban-checklist.md` and `docs/qa/ai-evals-checklist.md` are satisfied for shipped behavior

## Agent Workflow By Phase

- Phase 1: `api-designer` plus direct documentation work
- Phase 2: `api-designer` first, then `fullstack-developer`
- Phase 3: `backend-developer` plus `api-designer`
- Phase 4: `ui-designer` first, then `fullstack-developer`
- Phase 5: `ui-designer` plus `fullstack-developer`
- Phase 6: `api-designer` plus `ui-designer`, then `fullstack-developer`
- Phase 7: `fullstack-developer`
- Phase 8: `test-automator`, then `browser-debugger` for UI-only issues

## Scope Control Rules

- If a task does not strengthen capture, expansion, decomposition, acceptance, or execution clarity, defer it.
- If a feature adds a new domain concept, document it before implementing.
- If a feature makes human review weaker or less explicit, reject or redesign it.
- If a feature makes completion slower or less obvious, reject or redesign it.
- If a feature turns the board into the planning engine, it is out of scope for MVP.
