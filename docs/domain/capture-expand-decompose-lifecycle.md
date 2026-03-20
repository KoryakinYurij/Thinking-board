# Capture Expand Decompose Lifecycle

## Purpose

This document defines the lifecycle of capture items, AI suggestion sets, and committed work without mixing AI process state into execution status.

## Capture Item Lifecycle

Recommended capture item lifecycle:
- `captured`
- `in_review`
- `committed`
- `archived`
- `deleted`

Meaning:
- `captured`: raw idea exists
- `in_review`: user is inspecting or running AI on it
- `committed`: the useful content has been turned into task data
- `archived`: kept for reference but not active
- `deleted`: permanently removed

## Suggestion Set Lifecycle

Recommended suggestion set lifecycle:
- `pending`
- `accepted`
- `partially_accepted`
- `rejected`
- `failed`

Meaning:
- `pending`: output exists and awaits review
- `accepted`: all useful output was committed
- `partially_accepted`: only some output was committed
- `rejected`: output was reviewed and intentionally discarded
- `failed`: generation or acceptance failed

## Task Lifecycle

Recommended task execution lifecycle:
- `todo`
- `in_progress`
- `done`
- `archived`
- `deleted`

Important:
- these are execution states
- they are not AI review states
- a task may have pending AI suggestion sets while still being in `todo` or `in_progress`

## Lifecycle Rules

- a capture item may exist without any task yet
- a task may exist without any AI suggestion set
- a suggestion set may exist for either a capture item or a task
- accepting a suggestion set may update an existing task or create subtasks
- rejecting a suggestion set must not damage the linked entity
- archiving a task must not silently archive unrelated capture items or suggestion sets unless explicitly specified

## Anti-Confusion Rule

Do not map these lifecycle concepts into one field.

Bad example:
- using board columns like `captured`, `expanded`, `decomposed`, `done`

Preferred separation:
- capture or suggestion lifecycle stays in its own domain field
- execution status stays in the task status field
