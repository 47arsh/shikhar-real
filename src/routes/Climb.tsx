import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import {
  ALTITUDE_BANDS,
  PROMPT_SECONDS,
  SUMMIT_METRES,
  bandFor,
} from '../../shared/game'
import type { ClimbRound } from '../game/solo'
import { useSoloClimb } from '../game/useSoloClimb'
import { useTween } from '../game/useTween'
import { ClimbHud } from '../components/ClimbHud'
import { ClimbScene } from '../components/ClimbScene'
import { Logo } from '../components/Logo'
import { Postcard } from '../components/Postcard'
import { Uncle } from '../components/Uncle'
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
  const bandIndex = Math.max(0, ALTITUDE_BANDS.indexOf(bandFor(shownAltitude)))
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
    <div className="climb">
      <aside className="climb-stage" data-band={bandIndex}>
        <div className="stage-top">
          <Logo />
          <span className="stage-tag">
            {state.phase === 'summit' ? 'Summit' : state.phase === 'base' ? 'Base camp' : 'Solo climb'}
          </span>
        </div>
        <ClimbScene altitude={shownAltitude} />
        <ClimbHud
          altitude={shownAltitude}
          oxygen={state.oxygen}
          rounds={state.rounds}
          total={climb.total}
        />
      </aside>

      <section className="climb-panel">
        <div className="panel-inner anim-rise" key={`${state.phase}-${state.rounds.length}`}>
          {state.phase === 'base' && (
            <>
              <p className="eyebrow">{dateLabel} · base camp</p>
              <h1 className="panel-title">Up you go.</h1>
              <p className="panel-lede">
                Seven open prompts, twenty-five seconds each. Type anything real — a
                fruit, a film, a place, a feeling — and the rarer it is in the world,
                the higher you climb.
              </p>

              <div className="uncle-row uncle-greet">
                <Uncle size={54} />
                <div className="uncle-copy">
                  <p className="uncle-name">Bhuwan uncle</p>
                  <p className="uncle-line">
                    “I have heard Everest too many times today, beta. Surprise me.”
                  </p>
                </div>
              </div>

              <ul className="rule-list">
                <li>
                  <span className="rule-no">01</span>
                  <p>
                    <strong>Anything in the world counts.</strong> No options, no
                    lists. If it is real, it is an answer.
                  </p>
                </li>
                <li>
                  <span className="rule-no">02</span>
                  <p>
                    <strong>Rarer climbs higher.</strong> We check how often the world
                    writes your answer. Crowd answers slide you down the scree.
                  </p>
                </li>
                <li>
                  <span className="rule-no">03</span>
                  <p>
                    <strong>Watch the air.</strong> Every prompt burns a canister. Run
                    dry and you drop a camp to breathe.
                  </p>
                </li>
              </ul>

              {climb.saved && (
                <div className="return-card">
                  <p className="return-kicker">You climbed today</p>
                  <p className="return-line">
                    <strong>{climb.saved.last.toLocaleString('en-IN')} m</strong> last time
                    <span>·</span> best{' '}
                    <strong>{climb.saved.best.toLocaleString('en-IN')} m</strong>
                  </p>
                </div>
              )}

              <div className="panel-actions">
                <button className="btn btn-solid panel-cta" onClick={climb.start}>
                  {climb.saved ? 'Climb again' : 'Rope up'} <span className="arrow">→</span>
                </button>
                <Link className="panel-back" to="/">
                  Not today
                </Link>
              </div>
              <p className="panel-note">
                Same seven prompts for everyone in India today. No login.
              </p>
            </>
          )}

          {state.phase === 'asking' && climb.activePrompt && (
            <>
              <div className="ask-top">
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

              <p className="ask-kicker">Anything in the world counts</p>
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

              <p className="ask-band">
                You are at {Math.round(state.altitude).toLocaleString('en-IN')} m ·{' '}
                {bandFor(state.altitude).name}
              </p>
            </>
          )}

          {state.phase === 'reveal' && climb.round && (
            <>
              <div className="reveal-head">
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

              <div className="uncle-row">
                <Uncle
                  size={62}
                  mood={
                    climb.round.points >= 55
                      ? 'happy'
                      : climb.round.timedOut
                        ? 'wince'
                        : 'idle'
                  }
                />
                <div className="uncle-copy">
                  <p className="uncle-name">Bhuwan uncle</p>
                  <p className="uncle-line">{climb.round.reaction}</p>
                </div>
              </div>

              <p className="reveal-source">{sourceLine(climb.round)}</p>

              <button className="btn btn-solid panel-cta" onClick={climb.next}>
                {state.rounds.length >= climb.total ? 'See the summit' : 'Next prompt'}{' '}
                <span className="arrow">→</span>
              </button>
            </>
          )}

          {state.phase === 'summit' && (
            <>
              <p className="eyebrow">Summit report · {dateLabel}</p>
              <h1 className="summit-title">
                {state.altitude.toLocaleString('en-IN')} m
              </h1>
              <p className="summit-sub">
                {bandFor(state.altitude).name} ·{' '}
                {state.altitude >= SUMMIT_METRES ? 'the flag is yours' : 'climbed'}
              </p>

              <div className="summit-card">
                <Postcard
                  altitude={state.altitude}
                  answer={state.best?.answer || 'The mountain'}
                  tier={state.best?.label || 'Trekker'}
                  prompt={state.best?.prompt.text}
                  tilt={-3}
                />
              </div>

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

              <div className="uncle-row summit-uncle">
                <Uncle size={58} mood="happy" />
                <div className="uncle-copy">
                  <p className="uncle-name">Bhuwan uncle</p>
                  <p className="uncle-line">{summitLine(state.altitude)}</p>
                </div>
              </div>

              <ol className="trail-log">
                {state.rounds.map((round, index) => (
                  <li key={round.prompt.id}>
                    <span className="log-no">{String(index + 1).padStart(2, '0')}</span>
                    <span className="log-prompt">{round.prompt.text}</span>
                    <span className="log-answer">
                      {round.timedOut ? '—' : round.answer}
                    </span>
                    <span className={`log-points points-${round.points}`}>
                      {round.points}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="summit-actions">
                <button className="btn btn-solid" onClick={share}>
                  {copied ? 'Copied!' : 'Copy the postcard'}
                </button>
                <button className="btn btn-ghost" onClick={climb.start}>
                  Climb again
                </button>
                <Link className="panel-back" to="/">
                  Back to base
                </Link>
              </div>
              <p className="panel-note">
                Come back tomorrow — same mountain, new prompts.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
