import { bandFor } from '../../shared/game'

interface ClimbHudProps {
  altitude: number
  oxygen: number
  rounds: { points: number }[]
  total: number
}

export function ClimbHud({ altitude, oxygen, rounds, total }: ClimbHudProps) {
  const band = bandFor(altitude)

  return (
    <div className="climb-hud">
      <div className="hud-chip hud-alt">
        <b>{Math.round(altitude).toLocaleString('en-IN')}</b>
        <i>m</i>
        <em>{band.name}</em>
      </div>

      <div className="hud-chip hud-air" role="img" aria-label={`${oxygen} of 5 air canisters left`}>
        <span>Air</span>
        <span className="hud-cans" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <s key={i} className={i < oxygen ? 'is-full' : undefined} />
          ))}
        </span>
      </div>

      <ol className="hud-chip hud-dots" aria-label={`${rounds.length} of ${total} prompts done`}>
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
  )
}
