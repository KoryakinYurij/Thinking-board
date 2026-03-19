# Kanban QA Checklist

This checklist is the minimum regression pass for MVP work. Expand it as features land.

## Task Lifecycle

- can create a task with the minimum required fields
- can edit task content without losing status or order
- can complete a task without using drag-and-drop
- can reopen a completed task
- delete and archive behavior match the documented domain rules

## Board Behavior

- tasks render in the expected column for their status
- moving a task within a column preserves a stable order after refresh
- moving a task across columns updates both view and status correctly
- moving a task into an empty column works
- first, middle, and last drop positions behave correctly

## Filtering

- text filter does not hide newly edited tasks unexpectedly
- status filters reflect task moves correctly
- clearing filters restores expected task visibility
- filtered views do not corrupt persisted ordering

## Error Handling

- failed create, update, or move operations leave the UI in a consistent state
- loading states do not permit duplicate destructive actions
- empty states are clear and do not look broken

## Responsive And Accessibility

- primary task actions are usable on mobile
- board remains navigable with horizontal overflow
- task controls are reachable by keyboard where applicable
- status changes are not drag-only

## Before Closing A Feature

- update this checklist if the feature adds new risk areas
- add or update automated tests for the changed behavior
- verify the change against `docs/domain/todo-kanban-rules.md`
