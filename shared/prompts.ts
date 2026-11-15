import { DAILY_PROMPTS, type Prompt } from './game'

/*
 * The mountain is the setting, not the subject. Prompts should let anyone
 * answer with anything real — a fruit, a film, a feeling — with only a light
 * dusting of trail-flavoured prompts to keep the theme present.
 */
export const PROMPTS: readonly Prompt[] = [
  { id: 'p01', text: 'Name a fruit.', category: 'fruit' },
  { id: 'p02', text: 'Name a vegetable you hated as a kid.', category: 'vegetable' },
  { id: 'p03', text: 'Name a breakfast food.', category: 'food' },
  { id: 'p04', text: 'Name a snack you would buy at a railway station.', category: 'snack' },
  { id: 'p05', text: 'Name a dish you would cook for someone you like.', category: 'dish' },
  { id: 'p06', text: 'Name a drink that is better cold.', category: 'drink' },
  { id: 'p07', text: 'Name a sweet you would fight someone for.', category: 'sweet' },
  { id: 'p08', text: 'Name a spice you would recognise blindfolded.', category: 'spice' },
  { id: 'p09', text: 'Name something you would eat at 2 a.m.', category: 'food' },
  { id: 'p10', text: 'Name a food that tastes better the next day.', category: 'food' },
  { id: 'p11', text: 'Name an animal you would never keep as a pet.', category: 'animal' },
  { id: 'p12', text: 'Name a bird with an unfair reputation.', category: 'bird' },
  { id: 'p13', text: 'Name an animal that is sneakier than it looks.', category: 'animal' },
  { id: 'p14', text: 'Name an insect you would rescue instead of squash.', category: 'insect' },
  { id: 'p15', text: 'Name a fish you would pay extra for.', category: 'fish' },
  { id: 'p16', text: 'Name something you would find in a bathroom.', category: 'object' },
  { id: 'p17', text: 'Name something you always lose.', category: 'object' },
  { id: 'p18', text: 'Name a thing that is impossible to fold.', category: 'thing' },
  { id: 'p19', text: 'Name something you would find in a school bag.', category: 'object' },
  { id: 'p20', text: 'Name a thing that fits in a pocket.', category: 'thing' },
  { id: 'p21', text: 'Name a thing you would never lend anyone.', category: 'thing' },
  { id: 'p22', text: 'Name something you would rather not step on.', category: 'thing' },
  { id: 'p23', text: 'Name a thing that gets lighter as you use it.', category: 'thing' },
  { id: 'p24', text: 'Name a thing that gets heavier the longer you carry it.', category: 'thing' },
  { id: 'p25', text: 'Name a thing that works better upside down.', category: 'thing' },
  { id: 'p26', text: 'Name a thing that is always found in pairs.', category: 'thing' },
  { id: 'p27', text: 'Name a thing that is always in the fridge.', category: 'thing' },
  { id: 'p28', text: 'Name a thing you can never find when you need it.', category: 'thing' },
  { id: 'p29', text: 'Name something that melts.', category: 'thing' },
  { id: 'p30', text: 'Name something that floats.', category: 'thing' },
  { id: 'p31', text: 'Name a thing that is striped.', category: 'thing' },
  { id: 'p32', text: 'Name a thing that is perfectly round.', category: 'thing' },
  { id: 'p33', text: 'Name a thing you can hear but never see.', category: 'thing' },
  { id: 'p34', text: 'Name a thing that is better when it is old.', category: 'thing' },
  { id: 'p35', text: 'Name something that is impossible to photograph well.', category: 'thing' },
  { id: 'p36', text: 'Name something that shines.', category: 'thing' },
  { id: 'p37', text: 'Name a colour you would never paint a wall.', category: 'colour' },
  { id: 'p38', text: 'Name a colour that is not a primary colour.', category: 'colour' },
  { id: 'p39', text: 'Name a smell that reminds you of home.', category: 'smell' },
  { id: 'p40', text: 'Name a smell you would recognise anywhere.', category: 'smell' },
  { id: 'p41', text: 'Name a sound you hate.', category: 'sound' },
  { id: 'p42', text: 'Name something you would hear at a wedding.', category: 'sound' },
  { id: 'p43', text: 'Name a country you would move to tomorrow.', category: 'country' },
  { id: 'p44', text: 'Name a city that never sleeps.', category: 'city' },
  { id: 'p45', text: 'Name a place you would go to think.', category: 'place' },
  { id: 'p46', text: 'Name a place you would hide a gift.', category: 'place' },
  { id: 'p47', text: 'Name a landmark you would recognise from a plane.', category: 'landmark' },
  { id: 'p48', text: 'Name a river you would not swim in.', category: 'river' },
  { id: 'p49', text: 'Name a mountain you would not climb.', category: 'mountain' },
  { id: 'p50', text: 'Name a hill station with good food.', category: 'hill station' },
  { id: 'p51', text: 'Name a Himalayan peak.', category: 'peak' },
  { id: 'p52', text: 'Name a tree you would recognise by its bark.', category: 'tree' },
  { id: 'p53', text: 'Name a flower that smells better than it looks.', category: 'flower' },
  { id: 'p54', text: 'Name a Hindi film with a great soundtrack.', category: 'film' },
  { id: 'p55', text: 'Name a movie you can quote from memory.', category: 'movie' },
  { id: 'p56', text: 'Name a song that makes you cry.', category: 'song' },
  { id: 'p57', text: 'Name a song about rain.', category: 'song' },
  { id: 'p58', text: 'Name a book you would take on a long trip.', category: 'book' },
  { id: 'p59', text: 'Name a fictional character you would trust with your phone.', category: 'character' },
  { id: 'p60', text: 'Name a game you can play with no phone reception.', category: 'game' },
  { id: 'p61', text: 'Name a game you always lose.', category: 'game' },
  { id: 'p62', text: 'Name an outfit you would wear to a wedding.', category: 'clothing' },
  { id: 'p63', text: 'Name something you would take to a desert island.', category: 'thing' },
  { id: 'p64', text: 'Name something you would bury in a time capsule.', category: 'thing' },
  { id: 'p65', text: 'Name a thing you would pack for a trek.', category: 'object' },
  { id: 'p66', text: 'Name something you would leave at base camp.', category: 'thing' },
  { id: 'p67', text: 'Name a word that sounds cold.', category: 'word' },
  { id: 'p68', text: 'Name a word that sounds expensive.', category: 'word' },
  { id: 'p69', text: 'Name something you would do on a long train ride.', category: 'activity' },
  { id: 'p70', text: 'Name a thing you would write in a trail register.', category: 'thing' },
  { id: 'p71', text: 'Name an emotion you would share with a stranger.', category: 'emotion' },
  { id: 'p72', text: 'Name a thing that makes you laugh.', category: 'thing' },
  { id: 'p73', text: 'Name something that makes you sleepy.', category: 'thing' },
  { id: 'p74', text: 'Name a thing you would find in a grandmother’s kitchen.', category: 'object' },
  { id: 'p75', text: 'Name a thing that comes in a packet.', category: 'object' },
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
