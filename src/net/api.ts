import type { JudgeResult } from '../../shared/game'

export interface JudgeResponse {
  result?: JudgeResult
  error?: string
}

export async function requestJudge(
  promptId: string,
  answer: string,
): Promise<JudgeResponse> {
  let response: Response
  try {
    response = await fetch('/api/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptId, answer }),
    })
  } catch {
    return { error: 'No signal up here. Give it one more go.' }
  }

  const data = (await response.json().catch(() => null)) as JudgeResponse | null
  if (!response.ok) {
    return { error: data?.error ?? 'The mountain is thinking. Try again.' }
  }
  return data ?? { error: 'The mountain is thinking. Try again.' }
}
