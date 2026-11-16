import type { CSSProperties } from 'react'
import { SUMMIT_METRES } from '../../shared/game'
import type { RoomPhase, RoomPlayerView } from '../../shared/rooms'
import { initialsFor, tintFor } from '../rooms/identity'

interface RaceBoardProps {
  players: RoomPlayerView[]
  meId: string | null
  phase: RoomPhase
  variant: 'tower' | 'strip'
}

function orderedPlayers(players: RoomPlayerView[]): RoomPlayerView[] {
  return [...players].sort(
    (left, right) =>
      right.altitude - left.altitude || left.name.localeCompare(right.name),
  )
}

export function RaceBoard({ players, meId, phase, variant }: RaceBoardProps) {
  const ordered = orderedPlayers(players)
  const leader = ordered[0]?.altitude ?? 0

  if (variant === 'strip') {
    return (
      <div className="race-strip" aria-label="The rope, by altitude">
        {ordered.map((player) => (
          <div
            key={player.id}
            className={`${player.id === meId ? 'is-me' : ''}${player.connected ? '' : ' is-away'}`}
            style={{ '--tint': tintFor(player.id) } as CSSProperties}
          >
            <span className="race-badge">{initialsFor(player.name)}</span>
            <span className="race-chip-name">{player.name}</span>
            <span className="race-chip-alt">
              {player.altitude.toLocaleString('en-IN')} m
            </span>
            {phase === 'round' && player.answered && (
              <span className="race-tick" aria-label="answered">
                ✓
              </span>
            )}
            {!player.connected && <span className="race-away">away</span>}
          </div>
        ))}
      </div>
    )
  }

  return (
    <aside className="race-tower" aria-label="The rope, by altitude">
      <p className="race-title">The rope</p>
      <ol>
        {ordered.map((player, index) => {
          const percent = Math.max(
            3,
            Math.round((player.altitude / SUMMIT_METRES) * 100),
          )
          return (
            <li
              key={player.id}
              className={`${player.id === meId ? 'is-me' : ''}${player.connected ? '' : ' is-away'}`}
              style={
                {
                  '--tint': tintFor(player.id),
                  '--pct': `${percent}%`,
                } as CSSProperties
              }
            >
              <span className="race-rank">{String(index + 1).padStart(2, '0')}</span>
              <span className="race-badge">{initialsFor(player.name)}</span>
              <div className="race-meta">
                <span className="race-name">
                  {player.name}
                  {player.id === meId && <em>you</em>}
                </span>
                <span className="race-alt">
                  {player.altitude.toLocaleString('en-IN')} m
                  {phase === 'round' && player.answered ? ' · in' : ''}
                  {player.connected ? '' : ' · away'}
                </span>
                <span className="race-bar" aria-hidden="true">
                  <i />
                </span>
              </div>
            </li>
          )
        })}
      </ol>
      <p className="race-foot">
        {leader > 0
          ? `Leader at ${leader.toLocaleString('en-IN')} m`
          : 'Everyone still at base camp'}
      </p>
    </aside>
  )
}
