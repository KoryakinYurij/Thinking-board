import { startTransition, useDeferredValue, useState } from 'react'
import './App.css'
import ArchivedTasks from './components/ArchivedTasks'
import BoardFilters from './components/BoardFilters'
import CaptureDetail from './components/CaptureDetail'
import CaptureInbox from './components/CaptureInbox'
import KanbanBoard from './components/KanbanBoard'
import Masthead from './components/Masthead'
import TaskComposer from './components/TaskComposer'
import TaskDetail from './components/TaskDetail'
import {
  acceptDecompositionSuggestionWithAI,
  acceptExpansionSuggestionWithAI,
  rejectSuggestionWithAI,
} from './lib/api/ai'
import {
  getLatestSuggestionSet,
  getLatestExpansionSuggestionSet,
  recordDecompositionSuggestion,
  recordExpansionSuggestion,
  recordFailedDecompositionSuggestion,
  recordFailedExpansionSuggestion,
  updateDecompositionSuggestionStatus,
  updateExpansionSuggestionStatus,
} from './features/ai/store'
import { loadSuggestionSets, saveSuggestionSets } from './features/ai/storage'
import type {
  DecompositionAcceptedField,
  DecompositionSuggestionSet,
  ExpansionAcceptedField,
  SuggestionSet,
} from './features/ai/model'
import {
  archiveCaptureItem,
  buildTaskDraftFromCapture,
  createCaptureItem,
  deleteCaptureItem,
  getActiveCaptureItems,
  patchCaptureItem,
  sortCaptureItems,
} from './features/capture/store'
import { loadCaptureItems, saveCaptureItems } from './features/capture/storage'
import type { CaptureItem } from './features/capture/model'
import {
  archiveTask,
  buildColumns,
  createTask,
  deleteTask,
  getActiveTasks,
  getArchivedTasks,
  moveTask,
  moveTaskWithinStatus,
  patchTask,
  restoreTask,
  setTaskStatus,
} from './features/tasks/board'
import {
  filterTasks,
  getResolvedSelectedTaskId,
  getTaskStats,
  getVisibleStatuses,
  sortArchivedTasks,
} from './features/tasks/queries'
import { loadTasks, saveTasks } from './features/tasks/storage'
import {
  getSubtasksForTask,
} from './features/subtasks/store'
import type {
  MovePlacement,
  Task,
  TaskDraft,
  TaskPatch,
  TaskPriorityFilter,
  TaskStatus,
  TaskStatusFilter,
} from './features/tasks/model'
import type { DecomposeResponse, ExpandResponse } from '../shared/ai/contracts'

