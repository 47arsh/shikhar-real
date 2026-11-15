import { bandFor } from '../../shared/game'
import type { ClimbRound } from '../game/solo'

interface ClimbHudProps {
  altitude: number
  oxygen: number
  rounds: ClimbRound[]
  total: number
}

export function ClimbHud({ altitude, oxygen, rounds, total }: ClimbHudProps) {
  const band = bandFor(altitude)

  return (
    <div className="climb-hud">
      <div className="hud-main">
        <div className="hud-alt">
          <span className="hud-alt-num">{Math.round(altitude).toLocaleString('en-IN')}</span>
          <span className="hud-alt-unit">m</span>
        </div>
        <p className="hud-band">{band.name}</p>
      </div>

      <div className="hud-side">
        <div className="hud-air" role="img" aria-label={`${oxygen} of 5 air canisters left`}>
          <span className="hud-key">Air</span>
          <span className="hud-cans" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <i key={i} className={i < oxygen ? 'is-full' : undefined} />
            ))}
          </span>
        </div>

        <ol className="hud-dots" aria-label={`${rounds.length} of ${total} prompts done`}>
          {Array.from({ length: total }, (_, i) => {
            const round = rounds[i]
            const className = round
              ? `is-done points-${round.points}`
              : i === rounds.length
                ? 'is-now'
                : undefined
            return <li key={i} className={className} />
          })}
        </ol>
      </div>
    </div>
  )
}
