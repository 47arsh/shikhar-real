import {
  START_OXYGEN,
  SUMMIT_METRES,
  type JudgeResult,
  type Prompt,
} from '../../shared/game'
import { altitudeOutcome, oxygenAfter } from '../../shared/scoring'

export const REST_METRES = 150
export const REST_OXYGEN = 2

export type ClimbPhase = 'base' | 'asking' | 'reveal' | 'summit'

export interface ClimbRound {
  prompt: Prompt
  answer: string
  points: number
  label: string
  gain: number
  slide: number
  rest: number
  timedOut: boolean
  hits: number | null
  source: JudgeResult['source'] | null
  reaction: string
  note?: string
}

export interface ClimbState {
  phase: ClimbPhase
  altitude: number
  oxygen: number
  rounds: ClimbRound[]
  best: ClimbRound | null
}

export type ClimbAction =
  | { type: 'start' }
  | { type: 'answer'; prompt: Prompt; answer: string; result: JudgeResult | null }
  | { type: 'next' }

export const initialClimb: ClimbState = {
  phase: 'base',
  altitude: 0,
  oxygen: START_OXYGEN,
  rounds: [],
  best: null,
}

export const TIMEOUT_REACTION = 'The clock took that one. It does that.'

export function climbReducer(
  state: ClimbState,
  action: ClimbAction,
  total: number,
): ClimbState {
  switch (action.type) {
    case 'start':
      return { ...initialClimb, phase: 'asking' }

    case 'next':
      return {
        ...state,
        phase: state.rounds.length >= total ? 'summit' : 'asking',
      }

    case 'answer': {
      const { prompt, result } = action
      const points = result?.points ?? 0
      const outcome = altitudeOutcome(points, state.altitude)
      let altitude = Math.min(SUMMIT_METRES, state.altitude + outcome.net)
      let oxygen = oxygenAfter(state.oxygen, points)
      let rest = 0

      if (oxygen === 0 && state.rounds.length + 1 < total) {
        rest = Math.min(REST_METRES, altitude)
        altitude -= rest
        oxygen = REST_OXYGEN
      }

      const round: ClimbRound = {
        prompt,
        answer: action.answer,
        points,
        label: result?.label ?? 'No answer',
        gain: outcome.gain,
        slide: outcome.slide,
        rest,
        timedOut: result === null,
        hits: result?.hits ?? null,
        source: result?.source ?? null,
        reaction: result?.reaction ?? TIMEOUT_REACTION,
        note: result?.note,
      }

      const rounds = [...state.rounds, round]
      const best = state.best && state.best.points >= round.points ? state.best : round
      const finished = altitude >= SUMMIT_METRES

      return {
        ...state,
        phase: finished ? 'summit' : 'reveal',
        altitude,
        oxygen,
        rounds,
        best,
      }
    }
  }
}

const STORAGE_PREFIX = 'shikhar:daily:'

export interface SavedClimb {
  date: string
  last: number
  best: number
  bestAnswer: string
  bestLabel: string
  at: number
}

export function readSavedClimb(date: string): SavedClimb | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + date)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SavedClimb>
    if (typeof parsed.last !== 'number' || typeof parsed.best !== 'number') return null
    return {
      date,
      last: parsed.last,
      best: parsed.best,
      bestAnswer: typeof parsed.bestAnswer === 'string' ? parsed.bestAnswer : '',
      bestLabel: typeof parsed.bestLabel === 'string' ? parsed.bestLabel : '',
      at: typeof parsed.at === 'number' ? parsed.at : 0,
    }
  } catch {
    return null
  }
}

export function writeSavedClimb(
  date: string,
  state: ClimbState,
  previous: SavedClimb | null,
): SavedClimb {
  const record: SavedClimb = {
    date,
    last: state.altitude,
    best: Math.max(state.altitude, previous?.best ?? 0),
    bestAnswer: state.best?.answer ?? previous?.bestAnswer ?? '',
    bestLabel: state.best?.label ?? previous?.bestLabel ?? '',
    at: Date.now(),
  }
  try {
    localStorage.setItem(STORAGE_PREFIX + date, JSON.stringify(record))
  } catch {
    // private mode, full storage, no matter — the climb still happened
  }
  return record
}