function App() {
  const [appState, setAppState] = useState(() => ({
    tasks: loadTasks(),
    captureItems: loadCaptureItems(),
    suggestionSets: loadSuggestionSets(),
    persistenceError: null as string | null,
  }))
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedCaptureItemId, setSelectedCaptureItemId] =
    useState<string | null>(null)
  const [workspaceView, setWorkspaceView] =
    useState<'inbox' | 'board' | 'archive'>('inbox')
  const [search, setSearch] = useState('')
  const [focusStatus, setFocusStatus] = useState<TaskStatusFilter>('all')
  const [priorityFilter, setPriorityFilter] =
    useState<TaskPriorityFilter>('all')
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)
  const [aiActionError, setAiActionError] = useState<string | null>(null)
  const { tasks, captureItems, suggestionSets, persistenceError } = appState

  const deferredSearch = useDeferredValue(search)
  const activeCaptureItems = sortCaptureItems(getActiveCaptureItems(captureItems))
  const filteredCaptureItems = activeCaptureItems.filter((item) =>
    item.rawText.toLowerCase().includes(deferredSearch.trim().toLowerCase()),
  )
  const captureCount = activeCaptureItems.length
  const activeTasks = getActiveTasks(tasks)
  const archivedTasks = sortArchivedTasks(getArchivedTasks(tasks))
  const archivedCount = archivedTasks.length
  const filteredActiveTasks = filterTasks(
    activeTasks,
    deferredSearch,
    focusStatus,
    priorityFilter,
  )
  const filteredArchivedTasks = filterTasks(
    archivedTasks,
    deferredSearch,
    focusStatus,
    priorityFilter,
  )
  const viewedTasks = workspaceView === 'archive' ? archivedTasks : activeTasks
  const visibleStatuses = getVisibleStatuses(focusStatus)
  const filteredColumns = buildColumns(filteredActiveTasks)
  const allColumns = buildColumns(activeTasks)
  const resolvedSelectedTaskId = getResolvedSelectedTaskId(
    viewedTasks,
    selectedTaskId,
  )
  const selectedTask =
    viewedTasks.find((task) => task.id === resolvedSelectedTaskId) ?? null
  const selectedTaskSuggestionSet = selectedTask
    ? getLatestExpansionSuggestionSet(suggestionSets, 'task', selectedTask.id)
    : null
  const selectedTaskDecompositionSuggestionSet = selectedTask
    ? (getLatestSuggestionSet(
        suggestionSets,
        'decomposition',
        'task',
        selectedTask.id,
      ) as DecompositionSuggestionSet | null)
    : null
  const selectedTaskSubtasks = selectedTask
    ? getSubtasksForTask(tasks, selectedTask.id)
    : []
  const resolvedSelectedCaptureItemId = activeCaptureItems.some(
    (item) => item.id === selectedCaptureItemId,
  )
    ? selectedCaptureItemId
    : (activeCaptureItems[0]?.id ?? null)
  const selectedCaptureItem =
    activeCaptureItems.find((item) => item.id === resolvedSelectedCaptureItemId) ??
    null
  const selectedCaptureSuggestionSet = selectedCaptureItem
    ? getLatestExpansionSuggestionSet(
        suggestionSets,
        'capture_item',
        selectedCaptureItem.id,
      )
    : null
  const dragDisabled =
    workspaceView !== 'board' ||
    deferredSearch.trim().length > 0 ||
    priorityFilter !== 'all' ||
    focusStatus !== 'all'
  const { openCount, urgentCount } = getTaskStats(activeTasks)

  function finalizeAppData(nextData: {
    tasks: Task[]
    captureItems: CaptureItem[]
    suggestionSets: SuggestionSet[]
  }) {
    const taskResult = saveTasks(nextData.tasks)
    const captureResult = saveCaptureItems(nextData.captureItems)
    const suggestionResult = saveSuggestionSets(nextData.suggestionSets)

    return {
      ...nextData,
      persistenceError:
        taskResult.ok && captureResult.ok && suggestionResult.ok
          ? null
          : 'Changes are still visible in this tab, but local storage could not be updated.',
    }
  }

  function updateTasks(recipe: (current: Task[]) => Task[]) {
    setAppState((currentState) =>
      finalizeAppData({
        tasks: recipe(currentState.tasks),
        captureItems: currentState.captureItems,
        suggestionSets: currentState.suggestionSets,
      }),
    )
  }

  function updateCaptureItems(recipe: (current: CaptureItem[]) => CaptureItem[]) {
    setAppState((currentState) =>
      finalizeAppData({
        tasks: currentState.tasks,
        captureItems: recipe(currentState.captureItems),
        suggestionSets: currentState.suggestionSets,
      }),
    )
  }

  function updateAllSuggestionSets(
    recipe: (current: SuggestionSet[]) => SuggestionSet[],
  ) {
    setAppState((currentState) =>
      finalizeAppData({
        tasks: currentState.tasks,
        captureItems: currentState.captureItems,
        suggestionSets: recipe(currentState.suggestionSets),
      }),
    )
  }

  function handleCreateCapture(rawText: string) {
    const normalizedRawText = rawText.trim()

    if (!normalizedRawText) {
      return false
    }

    const timestamp = new Date().toISOString()
    const createdCaptureId = crypto.randomUUID()

    updateCaptureItems((current) =>
      createCaptureItem(current, normalizedRawText, timestamp, () => createdCaptureId),
    )

    startTransition(() => {
      setWorkspaceView('inbox')
      setSelectedCaptureItemId(createdCaptureId)
    })

    return true
  }

  function handleCreateTask(draft: TaskDraft) {
    if (!draft.title.trim()) {
      return false
    }

    const timestamp = new Date().toISOString()
    const createdTaskId = crypto.randomUUID()

    updateTasks((current) =>
      createTask(current, draft, timestamp, () => createdTaskId),
    )

    startTransition(() => {
      setWorkspaceView('board')
      setSelectedTaskId(createdTaskId)
    })

    return true
  }

  function handlePatchCaptureItem(itemId: string, rawText: string) {
    updateCaptureItems((current) =>
      patchCaptureItem(current, itemId, { rawText }),
    )
  }

  function handleDeleteCaptureItem(itemId: string) {
    updateCaptureItems((current) => deleteCaptureItem(current, itemId))
  }

  function handleCommitCaptureItemToTask(itemId: string, draft: TaskDraft) {
    const captureItem = captureItems.find((item) => item.id === itemId && !item.archivedAt)

    if (!captureItem || !draft.title.trim()) {
      return false
    }

    const timestamp = new Date().toISOString()
    const createdTaskId = crypto.randomUUID()

    setAppState((currentState) =>
      finalizeAppData({
        tasks: createTask(currentState.tasks, draft, timestamp, () => createdTaskId),
        captureItems: archiveCaptureItem(currentState.captureItems, itemId, timestamp),
        suggestionSets: currentState.suggestionSets,
      }),
    )

    startTransition(() => {
      setWorkspaceView('board')
      setSelectedTaskId(createdTaskId)
    })

    return true
  }

  function handlePatchTask(taskId: string, updates: TaskPatch) {
    updateTasks((current) => patchTask(current, taskId, updates))
  }

  function handleSetTaskStatus(taskId: string, status: TaskStatus) {
    updateTasks((current) => setTaskStatus(current, taskId, status))
  }

  function handleMoveTask(taskId: string, placement: MovePlacement) {
    updateTasks((current) => moveTask(current, taskId, placement))
  }

  function handleMoveTaskWithinStatus(taskId: string, direction: -1 | 1) {
    updateTasks((current) => moveTaskWithinStatus(current, taskId, direction))
  }

  function handleArchiveTask(taskId: string) {
    updateTasks((current) => archiveTask(current, taskId))
  }

  function handleRestoreTask(taskId: string) {
    updateTasks((current) => restoreTask(current, taskId))

    startTransition(() => {
      setWorkspaceView('board')
      setSelectedTaskId(taskId)
    })
  }

  function handleDeleteTask(taskId: string) {
    updateTasks((current) => deleteTask(current, taskId))
  }

  function handleStoreExpansionSuggestion(
    sourceEntityType: 'capture_item' | 'task',
    sourceEntityId: string,
    response: ExpandResponse,
  ) {
    updateAllSuggestionSets((current) =>
      recordExpansionSuggestion(current, {
        sourceEntityType,
        sourceEntityId,
        response,
      }),
    )
  }

  function handleStoreFailedExpansionSuggestion(
    sourceEntityType: 'capture_item' | 'task',
    sourceEntityId: string,
    errorMessage: string,
  ) {
    updateAllSuggestionSets((current) =>
      recordFailedExpansionSuggestion(current, {
        sourceEntityType,
        sourceEntityId,
        errorMessage,
      }),
    )
  }

  function handleRejectSuggestionSet(suggestionSetId: string) {
    const suggestionSet = suggestionSets.find((item) => item.id === suggestionSetId)

    if (!suggestionSet) {
      return
    }

    void (async () => {
      setAiActionError(null)

      try {
        const result = await rejectSuggestionWithAI(suggestionSetId, {
          kind: suggestionSet.kind,
        })

        updateAllSuggestionSets((current) =>
          result.kind === 'expansion'
            ? updateExpansionSuggestionStatus(
                current,
                suggestionSetId,
                result.reviewStatus,
                [],
                result.appliedAt,
              )
            : updateDecompositionSuggestionStatus(
                current,
                suggestionSetId,
                result.reviewStatus,
                [],
                result.appliedAt,
              ),
        )
      } catch (error) {
        setAiActionError(
          error instanceof Error ? error.message : 'Reject request failed.',
        )
      }
    })()
  }

  function handleStoreDecompositionSuggestion(
    taskId: string,
    response: DecomposeResponse,
  ) {
    updateAllSuggestionSets((current) =>
      recordDecompositionSuggestion(current, {
        sourceEntityId: taskId,
        response,
      }),
    )
  }

  function handleStoreFailedDecompositionSuggestion(
    taskId: string,
    errorMessage: string,
  ) {
    updateAllSuggestionSets((current) =>
      recordFailedDecompositionSuggestion(current, {
        sourceEntityId: taskId,
        errorMessage,
      }),
    )
  }

  function handleAcceptTaskExpansionSuggestion(
    suggestionSetId: string,
    taskId: string,
    _updates: TaskPatch,
    acceptedFields: ExpansionAcceptedField[],
  ) {
    const task = tasks.find((item) => item.id === taskId)
    const suggestionSet = suggestionSets.find(
      (item): item is Extract<SuggestionSet, { kind: 'expansion' }> =>
        item.id === suggestionSetId && item.kind === 'expansion',
    )

    if (!task || !suggestionSet?.payload || acceptedFields.length === 0) {
      return
    }

    const suggestionPayload = suggestionSet.payload

    void (async () => {
      setAiActionError(null)

      try {
        const result = await acceptExpansionSuggestionWithAI(suggestionSetId, {
          kind: 'expansion',
          sourceEntityType: 'task',
          sourceEntityId: taskId,
          acceptedFields,
          suggestion: suggestionPayload,
          currentDescription: task.description,
          fallbackTitle: task.title,
          sourceCaptureId: task.sourceCaptureId ?? null,
        })

        setAppState((currentState) =>
          finalizeAppData({
            tasks: result.taskPatch
              ? patchTask(
                  currentState.tasks,
                  taskId,
                  result.taskPatch,
                  result.appliedAt,
                )
              : currentState.tasks,
            captureItems: currentState.captureItems,
            suggestionSets: updateExpansionSuggestionStatus(
              currentState.suggestionSets,
              suggestionSetId,
              result.reviewStatus,
              result.acceptedFields,
              result.appliedAt,
            ),
          }),
        )
      } catch (error) {
        setAiActionError(
          error instanceof Error ? error.message : 'Accept request failed.',
        )
      }
    })()
  }

  function handleAcceptCaptureExpansionSuggestion(
    suggestionSetId: string,
    itemId: string,
    _draft: TaskDraft,
    acceptedFields: ExpansionAcceptedField[],
  ) {
    const captureItem = captureItems.find((item) => item.id === itemId && !item.archivedAt)
    const suggestionSet = suggestionSets.find(
      (item): item is Extract<SuggestionSet, { kind: 'expansion' }> =>
        item.id === suggestionSetId && item.kind === 'expansion',
    )

    if (!captureItem || !suggestionSet?.payload || acceptedFields.length === 0) {
      return false
    }

    const createdTaskId = crypto.randomUUID()
    const suggestionPayload = suggestionSet.payload
    const fallbackTitle = buildTaskDraftFromCapture(captureItem).title

    void (async () => {
      setAiActionError(null)

      try {
        const result = await acceptExpansionSuggestionWithAI(suggestionSetId, {
          kind: 'expansion',
          sourceEntityType: 'capture_item',
          sourceEntityId: itemId,
          acceptedFields,
          suggestion: suggestionPayload,
          currentDescription: '',
          fallbackTitle,
          sourceCaptureId: captureItem.id,
        })

        const taskDraft = result.taskDraft

        if (!taskDraft) {
          throw new Error('Accept response returned no task draft.')
        }

        setAppState((currentState) =>
          finalizeAppData({
            tasks: createTask(
              currentState.tasks,
              taskDraft,
              result.appliedAt,
              () => createdTaskId,
            ),
            captureItems: archiveCaptureItem(
              currentState.captureItems,
              itemId,
              result.appliedAt,
            ),
            suggestionSets: updateExpansionSuggestionStatus(
              currentState.suggestionSets,
              suggestionSetId,
              result.reviewStatus,
              result.acceptedFields,
              result.appliedAt,
            ),
          }),
        )

        startTransition(() => {
          setWorkspaceView('board')
          setSelectedTaskId(createdTaskId)
        })
      } catch (error) {
        setAiActionError(
          error instanceof Error ? error.message : 'Accept request failed.',
        )
      }
    })()

    return true
  }

  function handleAcceptTaskDecompositionSuggestion(
    suggestionSetId: string,
    taskId: string,
    acceptedFields: DecompositionAcceptedField[],
  ) {
    if (acceptedFields.length === 0) {
      return
    }

    const parentTask = tasks.find((task) => task.id === taskId)
    const suggestionSet = suggestionSets.find(
      (item): item is DecompositionSuggestionSet =>
        item.id === suggestionSetId && item.kind === 'decomposition',
    )

    if (!parentTask || !suggestionSet?.payload) {
      return
    }

    const suggestionPayload = suggestionSet.payload
    const existingSubtasks = getSubtasksForTask(tasks, taskId).map((subtask) => ({
      title: subtask.title,
      description: subtask.description,
      position: subtask.position,
    }))

    void (async () => {
      setAiActionError(null)

      try {
        const result = await acceptDecompositionSuggestionWithAI(suggestionSetId, {
          kind: 'decomposition',
          sourceEntityId: taskId,
          acceptedFields,
          suggestion: suggestionPayload,
          parentTask: {
            title: parentTask.title,
            description: parentTask.description,
            priority: parentTask.priority,
            dueAt: parentTask.dueAt,
          },
          existingSubtasks,
        })

        setAppState((currentState) =>
          finalizeAppData({
            tasks: [
              ...(result.taskPatch
                ? patchTask(
                    currentState.tasks,
                    taskId,
                    result.taskPatch,
                    result.appliedAt,
                  )
                : currentState.tasks),
              ...buildAcceptedSubtasks(taskId, result.subtaskDrafts, result.appliedAt),
            ],
            captureItems: currentState.captureItems,
            suggestionSets: updateDecompositionSuggestionStatus(
              currentState.suggestionSets,
              suggestionSetId,
              result.reviewStatus,
              result.acceptedFields,
              result.appliedAt,
            ),
          }),
        )
      } catch (error) {
        setAiActionError(
          error instanceof Error ? error.message : 'Accept request failed.',
        )
      }
    })()
  }

  function buildAcceptedSubtasks(
    parentTaskId: string,
    subtaskDrafts: Array<{
      title: string
      description: string
      priority: Task['priority']
      dueAt: string | null
      position: number
    }>,
    timestamp: string,
  ) {
    return subtaskDrafts.map((subtaskDraft) => ({
      id: crypto.randomUUID(),
      parentTaskId,
      sourceCaptureId: null,
      title: subtaskDraft.title,
      description: subtaskDraft.description,
      status: 'todo' as const,
      priority: subtaskDraft.priority,
      position: subtaskDraft.position,
      createdAt: timestamp,
      updatedAt: timestamp,
      completedAt: null,
      archivedAt: null,
      dueAt: subtaskDraft.dueAt,
    }))
  }

  return (
    <div className="app-shell">
      <Masthead
        captureCount={captureCount}
        openCount={openCount}
        urgentCount={urgentCount}
      />

      <section className="workspace">
        <TaskComposer
          onCreateCapture={handleCreateCapture}
          onCreateTask={handleCreateTask}
        />

        <main className="board-stage">
          {persistenceError ? (
            <div className="status-banner is-warning" role="status">
              <p>{persistenceError}</p>
            </div>
          ) : null}

          {aiActionError ? (
            <div className="status-banner is-warning" role="status">
              <p>{aiActionError}</p>
            </div>
          ) : null}

          <BoardFilters
            search={search}
            focusStatus={focusStatus}
            priorityFilter={priorityFilter}
            workspaceView={workspaceView}
            inboxCount={captureCount}
            archivedCount={archivedCount}
            dragDisabled={dragDisabled}
            onSearchChange={setSearch}
            onFocusStatusChange={setFocusStatus}
            onPriorityFilterChange={setPriorityFilter}
            onWorkspaceViewChange={setWorkspaceView}
          />

          {workspaceView === 'inbox' ? (
            <CaptureInbox
              items={filteredCaptureItems}
              totalCount={captureCount}
              selectedCaptureItemId={resolvedSelectedCaptureItemId}
              onSelectCaptureItem={setSelectedCaptureItemId}
              onCommitCaptureItem={(itemId) => {
                const captureItem = captureItems.find((item) => item.id === itemId)

                if (!captureItem) {
                  return
                }

                handleCommitCaptureItemToTask(
                  itemId,
                  buildTaskDraftFromCapture(captureItem),
                )
              }}
              onDeleteCaptureItem={handleDeleteCaptureItem}
            />
          ) : workspaceView === 'archive' ? (
            <ArchivedTasks
              tasks={filteredArchivedTasks}
              totalCount={archivedCount}
              selectedTaskId={resolvedSelectedTaskId}
              onSelectTask={setSelectedTaskId}
              onRestoreTask={handleRestoreTask}
              onDeleteTask={handleDeleteTask}
            />
          ) : (
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
          )}
        </main>

        {workspaceView === 'inbox' ? (
          <CaptureDetail
            selectedCaptureItem={selectedCaptureItem}
            suggestionSet={selectedCaptureSuggestionSet}
            captureCount={captureCount}
            onOpenBoard={() => setWorkspaceView('board')}
            onPatchCaptureItem={handlePatchCaptureItem}
            onDeleteCaptureItem={handleDeleteCaptureItem}
            onCommitCaptureItemToTask={handleCommitCaptureItemToTask}
            onStoreExpansionSuggestion={handleStoreExpansionSuggestion}
            onStoreFailedExpansionSuggestion={handleStoreFailedExpansionSuggestion}
            onAcceptCaptureExpansionSuggestion={handleAcceptCaptureExpansionSuggestion}
            onRejectSuggestionSet={handleRejectSuggestionSet}
          />
        ) : (
          <TaskDetail
            viewMode={workspaceView}
            selectedTask={selectedTask}
            expansionSuggestionSet={selectedTaskSuggestionSet}
            decompositionSuggestionSet={selectedTaskDecompositionSuggestionSet}
            subtasks={selectedTaskSubtasks}
            archivedCount={archivedCount}
            onOpenArchive={() => setWorkspaceView('archive')}
            onOpenBoard={() => setWorkspaceView('board')}
            onPatchTask={handlePatchTask}
            onSetTaskStatus={handleSetTaskStatus}
            onArchiveTask={handleArchiveTask}
            onRestoreTask={handleRestoreTask}
            onDeleteTask={handleDeleteTask}
            onStoreExpansionSuggestion={handleStoreExpansionSuggestion}
            onStoreFailedExpansionSuggestion={handleStoreFailedExpansionSuggestion}
            onAcceptTaskExpansionSuggestion={handleAcceptTaskExpansionSuggestion}
            onRejectSuggestionSet={handleRejectSuggestionSet}
            onStoreDecompositionSuggestion={handleStoreDecompositionSuggestion}
            onStoreFailedDecompositionSuggestion={
              handleStoreFailedDecompositionSuggestion
            }
            onAcceptTaskDecompositionSuggestion={
              handleAcceptTaskDecompositionSuggestion
            }
          />
        )}
      </section>
    </div>
  )
}

export default App
