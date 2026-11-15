import type { CSSProperties } from 'react'

interface PostcardProps {
  altitude: number
  answer: string
  tier: string
  prompt?: string
  tilt?: number
  className?: string
}

export function Postcard({
  altitude,
  answer,
  tier,
  prompt,
  tilt = -3,
  className = '',
}: PostcardProps) {
  const postcardNo = String(Math.max(1, Math.round(altitude / 500))).padStart(2, '0')

  return (
    <figure
      className={`postcard ${className}`}
      style={{ '--tilt': `${tilt}deg` } as CSSProperties}
    >
      <div className="postcard-head">
        <span className="postcard-brand" lang="hi">
          शिखर
        </span>
        <span className="postcard-stamp" aria-hidden="true">
          <svg viewBox="0 0 44 52">
            <path d="M6 40 L19 16 L27 28 L32 21 L39 40 Z" fill="currentColor" />
            <circle cx="33" cy="13" r="3.4" fill="currentColor" />
          </svg>
        </span>
      </div>
      {prompt ? <p className="postcard-prompt">{prompt}</p> : null}
      <div className="postcard-alt">
        <span className="postcard-num">{altitude.toLocaleString('en-IN')}</span>
        <span className="postcard-unit">m</span>
      </div>
      <div className="postcard-answer">“{answer}”</div>
      <p className="postcard-tier">{tier}</p>
      <p className="postcard-foot">Postcard no. {postcardNo} · from the climb</p>
    </figure>
  )
}
