# MVP Scope

## Product Framing

This product is a personal or small-team `To Do app` with a kanban view.

The MVP should feel optimized for:
- quickly adding tasks
- seeing what matters now
- moving tasks through a small workflow
- completing tasks with minimal friction

The MVP should not feel optimized for:
- project portfolio management
- advanced permissions
- complex workflow engines
- highly customizable enterprise boards

## MVP In

- create a task
- edit a task
- complete a task
- reopen a completed task
- delete or archive a task
- view tasks in a kanban board
- move a task within a column
- move a task between columns
- persist task and board state
- basic filtering such as status or text query
- usable mobile and desktop layout

## MVP Out

- multiple board templates
- workflow automation rules
- comments and activity feed
- labels with complex boolean logic
- assignee permissions model
- realtime collaboration
- offline conflict resolution
- analytics and reporting

## UX Expectations

- task creation must be faster than board manipulation
- completing a task must be easier than dragging it
- drag-and-drop must not be the only way to change status
- important actions must still work on mobile without relying on hover
- board layout must remain understandable with long task titles

## Delivery Order

1. establish data model
2. ship create/edit/complete
3. ship board columns and rendering
4. ship reorder and move behavior
5. ship persistence
6. ship filters
7. harden edge cases and mobile UX
