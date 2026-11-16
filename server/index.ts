import express from 'express'
import { createServer } from 'node:http'
import { resolve } from 'node:path'
import { Server } from 'socket.io'
import { PROMPTS, promptById } from '../shared/prompts'
import { judgeAnswer } from './judge'
import { RoomManager } from './rooms'

const app = express()
app.use(express.json({ limit: '4kb' }))

const attempts = new Map<string, number[]>()

function allowAttempt(ip: string): boolean {
  const now = Date.now()
  const recent = (attempts.get(ip) ?? []).filter((at) => now - at < 60_000)
  if (recent.length >= 40) {
    attempts.set(ip, recent)
    return false
  }
  recent.push(now)
  attempts.set(ip, recent)
  return true
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'shikhar', prompts: PROMPTS.length })
})

app.post('/api/judge', async (req, res) => {
  const ip = req.ip ?? 'unknown'
  if (!allowAttempt(ip)) {
    res.status(429).json({ error: 'Too many answers at once. Breathe.' })
    return
  }

  const body = req.body as { promptId?: unknown; answer?: unknown }
  const prompt = typeof body?.promptId === 'string' ? promptById(body.promptId) : undefined
  if (!prompt) {
    res.status(400).json({ error: 'Unknown prompt.' })
    return
  }
  const answer = typeof body.answer === 'string' ? body.answer : ''

  try {
    const outcome = await judgeAnswer(prompt, answer)
    res.json(outcome)
  } catch (error) {
    console.error('[judge] failed', error)
    res.status(500).json({ error: 'The mountain is thinking. Try again.' })
  }
})

const isProd = process.env.NODE_ENV === 'production'
if (isProd) {
  const dist = resolve(process.cwd(), 'dist')
  app.use(express.static(dist))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      next()
      return
    }
    res.sendFile(resolve(dist, 'index.html'))
  })
}

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: true },
})

const rooms = new RoomManager({
  onChange: (state) => {
    io.to(state.code).emit('room:state', state)
  },
})

type Member = { code: string; playerId: string }
const memberOf = (socket: { data: Record<string, unknown> }) =>
  socket.data.member as Member | undefined

function bindMember(
  socket: { data: Record<string, unknown>; join: (room: string) => unknown; leave: (room: string) => unknown },
  member: Member,
) {
  const previous = memberOf(socket)
  if (previous && (previous.code !== member.code || previous.playerId !== member.playerId)) {
    void socket.leave(previous.code)
    rooms.disconnect(previous.code, previous.playerId)
  }
  socket.data.member = member
  void socket.join(member.code)
}

io.on('connection', (socket) => {
  socket.emit('mountain:hello', { ok: true })

  socket.on('room:create', (payload: { name?: unknown } | undefined, ack?: Function) => {
    const result = rooms.create(payload?.name)
    if (!result.ok) {
      ack?.({ ok: false, error: result.error })
      return
    }
    bindMember(socket, { code: result.code, playerId: result.playerId })
    ack?.({ ok: true, code: result.code, playerId: result.playerId, state: result.state })
  })

  socket.on(
    'room:join',
    (payload: { code?: unknown; name?: unknown } | undefined, ack?: Function) => {
      const result = rooms.join(payload?.code, payload?.name)
      if (!result.ok) {
        ack?.({ ok: false, error: result.error })
        return
      }
      bindMember(socket, { code: result.code, playerId: result.playerId })
      ack?.({
        ok: true,
        code: result.code,
        playerId: result.playerId,
        state: result.state,
      })
    },
  )

  socket.on(
    'room:rejoin',
    (payload: { code?: unknown; playerId?: unknown } | undefined, ack?: Function) => {
      const result = rooms.rejoin(payload?.code, payload?.playerId)
      if (!result.ok) {
        ack?.({ ok: false, error: result.error })
        return
      }
      bindMember(socket, {
        code: result.state.code,
        playerId: String(payload?.playerId),
      })
      ack?.({ ok: true, state: result.state })
    },
  )

  socket.on('room:start', (_payload: unknown, ack?: Function) => {
    const member = memberOf(socket)
    if (!member) {
      ack?.({ ok: false, error: 'Join a room first.' })
      return
    }
    const result = rooms.start(member.code, member.playerId)
    ack?.(result)
  })

  socket.on(
    'room:answer',
    async (payload: { text?: unknown } | undefined, ack?: Function) => {
      const member = memberOf(socket)
      if (!member) {
        ack?.({ ok: false, error: 'Join a room first.' })
        return
      }
      const result = await rooms.answer(member.code, member.playerId, payload?.text)
      ack?.(result)
    },
  )

  socket.on('room:again', (_payload: unknown, ack?: Function) => {
    const member = memberOf(socket)
    if (!member) {
      ack?.({ ok: false, error: 'Join a room first.' })
      return
    }
    ack?.(rooms.again(member.code, member.playerId))
  })

  socket.on('room:leave', (_payload: unknown, ack?: Function) => {
    const member = memberOf(socket)
    if (!member) {
      ack?.({ ok: true })
      return
    }
    void socket.leave(member.code)
    socket.data.member = undefined
    rooms.leave(member.code, member.playerId)
    ack?.({ ok: true })
  })

  socket.on('disconnect', () => {
    const member = memberOf(socket)
    if (member) rooms.disconnect(member.code, member.playerId)
  })
})

const port = Number(process.env.PORT ?? 8787)
httpServer.listen(port, () => {
  console.log(`[shikhar] base camp listening on http://localhost:${port}`)
})
