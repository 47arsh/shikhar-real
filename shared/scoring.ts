import { METRES_PER_POINT, REST_METRES, REST_OXYGEN, SUMMIT_METRES } from './game'

export interface AltitudeOutcome {
  gain: number
  slide: number
  net: number
}

export function altitudeOutcome(points: number, altitude: number): AltitudeOutcome {
  const gain = points * METRES_PER_POINT
  const slideBase = points <= 10 ? 60 : points <= 25 ? 30 : 0
  const slide = Math.min(slideBase, altitude + gain)
  return { gain, slide, net: gain - slide }
}

export function oxygenAfter(oxygen: number, points: number): number {
  const refill = points >= 100 ? 2 : points >= 75 ? 1 : 0
  return Math.max(0, Math.min(5, oxygen - 1 + refill))
}

export interface AnswerOutcome extends AltitudeOutcome {
  rest: number
  altitude: number
  oxygen: number
}

export function answerOutcome(
  points: number,
  altitude: number,
  oxygen: number,
  hasMoreRounds: boolean,
): AnswerOutcome {
  const outcome = altitudeOutcome(points, altitude)
  let nextAltitude = Math.min(SUMMIT_METRES, altitude + outcome.net)
  let nextOxygen = oxygenAfter(oxygen, points)
  let rest = 0

  if (nextOxygen === 0 && hasMoreRounds) {
    rest = Math.min(REST_METRES, nextAltitude)
    nextAltitude -= rest
    nextOxygen = REST_OXYGEN
  }

  return { ...outcome, rest, altitude: nextAltitude, oxygen: nextOxygen }
}

export function percentileFor(altitude: number): number {
  const ratio = Math.max(0, Math.min(1, altitude / 7000))
  return Math.round(6 + ratio * 92)
}
