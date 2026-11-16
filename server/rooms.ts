import { randomUUID } from 'node:crypto'
import {
  MAX_NAME_LENGTH,
  MAX_PLAYERS_PER_ROOM,
  ROOM_CODE_LENGTH,
  ROOM_IDLE_MS,
  ROOM_REVEAL_MS,
  ROOM_ROUND_MS,
  type RoomAck,
  type RoomPhase,
  type RoomPrompt,
  type RoomRoundView,
  type RoomSnapshot,
} from '../shared/rooms'
import {
  START_OXYGEN,
  TIMEOUT_REACTION,
  type JudgeResult,
  type Prompt,
} from '../shared/game'
import { dailyPrompts } from '../shared/prompts'
import { answerOutcome } from '../shared/scoring'
import { judgeAnswer, type JudgeOutcome } from './judge'

export type JudgeFn = (prompt: Prompt, raw: string) => Promise<JudgeOutcome>

export interface RoomManagerOptions {
  onChange: (state: RoomSnapshot) => void
  judge?: JudgeFn
  now?: () => number
}

interface PlayerAnswer {
  text: string
  result: JudgeResult
  gain: number
  slide: number
  rest: number
  net: number
}

interface RoomPlayerState {
  id: string
  name: string
  connected: boolean
  altitude: number
  oxygen: number
  best: number
  history: RoomRoundView[]
  current: PlayerAnswer | null
  pendingRound: number | null
}

interface PausedPhase {
  phase: 'round' | 'reveal'
  remaining: number
}

interface Room {
  code: string
  phase: RoomPhase
  hostId: string
  prompts: Prompt[]
  roundIndex: number
  deadline: number | null
  players: Map<string, RoomPlayerState>
  roundTimer: ReturnType<typeof setTimeout> | null
  revealTimer: ReturnType<typeof setTimeout> | null
  expiryTimer: ReturnType<typeof setTimeout> | null
  paused: PausedPhase | null
  closing: boolean
  closeAttempts: number
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const CLOSE_BEAT_MS = 700
const CLOSE_RETRY_MS = 300
const MAX_CLOSE_RETRIES = 20

function normalizeCode(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toUpperCase() : ''
}

function cleanName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const name = raw
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (name.length < 2 || name.length > MAX_NAME_LENGTH) return null
  return name
}

function snapshot(room: Room): RoomSnapshot {
  const prompt =
    room.phase === 'round' || room.phase === 'reveal'
      ? room.prompts[room.roundIndex]
      : null

  return {
    code: room.code,
    phase: room.phase,
    round: room.phase === 'summit' ? room.prompts.length : room.roundIndex,
    total: room.prompts.length,
    prompt: prompt ? { id: prompt.id, text: prompt.text } : null,
    deadline: room.deadline,
    hostId: room.hostId,
    players: [...room.players.values()].map((player) => ({
      id: player.id,
      name: player.name,
      altitude: player.altitude,
      oxygen: player.oxygen,
      connected: player.connected,
      host: player.id === room.hostId,
      answered: player.current !== null,
      best: player.best,
      history: player.history.map((round) => ({ ...round })),
    })),
  }
}

export class RoomManager {
  private rooms = new Map<string, Room>()
  private judge: JudgeFn
  private now: () => number
  private onChange: (state: RoomSnapshot) => void

  constructor(options: RoomManagerOptions) {
    this.judge = options.judge ?? judgeAnswer
    this.now = options.now ?? Date.now
    this.onChange = options.onChange
  }

  create(rawName: unknown): RoomAck<{ code: string; playerId: string; state: RoomSnapshot }> {
    const name = cleanName(rawName)
    if (!name) {
      return { ok: false, error: 'Pick a name between 2 and 18 characters.' }
    }

    const code = this.generateCode()
    const playerId = randomUUID()
    const room: Room = {
      code,
      phase: 'lobby',
      hostId: playerId,
      prompts: [],
      roundIndex: 0,
      deadline: null,
      players: new Map([
        [
          playerId,
          {
            id: playerId,
            name,
            connected: true,
            altitude: 0,
            oxygen: START_OXYGEN,
            best: 0,
            history: [],
            current: null,
            pendingRound: null,
          },
        ],
      ]),
      roundTimer: null,
      revealTimer: null,
      expiryTimer: null,
      paused: null,
      closing: false,
      closeAttempts: 0,
    }

    this.rooms.set(code, room)
    this.publish(room)
    return { ok: true, code, playerId, state: snapshot(room) }
  }

