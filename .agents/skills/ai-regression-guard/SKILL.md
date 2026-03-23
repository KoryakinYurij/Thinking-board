---
name: ai-regression-guard
description: Plan and review repo-specific regression coverage for AI expansion, decomposition, acceptance, rejection, retry, and failure handling in this AI-assisted task execution app. Use when a change touches AI contracts, server routes, API clients, review panels, App orchestration, acceptance writes, prompt or schema changes, or QA and eval checklists and you need to decide which test layers are required, which harness gaps block coverage, and whether the feature can close safely.
---

# AI Regression Guard

## Overview

Use this skill to set the minimum regression bar for AI flow changes in this repo. Tie each code change back to the documented QA checklists, require the highest-value coverage for the actual risk introduced, and call out harness gaps explicitly instead of pretending pure tests cover cross-boundary behavior.

## Scope Gate

Use this skill when the task changes:
- `shared/ai/contracts.ts` or other AI DTO or schema files
- `server/routes/ai.ts` or acceptance helpers
- `src/lib/api/ai.ts`
- AI review panels, `TaskDetail`, `CaptureDetail`, or `App.tsx` orchestration
- accept, reject, retry, failed-suggestion, or repeated-accept behavior
- prompt or schema changes that can alter suggestion quality or acceptance safety
- QA or eval checklist expectations for AI flows

Do not use this skill as the primary guide when the task is:
- isolated CSS or layout polish with unchanged AI behavior
- pure domain modeling with no AI flow delta
- generic non-AI test work elsewhere in the app

Use `ai-acceptance-designer` when the main risk is contract semantics.
Use `ai-review-flow-builder` when the main risk is surface design or recovery UX.
Use `task-domain-guard` when the main risk is task or board semantics.

## Repo Reality

Start from the real testing surface, not the ideal one:
- current automated coverage is strongest at contract, store, and helper level
- route, component, and integration harnesses may be partial or missing
- a lower-level store test does not prove `panel -> App -> API client -> route -> acceptance -> persisted review state`
- a `todo` test is not coverage

Before demanding a higher-layer test, verify whether the repo already has the needed harness. If not, either add the smallest viable harness or record the gap as blocking.

## Read This Context First

Read these repo documents in repo-required order before setting a regression bar:
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

Inspect these implementation paths before deciding coverage:
- `package.json`
- `shared/ai/contracts.ts`
- `server/routes/ai.ts`
- `server/acceptance/suggestions.ts`
- `server/openai/schemas.ts`
- `server/openai/expand.ts`
- `server/openai/decompose.ts`
- `src/lib/api/ai.ts`
- `src/components/CaptureExpansionPanel.tsx`
- `src/components/TaskExpansionPanel.tsx`
- `src/components/TaskDecompositionPanel.tsx`
- `src/components/CaptureDetail.tsx`
- `src/components/TaskDetail.tsx`
- `src/App.tsx`
- `src/features/ai/*`
- `src/features/subtasks/*`

## Shell-First Pass

Start with repo inspection before prescribing tests.

Useful commands:
```powershell
rg --files src server shared | rg "(test|spec)\."
rg -n "accept|reject|retry|failed|partially_accepted|rejected" src server shared docs
rg -n "Expand with AI|Decompose with AI|suggestionSet|acceptedFields|aiActionError" src docs
rg -n "schema|json_schema|strict|responses.create|prompt" server/openai shared docs
rg -n "vitest|testing-library|jsdom|msw|supertest|playwright" package.json .
```

Use the results to identify:
- what test layers already exist
- which boundary the change crosses
- which risky scenarios already have lower-level coverage
- which risky scenarios still lack route, component, or cross-boundary coverage
- whether docs and checklists must move with the code

## Coverage Model

Choose coverage by boundary, not by habit.

### 1. Contract coverage

Use for:
- DTOs
- schemas
- parse behavior
- frozen request or response shapes

Typical targets:
- `shared/ai/contracts.ts`
- parser or schema helpers

### 2. Logic coverage

Use for:
- acceptance builders
- duplicate prevention
- appended-note replacement
- review-status updates
- helper-level failure handling

