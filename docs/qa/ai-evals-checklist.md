# AI Evals Checklist

## Purpose

This checklist is the minimum quality bar for AI-assisted expansion and decomposition features.

## Expansion Quality

- expansion output makes the original idea clearer, not more verbose for its own sake
- suggested outcome is relevant to the source input
- risks and assumptions are plausible
- clarifying questions are useful rather than generic filler
- normalized title improves readability without changing intent incorrectly

## Decomposition Quality

- suggested subtasks are actually executable
- subtasks are not trivial restatements of the parent task
- the order of steps is reasonable
- next actions are concrete enough to start work
- decomposition does not invent unjustified dependencies or scope

## Safety And Acceptance

- AI output is reviewable before acceptance
- accepting some suggestions does not force all suggestions
- accepting a new expansion replaces the prior accepted AI expansion notes instead of duplicating them
- the latest suggestion set stays reviewable after refresh with its persisted status
- rejected suggestions do not leak into canonical task data
- repeated acceptance does not duplicate subtasks or fields
- failed AI actions do not corrupt the linked task or capture item
- malformed provider output is rejected before it can become a suggestion payload
- provider misconfiguration does not mutate linked task or capture state

## UX Quality

- users can understand what came from AI and what is committed
- users can tell the difference between expansion and decomposition actions
- users can recover from failed AI calls without losing context
- mobile and keyboard flows remain usable during review and acceptance

## Regression Expectations

- add fixtures for good and bad outputs when practical
- add at least one regression check for each new AI contract shape
- re-run this checklist whenever prompts, schemas, or acceptance flows change
