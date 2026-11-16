import type { CSSProperties } from 'react'
import { SUMMIT_METRES } from '../../shared/game'
import { Climber } from './Climber'

interface MountainSceneProps {
  altitude: number
  moving?: boolean
}

export function MountainScene({ altitude, moving = false }: MountainSceneProps) {
  const climb = Math.min(1, Math.max(0, altitude / SUMMIT_METRES))

  return (
    <div
      className={`mountain-scene${moving ? ' is-moving' : ''}`}
      style={{ '--climb': Math.sqrt(climb) } as CSSProperties}
      aria-hidden="true"
    >
      <div className="scene-photo" />
      <div className="scene-grade" />
      <div className="scene-vignette" />
      <div className="scene-snow" />
      <div className="scene-mist" />
      <svg className="scene-ridge" viewBox="0 0 1440 360" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ridge-shade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b2d26" />
            <stop offset="0.4" stopColor="#101d18" />
            <stop offset="1" stopColor="#07100d" />
          </linearGradient>
        </defs>
        <path
          d="M0 118 C140 100 260 134 400 116 C540 98 660 130 800 112 C940 94 1060 128 1200 110 C1320 96 1400 116 1440 102 L1440 360 L0 360 Z"
          fill="url(#ridge-shade)"
        />
        <path
          d="M0 118 C140 100 260 134 400 116 C540 98 660 130 800 112 C940 94 1060 128 1200 110 C1320 96 1400 116 1440 102"
          fill="none"
          stroke="rgba(216, 234, 226, 0.22)"
          strokeWidth="2"
        />
      </svg>
      <div className="scene-climber">
        <Climber />
      </div>
    </div>
  )
}