  join(
    rawCode: unknown,
    rawName: unknown,
  ): RoomAck<{ code: string; playerId: string; state: RoomSnapshot }> {
    const room = this.rooms.get(normalizeCode(rawCode))
    if (!room) return { ok: false, error: 'No room with that code. Check it again?' }

    const name = cleanName(rawName)
    if (!name) {
      return { ok: false, error: 'Pick a name between 2 and 18 characters.' }
    }
    if (room.phase !== 'lobby') {
      return { ok: false, error: 'That climb has already left base camp.' }
    }
    if (room.players.size >= MAX_PLAYERS_PER_ROOM) {
      return { ok: false, error: 'That room is full. Eight is the rope limit.' }
    }

    const playerId = randomUUID()
    room.players.set(playerId, {
      id: playerId,
      name,
      connected: true,
      altitude: 0,
      oxygen: START_OXYGEN,
      best: 0,
      history: [],
      current: null,
      pendingRound: null,
    })
    this.clearExpiry(room)
    this.publish(room)
    return { ok: true, code: room.code, playerId, state: snapshot(room) }
  }

  rejoin(rawCode: unknown, rawPlayerId: unknown): RoomAck<{ state: RoomSnapshot }> {
    const room = this.rooms.get(normalizeCode(rawCode))
    if (!room) return { ok: false, error: 'That room has melted away.' }

    const player = room.players.get(String(rawPlayerId))
    if (!player) return { ok: false, error: 'That seat is no longer in this room.' }

    player.connected = true
    this.clearExpiry(room)
    this.resume(room)
    this.publish(room)
    return { ok: true, state: snapshot(room) }
  }

  start(rawCode: unknown, playerId: string): RoomAck {
    const room = this.getRoom(rawCode)
    if (!room) return { ok: false, error: 'No room with that code.' }
    if (room.hostId !== playerId) {
      return { ok: false, error: 'Only the host can call the climb.' }
    }
    if (room.phase !== 'lobby') {
      return { ok: false, error: 'This climb has already started.' }
    }

    room.prompts = dailyPrompts()
    room.roundIndex = 0
    room.phase = 'round'
    room.closeAttempts = 0
    room.closing = false
    for (const player of room.players.values()) {
      player.altitude = 0
      player.oxygen = START_OXYGEN
      player.best = 0
      player.history = []
      player.current = null
      player.pendingRound = null
    }

    this.beginRound(room)
    return { ok: true }
  }

  async answer(rawCode: unknown, playerId: string, raw: unknown): Promise<RoomAck> {
    const room = this.getRoom(rawCode)
    if (!room) return { ok: false, error: 'That room is gone.' }
    if (room.phase !== 'round' || room.deadline === null) {
      return { ok: false, error: 'No prompt is open right now.' }
    }

    const player = room.players.get(playerId)
    if (!player) return { ok: false, error: 'You are not on this rope.' }
    if (player.current || player.pendingRound !== null) {
      return { ok: false, error: 'One answer per prompt.' }
    }
    if (this.now() > room.deadline) {
      return { ok: false, error: 'Time is up on that one.' }
    }

    const roundIndex = room.roundIndex
    const prompt = room.prompts[roundIndex]
    player.pendingRound = roundIndex

    let outcome: JudgeOutcome
    try {
      outcome = await this.judge(prompt, typeof raw === 'string' ? raw : '')
    } catch {
      player.pendingRound = null
      return { ok: false, error: 'The mountain is thinking. Try again.' }
    }

    player.pendingRound = null

    if (room.phase !== 'round' || room.roundIndex !== roundIndex) {
      return { ok: false, error: 'The round closed before that landed.' }
    }
    if ('error' in outcome) {
      return { ok: false, error: outcome.error }
    }

    const result = outcome.result
    const effects = answerOutcome(
      result.points,
      player.altitude,
      player.oxygen,
      roundIndex + 1 < room.prompts.length,
    )

    player.altitude = effects.altitude
    player.oxygen = effects.oxygen
    player.best = Math.max(player.best, result.points)
    player.current = {
      text: result.answer,
      result,
      gain: effects.gain,
      slide: effects.slide,
      rest: effects.rest,
      net: effects.net,
    }

    this.publish(room)
    if (this.allConnectedAnswered(room)) this.scheduleClose(room)
    return { ok: true }
  }

