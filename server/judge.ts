import {
  tierFor,
  type JudgeResult,
  type Prompt,
  type TierPoints,
} from '../shared/game'
import { altitudeOutcome } from '../shared/scoring'
import { readRarity } from './rarity'
import { normalizeKey } from './text'

const STOP_WORDS = new Set([
  'name',
  'a',
  'an',
  'the',
  'that',
  'is',
  'are',
  'you',
  'would',
  'could',
  'might',
  'do',
  'did',
  'not',
  'in',
  'on',
  'at',
  'of',
  'to',
  'for',
  'with',
  'and',
  'or',
  'but',
  'your',
  'my',
  'it',
  'this',
  'something',
  'thing',
  'things',
])

const JUNK = new Set([
  'thing',
  'something',
  'anything',
  'nothing',
  'stuff',
  'idk',
  'dunno',
  'test',
  'asdf',
  'blah',
  'na',
  'no',
  'yes',
  'none',
])

const BLOCKED = ['fuck', 'shit', 'bitch', 'bastard', 'cunt', 'dick', 'porn', 'rape', 'nazi']
const KEYBOARD = /(asdf|qwer|zxcv|hjkl|uiop|poiu|lkjh|mnbv|vcxz|1234)/

export type Validation =
  | { ok: true; display: string; key: string }
  | { ok: false; reason: string }

const fail = (reason: string): Validation => ({ ok: false, reason })

export function validateAnswer(raw: string, prompt: Prompt): Validation {
  if (typeof raw !== 'string') return fail('Give me an actual answer, beta.')

  const display = raw
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^["'“”‘’]+/, '')
    .replace(/["'“”‘’]+$/, '')
    .trim()

  if (display.length < 2) return fail('Give me an actual answer, beta.')
  if (display.length > 48) return fail('That is a paragraph. The mountain is in a hurry.')

  const key = normalizeKey(display)
  if (!key) return fail('Give me an actual answer, beta.')

  if (/\d{5,}|https?:|www\.|@/.test(display)) {
    return fail('No links and no phone numbers on this mountain.')
  }

  const words = key.split(' ').filter(Boolean)
  if (words.length > 6) return fail('Pick a shorter answer.')

  if (words.some((word) => word.length >= 3 && !/[aeiouy0-9]/.test(word))) {
    return fail('The mountain has never heard that word.')
  }

  if (/(.)\1{3,}/.test(key) || KEYBOARD.test(key)) {
    return fail('Keyboard mashing is not a route.')
  }

  if (BLOCKED.some((word) => key.includes(word))) {
    return fail('Not on this mountain.')
  }

  if (JUNK.has(key)) return fail('That is not a thing, beta.')

  const promptWords = prompt.text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word))

  const categoryStem = prompt.category.replace(/s$/, '')
  if (key === prompt.category || key.replace(/s$/, '') === categoryStem) {
    return fail('That is the question, not the answer.')
  }
  if (promptWords.length === 1 && key === promptWords[0]) {
    return fail('That is the question, not the answer.')
  }

  return { ok: true, display, key }
}

const REACTIONS: Record<TierPoints, string[]> = {
  10: [
    'Everyone said that, beta. Every single one.',
    'That answer has its own gift shop.',
    'Rahul said that too. Rahul is behind you now.',
  ],
  25: [
    'Safe. Comfortable. Like Maggi without chilli.',
    'You could have said anything on earth.',
    'A crowd answer. The scree is already moving.',
  ],
  40: [
    'Now we are walking. Finally.',
    'Respectable. The trail approves.',
    'Not bad. The dhaba has heard better.',
  ],
  55: [
    'Oh, you have read something. I can tell.',
    'That one took actual thought. Keep moving.',
    'Good. The air is thinner up here, not your answers.',
  ],
  75: [
    'Nobody up here said that. I checked.',
    'A proper answer. I am telling the dhaba.',
    'That is a rare thing to find on a crowded mountain.',
  ],
  100: [
    'Ek dum original. I am writing this in the register.',
    'You may be the only person on this mountain who thought of that.',
    'One in a lakh. The summit is listening.',
  ],
}

function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function reactionFor(points: TierPoints, key: string, promptId: string): string {
  const lines = REACTIONS[points]
  return lines[hashString(`${promptId}:${key}`) % lines.length]
}

export type JudgeOutcome = { result: JudgeResult } | { error: string }

export async function judgeAnswer(prompt: Prompt, raw: string): Promise<JudgeOutcome> {
  const validation = validateAnswer(raw, prompt)
  if (!validation.ok) return { error: validation.reason }

  const reading = await readRarity(validation.key)

  if (
    reading.hits === 0 &&
    !reading.curated &&
    validation.key.split(' ').filter(Boolean).length === 1
  ) {
    return { error: 'The mountain has never heard that one. Try a real thing.' }
  }

  const outcome = altitudeOutcome(reading.points, 0)

  return {
    result: {
      answer: validation.display,
      reading: validation.key,
      accepted: true,
      points: reading.points,
      label: tierFor(reading.points).label,
      altitudeGain: outcome.gain,
      slide: outcome.slide,
      hits: reading.hits,
      source: reading.source,
      reaction: reactionFor(reading.points, validation.key, prompt.id),
      note: reading.note,
    },
  }
}
