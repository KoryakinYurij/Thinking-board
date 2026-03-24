import { z } from 'zod'

export const expandSourceEntityTypeSchema = z.enum(['capture_item', 'task'])

export const expandTaskSnapshotSchema = z
  .object({
    title: z.string().min(1),
    description: z.string(),
    status: z.string().optional(),
    priority: z.string().optional(),
    dueAt: z.string().nullable().optional(),
  })
  .strict()

export const expandRequestSchema = z
  .object({
    sourceEntityType: expandSourceEntityTypeSchema,
    sourceEntityId: z.string().min(1).optional(),
    rawText: z.string().min(1),
    existingTask: expandTaskSnapshotSchema.optional(),
    contextDocuments: z.array(z.string()).default([]),
    schemaVersion: z.literal('v1').default('v1'),
  })
  .strict()

export const expansionOptionSchema = z
  .object({
    label: z.string().min(1),
    summary: z.string().min(1),
  })
  .strict()

export const expansionRiskSchema = z
  .object({
    label: z.string().min(1),
    impact: z.string().min(1),
  })
  .strict()

export const expandSuggestionSchema = z
  .object({
    summary: z.string().min(1),
    normalizedTitle: z.string().min(1),
    desiredOutcome: z.string().min(1),
    options: z.array(expansionOptionSchema),
    risks: z.array(expansionRiskSchema),
    assumptions: z.array(z.string().min(1)),
    constraints: z.array(z.string().min(1)),
    clarifyingQuestions: z.array(z.string().min(1)),
  })
  .strict()

export const expandResponseSchema = z
  .object({
    suggestionSetId: z.string().min(1),
    suggestion: expandSuggestionSchema,
    model: z.string().min(1),
    responseId: z.string().min(1).nullable(),
  })
  .strict()

export const decomposeTaskSnapshotSchema = z
  .object({
    title: z.string().min(1),
    description: z.string(),
    priority: z.string().optional(),
    dueAt: z.string().nullable().optional(),
  })
  .strict()

export const decomposeRequestSchema = z
  .object({
    taskId: z.string().min(1),
    taskSnapshot: decomposeTaskSnapshotSchema,
    acceptedContext: z.array(z.string()).default([]),
    constraints: z.array(z.string()).default([]),
    schemaVersion: z.literal('v1').default('v1'),
  })
  .strict()

export const decompositionSubtaskSchema = z
  .object({
    title: z.string().min(1),
    description: z.string(),
    suggestedPriority: z.enum(['high', 'medium', 'low']).nullable(),
    suggestedDueAt: z.string().nullable(),
  })
  .strict()

export const decompositionNextActionSchema = z
  .object({
    title: z.string().min(1),
    whyNow: z.string().min(1),
  })
  .strict()

export const decomposeSuggestionSchema = z
  .object({
    summary: z.string().min(1),
    subtasks: z.array(decompositionSubtaskSchema),
    nextActions: z.array(decompositionNextActionSchema),
    dependencies: z.array(z.string().min(1)),
    notes: z.array(z.string().min(1)),
  })
  .strict()

export const decomposeResponseSchema = z
  .object({
    suggestionSetId: z.string().min(1),
    suggestion: decomposeSuggestionSchema,
    model: z.string().min(1),
    responseId: z.string().min(1).nullable(),
  })
  .strict()

export const acceptedSuggestionReviewStatusSchema = z.enum([
  'accepted',
  'partially_accepted',
  'rejected',
])

export const taskPrioritySchema = z.enum(['high', 'medium', 'low'])

export const taskPatchWriteSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
  })
  .strict()

export const taskDraftWriteSchema = z
  .object({
    title: z.string().min(1),
    description: z.string(),
    priority: taskPrioritySchema,
    dueAt: z.string().nullable(),
    sourceCaptureId: z.string().nullable(),
  })
  .strict()

export const acceptedSubtaskDraftSchema = z
  .object({
    title: z.string().min(1),
    description: z.string(),
    priority: taskPrioritySchema,
    dueAt: z.string().nullable(),
    position: z.number(),
  })
  .strict()

export const currentSubtaskSnapshotSchema = z
  .object({
    title: z.string().min(1),
    description: z.string(),
    position: z.number(),
  })
  .strict()

