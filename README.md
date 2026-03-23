# AI Task Execution App

AI-assisted task execution app with disciplined execution surfaces.

## Stack

- React
- TypeScript
- Vite
- Express server
- OpenAI Node SDK

## Product stance

- `AI-assisted task execution app`
- capture first
- expansion and decomposition are distinct AI actions
- accepted work is executed through list, focus, and kanban surfaces
- board columns are a projection of committed task status

## Commands

```bash
npm install
npm run dev         # client dev server
npm run dev:server  # API server
npm run build
npm run lint
npm test
```

## LLM Configuration

Current implementation supports these backend providers:
- OpenRouter via `OPENROUTER_API_KEY`
- OpenAI via `OPENAI_API_KEY`

Optional configuration:
- `LLM_PROVIDER=openrouter|openai`
- `OPENROUTER_MODEL`, `OPENROUTER_BASE_URL`, `OPENROUTER_REFERER`, `OPENROUTER_TITLE`
- `OPENAI_MODEL`, `OPENAI_BASE_URL`

Current auto-detection behavior:
- prefers OpenRouter when both providers are configured
- otherwise uses the configured provider

AI requests go through the server under `/api/ai/*`; the frontend does not call the provider directly.

## Project docs

- `AGENTS.md`
- `docs/product/mvp-scope.md`
- `docs/product/ai-surface-and-user-flows.md`
- `docs/domain/todo-kanban-rules.md`
- `docs/domain/capture-expand-decompose-lifecycle.md`
- `docs/architecture/task-model-and-reorder-contracts.md`
- `docs/architecture/implementation-bridge.md`
- `docs/architecture/ai-api-and-structured-output-contracts.md`
- `docs/product/implementation-roadmap.md`
- `docs/qa/kanban-checklist.md`
- `docs/qa/ai-evals-checklist.md`
- `docs/handover.md`
