export function Climber() {
  return (
    <svg viewBox="0 0 40 70" role="presentation" focusable="false">
      <defs>
        <linearGradient id="climber-parka" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d1583f" />
          <stop offset=".55" stopColor="#bf4535" />
          <stop offset="1" stopColor="#8d3226" />
        </linearGradient>
        <linearGradient id="climber-legs" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#26332d" />
          <stop offset="1" stopColor="#141d19" />
        </linearGradient>
      </defs>
      <ellipse cx="20" cy="67.5" rx="10" ry="2.4" fill="rgba(0,0,0,.4)" />
      <path
        d="M17.4 42 L16 56 L13.4 65"
        stroke="url(#climber-legs)"
        strokeWidth="5.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M22.6 42 L24 55 L28.6 64"
        stroke="url(#climber-legs)"
        strokeWidth="5.2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M12.4 64.4 L16.6 65.2" stroke="#0d1613" strokeWidth="3" strokeLinecap="round" />
      <path d="M27.4 63.2 L31.2 64.6" stroke="#0d1613" strokeWidth="3" strokeLinecap="round" />
      <path d="M13.6 19 Q20 14.6 26.4 19 L27.6 43 Q20 47.4 12.4 43 Z" fill="url(#climber-parka)" />
      <path
        d="M13.2 22.6 Q20 27.4 27 22.6"
        stroke="rgba(20,26,23,.28)"
        strokeWidth="1.2"
        fill="none"
      />
      <path d="M24.8 20.4 L31.4 21.8 L32 34.6 L25.4 36.2 Z" fill="#22362c" />
      <path d="M31.4 21.8 L32 34.6 L30 35 Q29.4 28 29 21.4 Z" fill="#31493c" opacity=".9" />
      <path d="M25.6 24 Q28.4 24.4 30.8 25" stroke="#0d1613" strokeWidth="1.1" opacity=".7" fill="none" />
      <path
        d="M13.8 20.8 Q19.8 15.4 26.2 20 Q27.6 13.8 23.4 11.2 Q19.4 8.8 16.4 12.4 Q14 15.4 13.8 20.8"
        fill="#9c392c"
      />
      <path d="M18.6 10.6 Q22.6 9.4 24.4 12.4 Q22.6 15 19.6 14.6 Q17.6 13.4 18.6 10.6" fill="#c9b79f" />
      <path d="M21.4 14.8 Q24 17.4 26 20.2" stroke="rgba(240,176,113,.4)" strokeWidth="1.2" fill="none" />
      <path d="M26 24 Q28.6 30 27.4 38" stroke="rgba(240,176,113,.28)" strokeWidth="1.2" fill="none" />
      <path d="M12.6 26 L7.2 15.4" stroke="#1a2521" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.6 36 L2.4 65.4" stroke="#101a17" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M33 43 L36.4 57" stroke="#101a17" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
