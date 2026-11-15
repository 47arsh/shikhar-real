export type TierPoints = 10 | 25 | 40 | 55 | 75 | 100

export interface TierMeta {
  points: TierPoints
  label: string
  blurb: string
}

export const TIERS: readonly TierMeta[] = [
  { points: 10, label: 'Tourist', blurb: 'Everyone and their aunt said that.' },
  { points: 25, label: 'Trekker', blurb: 'Safe. Seen it on a fridge magnet.' },
  { points: 40, label: 'Ridge-runner', blurb: 'You read the brochure, didn’t you.' },
  { points: 55, label: 'Snowliner', blurb: 'Actual knowledge detected.' },
  { points: 75, label: 'Summit-pusher', blurb: 'Nobody in this room said that.' },
  { points: 100, label: 'One in a Lakh', blurb: 'You may be the only one.' },
]

export const METRES_PER_POINT = 10
export const SUMMIT_METRES = 7000
export const PROMPT_SECONDS = 25
export const DAILY_PROMPTS = 7
export const START_OXYGEN = 3
export const MAX_PLAYERS = 8
export const ROOM_CODE_LENGTH = 4

export interface AltitudeBand {
  from: number
  name: string
  detail: string
}

export const ALTITUDE_BANDS: readonly AltitudeBand[] = [
  { from: 0, name: 'Roadhead', detail: 'Deodar, dust, mule bells' },
  { from: 1000, name: 'Rhododendron', detail: 'Bird calls and tea stalls' },
  { from: 2500, name: 'Bugyal meadows', detail: 'Sheep, shepherds, huge sky' },
  { from: 3500, name: 'Snowline', detail: 'First snow, crampons, wind' },
  { from: 4500, name: 'Glacier', detail: 'Blue ice, silence, thin air' },
  { from: 5500, name: 'Summit ridge', detail: 'Above the clouds, sunrise' },
]

export function bandFor(altitude: number): AltitudeBand {
  let band = ALTITUDE_BANDS[0]
  for (const candidate of ALTITUDE_BANDS) {
    if (altitude >= candidate.from) band = candidate
  }
  return band
}

export function metresFor(points: number): number {
  return points * METRES_PER_POINT
}

export function tierFor(points: TierPoints): TierMeta {
  return TIERS.find((tier) => tier.points === points) ?? TIERS[0]
}

export interface Prompt {
  id: string
  text: string
  category: string
}

export type RaritySource = 'books' | 'wikipedia' | 'fallback' | 'known'

export interface JudgeResult {
  answer: string
  reading: string
  accepted: boolean
  points: TierPoints
  label: string
  altitudeGain: number
  slide: number
  hits: number | null
  source: RaritySource
  reaction: string
  note?: string
}
