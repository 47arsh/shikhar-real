import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { PROMPT_SECONDS, SUMMIT_METRES, bandFor } from '../../shared/game'
import type { ClimbRound } from '../game/solo'
import { useSoloClimb } from '../game/useSoloClimb'
import { useTween } from '../game/useTween'
import { ClimbHud } from '../components/ClimbHud'
import { Logo } from '../components/Logo'
import { MountainScene } from '../components/MountainScene'
import { Postcard } from '../components/Postcard'
import '../styles/game.css'

const dateLabel = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'long',
  timeZone: 'Asia/Kolkata',
}).format(new Date())

function sourceLine(round: ClimbRound): string {
  if (round.timedOut) return 'Twenty-five seconds. The mountain does not wait.'
  if (round.note) return round.note
  if (round.source === 'wikipedia') {
    return `${(round.hits ?? 0).toLocaleString('en-IN')} mentions across Wikipedia.`
  }
  if (round.source === 'books') {
    return `${(round.hits ?? 0).toLocaleString('en-IN')} mentions in the book corpus.`
  }
  if (round.source === 'known') return 'Common knowledge around here.'
  return 'The register is quiet on this one — scored on mountain instinct.'
}

function summitLine(altitude: number): string {
  if (altitude >= SUMMIT_METRES) {
    return 'The register has your name in ink now. Go tell someone.'
  }
  if (altitude >= 5500) {
    return 'Above the clouds. I would offer chai, but the stove is frozen.'
  }
  if (altitude >= 3500) {
    return 'Snowline. Most people stop at the dhaba. Not you.'
  }
  if (altitude >= 1000) {
    return 'Not bad at all. The mountain noticed.'
  }
  return 'A short climb. The dhaba is proud of you anyway.'
}

