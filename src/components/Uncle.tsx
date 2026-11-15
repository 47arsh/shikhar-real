type Mood = 'idle' | 'happy' | 'wince'

interface UncleProps {
  size?: number
  mood?: Mood
  className?: string
}

export function Uncle({ size = 56, mood = 'idle', className = '' }: UncleProps) {
  return (
    <span
      className={`uncle ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="47" fill="#f0e2c8" />
        <circle cx="48" cy="48" r="46.4" fill="none" stroke="rgba(21,32,28,0.16)" />

        <path d="M12 94 C16 76 30 68 48 68 C66 68 80 76 84 94 Z" fill="#1d3a2e" />
        <path d="M28 73 Q48 82 68 73 L71 84 Q48 92 25 84 Z" fill="#bf4535" />
        <rect x="41" y="60" width="14" height="14" rx="6" fill="#c99264" />

        <circle cx="27.5" cy="48" r="4.6" fill="#d09a6d" />
        <circle cx="68.5" cy="48" r="4.6" fill="#d09a6d" />
        <ellipse cx="48" cy="47" rx="20.5" ry="22" fill="#dba77a" />

        <path d="M27 38 C27 22 36.5 15 48 15 C59.5 15 69 22 69 38 Z" fill="#bf4535" />
        <rect x="25" y="33.6" width="46" height="9.4" rx="4.7" fill="#a83b2d" />
        <path d="M25 38.3 H71" stroke="rgba(21,32,28,0.18)" strokeWidth="1" />
        <circle cx="48" cy="14" r="5" fill="#f3ebdd" />

        {mood === 'wince' ? (
          <g stroke="#3b2a1f" strokeWidth="2.2" strokeLinecap="round">
            <path d="M36.5 43.4 L44 45.6" />
            <path d="M59.5 43.4 L52 45.6" />
          </g>
        ) : (
          <g stroke="#3b2a1f" strokeWidth="2.2" strokeLinecap="round" fill="none">
            <path d="M36.5 44.7 Q40 42.7 43.5 44.7" />
            <path d="M52.5 44.7 Q56 42.7 59.5 44.7" />
          </g>
        )}

        {mood === 'happy' ? (
          <g stroke="#2b2119" strokeWidth="2.1" strokeLinecap="round" fill="none">
            <path d="M37 49.4 Q40 45.9 43 49.4" />
            <path d="M53 49.4 Q56 45.9 59 49.4" />
          </g>
        ) : (
          <g fill="#2b2119">
            <circle cx="40" cy="49" r="2.4" />
            <circle cx="56" cy="49" r="2.4" />
          </g>
        )}

        <ellipse cx="33.6" cy="56" rx="4" ry="2.6" fill="#bf4535" opacity="0.16" />
        <ellipse cx="62.4" cy="56" rx="4" ry="2.6" fill="#bf4535" opacity="0.16" />

        <path
          d="M48 50.5 L46.2 56.5 Q48 58 49.8 56.5"
          stroke="#b57f52"
          strokeWidth="1.7"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M36.5 59 Q41.5 53.8 48 57 Q54.5 53.8 59.5 59 Q54 65 48 61 Q42 65 36.5 59 Z"
          fill="#3b2a1f"
        />

        {mood === 'happy' ? (
          <path
            d="M42 65 Q48 70.5 54 65"
            stroke="#3b2a1f"
            strokeWidth="1.9"
            strokeLinecap="round"
            fill="none"
          />
        ) : mood === 'wince' ? (
          <path
            d="M43 66.4 Q48 64.6 53 66.4"
            stroke="#3b2a1f"
            strokeWidth="1.9"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <path
            d="M43 65.4 Q48 68.6 53 65.4"
            stroke="#3b2a1f"
            strokeWidth="1.9"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
    </span>
  )
}
