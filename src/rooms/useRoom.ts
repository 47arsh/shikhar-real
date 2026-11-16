import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import type { RoomSnapshot } from '../../shared/rooms'

const SEAT_KEY = 'shikhar:room:seat'

export interface RoomSeat {
  code: string
  playerId: string
  name: string
}

export type RoomConnection = 'connecting' | 'online' | 'offline'

interface AckResult {
  ok: boolean
  error?: string
  code?: string
  playerId?: string
  state?: RoomSnapshot
}

function readSeat(): RoomSeat | null {
  try {
    const raw = window.localStorage.getItem(SEAT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<RoomSeat>
    if (
      typeof parsed.code === 'string' &&
      typeof parsed.playerId === 'string' &&
      typeof parsed.name === 'string'
    ) {
      return { code: parsed.code, playerId: parsed.playerId, name: parsed.name }
    }
  } catch {
    // a broken seat is not a reason to stop climbing
  }
  return null
}

function writeSeat(seat: RoomSeat | null) {
  try {
    if (seat) window.localStorage.setItem(SEAT_KEY, JSON.stringify(seat))
    else window.localStorage.removeItem(SEAT_KEY)
  } catch {
    // private mode, no matter — the climb still happens
  }
}

export function useRoom(preferredCode = '') {
  const [room, setRoom] = useState<RoomSnapshot | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [connection, setConnection] = useState<RoomConnection>('connecting')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const seatRef = useRef<RoomSeat | null>(readSeat())

  const emitAck = useCallback(
    (event: string, payload: unknown): Promise<AckResult> => {
      const socket = socketRef.current
      if (!socket || !socket.connected) {
        return Promise.resolve({
          ok: false,
          error: 'Base camp is out of range. Give it a second.',
        })
      }
      return new Promise((resolve) => {
        socket.timeout(12000).emit(
          event,
          payload,
          (timeout: Error | null, response: AckResult) => {
            if (timeout) {
              resolve({ ok: false, error: 'The mountain is thinking. Try again.' })
              return
            }
            resolve(response ?? { ok: false, error: 'No answer from base camp.' })
          },
        )
      })
    },
    [],
  )

  useEffect(() => {
    const socket = io({ transports: ['websocket', 'polling'] })
    socketRef.current = socket

    const wanted = preferredCode.trim().toUpperCase()

    const rejoinSeat = () => {
      const saved = seatRef.current
      if (!saved) return
      if (wanted && saved.code !== wanted) return
      socket.timeout(12000).emit(
        'room:rejoin',
        { code: saved.code, playerId: saved.playerId },
        (timeout: Error | null, response: AckResult) => {
          if (!timeout && response?.ok && response.state) {
            setRoom(response.state)
            setPlayerId(saved.playerId)
            setError('')
            return
          }
          seatRef.current = null
          writeSeat(null)
          setPlayerId(null)
        },
      )
    }

    const onConnect = () => {
      setConnection('online')
      rejoinSeat()
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', () => setConnection('offline'))
    socket.on('room:state', (state: RoomSnapshot) => setRoom(state))
    if (socket.connected) onConnect()

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  const adopt = (response: AckResult, name: string): string | null => {
    if (!response.ok || !response.code || !response.playerId || !response.state) {
      setError(response.error ?? 'Could not open that room.')
      return null
    }
    const seat: RoomSeat = {
      code: response.code,
      playerId: response.playerId,
      name: name.trim(),
    }
    seatRef.current = seat
    writeSeat(seat)
    setPlayerId(seat.playerId)
    setRoom(response.state)
    setError('')
    return seat.code
  }

  const create = useCallback(
    async (name: string) => {
      setBusy(true)
      setError('')
      const response = await emitAck('room:create', { name })
      setBusy(false)
      return adopt(response, name)
    },
    [emitAck],
  )

  const join = useCallback(
    async (code: string, name: string) => {
      setBusy(true)
      setError('')
      const response = await emitAck('room:join', {
        code: code.trim().toUpperCase(),
        name,
      })
      setBusy(false)
      return adopt(response, name)
    },
    [emitAck],
  )

  const start = useCallback(async () => {
    setBusy(true)
    setError('')
    const response = await emitAck('room:start', {})
    setBusy(false)
    if (!response.ok) setError(response.error ?? 'Could not start the climb.')
    return response.ok
  }, [emitAck])

  const answer = useCallback(
    async (text: string) => {
      const response = await emitAck('room:answer', { text })
      if (!response.ok) setError(response.error ?? 'That answer did not make it up.')
      return response.ok
    },
    [emitAck],
  )

  const again = useCallback(async () => {
    setBusy(true)
    setError('')
    const response = await emitAck('room:again', {})
    setBusy(false)
    if (!response.ok) setError(response.error ?? 'Could not call another climb.')
    return response.ok
  }, [emitAck])

  const leave = useCallback(() => {
    const socket = socketRef.current
    if (socket?.connected) socket.emit('room:leave', {})
    seatRef.current = null
    writeSeat(null)
    setPlayerId(null)
    setRoom(null)
    setError('')
  }, [])

  const clearError = useCallback(() => setError(''), [])

  return {
    room,
    playerId,
    connection,
    error,
    busy,
    create,
    join,
    start,
    answer,
    again,
    leave,
    clearError,
  }
}
