import { useEffect, useRef, useState } from 'react'
import { SUMMIT_METRES } from '../../shared/game'

const TRAIL =
  'M 150 738 C 214 716 250 690 248 652 C 246 614 172 604 156 566 C 138 524 190 492 248 482 C 306 472 346 448 344 406 C 342 362 268 350 254 310 C 240 268 296 236 352 226 C 408 216 440 190 420 164 C 410 152 388 148 366 152'

const CAMPS = [
  { f: 0, label: 'Base' },
  { f: 1000 / SUMMIT_METRES, label: '1,000 m' },
  { f: 2500 / SUMMIT_METRES, label: '2,500 m' },
  { f: 3500 / SUMMIT_METRES, label: '3,500 m' },
  { f: 4500 / SUMMIT_METRES, label: '4,500 m' },
  { f: 5500 / SUMMIT_METRES, label: '5,500 m' },
]

const PINES: Array<[number, number, number]> = [
  [58, 748, 46],
  [86, 738, 30],
  [116, 752, 38],
  [596, 744, 42],
  [620, 734, 28],
  [560, 752, 34],
]

interface CampPoint {
  x: number
  y: number
  f: number
  label: string
}

interface ClimbSceneProps {
  altitude: number
}

export function ClimbScene({ altitude }: ClimbSceneProps) {
  const trailRef = useRef<SVGPathElement>(null)
  const climbedRef = useRef<SVGPathElement>(null)
  const markerRef = useRef<SVGGElement>(null)
  const [camps, setCamps] = useState<CampPoint[]>([])

  const progress = Math.max(0, Math.min(1, altitude / SUMMIT_METRES))

  useEffect(() => {
    const path = trailRef.current
    if (!path) return
    const length = path.getTotalLength()
    setCamps(
      CAMPS.map((camp) => {
        const point = path.getPointAtLength(length * camp.f)
        return { x: point.x, y: point.y, f: camp.f, label: camp.label }
      }),
    )
  }, [])

  useEffect(() => {
    const path = trailRef.current
    if (!path) return
    const length = path.getTotalLength()
    const point = path.getPointAtLength(length * progress)
    markerRef.current?.setAttribute(
      'transform',
      `translate(${point.x} ${point.y}) scale(1.5)`,
    )
    climbedRef.current?.setAttribute('stroke-dasharray', `${progress} 1`)
  }, [progress])

  return (
    <svg
      className="climb-svg"
      viewBox="0 0 640 760"
      preserveAspectRatio="xMidYMax meet"
      role="img"
      aria-label={`The mountain trail at ${Math.round(altitude)} metres`}
    >
      <defs>
        <linearGradient id="climb-rock" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#d3d9cf" />
          <stop offset="0.42" stopColor="#a9b7a5" />
          <stop offset="0.78" stopColor="#6f8774" />
          <stop offset="1" stopColor="#3f5d4b" />
        </linearGradient>
        <linearGradient id="climb-snow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="1" stopColor="#e9e2d3" />
        </linearGradient>
        <radialGradient id="climb-sun">
          <stop offset="0" stopColor="#f6cf8d" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="#f0b96b" stopOpacity="0.34" />
          <stop offset="1" stopColor="#f0b96b" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="512" cy="118" r="150" fill="url(#climb-sun)" />
      <circle cx="512" cy="118" r="27" fill="#f4cb86" />

      <g fill="#cfdacf" opacity="0.6">
        <path d="M-40 650 L62 468 L154 616 L228 528 L306 648 Z" />
        <path d="M378 656 L470 496 L544 594 L612 478 L692 664 Z" />
      </g>
      <g fill="#f7f1e5" opacity="0.7">
        <path d="M62 468 L82 506 L70 496 L58 512 L46 500 Z" />
        <path d="M612 478 L630 512 L618 504 L606 518 L596 506 Z" />
      </g>

      <path
        d="M-30 760 L50 692 L96 660 L128 626 L168 600 L206 552 L246 500 L286 436 L318 360 L344 250 L366 150 L394 268 L420 360 L452 430 L494 486 L536 540 L578 588 L622 640 L672 700 L672 760 Z"
        fill="url(#climb-rock)"
      />
      <path
        d="M366 150 L420 360 L404 342 L392 362 L378 340 L364 360 L350 338 L336 358 L318 360 Z"
        fill="url(#climb-snow)"
      />
      <path
        d="M366 150 L420 360 L404 342 L392 362 L378 340 L364 360 L350 338 L336 358 L318 360 Z"
        fill="none"
        stroke="rgba(21,32,28,0.24)"
        strokeWidth="1.4"
      />

      <g fill="#fdf8ee" opacity="0.55" className="scene-clouds">
        <ellipse cx="128" cy="332" rx="78" ry="15" />
        <ellipse cx="168" cy="324" rx="42" ry="18" />
        <ellipse cx="470" cy="410" rx="96" ry="16" />
        <ellipse cx="510" cy="401" rx="48" ry="19" />
        <ellipse cx="256" cy="214" rx="60" ry="12" opacity="0.7" />
      </g>

      <g fill="#132a22" opacity="0.85">
        {PINES.map(([x, y, h]) => (
          <path key={`${x}-${y}`} d={`M${x} ${y} l${h * 0.5} ${-h} l${h * 0.5} ${h} Z`} />
        ))}
      </g>

      <path
        ref={trailRef}
        d={TRAIL}
        fill="none"
        stroke="rgba(21,32,28,0.3)"
        strokeWidth="3"
        strokeDasharray="5 7"
        strokeLinecap="round"
      />
      <path
        ref={climbedRef}
        d={TRAIL}
        fill="none"
        stroke="#e9a23b"
        strokeWidth="4.6"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="0 1"
      />

      {camps.map((camp) => {
        const passed = progress >= camp.f
        return (
          <g
            key={camp.label}
            className={`scene-camp ${passed ? 'is-passed' : ''}`}
            transform={`translate(${camp.x + 17} ${camp.y + 3})`}
          >
            <path
              d="M-8 0 L0 -13 L8 0 Z"
              fill={passed ? '#e9a23b' : '#f3ebdd'}
              stroke="#15201c"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <line x1="0" y1="-13" x2="0" y2="-18" stroke="#15201c" strokeWidth="1.2" />
            <text x="12" y="3" fontSize="11" fill="#3d4a43">
              {camp.label}
            </text>
          </g>
        )
      })}

      <g transform="translate(366 150)">
        <line x1="0" y1="0" x2="0" y2="-30" stroke="#15201c" strokeWidth="2.2" />
        <path d="M0 -30 L21 -24.5 L0 -19 Z" fill="#bf4535" />
        <circle cx="0" cy="-1" r="3.2" fill="#f3ebdd" stroke="#15201c" strokeWidth="1.2" />
      </g>

      <g ref={markerRef} className="scene-climber" transform="translate(150 738) scale(1.5)">
        <circle r="11" fill="#e9a23b" opacity="0.28" className="climber-halo" />
        <circle cx="0" cy="-8" r="3.7" fill="#f3ebdd" stroke="#15201c" strokeWidth="1.2" />
        <path
          d="M-2.6 -4.4 L0 -0.4 L2.6 -4.4"
          fill="none"
          stroke="#15201c"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <line x1="3.8" y1="-5" x2="3.8" y2="-21" stroke="#15201c" strokeWidth="1.4" />
        <path d="M3.8 -21 L14 -18.4 L3.8 -15.6 Z" fill="#bf4535" />
      </g>
    </svg>
  )
}
