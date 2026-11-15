import { Link } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { LandingScene } from '../components/LandingScene'
import { Logo } from '../components/Logo'
import { Postcard } from '../components/Postcard'
import { ALTITUDE_BANDS, SUMMIT_METRES } from '../../shared/game'
import '../styles/landing.css'

export function Landing() {
  return (
    <div className="landing">
      <nav className="nav">
        <Logo />
        <div className="nav-links">
          <a className="nav-link" href="#how">
            How it works
          </a>
          <a className="nav-link" href="#route">
            The route
          </a>
          <Link className="btn btn-solid btn-sm" to="/climb">
            Today’s climb
          </Link>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">A rare-answer climbing game</p>
            <h1>
              Say something <em>nobody</em> else said.
            </h1>
            <p className="lede">
              Open prompts, no options, no multiple choice. Rarer answers take you
              higher up a Himalayan peak — common ones slide you down the scree.
              Seven questions to the summit, or climb endlessly with friends.
            </p>
            <div className="cta-row">
              <Link className="btn btn-solid" to="/climb">
                Start today’s climb <span className="arrow">→</span>
              </Link>
              <a className="btn btn-ghost" href="#how">
                How it works
              </a>
            </div>
            <p className="cta-meta">
              <span>7 prompts</span>
              <span>25 seconds each</span>
              <span>summit at {SUMMIT_METRES.toLocaleString('en-IN')} m</span>
            </p>
          </div>

          <div className="hero-card-wrap">
            <Postcard
              altitude={5410}
              answer="Snow leopard"
              tier="One in a Lakh"
              prompt="Name an animal that lives above the snowline."
              tilt={-4}
            />
            <p className="hero-card-note">Your postcard, 5,410 m above sea level</p>
          </div>
        </div>
        <LandingScene />
      </header>

      <section className="how" id="how">
        <div className="section-head">
          <p className="eyebrow">The climb</p>
          <h2>
            Open answers.
            <br />
            <em>Brutal</em> altitude.
          </h2>
          <p className="section-lede">
            Krillion went down. We go up. Same itch: find the answer nobody else
            thought of, and see how far it takes you.
          </p>
        </div>
        <ol className="steps">
          <li className="step">
            <span className="step-no">01</span>
            <h3>Read the prompt</h3>
            <p>
              “Name a hill station.” “Name a thing you’d pack.” No options — type
              whatever is true. If it exists, it counts.
            </p>
          </li>
          <li className="step">
            <span className="step-no">02</span>
            <h3>Rarer is higher</h3>
            <p>
              We check how often your answer turns up in the world’s writing.
              “Everest” gets you 10 metres. “Saser Kangri” gets you 100.
            </p>
          </li>
          <li className="step">
            <span className="step-no">03</span>
            <h3>Don’t slip</h3>
            <p>
              Painfully common answers cost altitude and air. Seven good answers
              and the summit is yours. Nothing is ever so satisfying as a 100.
            </p>
          </li>
        </ol>
      </section>

      <section className="route" id="route">
        <div className="route-head">
          <p className="eyebrow">The route</p>
          <h2>
            {SUMMIT_METRES.toLocaleString('en-IN')} metres,
            <br />
            six kinds of quiet.
          </h2>
        </div>
        <ol className="band-list">
          {ALTITUDE_BANDS.map((band) => (
            <li className="band-row" key={band.name}>
              <span className="band-m">{band.from.toLocaleString('en-IN')} m</span>
              <span className="band-name">{band.name}</span>
              <span className="band-detail">{band.detail}</span>
            </li>
          ))}
          <li className="band-row band-row-summit">
            <span className="band-m">{SUMMIT_METRES.toLocaleString('en-IN')} m</span>
            <span className="band-name">Summit</span>
            <span className="band-detail">The flag, the photo, the bragging</span>
          </li>
        </ol>
      </section>

      <Footer />
    </div>
  )
}
