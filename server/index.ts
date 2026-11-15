import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'

const app = express()
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'shikhar', altitude: 0 })
})

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
