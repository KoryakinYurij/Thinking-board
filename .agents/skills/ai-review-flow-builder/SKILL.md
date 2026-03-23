---
name: ai-review-flow-builder
description: Design and review AI review surfaces, acceptance controls, rejection flows, loading and failure states, and implementation handoff for expansion and decomposition in this AI-assisted task execution app. Use when changing capture review flows, task detail AI workspace behavior, partial acceptance controls, pending or failed suggestion presentation, or the UI composition of expand or decompose actions. Do not use for AI contract design, accepted field enums, canonical write payload design, prompt-only changes, or purely visual styling without review-flow impact.
---

# AI Review Flow Builder

## Overview

Use this skill to make AI review flows clear, selective, and safe. Keep review UI understandable, keep pending suggestion sets visibly non-canonical, and make acceptance targets obvious before any committed data changes.

## Scope Gate

Use this skill when the task changes:
- capture-item review flow
- task-detail AI workspace flow
- expansion or decomposition review panels
- partial acceptance controls
- reject, failed, retry, or empty review states
- review-surface layout or copy that affects how users understand AI output versus committed data
- component composition of AI review surfaces across capture, task, and decomposition paths

Do not use this skill as the primary guide when the task is:
- accepted field enums or acceptance DTOs
- server validation or canonical write payload design
- prompt tuning with unchanged review behavior
- purely decorative styling without review-flow impact
- backend route implementation with unchanged UI semantics

Use `ai-acceptance-designer` instead when the main risk is acceptance semantics or write payloads.

## AGENTS Sync

Keep this skill aligned with `AGENTS.md`:
- treat `task detail` as the central AI workspace
- treat `board`, `list`, and `focus` as execution surfaces, not the AI planning engine
- prefer simple, explainable acceptance flows over magical mutation
- prioritize mobile, keyboard, empty, loading, and error states for review actions
- if UI behavior conflicts with domain rules, domain rules win
- before material work, read the required docs in repo order, not a reduced subset

## Read This Context First

Read these repo documents before changing behavior, in this order:
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

Inspect these implementation paths before editing:
- `shared/ai/contracts.ts`
- `src/components/CaptureDetail.tsx`
- `src/components/CaptureExpansionPanel.tsx`
- `src/components/TaskDetail.tsx`
- `src/components/TaskExpansionPanel.tsx`
- `src/components/TaskDecompositionPanel.tsx`
- `src/App.tsx`
- `src/lib/api/ai.ts`
- `src/features/ai/format.ts`
- `src/features/ai/model.ts`
- `src/features/ai/store.ts`
- `src/features/subtasks/api.ts`
- `src/features/subtasks/model.ts`
- `src/features/subtasks/store.ts`

## Shell-First Pass

Start with repo inspection before proposing changes.

Useful commands:
```powershell
rg -n "Expand with AI|Decompose with AI|Reject latest|accepted|partially_accepted|rejected|failed" src docs
rg -n "suggestionSet|acceptedFields|onAccept|onReject|isLoading|error|aiActionError" src/components src/App.tsx src/features
rg -n "CaptureExpansionPanel|TaskExpansionPanel|TaskDecompositionPanel|TaskDetail|CaptureDetail" src
rg -n "subtask|next_actions_notes|description_notes|normalized_title" src shared docs
```

Use the search results to identify:
- where each review surface starts and ends
- which component owns the action controls
- which acceptance targets each panel exposes
- where generation failures are rendered
- where accept or reject failures are rendered
- which docs and tests must move with the UI change

## Product Model To Preserve

Keep these meanings precise:
- `capture item` is intake state
- `task` is committed execution work
- `subtask` is a child execution unit under a task, not display-only metadata
- `AI suggestion set` is reviewable output, not canonical data

Subtask handling in review flows must stay explicit:
- decomposition may create canonical subtasks only after acceptance
- accepted subtasks belong under the parent task
- accepted subtasks do not become top-level board cards in MVP
- next actions may be appended to parent task notes, but that is separate from subtask creation

## Acceptance Targets

Design review UI around the real acceptance targets, not generic "apply AI" actions.

