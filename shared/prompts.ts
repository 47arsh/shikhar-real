import { DAILY_PROMPTS, type Prompt } from './game'

export const PROMPTS: readonly Prompt[] = [
  { id: 'p01', text: 'Name a Himalayan peak.', category: 'peak' },
  { id: 'p02', text: 'Name a hill station.', category: 'hill station' },
  { id: 'p03', text: 'Name a river you would drink from.', category: 'river' },
  { id: 'p04', text: 'Name a tree you would find on a mountain trail.', category: 'tree' },
  { id: 'p05', text: 'Name a bird you might spot above the treeline.', category: 'bird' },
  { id: 'p06', text: 'Name an animal you would be lucky to see in the Himalaya.', category: 'animal' },
  { id: 'p07', text: 'Name a flower that blooms in the mountains.', category: 'flower' },
  { id: 'p08', text: 'Name something that melts.', category: 'thing' },
  { id: 'p09', text: 'Name something that floats.', category: 'thing' },
  { id: 'p10', text: 'Name something cold that is not ice.', category: 'thing' },
  { id: 'p11', text: 'Name something you would find inside a glacier.', category: 'thing' },
  { id: 'p12', text: 'Name a thing that is striped.', category: 'thing' },
  { id: 'p13', text: 'Name a thing that is perfectly round.', category: 'thing' },
  { id: 'p14', text: 'Name something that shines.', category: 'thing' },
  { id: 'p15', text: 'Name a thing you can hear but never see.', category: 'thing' },
  { id: 'p16', text: 'Name a spice.', category: 'spice' },
  { id: 'p17', text: 'Name a dish you would eat on a cold day.', category: 'dish' },
  { id: 'p18', text: 'Name a thing you would pack for a trek.', category: 'object' },
  { id: 'p19', text: 'Name a snack you would buy at a roadside stall.', category: 'snack' },
  { id: 'p20', text: 'Name a drink that is better hot.', category: 'drink' },
  { id: 'p21', text: 'Name a fruit.', category: 'fruit' },
  { id: 'p22', text: 'Name a vegetable that grows in the hills.', category: 'vegetable' },
  { id: 'p23', text: 'Name a sweet you would share with a friend.', category: 'sweet' },
  { id: 'p24', text: 'Name something you would cook over a fire.', category: 'food' },
  { id: 'p25', text: 'Name a thing that comes in a packet.', category: 'thing' },
  { id: 'p26', text: 'Name a Hindi film.', category: 'film' },
  { id: 'p27', text: 'Name a song about rain.', category: 'song' },
  { id: 'p28', text: 'Name a book you would take up a mountain.', category: 'book' },
  { id: 'p29', text: 'Name a thing you would write in a trail register.', category: 'thing' },
  { id: 'p30', text: 'Name something you would do on a long train ride.', category: 'activity' },
  { id: 'p31', text: 'Name a game you can play with no phone reception.', category: 'game' },
  { id: 'p32', text: 'Name an outfit you would wear in the cold.', category: 'clothing' },
  { id: 'p33', text: 'Name a fictional character you would take on a trek.', category: 'character' },
  { id: 'p34', text: 'Name a thing that is better when it is old.', category: 'thing' },
  { id: 'p35', text: 'Name a word that sounds cold.', category: 'word' },
  { id: 'p36', text: 'Name a smell that reminds you of home.', category: 'smell' },
  { id: 'p37', text: 'Name a sound you would miss on a mountain.', category: 'sound' },
  { id: 'p38', text: 'Name a thing you would leave at base camp.', category: 'thing' },
  { id: 'p39', text: 'Name something that is impossible to photograph well.', category: 'thing' },
  { id: 'p40', text: 'Name a thing that gets lighter as you use it.', category: 'thing' },
  { id: 'p41', text: 'Name a thing that gets heavier the longer you carry it.', category: 'thing' },
  { id: 'p42', text: 'Name a colour that is not a primary colour.', category: 'colour' },
  { id: 'p43', text: 'Name a thing with a handle.', category: 'thing' },
  { id: 'p44', text: 'Name a thing that has a lid.', category: 'thing' },
  { id: 'p45', text: 'Name a thing that is always found in pairs.', category: 'thing' },
  { id: 'p46', text: 'Name a thing that makes you sleepy.', category: 'thing' },
  { id: 'p47', text: 'Name a thing that makes you laugh.', category: 'thing' },
  { id: 'p48', text: 'Name something you would rather not step on.', category: 'thing' },
  { id: 'p49', text: 'Name a thing that works better upside down.', category: 'thing' },
  { id: 'p50', text: 'Name a thing that fits in a pocket.', category: 'thing' },
]

const DAY_MS = 24 * 60 * 60 * 1000

export function dailyKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date)
}

function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededPrompts(seed: string, count: number): Prompt[] {
  const rand = mulberry32(hashString(seed))
  const pool = [...PROMPTS]
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    const swap = pool[i]
    pool[i] = pool[j]
    pool[j] = swap
  }
  return pool.slice(0, Math.min(count, pool.length))
}

export function dailyPrompts(date = new Date()): Prompt[] {
  return seededPrompts(`shikhar:${dailyKey(date)}`, DAILY_PROMPTS)
}

export function endlessPrompts(seed: string): Prompt[] {
  return seededPrompts(seed, 12)
}

export function dayIndex(date = new Date()): number {
  return Math.floor(date.getTime() / DAY_MS)
}

export function promptById(id: string): Prompt | undefined {
  return PROMPTS.find((prompt) => prompt.id === id)
}