export const acceptExpansionSuggestionRequestSchema = z
  .object({
    suggestionSetId: z.string().min(1),
    kind: z.literal('expansion'),
    sourceEntityType: expandSourceEntityTypeSchema,
    sourceEntityId: z.string().min(1),
    acceptedFields: z
      .array(z.enum(['normalized_title', 'description_notes']))
      .min(1),
    suggestion: expandSuggestionSchema,
    currentDescription: z.string().default(''),
    fallbackTitle: z.string().min(1),
    sourceCaptureId: z.string().nullable().optional(),
  })
  .strict()

export const acceptExpansionSuggestionResponseSchema = z
  .object({
    suggestionSetId: z.string().min(1),
    kind: z.literal('expansion'),
    reviewStatus: acceptedSuggestionReviewStatusSchema,
    acceptedFields: z.array(z.enum(['normalized_title', 'description_notes'])),
    taskPatch: taskPatchWriteSchema.nullable(),
    taskDraft: taskDraftWriteSchema.nullable(),
    appliedAt: z.string().min(1),
  })
  .strict()

export const acceptDecompositionSuggestionRequestSchema = z
  .object({
    suggestionSetId: z.string().min(1),
    kind: z.literal('decomposition'),
    sourceEntityId: z.string().min(1),
    acceptedFields: z.array(z.enum(['subtasks', 'next_actions_notes'])).min(1),
    suggestion: decomposeSuggestionSchema,
    parentTask: z
      .object({
        title: z.string().min(1),
        description: z.string(),
        priority: taskPrioritySchema,
        dueAt: z.string().nullable(),
      })
      .strict(),
    existingSubtasks: z.array(currentSubtaskSnapshotSchema).default([]),
  })
  .strict()

export const acceptDecompositionSuggestionResponseSchema = z
  .object({
    suggestionSetId: z.string().min(1),
    kind: z.literal('decomposition'),
    reviewStatus: acceptedSuggestionReviewStatusSchema,
    acceptedFields: z.array(z.enum(['subtasks', 'next_actions_notes'])),
    taskPatch: taskPatchWriteSchema.nullable(),
    subtaskDrafts: z.array(acceptedSubtaskDraftSchema),
    appliedAt: z.string().min(1),
  })
  .strict()

export const rejectSuggestionRequestSchema = z
  .object({
    suggestionSetId: z.string().min(1),
    kind: z.enum(['expansion', 'decomposition']),
  })
  .strict()

export const rejectSuggestionResponseSchema = z
  .object({
    suggestionSetId: z.string().min(1),
    kind: z.enum(['expansion', 'decomposition']),
    reviewStatus: z.literal('rejected'),
    appliedAt: z.string().min(1),
  })
  .strict()

export type ExpandRequest = z.infer<typeof expandRequestSchema>
export type ExpandResponse = z.infer<typeof expandResponseSchema>
export type ExpandSuggestion = z.infer<typeof expandSuggestionSchema>
export type DecomposeRequest = z.infer<typeof decomposeRequestSchema>
export type DecomposeResponse = z.infer<typeof decomposeResponseSchema>
export type DecomposeSuggestion = z.infer<typeof decomposeSuggestionSchema>
export type DecompositionSubtask = z.infer<typeof decompositionSubtaskSchema>
export type TaskPriority = z.infer<typeof taskPrioritySchema>
export type CurrentSubtaskSnapshot = z.infer<typeof currentSubtaskSnapshotSchema>
export type AcceptExpansionSuggestionRequest = z.infer<
  typeof acceptExpansionSuggestionRequestSchema
>
export type AcceptExpansionSuggestionResponse = z.infer<
  typeof acceptExpansionSuggestionResponseSchema
>
export type AcceptDecompositionSuggestionRequest = z.infer<
  typeof acceptDecompositionSuggestionRequestSchema
>
export type AcceptDecompositionSuggestionResponse = z.infer<
  typeof acceptDecompositionSuggestionResponseSchema
>
export type RejectSuggestionRequest = z.infer<
  typeof rejectSuggestionRequestSchema
>
export type RejectSuggestionResponse = z.infer<
  typeof rejectSuggestionResponseSchema
>