export function Climb() {
  const climb = useSoloClimb()
  const { state } = climb
  const shownAltitude = useTween(state.altitude)
  const moving = Math.abs(state.altitude - shownAltitude) > 1
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const text = `I climbed ${state.altitude.toLocaleString('en-IN')} m up Shikhar today.${
      state.best ? ` Best answer: “${state.best.answer}” for ${state.best.points} points.` : ''
    }`
    try {
      await navigator.clipboard.writeText(`${text} ${window.location.origin}/climb`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      // clipboard access can be denied, no drama
    }
  }

  return (
    <main className="climb">
      <MountainScene altitude={shownAltitude} moving={moving} />

      <header className="climb-top">
        <Logo />
        <ClimbHud
          altitude={shownAltitude}
          oxygen={state.oxygen}
          rounds={state.rounds}
          total={climb.total}
        />
      </header>

      <div className="card-zone">
        <section
          className={`climb-card${state.phase === 'summit' ? ' is-wide' : ''}`}
          data-phase={state.phase}
        >
        <div className="card-inner anim-rise" key={`${state.phase}-${state.rounds.length}`}>
          {state.phase === 'base' && (
            <>
              <p className="eyebrow">{dateLabel} · base camp</p>
              <h1 className="card-title">Up you go.</h1>
              <p className="card-lede">
                Seven open prompts, twenty-five seconds each. Type anything real — a
                fruit, a film, a place, a feeling — and the rarer it is, the higher you
                climb.
              </p>

              <blockquote className="trail-quote">
                <p>“I have heard Everest too many times today, beta. Surprise me.”</p>
                <cite>Bhuwan uncle, at the tea stall</cite>
              </blockquote>

              <ul className="rule-list">
                <li>
                  <span className="rule-no">01</span>
                  <p>
                    <strong>Anything counts.</strong> No options, no lists.
                  </p>
                </li>
                <li>
                  <span className="rule-no">02</span>
                  <p>
                    <strong>Rarer climbs higher.</strong> Crowd answers slide down.
                  </p>
                </li>
                <li>
                  <span className="rule-no">03</span>
                  <p>
                    <strong>Watch the air.</strong> Run dry and you drop a camp.
                  </p>
                </li>
              </ul>

              {climb.saved && (
                <div className="return-card">
                  <p className="return-kicker">You climbed today</p>
                  <p className="return-line">
                    <strong>{climb.saved.last.toLocaleString('en-IN')} m</strong> last
                    time <span>·</span> best{' '}
                    <strong>{climb.saved.best.toLocaleString('en-IN')} m</strong>
                  </p>
                </div>
              )}

              <div className="card-actions">
                <button className="btn btn-solid" onClick={climb.start}>
                  {climb.saved ? 'Climb again' : 'Rope up'} <span className="arrow">→</span>
                </button>
                <Link className="card-back" to="/">
                  Not today
                </Link>
              </div>
              <p className="card-note">
                Same seven prompts for everyone in India today. No login.
              </p>
            </>
          )}

          {state.phase === 'asking' && climb.activePrompt && (
            <>
              <div className="card-top">
                <p className="eyebrow">
                  Prompt {state.rounds.length + 1} of {climb.total}
                </p>
                <div
                  className={`timer-ring ${climb.secondsLeft <= 8 ? 'is-low' : ''}`}
                  style={
                    {
                      '--t': `${(climb.secondsLeft / PROMPT_SECONDS) * 360}deg`,
                    } as CSSProperties
                  }
                  aria-hidden="true"
                >
                  <span>{climb.secondsLeft}</span>
                </div>
              </div>

              <p className="kicker">Anything in the world counts</p>
              <h2 className="ask-prompt">{climb.activePrompt.text}</h2>

              <form className="ask-form" onSubmit={climb.onSubmit}>
                <label className="sr-only" htmlFor="climb-answer">
                  Your answer
                </label>
                <input
                  ref={climb.inputRef}
                  id="climb-answer"
                  className="ask-input"
                  value={climb.answer}
                  onChange={(event) => climb.setAnswer(event.target.value)}
                  placeholder="Type anything real…"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  maxLength={48}
                  disabled={climb.pending}
                />
                <div className="ask-foot">
                  <p
                    className={`ask-hint ${climb.error ? 'is-error' : ''}`}
                    role={climb.error ? 'alert' : undefined}
                  >
                    {climb.error ||
                      (climb.pending
                        ? 'Checking the trail register…'
                        : 'No options. No list. Just you.')}
                  </p>
                  <button
                    className="btn btn-solid"
                    type="submit"
                    disabled={climb.pending || !climb.answer.trim()}
                  >
                    {climb.pending ? 'Checking…' : 'Send it up'}{' '}
                    <span className="arrow">→</span>
                  </button>
                </div>
              </form>

              <div className="card-foot">
                <span>{bandFor(state.altitude).name}</span>
                <span>Summit 7,000 m</span>
              </div>
            </>
          )}

          {state.phase === 'reveal' && climb.round && (
            <>
              <div className="card-top">
                <p className="eyebrow">
                  Prompt {state.rounds.length} of {climb.total}
                </p>
                <span className={`tier-stamp points-${climb.round.points}`}>
                  {climb.round.timedOut ? 'No answer' : `${climb.round.points} pts`}
                </span>
              </div>

              <div className="reveal-gain">
                <span className="reveal-gain-num">
                  {climb.round.gain > 0 ? `+${climb.round.gain}` : '0'}
                </span>
                <span className="reveal-gain-unit">m</span>
              </div>
              <p className="reveal-tier">
                {climb.round.timedOut ? 'The clock took that one.' : climb.round.label}
              </p>
              <h2 className="reveal-answer">
                {climb.round.timedOut ? 'No answer' : `“${climb.round.answer}”`}
              </h2>
              {!climb.round.timedOut && (
                <p className="reveal-math">
                  {climb.round.gain} m earned
                  {climb.round.slide ? ` · −${climb.round.slide} m scree slide` : ''}
                  {climb.round.rest ? ` · −${climb.round.rest} m rest` : ''}
                </p>
              )}

              <blockquote className="trail-quote reveal-quote">
                <p>“{climb.round.reaction}”</p>
                <cite>Bhuwan uncle</cite>
              </blockquote>

              <p className="reveal-source">{sourceLine(climb.round)}</p>

              <button className="btn btn-solid card-cta" onClick={climb.next}>
                {state.rounds.length >= climb.total ? 'See the summit' : 'Next prompt'}{' '}
                <span className="arrow">→</span>
              </button>
            </>
          )}

          {state.phase === 'summit' && (
            <>
              <div className="card-top">
                <p className="eyebrow">Summit report · {dateLabel}</p>
                <p className="summit-band">
                  {bandFor(state.altitude).name} ·{' '}
                  {state.altitude >= SUMMIT_METRES ? 'the flag is yours' : 'climbed'}
                </p>
              </div>
              <h1 className="summit-title">
                {state.altitude.toLocaleString('en-IN')}
                <span> m</span>
              </h1>

              <div className="summit-grid">
                <div className="summit-postcard">
                  <Postcard
                    altitude={state.altitude}
                    answer={state.best?.answer || 'The mountain'}
                    tier={state.best?.label || 'Trekker'}
                    prompt={state.best?.prompt.text}
                    tilt={-3}
                  />
                </div>

                <div className="summit-side">
                  <div className="summit-stats">
                    <div>
                      <span>Best answer</span>
                      <strong>{state.best?.points ?? 0} pts</strong>
                    </div>
                    <div>
                      <span>Air left</span>
                      <strong>{state.oxygen} / 5</strong>
                    </div>
                    <div>
                      <span>Prompts</span>
                      <strong>
                        {state.rounds.length} / {climb.total}
                      </strong>
                    </div>
                  </div>

                  <blockquote className="trail-quote">
                    <p>“{summitLine(state.altitude)}”</p>
                    <cite>Bhuwan uncle</cite>
                  </blockquote>

                  <ol className="trail-log">
                    {state.rounds.map((round, index) => (
                      <li key={round.prompt.id}>
                        <span className="log-no">{String(index + 1).padStart(2, '0')}</span>
                        <span className="log-answer">
                          {round.timedOut ? '—' : round.answer}
                        </span>
                        <span className={`log-points points-${round.points}`}>
                          {round.points}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="card-actions summit-actions">
                <button className="btn btn-solid" onClick={share}>
                  {copied ? 'Copied!' : 'Copy the postcard'}
                </button>
                <button className="btn btn-ghost" onClick={climb.start}>
                  Climb again
                </button>
                <Link className="card-back" to="/">
                  Back to base
                </Link>
              </div>
              <p className="card-note">
                Come back tomorrow — same mountain, new prompts.
              </p>
            </>
          )}
        </div>
        </section>
      </div>

      <p className="scene-credit">Himalaya · photo via Unsplash</p>
    </main>
  )
}
