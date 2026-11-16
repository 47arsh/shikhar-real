import { describe, expect, it } from 'vitest'
import type { JudgeResult, Prompt } from '../../shared/game'
import { climbReducer, initialClimb } from './solo'

const prompt = (id: string): Prompt => ({ id, text: 'Name a fruit.', category: 'fruit' })

const result = (points: 75 | 100): JudgeResult => ({
  answer: 'x',
  reading: 'x',
  accepted: true,
  points,
  label: 'Test',
  altitudeGain: points * 10,
  slide: 0,
  hits: 9,
  source: 'wikipedia',
  reaction: 'ok',
})

function playAnswer(
  state: Parameters<typeof climbReducer>[0],
  id: string,
  points: 75 | 100,
  total: number,
) {
  return climbReducer(
    state,
    { type: 'answer', prompt: prompt(id), answer: 'x', result: result(points) },
    total,
  )
}

describe('climbReducer', () => {
  it('shows the last verdict before the summit report', () => {
    let state = climbReducer(initialClimb, { type: 'start' }, 2)
    state = playAnswer(state, 'p1', 75, 2)
    expect(state.phase).toBe('reveal')

    state = climbReducer(state, { type: 'next' }, 2)
    expect(state.phase).toBe('asking')

    state = playAnswer(state, 'p2', 100, 2)
    expect(state.phase).toBe('reveal')
    expect(state.rounds).toHaveLength(2)

    state = climbReducer(state, { type: 'next' }, 2)
    expect(state.phase).toBe('summit')
  })

  it('shows a verdict for a timed-out final prompt too', () => {
    let state = climbReducer(initialClimb, { type: 'start' }, 1)
    state = climbReducer(
      state,
      { type: 'answer', prompt: prompt('p1'), answer: '', result: null },
      1,
    )
    expect(state.phase).toBe('reveal')
    expect(state.rounds[0].label).toBe('No answer')

    state = climbReducer(state, { type: 'next' }, 1)
    expect(state.phase).toBe('summit')
  })

  it('ends at the summit as soon as 7,000 m is reached', () => {
    let state = climbReducer(initialClimb, { type: 'start' }, 7)
    for (let i = 0; i < 7; i += 1) {
      state = playAnswer(state, `p${i}`, 100, 7)
    }
    expect(state.altitude).toBe(7000)
    expect(state.phase).toBe('summit')
  })
})
