# Agent Work Briefs

This folder contains handoff-ready briefs for large parallel workstreams in the `AI-assisted task execution app`.

## How To Use

- Assign one brief per agent.
- Treat each brief as a bounded workstream, not as an open-ended exploration prompt.
- Require the agent to read the listed repo docs before changing code.
- Require a completion handoff that includes changed files, decisions, risks, and tests run.
- Keep cross-brief dependencies explicit. If one brief blocks another, finish the blocker first.

## Recommended Assignment Order

1. `01-foundation-hardening.md`
2. `02-capture-expand-vertical-slice.md`
3. `03-decomposition-review-acceptance.md`

## Brief Index

- `01-foundation-hardening.md`
  Stabilize current persistence, validation, and keyboard behavior before more AI-facing work lands.
- `02-capture-expand-vertical-slice.md`
  Deliver the first end-to-end AI slice: capture item to expansion review to selective acceptance into committed task data.
- `03-decomposition-review-acceptance.md`
  Deliver decomposition review and partial acceptance into canonical subtasks without polluting committed work.

## Coordination Rules

- `01-foundation-hardening.md` should land first or at minimum define any shared storage and validation changes before the other briefs branch deeply.
- `02-capture-expand-vertical-slice.md` depends on stable capture, task, and suggestion persistence behavior.
- `03-decomposition-review-acceptance.md` depends on the acceptance model and suggestion review patterns proven in the expansion slice.

## Recommended Agent Types

- `01-foundation-hardening.md`: `fullstack-developer`
- `02-capture-expand-vertical-slice.md`: `fullstack-developer`
- `03-decomposition-review-acceptance.md`: `fullstack-developer`

Use `test-automator` after each brief closes to lock regression coverage.
