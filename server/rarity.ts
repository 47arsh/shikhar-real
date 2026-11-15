import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { RaritySource, TierPoints } from '../shared/game'
import { curatedCap } from './commonness'
import { normalizeKey } from './text'

const CACHE_PATH = resolve(process.cwd(), 'data/rarity-cache.json')
const USER_AGENT = 'ShikharGame/0.1 (https://github.com/47arsh/shikhar-real)'
const CACHE_TTL = 1000 * 60 * 60 * 24 * 30
const MAX_CACHE = 4000

interface CachedReading {
  hits: number
  source: 'wikipedia' | 'books'
  at: number
}

const cache = new Map<string, CachedReading>()

function loadCache() {
  try {
    if (!existsSync(CACHE_PATH)) return
    const parsed = JSON.parse(readFileSync(CACHE_PATH, 'utf8')) as Record<string, CachedReading>
    for (const [key, value] of Object.entries(parsed)) {
      if (value && typeof value.hits === 'number') cache.set(key, value)
    }
  } catch {
    // a broken cache is not a reason to stop climbing
  }
}

loadCache()

let flushTimer: ReturnType<typeof setTimeout> | null = null

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    try {
      mkdirSync(resolve(process.cwd(), 'data'), { recursive: true })
      writeFileSync(CACHE_PATH, JSON.stringify(Object.fromEntries(cache)))
    } catch {
      // cache is best effort
    }
  }, 1500)
}

function store(key: string, hits: number, source: 'wikipedia' | 'books') {
  cache.set(key, { hits, source, at: Date.now() })
  if (cache.size > MAX_CACHE) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
  scheduleFlush()
}

// Wikipedia politely asks for paced requests. Serialise them.
let queue: Promise<unknown> = Promise.resolve()
let lastRequest = 0

function scheduled<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = 260 - (Date.now() - lastRequest)
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    lastRequest = Date.now()
    return task()
  })
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(4000),
  })
  if (!res.ok) throw new Error(`lookup failed: ${res.status}`)
  return res.json()
}

async function wikipediaHits(phrase: string): Promise<number> {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: `"${phrase}"`,
    format: 'json',
    srlimit: '1',
    srprop: '',
  })
  const data = (await fetchJson(`https://en.wikipedia.org/w/api.php?${params}`)) as {
    query?: { searchinfo?: { totalhits?: number } }
  }
  const hits = data.query?.searchinfo?.totalhits
  if (typeof hits !== 'number') throw new Error('no hit count')
  return hits
}

async function openLibraryHits(phrase: string): Promise<number> {
  const params = new URLSearchParams({
    q: `"${phrase}"`,
    fields: 'numFound',
    limit: '1',
  })
  const data = (await fetchJson(`https://openlibrary.org/search.json?${params}`)) as {
    numFound?: number
  }
  if (typeof data.numFound !== 'number') throw new Error('no hit count')
  return data.numFound
}

export function pointsFromWikipedia(hits: number): TierPoints {
  if (hits >= 4000) return 10
  if (hits >= 1200) return 25
  if (hits >= 350) return 40
  if (hits >= 90) return 55
  if (hits >= 25) return 75
  return 100
}

export function pointsFromBooks(hits: number): TierPoints {
  if (hits >= 1500) return 10
  if (hits >= 500) return 25
  if (hits >= 150) return 40
  if (hits >= 40) return 55
  if (hits >= 8) return 75
  return 100
}

export function guessPoints(key: string): TierPoints {
  const words = key.split(' ').filter(Boolean).length
  if (words >= 3) return 75
  if (words === 2) return 55
  return 25
}

export interface RarityReading {
  points: TierPoints
  source: RaritySource
  hits: number | null
  curated: boolean
  note?: string
}

function readingFromHits(
  hits: number,
  source: 'wikipedia' | 'books',
): RarityReading {
  const points = source === 'wikipedia' ? pointsFromWikipedia(hits) : pointsFromBooks(hits)
  return {
    points,
    source,
    hits,
    curated: false,
    note: hits === 0 ? 'The mountain has never heard this one.' : undefined,
  }
}

export async function readRarity(answer: string): Promise<RarityReading> {
  const key = normalizeKey(answer)

  const cap = curatedCap(key)
  if (cap) {
    return {
      points: cap,
      source: 'known',
      hits: null,
      curated: true,
      note: 'Common knowledge around here.',
    }
  }

  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return readingFromHits(cached.hits, cached.source)
  }

  try {
    const hits = await scheduled(() => wikipediaHits(key))
    store(key, hits, 'wikipedia')
    return readingFromHits(hits, 'wikipedia')
  } catch {
    // try the book corpus
  }

  try {
    const hits = await scheduled(() => openLibraryHits(key))
    store(key, hits, 'books')
    return readingFromHits(hits, 'books')
  } catch {
    return {
      points: guessPoints(key),
      source: 'fallback',
      hits: null,
      curated: false,
      note: 'No signal from the valley — scored on mountain instinct.',
    }
  }
}
