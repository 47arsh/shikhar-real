import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const chromePath =
  process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const url = process.argv[2] ?? 'http://localhost:5173/'
const width = Number(process.argv[3] ?? 1440)
const height = Number(process.argv[4] ?? 900)
const out = process.argv[5] ?? '.shots/shot.png'
const scrollSelector = process.argv.find((a) => a.startsWith('--scroll='))?.split('=')[1]

const port = 9300 + Math.floor(Math.random() * 400)
const profile = mkdtempSync(join(tmpdir(), 'shikhar-shot-'))
const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
)

async function waitForTargets() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`)
      if (res.ok) return await res.json()
    } catch {
      // devtools not up yet
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('devtools endpoint never came up')
}

try {
  const targets = await waitForTargets()
  const page = targets.find((t) => t.type === 'page')
  if (!page) throw new Error('no page target')

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = reject
  })

  let nextId = 0
  const pending = new Map()
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    if (!msg.id) return
    const entry = pending.get(msg.id)
    if (!entry) return
    pending.delete(msg.id)
    if (msg.error) entry.reject(new Error(msg.error.message))
    else entry.resolve(msg.result)
  }

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId
      pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params }))
    })

  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await send('Page.navigate', { url })
  await new Promise((r) => setTimeout(r, 2800))

  if (scrollSelector) {
    await send('Runtime.evaluate', {
      expression: `document.querySelector(${JSON.stringify(scrollSelector)})?.scrollIntoView()`,
    })
    await new Promise((r) => setTimeout(r, 800))
  }

  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  })
  writeFileSync(out, Buffer.from(shot.data, 'base64'))
  console.log(`saved ${out} at ${width}x${height}`)

  ws.close()
} finally {
  chrome.kill()
}
