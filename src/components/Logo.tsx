import { Link } from 'react-router-dom'

export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="Shikhar, home">
      <span className="logo-dev" lang="hi">
        शिखर
      </span>
      <span className="logo-en">Shikhar</span>
    </Link>
  )
}
