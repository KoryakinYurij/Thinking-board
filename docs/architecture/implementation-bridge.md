# Implementation Bridge

## Purpose

This document maps the current local-only codebase to the new AI-assisted product model so the next implementation steps are concrete and low-risk.

## Current Code Reality

The current app is a single-front-end React/Vite project with one canonical local task array.

Primary files today:
- `src/App.tsx`
- `src/components/TaskComposer.tsx`
- `src/components/TaskDetail.tsx`
- `src/components/KanbanBoard.tsx`
- `src/components/BoardFilters.tsx`
- `src/components/ArchivedTasks.tsx`
- `src/features/tasks/model.ts`
- `src/features/tasks/board.ts`
- `src/features/tasks/queries.ts`
- `src/features/tasks/storage.ts`

Current domain reality:
- only `Task` exists as canonical object
- no `CaptureItem`
- no `Subtask`
- no `SuggestionSet`
- no server boundary
- no AI contracts

## Bridge Principle

Do not rewrite everything at once.

Preserve what already works:
- top-level task status model
- board projection logic
- basic detail pane interaction model
- task archive and restore flow

Add new product layers around it in slices:
- capture intake
- AI suggestion review
- acceptance writes
- subtasks
- backend AI API

## Naming Debt

Some filenames still reflect the old product framing:
- `docs/domain/todo-kanban-rules.md`
- `docs/qa/kanban-checklist.md`
- `src/features/tasks/*`

Decision:
- keep these names temporarily to avoid churn while the first AI slice is being built
- only rename files after the first working `capture -> expand -> accept -> task` slice is shipped

## Recommended Target Structure

Short-term target:

- `src/features/capture/*`
- `src/features/tasks/*`
- `src/features/ai/*`
- `src/features/subtasks/*`
- `src/lib/api/*`
- `server/*`

Meaning:
- `capture` owns raw intake
- `tasks` owns committed execution work
- `ai` owns suggestion state and review logic
- `subtasks` owns child execution work if split becomes necessary
- `lib/api` owns typed frontend API clients
- `server` owns OpenAI integration and acceptance-safe writes

## Mapping From Current Files To Future Responsibilities

### `src/App.tsx`

Current role:
- top-level state container for tasks and filters

Bridge plan:
- keep as composition root
- remove canonical business logic from it over time
- eventually make it orchestrate capture, task, and AI feature slices

### `src/features/tasks/model.ts`

Current role:
- task types and status metadata

Bridge plan:
- keep existing top-level task status types
- add or split new models for `CaptureItem`, `Subtask`, and `SuggestionSet`
- do not overload current `Task` type with pending AI state

### `src/features/tasks/board.ts`

Current role:
- create, edit, move, archive, restore, and reorder task operations

Bridge plan:
- keep as committed execution logic for top-level tasks only
- do not mix capture-item or suggestion acceptance logic into this file
- extract task operations that remain valid after subtasks are introduced

### `src/features/tasks/storage.ts`

Current role:
- localStorage persistence for task array

Bridge plan:
- keep only as temporary local MVP persistence
- replace with a repository boundary that can read and write capture items, tasks, suggestion sets, and acceptance state
- fix current empty-state and write-failure issues before treating it as stable

### `src/components/TaskComposer.tsx`

Current role:
- creates committed tasks directly

Bridge plan:
- convert this into a capture-first component
- default action should create `CaptureItem`, not force a committed task every time
- allow a fast-path manual commit when the user already knows the task shape

### `src/components/TaskDetail.tsx`

Current role:
- edits task fields and exposes complete or archive actions

Bridge plan:
- evolve into `Task Detail + AI Workspace`
- keep manual edit and completion behavior
- add `Expand with AI`, `Decompose with AI`, review state, and accept or reject controls

### `src/components/KanbanBoard.tsx`

Current role:
- renders board columns and move actions

Bridge plan:
- keep as committed top-level execution surface
- do not make it responsible for pending AI work or raw capture items
- only adapt it later for parent-task awareness if needed

## MVP Entity Introduction Order

Introduce new entities in this order:

1. `CaptureItem`
2. `SuggestionSet` for expansion
3. accepted task-field writes from expansion
4. `SuggestionSet` for decomposition
5. `Subtask`

Do not introduce all entities in one large refactor.

## Recommended Backend Bridge

The current repo has no backend. The smallest safe bridge is:

- keep the Vite frontend
- add a small TypeScript server under `server/`
- put all OpenAI API access behind that server
- keep frontend and server contracts typed

Recommended first server files:
- `server/index.ts`
- `server/routes/ai.ts`
- `server/openai/client.ts`
- `server/openai/schemas.ts`
- `server/openai/expand.ts`
- `server/openai/decompose.ts`

## First Vertical Slice

The first vertical slice should be:

`capture item -> expand with AI -> review -> accept selected fields -> commit to task`

Why this slice first:
- proves the core AI product value
- avoids premature subtask complexity
- keeps board logic mostly untouched
- forces the acceptance model to become real

## Step-By-Step Build Order

### Slice 1: Foundation Fixes

Before AI work, fix these existing issues:
- empty persisted state fallback
- localStorage write failure handling
- blank title on edit
- keyboard selection basics

### Slice 2: Capture Item Frontend Model

Add:
- `CaptureItem` type
- local temporary capture persistence
- inbox or triage surface

Do not add AI yet.

### Slice 3: Server And OpenAI Integration

Add:
- minimal Node/TypeScript server
- one `POST /api/ai/expand` endpoint
- strict JSON schema validation on server

### Slice 4: Expansion Review UI

Add:
- pending suggestion state
- loading and failure states
- selective accept flow

### Slice 5: Commit Accepted Expansion To Task

Add:
- explicit accept action
- deterministic task creation or task update from accepted fields
- audit-friendly acceptance record

## Decomposition Bridge After Expansion

Only start decomposition after expansion acceptance works well.

Then:
- add `POST /api/ai/decompose`
- add subtask model
- add partial accept controls for suggested subtasks

## Anti-Patterns To Avoid During Migration

- do not overload `Task` with pending AI response blobs
- do not put OpenAI calls directly in React components
- do not make board columns represent AI lifecycle
- do not build subtasks before the acceptance model works
- do not try to solve sync, auth, and collaboration before the first AI slice proves value
