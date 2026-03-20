# Execution And Kanban QA Checklist

This checklist is the minimum regression pass for committed execution behavior. Expand it as features land.

## Capture And Commit

- can create a capture item with minimal input
- can keep a rough idea without forcing premature structure
- can promote a capture item into a committed task
- promoting a capture item removes it from the active inbox without creating duplicate committed tasks
- promoting a capture item does not silently lose useful source context

## Task Lifecycle

- can create a task with the minimum required fields
- can edit committed task content without losing status or order
- can complete a task without using drag-and-drop
- can reopen a completed task
- delete and archive behavior match the documented domain rules
- archived tasks can be reviewed and restored without losing their status meaning

## Expansion And Decomposition Acceptance

- pending AI output remains reviewable before acceptance
- expansion output does not auto-commit into task data
- accepted expansion fields land only in the fields the user selected
- accepted, rejected, and failed suggestion-set states survive reload for the linked entity
- decomposition output can be accepted partially
- rejected suggestions do not appear as committed work
- accepted subtasks land in predictable task states

## Board Behavior

- only committed top-level tasks render in board columns
- tasks render in the expected column for their status
- moving a task within a column preserves a stable order after refresh
- moving a task across columns updates both view and status correctly
- moving a task into an empty column works
- first, middle, and last drop positions behave correctly

## Filtering

- text filter does not hide newly edited committed tasks unexpectedly
- status filters reflect task moves correctly
- clearing filters restores expected task visibility
- filtered views do not corrupt persisted ordering
- pending suggestion sets are not mistaken for filtered-out committed tasks

## Error Handling

- failed create, accept, update, or move operations leave the UI in a consistent state
- failed AI calls do not partially mutate canonical task data
- loading states do not permit duplicate destructive actions
- empty states are clear and do not look broken

## Responsive And Accessibility

- primary capture, review, and execution actions are usable on mobile
- board remains navigable with horizontal overflow
- task controls are reachable by keyboard where applicable
- status changes are not drag-only
- AI review and acceptance flows are usable without hover-only affordances

## Before Closing A Feature

- update this checklist if the feature adds new execution risk areas
- add or update automated tests for the changed behavior
- verify the change against `docs/domain/todo-kanban-rules.md`
- verify the change against `docs/domain/capture-expand-decompose-lifecycle.md` when AI flows are affected
