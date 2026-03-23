---
name: ai-acceptance-designer
description: Design and review AI suggestion contracts, accept or reject flows, partial acceptance semantics, persistence rules, failure classification, and acceptance-safe write payloads for this AI-assisted task execution app. Use when changing expansion or decomposition schemas, suggestion set status transitions, accepted field enums, acceptance DTOs, server validation, stable error classes, retry or idempotency behavior, or canonical write mapping from AI suggestions into tasks or subtasks. Do not use for prompt-only changes, purely visual review UI polish, or routine API wiring that does not change acceptance semantics.
---

# AI Acceptance Designer

## Overview

Use this skill to keep AI features suggestion-first. Define the contract first, keep acceptance explicit, and make server-produced write payloads deterministic, auditable, and safe to retry.

## Scope Gate

Use this skill when the task changes:
- request or response schemas
- accepted field enums
- review status transitions
- server-side validation
- acceptance write payloads
- idempotency, retry, or duplicate-accept behavior
- persistence of suggestion review state

Do not use this skill as the primary guide when the task is:
- prompt tuning without contract changes
- purely visual review-panel polish
- ordinary component refactoring with unchanged semantics
- ordinary route wiring with unchanged DTOs

## Read This Context First

Read these repo documents in repo-required order before material behavior changes:
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
- `docs/qa/ai-evals-checklist.md` before closing an AI feature or fix

Inspect these implementation paths before editing:
- `shared/ai/contracts.ts`
- `server/routes/ai.ts`
- `server/acceptance/suggestions.ts`
- `server/openai/schemas.ts`
- `src/lib/api/ai.ts`
- `src/features/ai/*`
- `src/features/subtasks/*`
- `src/App.tsx` when orchestration changes

## Shell-First Pass

Start with repo inspection before proposing contract changes.

Useful commands:
```powershell
rg -n "accept|reject|acceptedFields|suggestionSetId|reviewStatus" shared src server docs
rg -n "pending|accepted|partially_accepted|rejected|failed" shared src server docs
rg -n "capture_item|task|expansion|decomposition" shared src server docs
git diff --stat
```

Use the search results to identify:
- DTO definitions
- route validation boundaries
- acceptance write builders
- persisted review-state updates
- tests and docs that must move with the code

## Workflow

### 1. Classify the change

Write down:
- source entity: `capture_item` or `task`
- suggestion kind: `expansion` or `decomposition`
- review actions: `accept`, `partial accept`, `reject`, `failed`
- canonical writes: task patch, task draft, subtask drafts, appended notes
- idempotency risk: repeated accept, retry after timeout, stale suggestion set
- persistence impact: status, accepted fields, applied timestamp, contract version

### 2. Lock invariants before implementation

Enforce these rules:
- Keep `AI suggestion set` non-canonical until explicit acceptance.
- Keep execution status separate from AI review state.
- Let the server decide the final write payloads.
- Support partial acceptance as a first-class case.
- Make retries and repeated accepts idempotent or explicitly rejected.
- Keep rejected and failed suggestions reviewable and traceable.
- Keep board semantics limited to committed top-level tasks.
- Keep pending AI output visually distinct from committed task data.

### 3. Design the contract

Define or review:
- request DTO
- response DTO
- review status transitions
- accepted field enums
- source entity identifiers
- validation behavior for invalid or mixed payloads
- error class and retry-safety shape exposed to the client
- acceptance output shape that the client can apply deterministically

Prefer:
- strict schema validation
- versioned schemas
- narrow enums over free-form strings
- separate draft and patch payloads when `capture_item` acceptance creates a new task

If the task is ambiguous, answer this decision tree first:
- Does acceptance create a new committed task?
  Then return a task draft, not a task patch.
- Does acceptance mutate an existing task?
  Then return a task patch scoped only to selected fields.
- Does acceptance create child execution work?
  Then return subtask drafts and define duplicate-prevention rules.
- Does the task only change presentation?
  Stop and use a UI-oriented skill instead.

### 4. Map the write path

For each accepted field, answer:
- what canonical field changes
- where the write payload is built
- what stays untouched
- how rollback works on failure
- how repeated acceptance avoids duplication

