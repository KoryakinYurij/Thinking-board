# Handover

## Status At Handover

This repository already contains a working local-only React MVP, but the old product framing is now outdated.

The previous north star was:
- `To Do app first`
- `Kanban app second`
- polish the board next

That is no longer the correct next direction.

The product should now be treated as an `AI-assisted task execution app` where:
- users capture raw ideas quickly
- AI can expand an idea into clearer intent and scope
- AI can decompose a task into smaller executable steps
- accepted work is executed through task, list, focus, and kanban surfaces
- kanban remains useful, but only as an execution and review surface

## Critical Terminology

These terms must stay distinct so future agents do not blur the domain:

- `capture item`
  Raw unstructured input from the user. This may be a note, idea, or rough task seed.

- `task`
  A committed execution unit. Tasks are what users actually do and what should appear in list or board views.

- `subtask`
  A child execution unit under a task. Subtasks may be created manually or accepted from AI suggestions.

- `expansion`
  AI develops an idea or rough task by adding clarity, scope, outcome, options, risks, assumptions, missing questions, or constraints.

- `decomposition`
  AI breaks a task into smaller phases, subtasks, or next actions that are more directly executable.

- `AI suggestion set`
  Structured AI output that is not yet the source of truth. It must remain reviewable and accept/rejectable.

- `board`
  A projection of committed tasks. The board is not where AI thinking happens and must not become a planning engine by itself.

## Product Direction

The correct product identity going forward is:

`AI-assisted task execution app with todo/list/focus/kanban execution surfaces`

This means:
- the app is no longer only a local task board
- the AI layer is now part of core product value, not a future extra
- kanban should stay secondary to execution clarity
- AI should help turn messy intent into structured work

Non-goals for the next stage:
- generic AI chat app
- Jira clone
- Trello clone
- board-first workflow engine
- autonomous AI that mutates user data without review
- arbitrary status systems driven by AI output

## Current Implementation Snapshot

The existing codebase is still useful as a scaffold.

What is worth keeping:
- React + TypeScript + Vite app shell
- task-first UI layout pattern
- detail pane concept
- basic task create, edit, archive, and status flows
- board projection from task status
- filters and archive view
- responsive structure
- pure domain tests in `src/features/tasks/*`

What should now be treated as temporary:
- local-only persistence via `localStorage` for core task data
- incomplete capture or triage stage before a task is committed
- incomplete persistence story for suggestion sets and acceptance state
- deprecated provider-specific files under `server/openai/*`
- next priority set to board polish

What already exists now:
- backend or API layer under `server/`
- typed AI routes under `/api/ai/*`
- shared AI contracts under `shared/ai/contracts.ts`
- provider-agnostic `server/llm/*` integration layer
- server-side structured-output validation

## Existing Issues To Carry Forward

These are known implementation problems and should not be forgotten during the pivot:

- persisted empty state is not reliable because empty arrays currently fall back to seed data
- storage writes do not have clear failure handling
- edit flow can currently allow invalid blank titles
- keyboard selection and card accessibility still need work

These do not block documentation work, but they should be fixed before treating the current UI as a stable foundation.

## Immediate Correction

Do not continue with `kanban interaction polish` as the next product priority.

The documentation pivot is now mostly complete.

The next priority is:

`implementation bridge plus the first vertical AI slice`

That means:
- use `docs/architecture/implementation-bridge.md`
- keep the current task and board logic as the execution foundation
- build `capture item -> expand with AI -> review -> accept selected fields -> commit to task`

## Follow-Up Task To Carry Forward

A future cleanup task is now explicitly deferred to handover:

`Simplify the current multi-provider LLM layer to OpenRouter-only, remove OpenAI fallback/config paths, update docs and env handling accordingly, and keep the same structured-output safety guarantees.`

This is a follow-up task, not the current documentation-alignment task.

## New Core User Flow

This is the intended top-level flow to design around:

1. capture a raw idea quickly
2. optionally keep it in inbox or triage state
3. run `Expand with AI`
4. review the expanded output
5. run `Decompose with AI`
6. accept all or part of the generated subtasks and next actions
7. execute accepted tasks through list, focus, or board views
8. complete, archive, or restore work as usual

Important interpretation:
- expansion improves thinking
- decomposition improves executability
- board improves visibility of committed work

These are different layers and must not collapse into one.

## Rules To Prevent AI Confusion

Future agents should follow these rules once the docs are updated:

