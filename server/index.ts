import express from 'express'
import { createServer } from 'node:http'
import { resolve } from 'node:path'
import { Server } from 'socket.io'
import { PROMPTS, promptById } from '../shared/prompts'
import { judgeAnswer } from './judge'

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

io.on('connection', (socket) => {
  socket.emit('mountain:hello', { ok: true })
})

const port = Number(process.env.PORT ?? 8787)
httpServer.listen(port, () => {
  console.log(`[shikhar] base camp listening on http://localhost:${port}`)
})