### Capture Expansion

Source surface:
- `CaptureDetail`
- `CaptureExpansionPanel`

Current implementation path:
- acceptance in `CaptureExpansionPanel` selects `normalized_title` and/or `description_notes`
- `App.tsx` currently accepts the suggestion and creates the committed task in the same flow
- the linked `capture item` is archived as part of that successful acceptance path

UI obligation:
- make it clear that acceptance here results in committed task creation, not only an ephemeral reviewed draft
- if redesigning this flow toward an explicit pre-commit review draft, state that as an intentional behavior change and update docs accordingly

### Task Expansion

Source surface:
- `TaskDetail`
- `TaskExpansionPanel`

Acceptance targets:
- `normalized_title` into `task.title`
- `description_notes` into `task.description` through the appended AI expansion block

Do not imply that task expansion changes status, position, or board column.

### Task Decomposition

Source surface:
- `TaskDetail`
- `TaskDecompositionPanel`

Acceptance targets:
- `subtasks` into canonical child tasks under the selected parent task
- `next_actions_notes` into the parent task description through the appended AI decomposition block

Do not imply that decomposition creates top-level board tasks or a new workflow stage.

## Failure Model

Treat these as separate UI problems:

### Generation failure

Meaning:
- `Expand with AI` or `Decompose with AI` failed before a reviewable suggestion set became usable

Typical ownership:
- panel-local loading and error state
- failed suggestion-set rendering in the relevant review panel

### Acceptance or reject failure

Meaning:
- the suggestion existed, but accept or reject failed during the mutation step

Typical ownership:
- orchestration-level error handling such as `App.tsx`
- visible feedback that preserves the reviewed suggestion and user context

Do not collapse these into one generic error state unless the user experience remains equally clear.

## Error Taxonomy And Recovery Matrix

Classify failures before designing the UI:
- `config_error`: missing API key or disabled backend; show actionable setup copy and keep source context intact
- `validation_error`: client or server rejected the payload; do not suggest retry until the invalid input changes
- `provider_or_model_error`: model call failed or timed out; allow retry from the same review surface when safe
- `schema_or_parse_error`: the model response was unusable for the current contract; do not render partially trusted suggestions as reviewable output
- `accept_mutation_error`: accept failed after a reviewable suggestion existed; keep the suggestion visible and preserve selected fields when practical
- `reject_mutation_error`: reject failed; keep the suggestion reviewable and do not pretend it was discarded
- `persistence_error`: state could not be saved after a client or server action; explain whether the visible state is persisted or only local

For each class, define:
- where it originates
- where it is rendered
- whether retry is allowed
- what user context must be preserved
- what must remain visibly non-canonical

## Workflow

### 1. Identify the review surface

Write down:
- source entity: `capture_item` or `task`
- suggestion kind: `expansion` or `decomposition`
- exact panel or detail surface involved
- user decisions available: run, accept some, reject, retry, close, return to execution
- acceptance targets exposed by the UI
- whether acceptance currently commits canonical data immediately or only prepares a draft

### 2. Preserve review semantics

Enforce these rules:
- pending suggestion sets must look non-canonical
- accepted and partially accepted states must remain understandable after reload
- reject must discard the suggestion from execution semantics but keep traceability
- failed AI calls must keep user context and provide a clear retry path
- review UI must not make the board feel like the AI planning surface

### 3. Design the flow states

Cover these states explicitly:
- empty before generation
- loading while request is in flight
- failed generation
- pending review
- accepted
- partially accepted
- rejected
- failed acceptance or reject mutation when applicable

For each state, define:
- what the user sees
- what actions are available
- what is disabled
- what still looks editable versus committed

### 4. Map the implementation ownership

Use these ownership boundaries:
- `CaptureExpansionPanel` and `TaskExpansionPanel` own expansion review controls
- `TaskDecompositionPanel` owns decomposition review controls
- `CaptureDetail` and `TaskDetail` compose the surrounding surface
- `App.tsx` orchestrates accept or reject state transitions and shared mutation outcomes
- `src/lib/api/ai.ts` owns typed client calls
- `src/features/ai/*` and `src/features/subtasks/*` own suggestion and accepted-child data helpers