  again(rawCode: unknown, playerId: string): RoomAck {
    const room = this.getRoom(rawCode)
    if (!room) return { ok: false, error: 'That room is gone.' }
    if (room.hostId !== playerId) {
      return { ok: false, error: 'Only the host can call another climb.' }
    }
    if (room.phase !== 'summit') {
      return { ok: false, error: 'Finish this climb before starting another.' }
    }

    this.clearTimers(room)
    room.phase = 'lobby'
    room.prompts = []
    room.roundIndex = 0
    room.deadline = null
    room.closing = false
    room.closeAttempts = 0
    for (const player of room.players.values()) {
      player.altitude = 0
      player.oxygen = START_OXYGEN
      player.best = 0
      player.history = []
      player.current = null
      player.pendingRound = null
    }

    this.publish(room)
    return { ok: true }
  }

  disconnect(rawCode: unknown, playerId: string) {
    const room = this.getRoom(rawCode)
    if (!room) return
    const player = room.players.get(playerId)
    if (!player || !player.connected) return

    player.connected = false
    player.pendingRound = null

    if (room.hostId === playerId) {
      const next = [...room.players.values()].find((candidate) => candidate.connected)
      if (next) room.hostId = next.id
    }

    if (![...room.players.values()].some((candidate) => candidate.connected)) {
      this.pause(room)
      this.armExpiry(room)
    }

    this.publish(room)
  }

  leave(rawCode: unknown, playerId: string) {
    const room = this.getRoom(rawCode)
    if (!room) return
    if (!room.players.has(playerId)) return

    room.players.delete(playerId)

    if (room.players.size === 0) {
      this.clearTimers(room)
      this.clearExpiry(room)
      this.rooms.delete(room.code)
      return
    }

    if (room.hostId === playerId) {
      const next =
        [...room.players.values()].find((candidate) => candidate.connected) ??
        room.players.values().next().value
      if (next) room.hostId = next.id
    }

    if (![...room.players.values()].some((candidate) => candidate.connected)) {
      this.pause(room)
      this.armExpiry(room)
    }

    this.publish(room)
  }

  size(): number {
    return this.rooms.size
  }

  private getRoom(rawCode: unknown): Room | undefined {
    return this.rooms.get(normalizeCode(rawCode))
  }

