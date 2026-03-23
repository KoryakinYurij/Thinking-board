# AI API And Structured Output Contracts

## Purpose

This document defines the MVP contract for built-in AI actions so the frontend, backend, and future agents use the same shape and safety rules.

## Provider Strategy For MVP

The MVP uses a backend `LLM` layer that keeps the frontend provider-agnostic while preserving the same safety bar:
- official OpenAI Node SDK on the server
- `Responses API`
- `text.format` with `json_schema` and `strict: true` for structured generation
- manual server-side validation against the shared Zod contracts before suggestion output is accepted as app data

Supported providers:
- OpenAI via `OPENAI_API_KEY`
- OpenRouter via `OPENROUTER_API_KEY`

Provider selection rules:
- `LLM_PROVIDER=openai` forces OpenAI
- `LLM_PROVIDER=openrouter` forces OpenRouter
- if no explicit provider is set, the server auto-detects a configured provider

Important:
- the frontend still must not know provider-specific request details
- the server must not rely on SDK auto-parse helpers as the only safety mechanism
- strict schema generation remains required even when the provider changes

## Design Principles

- AI should return structured output, not only prose
- AI generation should not directly mutate canonical task data
- acceptance should be a separate explicit write
- prompts, outputs, and acceptance events should be traceable
- failed AI operations should not leave partial committed writes
- frontend must not call LLM providers directly

## MVP Actions

### Expand

Intent:
- improve clarity around a capture item or task

Expected output sections:
- normalized title
- concise summary
- desired outcome
- options
- risks
- assumptions
- constraints
- clarifying questions

### Decompose

Intent:
- turn a committed task into smaller executable steps

Expected output sections:
- brief plan summary
- ordered subtasks
- next actions
- optional dependencies
- optional effort hints

## Current Model Strategy

Current implementation uses provider-configured models:
- OpenAI default: `gpt-5`
- OpenRouter default: `openai/gpt-5`

These defaults can be overridden through environment variables.

Important:
- model choice is currently configuration-driven, not hard-coded per route
- smaller or alternate models should only be introduced after eval quality is measured

## Suggested Backend Endpoints

These are MVP server contracts:

- `POST /api/ai/expand`
- `POST /api/ai/decompose`
- `POST /api/ai/suggestions/:id/accept`
- `POST /api/ai/suggestions/:id/reject`

Recommended supporting routes:
- `GET /api/ai/suggestions/:id`
- `GET /api/ai/runs/:id`

## Example Input Shape

### Expand Request

- `source_entity_type`
- `source_entity_id`
- `raw_text`
- `existing_task`
- `context_documents`
- `schema_version`

### Decompose Request

- `task_id`
- `task_snapshot`
- `accepted_context`
- `constraints`
- `schema_version`

## Example Output Shape

### Expansion Suggestion Set

- `kind`
- `summary`
- `normalized_title`
- `desired_outcome`
- `options`
- `risks`
- `assumptions`
- `constraints`
- `clarifying_questions`

Recommended app-level field shapes:
- `options`: array of `{ label, summary }`
- `risks`: array of `{ label, impact }`
- `assumptions`: array of strings
- `constraints`: array of strings
- `clarifying_questions`: array of strings

### Decomposition Suggestion Set

- `kind`
- `summary`
- `subtasks`
- `next_actions`
- `dependencies`
- `notes`

Recommended subtask shape:
- `title`
- `description`
- `suggested_priority`
- `suggested_due_at`

Recommended next action shape:
- `title`
- `why_now`

## Request Strategy

### Expand

Use:
- `responses.create`
- provider-configured model
- `text.format.type: "json_schema"`
- `text.format.strict: true`
- no tool calling in the first slice unless retrieval is required

Recommended schema root fields:
- `summary`
- `normalized_title`
- `desired_outcome`
- `options`
- `risks`
- `assumptions`
- `constraints`
- `clarifying_questions`

### Decompose

Use:
- `responses.create`
- provider-configured model
- `text.format.type: "json_schema"`
- `text.format.strict: true`
- no background mode is currently implemented in the server layer

Recommended schema root fields:
- `summary`
- `subtasks`
- `next_actions`
- `dependencies`
- `notes`

### File Search

Do not use by default in the first slice.

Enable only when:
- the user explicitly wants project-file grounding
- the app already stores relevant files or notes
- evals show that context-free output is not good enough

When enabled:
- use provider-specific hosted retrieval only through the backend LLM layer
- scope search to explicit vector stores only

## Acceptance Rules

- acceptance may be partial
- selected fields only should be written
- accepted decomposition items should become canonical subtasks or task updates
- acceptance must update the suggestion set review status
- canonical task writes must remain auditable
- the server, not the model, decides the final write payload

## Persistence Rules

- persist the source entity id and type
- persist prompt version or contract version
- persist the raw structured output
- persist the review state
- persist the acceptance result
- persist the provider model id used for the run
- persist the upstream provider response id when available

## Failure Rules

- AI generation failure should create a visible recoverable state
- parse failure should not create canonical writes
- acceptance failure should keep the suggestion set reviewable
- retries must not duplicate accepted writes
- unsupported-schema failures should fail fast on the server before bad writes are attempted

## Server Validation Rules

- validate incoming app payloads before calling the provider
- validate model output against the same schema before storing it as a suggestion set
- reject partial malformed outputs instead of guessing missing fields
- version schemas so old suggestion sets remain interpretable

## Frontend Boundary

The frontend should only know about:
- app-level request DTOs
- app-level suggestion DTOs
- app-level acceptance DTOs

The frontend should not know:
- the provider SDK call shape
- raw provider auth handling
- vector store ids
- provider-specific retry logic

## Security Boundary

- frontend must not require direct model secrets
- model calls should go through backend or BFF infrastructure
- sensitive project context should be scoped intentionally
