import { describe, expect, it } from 'vitest'
import { dailyKey, dailyPrompts, promptById, PROMPTS } from '../shared/prompts'
import { altitudeOutcome, oxygenAfter } from '../shared/scoring'
import { curatedCap } from './commonness'
import { validateAnswer } from './judge'
import { guessPoints, pointsFromBooks, pointsFromWikipedia } from './rarity'

describe('altitude', () => {
  it('awards ten metres per point', () => {
    expect(altitudeOutcome(100, 0).gain).toBe(1000)
    expect(altitudeOutcome(55, 3000).gain).toBe(550)
  })

  it('slides the scree on crowd answers', () => {
    const first = altitudeOutcome(10, 0)
    expect(first.slide).toBe(60)
    expect(first.net).toBe(40)

    const high = altitudeOutcome(25, 800)
    expect(high.slide).toBe(30)
    expect(high.net).toBe(220)
  })

  it('never slides below base camp', () => {
    const outcome = altitudeOutcome(10, 0)
    expect(outcome.net).toBeGreaterThanOrEqual(0)
  })
})

describe('oxygen', () => {
  it('burns one canister per prompt', () => {
    expect(oxygenAfter(3, 25)).toBe(2)
    expect(oxygenAfter(3, 55)).toBe(2)
  })

  it('refills only on excellent answers', () => {
    expect(oxygenAfter(3, 75)).toBe(3)
    expect(oxygenAfter(3, 100)).toBe(4)
  })

  it('stays inside the tank', () => {
    expect(oxygenAfter(5, 100)).toBe(5)
    expect(oxygenAfter(0, 10)).toBe(0)
  })
})

describe('rarity ladder', () => {
  it('maps wikipedia hits onto the six tiers', () => {
    expect(pointsFromWikipedia(10_000)).toBe(10)
    expect(pointsFromWikipedia(2000)).toBe(25)
    expect(pointsFromWikipedia(400)).toBe(40)
    expect(pointsFromWikipedia(120)).toBe(55)
    expect(pointsFromWikipedia(40)).toBe(75)
    expect(pointsFromWikipedia(9)).toBe(100)
  })

  it('maps the book corpus onto the six tiers', () => {
    expect(pointsFromBooks(2000)).toBe(10)
    expect(pointsFromBooks(700)).toBe(25)
    expect(pointsFromBooks(200)).toBe(40)
    expect(pointsFromBooks(50)).toBe(55)
    expect(pointsFromBooks(10)).toBe(75)
    expect(pointsFromBooks(0)).toBe(100)
  })

  it('guesses politely when the network is gone', () => {
    expect(guessPoints('yak')).toBe(25)
    expect(guessPoints('snow leopard')).toBe(55)
    expect(guessPoints('hemis national park')).toBe(75)
  })
})

describe('indian common knowledge caps', () => {
  it('keeps famous Indian answers from scoring like secrets', () => {
    expect(curatedCap('Momos')).toBe(10)
    expect(curatedCap('Aloo Paratha')).toBe(10)
    expect(curatedCap('kedarkantha')).toBe(25)
    expect(curatedCap('tso moriri')).toBe(40)
  })

  it('leaves genuinely rare things uncapped', () => {
    expect(curatedCap('brahma kamal')).toBe(75)
    expect(curatedCap('lonely planet guidebook')).toBeNull()
  })
})

describe('answer hygiene', () => {
  const spicePrompt = promptById('p16')!
  const animalPrompt = promptById('p06')!

  it('accepts real, open answers', () => {
    expect(validateAnswer('Hing', spicePrompt).ok).toBe(true)
    expect(validateAnswer('Saser Kangri', animalPrompt).ok).toBe(true)
    expect(validateAnswer('snow leopard', animalPrompt).ok).toBe(true)
  })

  it('rejects keyboard mashing and vowel-free noise', () => {
    expect(validateAnswer('asdfgh', spicePrompt).ok).toBe(false)
    expect(validateAnswer('qwxz', spicePrompt).ok).toBe(false)
    expect(validateAnswer('aaaaaaaa', spicePrompt).ok).toBe(false)
  })

  it('rejects the question as an answer', () => {
    expect(validateAnswer('spice', spicePrompt).ok).toBe(false)
    expect(validateAnswer('spices', spicePrompt).ok).toBe(false)
    expect(validateAnswer('peak', promptById('p01')!).ok).toBe(false)
  })

  it('rejects links, numbers and essays', () => {
    expect(validateAnswer('https://example.com', spicePrompt).ok).toBe(false)
    expect(validateAnswer('123456', spicePrompt).ok).toBe(false)
    expect(
      validateAnswer(
        'this is a very long answer that keeps going and going past any reasonable length',
        spicePrompt,
      ).ok,
    ).toBe(false)
  })
})

describe('daily climb', () => {
  it('uses the Indian calendar day', () => {
    expect(dailyKey(new Date('2026-11-15T00:00:00Z'))).toBe('2026-11-15')
    expect(dailyKey(new Date('2026-11-14T19:00:00Z'))).toBe('2026-11-15')
  })

  it('picks seven distinct prompts, the same for everyone', () => {
    const date = new Date('2026-11-15T08:00:00Z')
    const first = dailyPrompts(date)
    const second = dailyPrompts(date)
    expect(first).toHaveLength(7)
    expect(new Set(first.map((prompt) => prompt.id)).size).toBe(7)
    expect(first.map((prompt) => prompt.id)).toEqual(second.map((prompt) => prompt.id))
  })

  it('has a clean, religion-free prompt pool', () => {
    expect(PROMPTS.length).toBeGreaterThanOrEqual(50)
    const text = PROMPTS.map((prompt) => prompt.text.toLowerCase()).join(' ')
    for (const word of ['temple', 'god', 'pray', 'festival', 'shrine', 'yatra']) {
      expect(text).not.toContain(word)
    }
  })
})
