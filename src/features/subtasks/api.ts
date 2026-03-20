import type { DecomposeRequest, DecomposeResponse } from '../../../shared/ai/contracts'

export async function decomposeTaskWithAI(
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
