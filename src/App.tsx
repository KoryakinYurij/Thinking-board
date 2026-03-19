import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import './App.css'
import BoardFilters from './components/BoardFilters'
import KanbanBoard from './components/KanbanBoard'
import Masthead from './components/Masthead'
import TaskComposer from './components/TaskComposer'
import TaskDetail from './components/TaskDetail'
import {
  archiveTask,
  buildColumns,
  createTask,
  deleteTask,
  getActiveTasks,
  moveTask,
  moveTaskWithinStatus,
  patchTask,
  setTaskStatus,
} from './features/tasks/board'
import { filterTasks, getResolvedSelectedTaskId, getTaskStats, getVisibleStatuses } from './features/tasks/queries'
import { loadTasks, saveTasks } from './features/tasks/storage'
import type {
  MovePlacement,
  Task,
  TaskDraft,
  TaskPatch,
  TaskPriorityFilter,
  TaskStatus,
  TaskStatusFilter,
} from './features/tasks/model'

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks())
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [focusStatus, setFocusStatus] = useState<TaskStatusFilter>('all')
  const [priorityFilter, setPriorityFilter] =
    useState<TaskPriorityFilter>('all')
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)

  const deferredSearch = useDeferredValue(search)
  const activeTasks = getActiveTasks(tasks)
  const archivedCount = tasks.length - activeTasks.length
  const filteredTasks = filterTasks(
    activeTasks,
    deferredSearch,
    focusStatus,
    priorityFilter,
  )
  const visibleStatuses = getVisibleStatuses(focusStatus)
  const filteredColumns = buildColumns(filteredTasks)
  const allColumns = buildColumns(activeTasks)
  const resolvedSelectedTaskId = getResolvedSelectedTaskId(
    activeTasks,
    selectedTaskId,
  )
  const selectedTask =
    activeTasks.find((task) => task.id === resolvedSelectedTaskId) ?? null
  const dragDisabled =
    deferredSearch.trim().length > 0 ||
    priorityFilter !== 'all' ||
    focusStatus !== 'all'
  const { openCount, doneCount, dueSoonCount } = getTaskStats(activeTasks)

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  function handleCreateTask(draft: TaskDraft) {
    if (!draft.title.trim()) {
      return false
    }

    const timestamp = new Date().toISOString()
    const createdTaskId = crypto.randomUUID()

    setTasks((current) =>
      createTask(current, draft, timestamp, () => createdTaskId),
    )

    startTransition(() => {
      setSelectedTaskId(createdTaskId)
    })

    return true
  }

  function handlePatchTask(taskId: string, updates: TaskPatch) {
    setTasks((current) => patchTask(current, taskId, updates))
  }

  function handleSetTaskStatus(taskId: string, status: TaskStatus) {
    setTasks((current) => setTaskStatus(current, taskId, status))
  }

  function handleMoveTask(taskId: string, placement: MovePlacement) {
    setTasks((current) => moveTask(current, taskId, placement))
  }

  function handleMoveTaskWithinStatus(taskId: string, direction: -1 | 1) {
    setTasks((current) => moveTaskWithinStatus(current, taskId, direction))
  }

  function handleArchiveTask(taskId: string) {
    setTasks((current) => archiveTask(current, taskId))
  }

  function handleDeleteTask(taskId: string) {
    setTasks((current) => deleteTask(current, taskId))
  }

  return (
    <div className="app-shell">
      <Masthead
        openCount={openCount}
        dueSoonCount={dueSoonCount}
        doneCount={doneCount}
      />

      <section className="workspace">
        <TaskComposer onCreateTask={handleCreateTask} />

        <main className="board-stage">
          <BoardFilters
            search={search}
            focusStatus={focusStatus}
            priorityFilter={priorityFilter}
            dragDisabled={dragDisabled}
            onSearchChange={setSearch}
            onFocusStatusChange={setFocusStatus}
            onPriorityFilterChange={setPriorityFilter}
          />

          <KanbanBoard
            visibleStatuses={visibleStatuses}
            filteredColumns={filteredColumns}
            allColumns={allColumns}
            selectedTaskId={resolvedSelectedTaskId}
            dragTaskId={dragTaskId}
            dragDisabled={dragDisabled}
            onSelectTask={setSelectedTaskId}
            onDragStartTask={setDragTaskId}
            onClearDrag={() => setDragTaskId(null)}
            onMoveTask={handleMoveTask}
            onMoveTaskWithinStatus={handleMoveTaskWithinStatus}
            onSetTaskStatus={handleSetTaskStatus}
          />
        </main>

        <TaskDetail
          selectedTask={selectedTask}
          archivedCount={archivedCount}
          onPatchTask={handlePatchTask}
          onSetTaskStatus={handleSetTaskStatus}
          onArchiveTask={handleArchiveTask}
          onDeleteTask={handleDeleteTask}
        />
      </section>
    </div>
  )
}

export default App