Typical targets:
- `server/acceptance/suggestions.ts`
- `src/features/ai/store.ts`
- `src/features/subtasks/store.ts`

### 3. Route or client-boundary coverage

Use for:
- HTTP validation behavior
- status-code handling
- typed client error mapping
- request or response wiring between client and server

Typical targets:
- `server/routes/ai.ts`
- `src/lib/api/ai.ts`

### 4. Component or flow coverage

Use for:
- checkbox-based partial accept flows
- reject and retry actions
- generation failure versus accept or reject failure
- orchestration through `App.tsx`
- preservation of review context after mutation failures

Typical targets:
- expansion panels
- decomposition panel
- `CaptureDetail`
- `TaskDetail`
- `App.tsx`

## Decision Rules

Require the minimum set that closes the actual risk:
- If the contract shape changes, add contract coverage.
- If acceptance logic changes, add logic coverage.
- If the route, status code, or client error mapping changes, add route or client-boundary coverage.
- If the user-visible review flow changes, add component or flow coverage.
- If a change crosses multiple boundaries, require at least one regression that crosses the highest changed boundary instead of stacking only lower-level tests.
- If a prompt, schema, or acceptance behavior changes AI usefulness or safety, update eval coverage expectations too.

Do not require `route + component + integration` for every AI change.
Do require higher-level coverage when the regression risk is no longer local to one helper.

## Required Scenarios

For AI flow work, check whether coverage exists for:
- partial accept
- reject
- repeated accept or retry without duplicate canonical writes
- failed AI generation
- accept mutation failure
- reject mutation failure when applicable
- persisted suggestion status after reload
- no partial canonical mutation on failure
- no leakage of accepted subtasks into top-level board semantics

If the change touches one of these and no automated regression covers it, call that gap explicitly.

## Harness Gap Policy

When the needed layer is unsupported:
- name the missing harness exactly
- say whether the feature should pause until it exists
- if the gap is acceptable temporarily, say why and what narrower coverage still landed
- never describe pure helper tests as component or integration coverage

Approved fallback order:
- add the smallest viable harness for the changed boundary
- add the best lower-layer regression available today
- record the remaining uncovered risk as a blocking or explicit follow-up gap

## Checklists And Evals

Use the docs as shipping gates, not background reading:
- `docs/qa/kanban-checklist.md` covers execution, acceptance, error handling, and mobile basics
- `docs/qa/ai-evals-checklist.md` covers AI usefulness, partial acceptance, duplicate prevention, failure safety, and recovery

If the change alters prompt behavior, schema behavior, acceptance flow, or review UX, say which checklist lines must be re-run and whether new fixtures or regression tests are needed.

Do not close an AI feature until each changed risk has either:
- automated regression coverage, or
- an explicit blocking gap called out in the output

## Output Expectations

When using this skill, produce these sections in order:
1. `Change Map`
2. `Risk Matrix`
3. `Required Test Layers`
4. `Harness Gaps`
5. `Checklist Delta`
6. `Eval Coverage`
7. `Blocking Gaps`
8. `Open Questions`

Fill every section. If a section has no changes, say `none`.

For `Risk Matrix`, include:
- changed boundary
- regression risk
- required scenario
- minimum test layer

For `Required Test Layers`, name concrete files or modules to cover.

For `Blocking Gaps`, state plainly whether the feature is ready to close.

## Quick Review Checklist

Check these questions before closing the work:
- Is the highest changed boundary actually covered?
- Are partial accept, reject, repeated accept, and failed AI calls covered where relevant?
- Does the regression surface prove no partial canonical mutation on failure?
- If subtasks are involved, is top-level board leakage covered?
- Do persisted suggestion statuses survive reload?
- Did the work re-check both QA checklists?
- Are harness limitations called out honestly instead of hidden?

## Avoid

Avoid these patterns:
- requiring every test layer for every AI change
- treating a helper test as proof of UI flow safety
- citing a `todo` test as meaningful coverage
- skipping eval or checklist work because unit tests passed
- opening a broad test refactor when one targeted regression would close the risk