Search for shared review primitives before adding more duplicated panel logic. In particular, compare:
- expansion panel state handling
- accepted or rejected status rendering
- failure banner patterns
- checkbox-based partial-accept controls

Do not collapse all review behavior into `App.tsx` if a panel can own the local interaction state.
Do not preserve duplication by default when two panels share the same review behavior.
Do not push provider-specific behavior into review components.

### 5. Update docs and regression surface

When the change affects:
- review flow meaning: update `docs/product/ai-surface-and-user-flows.md`
- acceptance visibility or confusion risk: update `docs/qa/ai-evals-checklist.md`
- execution-facing behavior or mobile and keyboard review actions: update `docs/qa/kanban-checklist.md`
- domain expectations: update domain docs if the UI meaning changes lifecycle interpretation
- canonical write timing: update docs if capture acceptance or task mutation timing changes

Add or adjust tests for:
- empty, loading, failed, pending, accepted, partially accepted, and rejected states
- generation failure versus acceptance failure behavior
- recovery behavior for `config_error`, `validation_error`, `provider_or_model_error`, `schema_or_parse_error`, and `persistence_error` when the UX distinguishes them
- retry without losing selected review context when practical
- partial acceptance controls
- non-hover mobile behavior
- keyboard reachability of review actions
- visible distinction between pending suggestion sets and committed task data

Escalate to another skill when needed:
- use `ai-acceptance-designer` when the main change is in acceptance semantics or write payloads
- use `task-domain-guard` when the main change is lifecycle or board semantics
- use `ui-designer` when the task is broader interaction design beyond AI review surfaces
- use `test-automator` when the main gap is regression coverage
- use `browser-debugger` for browser-only focus, scrolling, overlay, or interaction bugs

## Output Expectations

When using this skill, produce these sections in order:
1. `Surface`
2. `State Matrix`
3. `Error Taxonomy And Recovery Matrix`
4. `Acceptance Targets`
5. `Implementation Path`
6. `User Risks`
7. `Docs To Update`
8. `Regression Coverage`
9. `Open Questions`

Fill every section. If a section has no changes, say `none`.

For `State Matrix`, include at least:
- empty
- loading
- failed generation
- pending
- accepted or partially accepted or rejected as applicable
- failed acceptance or reject mutation when applicable

For `Error Taxonomy And Recovery Matrix`, classify at least:
- `config_error`
- `validation_error`
- `provider_or_model_error`
- `schema_or_parse_error`
- `accept_mutation_error`
- `reject_mutation_error` when applicable
- `persistence_error` when applicable

For `Acceptance Targets`, specify exact targets such as:
- committed task creation from capture acceptance
- task title
- task description through explicit appended AI review text
- parent task notes
- canonical subtasks under parent task

For `Implementation Path`, say explicitly whether the current code path is preserved or intentionally redesigned.

## Quick Review Checklist

Check these questions before closing the work:
- Can the user tell what came from AI and what is committed?
- Are partial acceptance choices explicit and scoped to real acceptance targets?
- Does the capture flow clearly communicate whether acceptance creates a committed task immediately?
- Does a failed AI call preserve context and offer a clear next action?
- Are config, validation, provider or model, schema or parse, and persistence failures distinguished when the UX needs that distinction?
- Are generation failure and acceptance failure handled distinctly when the UX needs that distinction?
- Do accepted subtasks remain child work rather than top-level board cards?
- Does the surface still work on mobile without hover-only affordances?
- Are review controls reachable by keyboard?
- Does the implementation path stay aligned with current component ownership instead of dumping more orchestration into `App.tsx`?

## Avoid

Avoid these patterns:
- generic "Apply AI" buttons without named acceptance targets
- making pending review output look like committed task content
- hiding failed state behind silent resets
- treating subtasks as decorative bullets instead of child execution work
- routing review behavior through the board surface
- overloading `App.tsx` with panel-specific interaction logic
- mixing provider-specific fetch details into UI components
- describing a desired future flow as if it were already the current implementation


