import type {
  DecomposeRequest,
  DecomposeResponse,
  ExpandRequest,
  ExpandResponse,
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
