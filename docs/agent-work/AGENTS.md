# Agent Work Briefs

This folder contains handoff-ready briefs for large parallel workstreams in the `AI-assisted task execution app`.

## How To Use

- Assign one brief per agent.
- Treat each brief as a bounded workstream, not as an open-ended exploration prompt.
- Require the agent to read the listed repo docs before changing code.
- Require a completion handoff that includes changed files, decisions, risks, and tests run.
- Keep cross-brief dependencies explicit. If one brief blocks another, finish the blocker first.

## Recommended Assignment Order

1. `03-decomposition-review-acceptance.md`

## Brief Index

- `03-decomposition-review-acceptance.md`
  Deliver decomposition review and partial acceptance into canonical subtasks without polluting committed work.

## Coordination Rules

- `03-decomposition-review-acceptance.md` assumes the already-landed foundation and expansion slices remain the reference pattern for suggestion review and acceptance behavior.

## Recommended Agent Types

- `03-decomposition-review-acceptance.md`: `fullstack-developer`

Use `test-automator` after each brief closes to lock regression coverage.
