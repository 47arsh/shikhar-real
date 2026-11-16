import { PROMPT_SECONDS, type RaritySource } from './game'

export const MAX_PLAYERS_PER_ROOM = 8
export const ROOM_CODE_LENGTH = 4
export const ROOM_ROUND_MS = PROMPT_SECONDS * 1000
export const ROOM_REVEAL_MS = 6000
export const ROOM_IDLE_MS = 15 * 60 * 1000
export const MAX_NAME_LENGTH = 18

export type RoomPhase = 'lobby' | 'round' | 'reveal' | 'summit'

export interface RoomPrompt {
  id: string
  text: string
}

export interface RoomRoundView {
  round: number
  prompt: RoomPrompt
  text: string
  points: number
  label: string
  gain: number
  slide: number
  rest: number
  net: number
  timedOut: boolean
  hits: number | null
  source: RaritySource | null
  reaction: string
}

export interface RoomPlayerView {
  id: string
  name: string
  altitude: number
  oxygen: number
  connected: boolean
  host: boolean
  answered: boolean
  best: number
  history: RoomRoundView[]
}

export interface RoomSnapshot {
  code: string
  phase: RoomPhase
  round: number
  total: number
  prompt: RoomPrompt | null
  deadline: number | null
  hostId: string
  players: RoomPlayerView[]
}

export type RoomAck<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string }
