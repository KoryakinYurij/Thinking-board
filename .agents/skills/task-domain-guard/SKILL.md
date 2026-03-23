---
name: task-domain-guard
description: Protect the domain semantics of capture items, tasks, subtasks, execution status, archive or delete behavior, board projection, filtering, and reorder rules in this AI-assisted task execution app. Use when changing lifecycle rules, entity boundaries, canonical versus derived state, restore or delete behavior, parent-child execution behavior, board visibility, or reorder semantics. Do not use for accept or reject contract design, accepted field enums, suggestion acceptance DTOs, prompt-only AI changes, purely visual styling, or routine component refactors that leave domain behavior unchanged.
---

# Task Domain Guard

## Overview

Use this skill to keep the product model coherent while features evolve. Resolve what is canonical, what is derived, where each entity is allowed to appear, and how lifecycle rules behave before code is changed or approved.

## Scope Gate

Use this skill when the task changes:
- lifecycle states or transitions
- capture item, task, or subtask boundaries
- canonical versus derived state
- archive, restore, delete, complete, or reopen behavior
- parent-child execution behavior
- reorder semantics or board projection rules
- filtering semantics that affect what users can or cannot recover
- any behavior that could make intake or derived state look like committed execution work

Do not use this skill as the primary guide when the task is:
- accept or reject contract design
- accepted field enums or acceptance DTOs
- suggestion-set persistence semantics driven by AI review state
- prompt tuning with unchanged domain behavior
- purely visual design or CSS work
- isolated API plumbing with unchanged semantics
- test-only changes with no domain delta

Use `ai-acceptance-designer` instead when the main risk is AI acceptance semantics.

## Read This Context First

Read these repo documents in repo-required order before material behavior changes:
- `AGENTS.md`
- `docs/product/mvp-scope.md`
- `docs/domain/todo-kanban-rules.md`
- `docs/domain/capture-expand-decompose-lifecycle.md`
- `docs/architecture/task-model-and-reorder-contracts.md`
- `docs/architecture/implementation-bridge.md`
- `docs/architecture/ai-api-and-structured-output-contracts.md` when the domain change touches AI boundaries
- `docs/product/implementation-roadmap.md`
- `docs/product/ai-surface-and-user-flows.md`
- `docs/qa/kanban-checklist.md`
- `docs/qa/ai-evals-checklist.md` before closing an AI-adjacent feature or fix

Inspect these implementation paths before editing:
- `src/features/tasks/model.ts`
- `src/features/tasks/board.ts`
- `src/features/tasks/queries.ts`
- `src/features/capture/*`
- `src/features/subtasks/*`
- `src/components/BoardFilters.tsx`
- `src/components/ArchivedTasks.tsx`
- `src/components/KanbanBoard.tsx`
- `src/components/TaskDetail.tsx`
- `src/components/CaptureInbox.tsx`
- `src/App.tsx` when orchestration changes

## Shell-First Pass

Start with repo inspection before proposing changes.

Useful commands:
```powershell
rg -n "capture|task|subtask|parentTaskId|sourceCaptureId|archivedAt|completedAt" src shared docs
rg -n "todo|in_progress|done|archived|deleted|captured|in_review|committed" src shared docs
rg -n "moveTask|moveTaskWithinStatus|restoreTask|archiveTask|deleteTask|setTaskStatus|buildColumns|getActiveTasks|filter" src docs
rg -n "board|column|projection|reorder|empty column|filtered" src docs
```

Use the search results to identify:
- where lifecycle meaning is defined
- which data is canonical versus derived
- whether board behavior is a projection or a source of truth
- whether parent-child rules stay out of top-level board semantics
- what docs and tests must move with the code

## Workflow

### 1. Classify the domain change

Write down:
- entity shapes affected: `capture_item`, top-level `task`, or child `task` (`subtask`)
- lifecycle affected: intake, execution, archive, delete
- whether the change affects canonical data, projection logic, or both
- whether top-level board semantics are involved
- whether filtering, reorder, restore, or reopen behavior changes

### 2. Build the canonical map first

Produce this table before implementation:
- entity
- canonical store
- canonical fields
- derived fields or projections
- allowed surfaces
- forbidden surfaces

At minimum cover:
- `capture_item`
- top-level `task`
- child `task` (`subtask`)

If a new field is introduced, label it explicitly as one of:
- canonical
- derived
- review-only
- presentation-only

Do not implement until this map is coherent.

### 3. Lock domain invariants