  private generateCode(): string {
    for (let attempt = 0; attempt < 500; attempt += 1) {
      let code = ''
      for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
        code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
      }
      if (!this.rooms.has(code)) return code
    }
    throw new Error('Could not find a free room code.')
  }

  private beginRound(room: Room) {
    room.deadline = this.now() + ROOM_ROUND_MS
    room.roundTimer = setTimeout(() => this.requestClose(room.code), ROOM_ROUND_MS)
    this.publish(room)
  }

  private requestClose(code: string) {
    const room = this.rooms.get(code)
    if (!room || room.phase !== 'round') return

    room.roundTimer = null
    const pending = [...room.players.values()].some(
      (player) => player.pendingRound !== null,
    )
    if (pending && room.closeAttempts < MAX_CLOSE_RETRIES) {
      room.closeAttempts += 1
      room.roundTimer = setTimeout(() => this.requestClose(code), CLOSE_RETRY_MS)
      return
    }

    this.closeRound(room)
  }

  private scheduleClose(room: Room) {
    if (room.closing) return
    room.closing = true
    if (room.roundTimer) {
      clearTimeout(room.roundTimer)
      room.roundTimer = null
    }
    room.roundTimer = setTimeout(() => this.closeRoundRoom(room.code), CLOSE_BEAT_MS)
  }

  private closeRoundRoom(code: string) {
    const room = this.rooms.get(code)
    if (!room || room.phase !== 'round') return
    room.roundTimer = null
    this.closeRound(room)
  }

  private closeRound(room: Room) {
    if (room.phase !== 'round') return
    if (room.roundTimer) {
      clearTimeout(room.roundTimer)
      room.roundTimer = null
    }

    const prompt = room.prompts[room.roundIndex]
    const promptView: RoomPrompt = { id: prompt.id, text: prompt.text }
    const hasMoreRounds = room.roundIndex + 1 < room.prompts.length

    for (const player of room.players.values()) {
      let round: RoomRoundView

      if (player.current) {
        const { current } = player
        round = {
          round: room.roundIndex,
          prompt: promptView,
          text: current.text,
          points: current.result.points,
          label: current.result.label,
          gain: current.gain,
          slide: current.slide,
          rest: current.rest,
          net: current.net,
          timedOut: false,
          hits: current.result.hits,
          source: current.result.source,
          reaction: current.result.reaction,
        }
        player.current = null
      } else {
        const effects = answerOutcome(0, player.altitude, player.oxygen, hasMoreRounds)
        player.altitude = effects.altitude
        player.oxygen = effects.oxygen
        round = {
          round: room.roundIndex,
          prompt: promptView,
          text: '',
          points: 0,
          label: 'No answer',
          gain: effects.gain,
          slide: effects.slide,
          rest: effects.rest,
          net: effects.net,
          timedOut: true,
          hits: null,
          source: null,
          reaction: TIMEOUT_REACTION,
        }
      }

      player.history.push(round)
    }

    room.phase = 'reveal'
    room.deadline = this.now() + ROOM_REVEAL_MS
    room.closing = false
    room.revealTimer = setTimeout(() => this.advance(room.code), ROOM_REVEAL_MS)
    this.publish(room)
  }

  private advance(code: string) {
    const room = this.rooms.get(code)
    if (!room || room.phase !== 'reveal') return

    room.revealTimer = null

    if (room.roundIndex + 1 >= room.prompts.length) {
      room.phase = 'summit'
      room.deadline = null
      this.publish(room)
      return
    }

    room.roundIndex += 1
    room.phase = 'round'
    room.closeAttempts = 0
    room.closing = false
    this.beginRound(room)
  }

  private allConnectedAnswered(room: Room): boolean {
    const connected = [...room.players.values()].filter((player) => player.connected)
    return connected.length > 0 && connected.every((player) => player.current !== null)
  }

  private pause(room: Room) {
    if (room.phase !== 'round' && room.phase !== 'reveal') return
    const remaining = Math.max(0, (room.deadline ?? this.now()) - this.now())
    room.paused = { phase: room.phase, remaining }
    if (room.roundTimer) {
      clearTimeout(room.roundTimer)
      room.roundTimer = null
    }
    if (room.revealTimer) {
      clearTimeout(room.revealTimer)
      room.revealTimer = null
    }
    room.deadline = null
  }

  private resume(room: Room) {
    const paused = room.paused
    if (!paused) return

    room.paused = null
    room.deadline = this.now() + paused.remaining
    if (paused.phase === 'round') {
      room.roundTimer = setTimeout(
        () => this.requestClose(room.code),
        paused.remaining,
      )
    } else {
      room.revealTimer = setTimeout(() => this.advance(room.code), paused.remaining)
    }
  }

  private clearTimers(room: Room) {
    if (room.roundTimer) clearTimeout(room.roundTimer)
    if (room.revealTimer) clearTimeout(room.revealTimer)
    room.roundTimer = null
    room.revealTimer = null
  }

  private armExpiry(room: Room) {
    this.clearExpiry(room)
    room.expiryTimer = setTimeout(() => {
      if ([...room.players.values()].some((player) => player.connected)) return
      this.clearTimers(room)
      this.rooms.delete(room.code)
    }, ROOM_IDLE_MS)
  }

  private clearExpiry(room: Room) {
    if (room.expiryTimer) {
      clearTimeout(room.expiryTimer)
      room.expiryTimer = null
    }
  }

  private publish(room: Room) {
    this.onChange(snapshot(room))
  }
}
