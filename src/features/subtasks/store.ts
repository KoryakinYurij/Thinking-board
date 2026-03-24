import type { Subtask, Task } from '../tasks/model'

export function getSubtasksForTask(tasks: Task[], parentTaskId: string) {
  return sortSubtasks(
    tasks.filter(
      (task): task is Subtask =>
        Boolean(task.parentTaskId) &&
        task.parentTaskId === parentTaskId &&
        !task.archivedAt,
    ),
  )
}

function sortSubtasks(tasks: Subtask[]) {
  return [...tasks].sort((left, right) => left.position - right.position)
}