Enforce these rules:
- Treat committed `task` data as the source of truth for execution.
- Treat `capture item` as intake state, not committed work.
- Keep execution status separate from intake and AI review state.
- Keep board as a projection of committed top-level tasks.
- Keep subtasks out of top-level board ordering unless the spec changes.
- Keep archive different from delete and different from done.
- Keep restore behavior deterministic and status-preserving.
- Keep filter behavior as view logic, not hidden mutation.
- Keep board visibility from granting extra business meaning beyond documented workflow rules.

### 4. Run the decision tree

Answer these questions before implementation:
- Is the changed object intake, committed execution work, or a derived projection?
- Does the change alter canonical state or only how it is shown?
- Should the object appear on the board at all?
- If it is archived, can it still be reviewed or restored?
- If it is filtered out, can the user still reliably recover it?
- If it is a child task, does it incorrectly participate in top-level reorder or columns?
- If reorder is allowed under a filtered view, is full-order semantics explicitly defined?

If the answer is unclear, stop and resolve the domain rule before coding.

### 5. Map the behavioral impact

For each affected action, answer:
- what entity changes
- what field changes
- what fields must not change
- what projection updates as a result
- what empty, failure, and reload behavior should look like

Cover at least these actions when relevant:
- create
- commit capture to task
- set status
- move within status
- move across status
- archive
- restore
- delete
- reopen
- filter

### 6. Update docs and regression surface

When the change affects:
- domain semantics: update `docs/domain/todo-kanban-rules.md` and `docs/domain/capture-expand-decompose-lifecycle.md`
- reorder or board rules: update `docs/architecture/task-model-and-reorder-contracts.md`
- execution behavior or regressions: update `docs/qa/kanban-checklist.md`
- user-facing flow meaning: update `docs/product/ai-surface-and-user-flows.md`

Add or adjust tests for:
- lifecycle transitions
- top-level board projection
- canonical versus derived state boundaries
- parent-child behavior
- archive, restore, delete, and reopen behavior
- filter and reorder edge cases

Escalate to another skill when needed:
- use `ai-acceptance-designer` when the main risk is AI acceptance semantics
- use `ui-designer` when the semantics stay the same but the interaction model changes
- use `test-automator` when the main gap is missing coverage
- use `fullstack-developer` or `backend-developer` when the domain rule is settled and implementation is the remaining work

## Domain Heuristics

Use these repo-specific heuristics during review:
- If a change introduces a new field, specify whether it is canonical, derived, review-only, or presentation-only.
- If a surface shows pending or intake data, verify that it cannot be mistaken for committed execution work.
- If a task move changes status, verify that it also preserves stable ordering semantics.
- If restore is changed, verify that the task returns to an execution lane without inventing new lifecycle meaning.
- If a child task becomes visible outside task detail, verify that it still does not leak into top-level board semantics unless the product spec changed.
- If filtered reorder is allowed, define behavior in the full underlying order, not only the filtered slice.

## Output Expectations

When using this skill, produce these sections in order:
1. `Canonical Entity Map`
2. `Invariants`
3. `Behavior Delta`
4. `Projection And Reorder Impact`
5. `Failure And Recovery Impact`
6. `Affected Files`
7. `Docs To Update`
8. `Regression Coverage`
9. `Open Questions`

Fill every section. If a section has no changes, say `none`.

For `Canonical Entity Map`, include at least one line each for:
- `capture_item`
- top-level `task`
- child `task` (`subtask`)

If reviewing existing code, lead with:
- invariant violations
- canonical versus derived state confusion
- board-as-source-of-truth mistakes
- mixed lifecycle fields
- parent-child semantic leaks
- filter or reorder behaviors that can hide or duplicate work

## Quick Review Checklist

Check these questions before closing the work:
- Does any intake or derived state masquerade as committed execution work?
- Is every newly added field labeled as canonical, derived, review-only, or presentation-only?
- Do board columns still represent execution meaning only?
- Can restore return work predictably without changing its status meaning?
- Are subtasks still excluded from top-level board projection?
- Can filtering hide data without making it seem lost?
- If filtered reorder is allowed, is its full-order meaning documented?
- Are archive, delete, and done still distinct concepts?
- Were domain docs and regression checklists updated with the change?

## Avoid

Avoid these patterns:
- mapping AI stages into board columns
- overloading a single field with intake, review, and execution meaning
- letting board gestures become the only way to change status
- making filtered projections behave like separate lists without full-order semantics
- making subtasks accidental top-level board cards
- letting archive semantics silently become delete semantics
- introducing fields without labeling whether they are canonical or derived