- never use `expansion` and `decomposition` as synonyms
- never let kanban columns represent AI planning stages
- never let AI output create hidden workflow meaning in board columns
- never write AI output directly into canonical task data without a review or accept step
- never assume a raw idea is already a committed task
- never assume a generated subtask is accepted unless the product flow says so
- keep execution status separate from AI processing state
- keep board reorder semantics limited to committed tasks only
- failed AI calls must not leave partial task mutations behind

## Docs Now In Place

These documents have now been rewritten or added and should be treated as the active implementation guide:

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
- `README.md`

Use them as the current source of truth. Do not restart the documentation pivot unless the product direction changes again.

## Detailed Delivery Plan

### Phase 0: Documentation Reset

Goal:
- remove conflicting product guidance before more code is written

Deliverables:
- rewritten `AGENTS.md`
- rewritten scope, domain, architecture, roadmap, and QA docs
- updated `README.md`
- new AI-specific docs added

Exit criteria:
- a new agent can enter the repo and correctly describe the product without being told verbally
- no doc still claims board polish is the next main priority
- implementation can now proceed from the bridge docs instead of verbal clarification

### Phase 1: Domain Pivot

Goal:
- model raw ideas, committed tasks, subtasks, and AI suggestion sets clearly

Deliverables:
- agreed entity shapes
- accepted field names
- lifecycle rules
- accept or reject semantics for AI output

Exit criteria:
- expansion and decomposition can be described without ambiguity
- board semantics remain stable for committed tasks

### Phase 2: AI API Foundation

Goal:
- create a safe technical path for built-in AI

Deliverables:
- backend or BFF
- API routes for expansion and decomposition
- structured output schemas
- persistence rules for prompts, outputs, and acceptance actions
- error states and timeout handling

Exit criteria:
- the frontend does not need model secrets
- AI responses are machine-parseable and reviewable

### Phase 3: Capture And Triage MVP

Goal:
- support messy user input before it becomes structured execution work

Deliverables:
- quick capture surface
- inbox or triage view
- ability to promote a capture item into a task or run AI on it

Exit criteria:
- a user can save a rough idea without deciding every detail up front

### Phase 4: Expansion MVP

Goal:
- help the user think better before execution

Deliverables:
- `Expand with AI` action
- structured output for outcome, risks, assumptions, options, constraints, and clarifying questions
- review UI
- accept selected results into task fields or notes

Exit criteria:
- AI expansion improves clarity without forcing decomposition yet

### Phase 5: Decomposition MVP

Goal:
- turn a task into executable work

Deliverables:
- `Decompose with AI` action
- generated subtasks or next actions
- partial accept and reject controls
- commit accepted items into canonical task data

Exit criteria:
- a user can accept only the useful steps
- rejected suggestions do not pollute the task model

### Phase 6: Execution Surfaces

Goal:
- make accepted work easy to do

Deliverables:
- list or focus view for actionable work
- board view for status review
- task detail with parent-child visibility
- completion, archive, and restore flows aligned to the new model

Exit criteria:
- the execution surfaces feel secondary to planning quality, but still efficient

### Phase 7: Quality, Evals, And Hardening

Goal:
- make the AI features trustworthy

Deliverables:
- AI regression tests
- eval checklist
- failure handling
- keyboard and mobile coverage
- analytics or logging if added later

Exit criteria:
- AI outputs are consistently useful enough to trust as a feature, not a demo

## Recommended Near-Term Work Order

Unless the user explicitly redirects, follow this order:

1. use the implementation bridge
2. fix the current foundation issues
3. define the code-level domain model
4. build the backend AI API slice
5. build capture and triage
6. build expansion flow
7. build decomposition flow
8. adapt execution views
9. harden and evaluate

Do not spend more time polishing drag-and-drop until the AI-critical flows exist.

## Recommended Agent Usage

For the next stage:

- `api-designer`
  Use before changing domain or AI API contracts.

- `ui-designer`
  Use before designing capture, review, acceptance, and detail-view AI flows.

- `fullstack-developer`
  Use once contracts and flows are clear.

- `backend-developer`
  Use for the AI API layer and persistence boundary.

- `test-automator`
  Use after each shipped AI feature to lock regression coverage.

- `browser-debugger`
  Use only for real browser issues after the AI surfaces exist.

## Suggested Next Instruction

If another chat picks this up directly, the best next instruction is:

`Continue the AI-assisted task execution app implementation from the current server-backed baseline: keep `/api/ai/*` on the backend, preserve strict structured output and server-side validation, and implement the next vertical slice without weakening explicit review and acceptance.`