### 5. Update docs and regression surface

When the change affects:
- domain semantics: update `docs/domain/todo-kanban-rules.md` and `docs/domain/capture-expand-decompose-lifecycle.md`
- AI API or output shape: update `docs/architecture/ai-api-and-structured-output-contracts.md`
- validation, acceptance, or regressions: update `docs/qa/kanban-checklist.md` and `docs/qa/ai-evals-checklist.md`
- implementation behavior: add or adjust tests for contract parsing, route validation, and acceptance logic

Escalate to another skill when needed:
- use `ui-designer` when the meaning stays the same but review UX or affordances change
- use `test-automator` when the main gap is missing regression coverage
- use `backend-developer` when the contract is settled and the remaining work is route or persistence implementation

## Acceptance Rules

### Expansion

Use expansion to improve clarity, not to invent workflow stages.

Allow acceptance into:
- task title
- task description through explicit accepted fields such as `description_notes`
- task draft when the source entity is `capture_item`

Do not:
- auto-create committed work without review
- change task status as a side effect of expansion
- let expansion output appear as a committed board card before acceptance

### Decomposition

Use decomposition to propose executable child work.

Allow acceptance into:
- subtask drafts
- next-action notes on the parent task

Do not:
- create top-level board tasks from decomposition by default
- duplicate equivalent subtasks on repeated acceptance
- mix decomposition lifecycle with task execution lifecycle

## Failure Classes And Mutation Guarantees

Classify failure handling explicitly when contracts or routes change:
- `config_or_preflight_error`: backend or provider configuration missing before generation starts
- `request_validation_error`: app payload rejected before provider call or before accept or reject mutation
- `provider_or_model_error`: provider timeout, refusal, or model failure during generation
- `schema_or_parse_error`: structured output cannot be trusted or parsed for the current contract version
- `accept_mutation_error`: accept write failed after a reviewable suggestion existed
- `reject_mutation_error`: reject write failed after a reviewable suggestion existed
- `persistence_or_replay_error`: write outcome or idempotent retry state is unknown

For each class, define:
- whether a suggestion set should be created or updated
- whether any canonical write may have happened
- what review status remains valid after the failure
- what retry or idempotency rule applies
- what stable error class or response contract the client can use

Mutation guarantees:
- generation and parse failures must not create canonical writes
- accept or reject failures must keep the suggestion reviewable unless the final write outcome is known
- repeated retries after unknown network outcomes must be idempotent or rejected deterministically
- success responses must not be emitted when persistence outcome is unknown

## Output Expectations

When using this skill, produce these sections in order:
1. `Invariants`
2. `DTO Delta`
3. `Canonical Write Mapping`
4. `Failure And Idempotency Handling`
5. `Affected Files`
6. `Docs To Update`
7. `Regression Coverage`
8. `Open Questions`

Fill every section. If a section has no changes, say `none`.

For `Failure And Idempotency Handling`, classify at least:
- `config_or_preflight_error`
- `request_validation_error`
- `provider_or_model_error`
- `schema_or_parse_error`
- `accept_mutation_error`
- `reject_mutation_error` when applicable
- `persistence_or_replay_error` when applicable

If reviewing existing code, lead with:
- invariant violations
- unsafe acceptance paths
- missing partial-accept cases
- retry or idempotency gaps
- doc or test mismatches

## Quick Review Checklist

Check these questions before closing the work:
- Does any AI path mutate canonical data before review?
- Are accepted fields explicit and enumerable?
- Can the same suggestion be accepted twice without duplication?
- Can reject or failure leave the task or capture item unchanged?
- Can the caller distinguish failure classes enough to render the correct recovery path?
- Do persisted review statuses survive reload?
- Does the client know only app-level DTOs, not provider internals?
- Does the UI still make pending suggestion sets look non-canonical?
- Were docs and QA checklists updated with the contract change?

## Avoid

Avoid these patterns:
- putting OpenAI call details into React components
- overloading `Task` with pending AI blobs
- reusing board columns as AI lifecycle
- free-form acceptance payloads that hide canonical writes
- undocumented schema changes



