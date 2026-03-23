import type {
  AcceptDecompositionSuggestionRequest,
  AcceptDecompositionSuggestionResponse,
  AcceptExpansionSuggestionRequest,
  AcceptExpansionSuggestionResponse,
  DecomposeRequest,
  DecomposeResponse,
  ExpandRequest,
  ExpandResponse,
  RejectSuggestionRequest,
  RejectSuggestionResponse,
} from '../../../shared/ai/contracts'

export async function expandWithAI(input: ExpandRequest): Promise<ExpandResponse> {
  const response = await fetch('/api/ai/expand', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    let message = 'Expand request failed'

    try {
      const parsed = (await response.json()) as { error?: string }
      message = parsed.error || message
    } catch {
      const fallbackMessage = await response.text()
      message = fallbackMessage || message
    }

    throw new Error(message)
  }

  return (await response.json()) as ExpandResponse
}

export async function decomposeWithAI(
  input: DecomposeRequest,
): Promise<DecomposeResponse> {
  const response = await fetch('/api/ai/decompose', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    let message = 'Decompose request failed'

    try {
      const parsed = (await response.json()) as { error?: string }
      message = parsed.error || message
    } catch {
      const fallbackMessage = await response.text()
      message = fallbackMessage || message
    }

    throw new Error(message)
  }

  return (await response.json()) as DecomposeResponse
}

export async function acceptExpansionSuggestionWithAI(
  suggestionSetId: string,
  input: Omit<AcceptExpansionSuggestionRequest, 'suggestionSetId'>,
): Promise<AcceptExpansionSuggestionResponse> {
  const response = await fetch(`/api/ai/suggestions/${suggestionSetId}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Accept request failed'))
  }

  return (await response.json()) as AcceptExpansionSuggestionResponse
}

export async function acceptDecompositionSuggestionWithAI(
  suggestionSetId: string,
  input: Omit<AcceptDecompositionSuggestionRequest, 'suggestionSetId'>,
): Promise<AcceptDecompositionSuggestionResponse> {
  const response = await fetch(`/api/ai/suggestions/${suggestionSetId}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Accept request failed'))
  }

  return (await response.json()) as AcceptDecompositionSuggestionResponse
}

export async function rejectSuggestionWithAI(
  suggestionSetId: string,
  input: Omit<RejectSuggestionRequest, 'suggestionSetId'>,
): Promise<RejectSuggestionResponse> {
  const response = await fetch(`/api/ai/suggestions/${suggestionSetId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Reject request failed'))
  }

  return (await response.json()) as RejectSuggestionResponse
}

async function readErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const parsed = (await response.json()) as { error?: string }
    return parsed.error || fallbackMessage
  } catch {
    const fallbackText = await response.text()
    return fallbackText || fallbackMessage
  }
}
