import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ROOM_REVEAL_MS,
  ROOM_ROUND_MS,
  type RoomSnapshot,
} from '../shared/rooms'
import type { Prompt } from '../shared/game'
import type { JudgeOutcome } from './judge'
import { RoomManager } from './rooms'

function judge(_prompt: Prompt, raw: string): Promise<JudgeOutcome> {
  if (raw === 'bad') return Promise.resolve({ error: 'That is not a thing, beta.' })
  const rare = raw === 'rare'
  return Promise.resolve({
    result: {
      answer: raw,
      reading: raw.toLowerCase(),
      accepted: true,
      points: rare ? 100 : 75,
      label: rare ? 'One in a Lakh' : 'Summit-pusher',
      altitudeGain: rare ? 1000 : 750,
      slide: 0,
      hits: 12,
      source: 'wikipedia',
      reaction: 'ok',
    },
  })
}

function setup() {
  const states: RoomSnapshot[] = []
  const manager = new RoomManager({
    onChange: (state) => states.push(state),
    judge,
  })
  const last = () => states[states.length - 1]
  return { manager, states, last }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-16T09:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('RoomManager', () => {
  it('creates a room with a four-letter code and seats the host', () => {
    const { manager } = setup()
    const created = manager.create('Asha')

    expect(created.ok).toBe(true)
    if (!created.ok) return
    expect(created.code).toMatch(/^[A-Z]{4}$/)
    expect(created.state.phase).toBe('lobby')
    expect(created.state.hostId).toBe(created.playerId)
    expect(created.state.players).toMatchObject([{ name: 'Asha', host: true }])
  })

  it('joins by code, rejects unknown codes and extra players past eight', () => {
    const { manager } = setup()
    const created = manager.create('Asha')
    if (!created.ok) throw new Error('setup failed')

    expect(manager.join('ZZZZ', 'Nobody').ok).toBe(false)

    const joined = manager.join(created.code.toLowerCase(), 'Bilal')
    expect(joined.ok).toBe(true)
    if (!joined.ok) return
    expect(joined.state.players).toHaveLength(2)

    for (let index = 0; index < 6; index += 1) {
      expect(manager.join(created.code, `Friend ${index}`).ok).toBe(true)
    }
    const ninth = manager.join(created.code, 'One too many')
    expect(ninth).toMatchObject({ ok: false })
  })

  it('only lets the host start, and gives everyone the same timed prompts', () => {
    const { manager, last } = setup()
    const host = manager.create('Asha')
    if (!host.ok) throw new Error('setup failed')
    const guest = manager.join(host.code, 'Bilal')
    if (!guest.ok) throw new Error('setup failed')

    expect(manager.start(host.code, guest.playerId)).toMatchObject({ ok: false })

    const started = manager.start(host.code, host.playerId)
    expect(started.ok).toBe(true)
    const state = last()
    expect(state.phase).toBe('round')
    expect(state.total).toBe(7)
    expect(state.prompt).not.toBeNull()
    expect(state.deadline).toBe(Date.now() + ROOM_ROUND_MS)
  })

  it('scores an answer immediately and reveals when everyone has answered', async () => {
    const { manager, last } = setup()
    const host = manager.create('Asha')
    if (!host.ok) throw new Error('setup failed')
    manager.start(host.code, host.playerId)

    const answered = await manager.answer(host.code, host.playerId, 'rare')
    expect(answered.ok).toBe(true)
    expect(last().phase).toBe('round')
    expect(last().players[0]).toMatchObject({ altitude: 1000, answered: true })

    vi.advanceTimersByTime(700)
    const reveal = last()
    expect(reveal.phase).toBe('reveal')
    expect(reveal.players[0].history).toHaveLength(1)
    expect(reveal.players[0].history[0]).toMatchObject({
      points: 100,
      net: 1000,
      timedOut: false,
      text: 'rare',
    })
    expect(reveal.deadline).toBe(Date.now() + ROOM_REVEAL_MS)

    vi.advanceTimersByTime(ROOM_REVEAL_MS)
    expect(last().phase).toBe('round')
    expect(last().round).toBe(1)
    expect(last().players[0].answered).toBe(false)
  })

  it('closes on the deadline and slides idle climbers down', async () => {
    const { manager, last } = setup()
    const host = manager.create('Asha')
    if (!host.ok) throw new Error('setup failed')
    const guest = manager.join(host.code, 'Bilal')
    if (!guest.ok) throw new Error('setup failed')
    manager.start(host.code, host.playerId)

    await manager.answer(host.code, host.playerId, 'rare')
    await manager.answer(host.code, guest.playerId, 'rare')
    vi.advanceTimersByTime(700)
    vi.advanceTimersByTime(ROOM_REVEAL_MS)

    await manager.answer(host.code, host.playerId, 'rare')
    vi.advanceTimersByTime(ROOM_ROUND_MS)

    const reveal = last()
    expect(reveal.phase).toBe('reveal')
    const idle = reveal.players.find((player) => player.id === guest.playerId)
    expect(idle?.history.at(-1)).toMatchObject({
      timedOut: true,
      points: 0,
      slide: 60,
      net: -60,
    })
    expect(idle?.altitude).toBe(940)
    const climber = reveal.players.find((player) => player.id === host.playerId)
    expect(climber?.altitude).toBe(2000)
  })

  it('does not burn a round when the judge rejects an answer', async () => {
    const { manager, last } = setup()
    const host = manager.create('Asha')
    if (!host.ok) throw new Error('setup failed')
    manager.start(host.code, host.playerId)

    const rejected = await manager.answer(host.code, host.playerId, 'bad')
    expect(rejected).toMatchObject({ ok: false })
    expect(last().players[0].answered).toBe(false)

    const accepted = await manager.answer(host.code, host.playerId, 'rare')
    expect(accepted.ok).toBe(true)
    expect(last().players[0].answered).toBe(true)
  })

  it('refuses answers after the deadline without closing early', async () => {
    const { manager } = setup()
    const host = manager.create('Asha')
    if (!host.ok) throw new Error('setup failed')
    manager.start(host.code, host.playerId)

    vi.setSystemTime(Date.now() + ROOM_ROUND_MS + 1)
    const late = await manager.answer(host.code, host.playerId, 'rare')
    expect(late).toMatchObject({ ok: false, error: 'Time is up on that one.' })
  })

  it('hands the room to a connected player when the host drops', () => {
    const { manager, last } = setup()
    const host = manager.create('Asha')
    if (!host.ok) throw new Error('setup failed')
    const guest = manager.join(host.code, 'Bilal')
    if (!guest.ok) throw new Error('setup failed')

    manager.disconnect(host.code, host.playerId)
    expect(last().hostId).toBe(guest.playerId)
    expect(last().players.find((player) => player.id === host.playerId)?.connected).toBe(
      false,
    )
  })

  it('pauses when everyone drops and resumes on rejoin', async () => {
    const { manager, last } = setup()
    const host = manager.create('Asha')
    if (!host.ok) throw new Error('setup failed')
    manager.start(host.code, host.playerId)

    vi.advanceTimersByTime(10_000)
    manager.disconnect(host.code, host.playerId)
    vi.advanceTimersByTime(ROOM_ROUND_MS * 2)
    expect(last().phase).toBe('round')

    const rejoined = manager.rejoin(host.code, host.playerId)
    expect(rejoined.ok).toBe(true)
    expect(last().deadline).toBe(Date.now() + (ROOM_ROUND_MS - 10_000))

    vi.advanceTimersByTime(ROOM_ROUND_MS - 10_000)
    expect(last().phase).toBe('reveal')
  })

  it('runs seven rounds to the summit and can start again', async () => {
    const { manager, last } = setup()
    const host = manager.create('Asha')
    if (!host.ok) throw new Error('setup failed')
    manager.start(host.code, host.playerId)

    for (let round = 0; round < 7; round += 1) {
      await manager.answer(host.code, host.playerId, 'rare')
      vi.advanceTimersByTime(700)
      expect(last().phase).toBe('reveal')
      vi.advanceTimersByTime(ROOM_REVEAL_MS)
    }

    const summit = last()
    expect(summit.phase).toBe('summit')
    expect(summit.round).toBe(7)
    expect(summit.players[0].altitude).toBe(7000)
    expect(summit.players[0].history).toHaveLength(7)

    expect(manager.again(host.code, host.playerId).ok).toBe(true)
    const lobby = last()
    expect(lobby.phase).toBe('lobby')
    expect(lobby.players[0]).toMatchObject({ altitude: 0, history: [], best: 0 })
  })
})
