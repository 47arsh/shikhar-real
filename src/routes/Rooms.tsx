import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  DAILY_PROMPTS,
  PROMPT_SECONDS,
  SUMMIT_METRES,
  bandFor,
} from '../../shared/game'
import {
  MAX_PLAYERS_PER_ROOM,
  type RoomPlayerView,
  type RoomRoundView,
} from '../../shared/rooms'
import { useCountdown } from '../rooms/useCountdown'
import { useRoom } from '../rooms/useRoom'
import { initialsFor, tintFor } from '../rooms/identity'
import { useTween } from '../game/useTween'
import { ClimbHud } from '../components/ClimbHud'
import { Logo } from '../components/Logo'
import { MountainScene } from '../components/MountainScene'
import { RaceBoard } from '../components/RaceBoard'
import '../styles/game.css'
import '../styles/room.css'

const NAME_KEY = 'shikhar:room:name'
const CODE_PATTERN = /^[A-Z]{4}$/

function readName(): string {
  try {
    return window.localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

function saveName(name: string) {
  try {
    window.localStorage.setItem(NAME_KEY, name)
  } catch {
    // private mode is fine, the seat still works
  }
}

function ordinal(position: number): string {
  if (position === 1) return '1st'
  if (position === 2) return '2nd'
  if (position === 3) return '3rd'
  return `${position}th`
}

function sourceLine(round: RoomRoundView): string {
  if (round.timedOut) return 'Twenty-five seconds. The mountain does not wait.'
  if (round.source === 'wikipedia') {
    return `${(round.hits ?? 0).toLocaleString('en-IN')} mentions across Wikipedia.`
  }
  if (round.source === 'books') {
    return `${(round.hits ?? 0).toLocaleString('en-IN')} mentions in the book corpus.`
  }
  if (round.source === 'known') return 'Common knowledge around here.'
  return 'The register is quiet on this one — scored on mountain instinct.'
}

interface RopeRow {
  player: RoomPlayerView
  last: RoomRoundView
}

export function Rooms() {
  const { code: routeCode = '' } = useParams()
  const navigate = useNavigate()
  const {
    room,
    playerId,
    connection,
    error,
    busy,
    create,
    join,
    start,
    answer,
    again,
    leave,
    clearError,
  } = useRoom(routeCode)

  const me = room?.players.find((player) => player.id === playerId) ?? null
  const isHost = Boolean(room && me && room.hostId === me.id)
  const hostName =
    room?.players.find((player) => player.id === room.hostId)?.name ?? 'the host'
  const shownAltitude = useTween(me?.altitude ?? 0)
  const moving = Math.abs((me?.altitude ?? 0) - shownAltitude) > 1
  const seconds = useCountdown(room?.deadline ?? null)
  const online = connection === 'online'

  const [name, setName] = useState(readName)
  const [codeDraft, setCodeDraft] = useState(() =>
    CODE_PATTERN.test(routeCode.toUpperCase()) ? routeCode.toUpperCase() : '',
  )
  const [answerText, setAnswerText] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (room && routeCode.toUpperCase() !== room.code) {
      navigate(`/rooms/${room.code}`, { replace: true })
    }
  }, [room, routeCode, navigate])

  const roundKey = room ? `${room.code}-${room.phase}-${room.round}` : ''
  useEffect(() => {
    clearError()
    setAnswerText('')
  }, [roundKey, clearError])

  const copyInvite = async () => {
    if (!room) return
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/rooms/${room.code}`,
      )
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      // clipboard access can be denied, no drama
    }
  }

  const onHost = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    saveName(trimmed)
    await create(trimmed)
  }

  const onJoin = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || !CODE_PATTERN.test(codeDraft)) return
    saveName(trimmed)
    await join(codeDraft, trimmed)
  }

  const onAnswer = async (event: FormEvent) => {
    event.preventDefault()
    const text = answerText.trim()
    if (!text) return
    const landed = await answer(text)
    if (landed) setAnswerText('')
  }

  const onLeave = () => {
    leave()
    navigate('/rooms', { replace: true })
  }

  const lastRound = me?.history[me.history.length - 1] ?? null
  const lastRoundIndex = room ? room.round + 1 >= room.total : false

  const ropeRows: RopeRow[] = room
    ? room.players
        .map((player) => {
          const last = player.history[player.history.length - 1]
          return last ? { player, last } : null
        })
        .filter((row): row is RopeRow => row !== null)
        .sort(
          (left, right) =>
            right.last.points - left.last.points ||
            right.player.altitude - left.player.altitude,
        )
    : []

  const standings = room
    ? [...room.players].sort(
        (left, right) =>
          right.altitude - left.altitude ||
          right.best - left.best ||
          left.name.localeCompare(right.name),
      )
    : []
  const myPosition = standings.findIndex((player) => player.id === playerId) + 1
  const lostSeat = Boolean(room && !me)

  return (
    <main className="climb">
      <MountainScene altitude={shownAltitude} moving={moving} />

      <header className="climb-top">
        <Logo />
        {room && room.phase !== 'lobby' ? (
          <ClimbHud
            altitude={shownAltitude}
            oxygen={me?.oxygen ?? 0}
            rounds={me?.history ?? []}
            total={room.total || DAILY_PROMPTS}
          />
        ) : room ? (
          <div className="room-code-chip">
            <span>Room</span>
            <b>{room.code}</b>
          </div>
        ) : (
          <Link className="btn btn-ghost btn-sm" to="/climb">
            Solo climb
          </Link>
        )}
      </header>

      {room && room.phase !== 'lobby' && !lostSeat && (
        <RaceBoard
          players={room.players}
          meId={playerId}
          phase={room.phase}
          variant="tower"
        />
      )}

      <div className="card-zone">
        <section className="climb-card" data-phase={room?.phase ?? 'entry'}>
          <div
            className="card-inner anim-rise"
            key={room ? `${room.code}-${room.phase}-${room.round}` : 'entry'}
          >
            {room && room.phase !== 'lobby' && !lostSeat && (
              <RaceBoard
                players={room.players}
                meId={playerId}
                phase={room.phase}
                variant="strip"
              />
            )}

            {connection === 'offline' && (
              <p className="room-note is-warn" role="status">
                Line to base camp dropped. Reconnecting…
              </p>
            )}
            {error && (
              <p className="room-note is-error" role="alert">
                {error}
              </p>
            )}

            {!room && (
              <>
                <p className="eyebrow">Live climb · friends</p>
                <h1 className="card-title">Climb together.</h1>
                <p className="card-lede">
                  One mountain, one set of seven prompts, one rope. Everyone
                  answers on their own phone — and the reveal shows exactly who
                  said what.
                </p>

                <form className="room-form" onSubmit={onHost}>
                  <label className="room-label" htmlFor="room-name">
                    Trail name
                  </label>
                  <input
                    id="room-name"
                    className="room-input"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Meera from Pune"
                    autoComplete="nickname"
                    maxLength={18}
                  />
                  <button
                    className="btn btn-solid"
                    type="submit"
                    disabled={busy || !online || name.trim().length < 2}
                  >
                    {busy ? 'Roping up…' : 'Start a room'}{' '}
                    <span className="arrow">→</span>
                  </button>
                </form>

                <div className="room-or">
                  <span>or join a rope</span>
                </div>

                <form className="room-join" onSubmit={onJoin}>
                  <label className="sr-only" htmlFor="room-code">
                    Room code
                  </label>
                  <input
                    id="room-code"
                    className="room-input room-code-input"
                    value={codeDraft}
                    onChange={(event) =>
                      setCodeDraft(
                        event.target.value
                          .replace(/[^a-zA-Z]/g, '')
                          .toUpperCase()
                          .slice(0, 4),
                      )
                    }
                    placeholder="ABCD"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={4}
                  />
                  <button
                    className="btn btn-ghost"
                    type="submit"
                    disabled={
                      busy || !online || name.trim().length < 2 || codeDraft.length < 4
                    }
                  >
                    Join room
                  </button>
                </form>

                <div className="card-actions">
                  <Link className="card-back" to="/climb">
                    Climb solo instead
                  </Link>
                </div>
                <p className="card-note">
                  Rooms hold eight. No login, no downloads — just the code.
                </p>
              </>
            )}

            {!lostSeat && room?.phase === 'lobby' && (
              <>
                <div className="card-top">
                  <p className="eyebrow">Base camp · room {room.code}</p>
                  <span className="room-count">
                    {room.players.length} / {MAX_PLAYERS_PER_ROOM}
                  </span>
                </div>
                <h1 className="card-title">Rope in.</h1>
                <p className="card-lede">
                  Share the code. Everyone climbs the same seven prompts at the
                  same time — one answer each, one reveal each.
                </p>

                <div className="room-invite">
                  <span className="room-invite-code">{room.code}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={copyInvite}
                  >
                    {copied ? 'Copied!' : 'Copy invite link'}
                  </button>
                </div>

                <ol className="room-roster">
                  {room.players.map((player) => (
                    <li
                      key={player.id}
                      className={`room-player${player.id === playerId ? ' is-me' : ''}${player.connected ? '' : ' is-away'}`}
                    >
                      <span
                        className="room-avatar"
                        style={{ '--tint': tintFor(player.id) } as CSSProperties}
                      >
                        {initialsFor(player.name)}
                      </span>
                      <span className="room-player-name">
                        {player.name}
                        {player.id === playerId && <em>you</em>}
                      </span>
                      {player.host && <span className="room-tag">host</span>}
                      {!player.connected && (
                        <span className="room-tag is-away">away</span>
                      )}
                    </li>
                  ))}
                </ol>
                <p className="room-seats">
                  {MAX_PLAYERS_PER_ROOM - room.players.length} seats left on this
                  rope
                </p>

                {isHost ? (
                  <button
                    className="btn btn-solid card-cta"
                    type="button"
                    onClick={start}
                    disabled={busy || !online}
                  >
                    {busy ? 'Calling the climb…' : 'Rope up'}{' '}
                    <span className="arrow">→</span>
                  </button>
                ) : (
                  <p className="room-wait">
                    Waiting for {hostName} to call the climb…
                  </p>
                )}

                <div className="card-actions">
                  <button className="card-back" type="button" onClick={onLeave}>
                    Leave room
                  </button>
                </div>
              </>
            )}

            {!lostSeat && room?.phase === 'round' && room.prompt && me && (
              <>
                <div className="card-top">
                  <p className="eyebrow">
                    Prompt {room.round + 1} of {room.total}
                  </p>
                  <div
                    className={`timer-ring ${seconds <= 8 ? 'is-low' : ''}`}
                    style={
                      {
                        '--t': `${(seconds / PROMPT_SECONDS) * 360}deg`,
                      } as CSSProperties
                    }
                    aria-hidden="true"
                  >
                    <span>{seconds}</span>
                  </div>
                </div>

                <p className="kicker">Anything in the world counts</p>
                <h2 className="ask-prompt">{room.prompt.text}</h2>

                {me.answered ? (
                  <div className="room-locked">
                    <span className="room-locked-stamp">In the register</span>
                    <p>
                      Locked. Your answer stays secret until the reveal — no
                      copying off the rope.
                    </p>
                  </div>
                ) : (
                  <form className="ask-form" onSubmit={onAnswer}>
                    <label className="sr-only" htmlFor="room-answer">
                      Your answer
                    </label>
                    <input
                      id="room-answer"
                      className="ask-input"
                      value={answerText}
                      onChange={(event) => setAnswerText(event.target.value)}
                      placeholder="Type anything real…"
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      maxLength={48}
                      disabled={!online}
                    />
                    <div className="ask-foot">
                      <p className="ask-hint">
                        {online
                          ? 'No options. No list. Just you.'
                          : 'Reconnecting to base camp…'}
                      </p>
                      <button
                        className="btn btn-solid"
                        type="submit"
                        disabled={!online || !answerText.trim()}
                      >
                        Send it up <span className="arrow">→</span>
                      </button>
                    </div>
                  </form>
                )}

                <div className="card-foot">
                  <span>
                    {room.players.filter((player) => player.answered).length} of{' '}
                    {room.players.filter((player) => player.connected).length} in
                    the register
                  </span>
                  <span>
                    {bandFor(me.altitude).name} ·{' '}
                    {me.altitude.toLocaleString('en-IN')} m
                  </span>
                </div>
              </>
            )}

            {!lostSeat && room?.phase === 'reveal' && lastRound && (
              <>
                <div className="card-top">
                  <p className="eyebrow">
                    Prompt {room.round + 1} of {room.total} · reveal
                  </p>
                  <span className={`tier-stamp points-${lastRound.points}`}>
                    {lastRound.timedOut ? 'No answer' : `${lastRound.points} pts`}
                  </span>
                </div>

                <div className="reveal-gain">
                  <span className="reveal-gain-num">
                    {lastRound.gain > 0 ? `+${lastRound.gain}` : '0'}
                  </span>
                  <span className="reveal-gain-unit">m</span>
                </div>
                <p className="reveal-tier">{lastRound.label}</p>
                <h2 className="reveal-answer">
                  {lastRound.timedOut ? 'No answer' : `“${lastRound.text}”`}
                </h2>
                {!lastRound.timedOut && (
                  <p className="reveal-math">
                    {lastRound.gain} m earned
                    {lastRound.slide ? ` · −${lastRound.slide} m scree slide` : ''}
                    {lastRound.rest ? ` · −${lastRound.rest} m rest` : ''}
                  </p>
                )}

                <blockquote className="trail-quote reveal-quote">
                  <p>“{lastRound.reaction}”</p>
                  <cite>Bhuwan uncle</cite>
                </blockquote>
                <p className="reveal-source">{sourceLine(lastRound)}</p>

                <div className="rope-board">
                  <div className="rope-board-head">
                    <p className="kicker">The rope</p>
                    <span>
                      {seconds}s to {lastRoundIndex ? 'the summit' : 'the next prompt'}
                    </span>
                  </div>
                  <ol className="rope-rows">
                    {ropeRows.map(({ player, last }) => (
                      <li
                        key={player.id}
                        className={player.id === playerId ? 'is-me' : undefined}
                      >
                        <span className="rope-row-name">{player.name}</span>
                        <span className="rope-row-answer">
                          {last.timedOut ? '—' : `“${last.text}”`}
                        </span>
                        <span className={`rope-row-points points-${last.points}`}>
                          {last.timedOut ? '0' : last.points}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            )}

            {!lostSeat && room?.phase === 'reveal' && !lastRound && (
              <p className="room-wait">Reading the register…</p>
            )}

            {!lostSeat && room?.phase === 'summit' && (
              <>
                <div className="card-top">
                  <p className="eyebrow">Summit · {room.code}</p>
                  <p className="summit-band">
                    {me ? bandFor(me.altitude).name : 'The mountain'} ·{' '}
                    {me && me.altitude >= SUMMIT_METRES ? 'the flag is yours' : 'climbed'}
                  </p>
                </div>
                <h1 className="summit-title">
                  {(me?.altitude ?? 0).toLocaleString('en-IN')}
                  <span> m</span>
                </h1>
                <p className="room-summit-line">
                  {myPosition > 0
                    ? `${ordinal(myPosition)} of ${standings.length} on the rope`
                    : `${standings.length} on the rope`}
                  {me ? ` · best answer ${me.best} pts` : ''}
                </p>

                <ol className="standings">
                  {standings.map((player, index) => (
                    <li
                      key={player.id}
                      className={`standing-row${player.id === playerId ? ' is-me' : ''}`}
                    >
                      <span className="standing-rank">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span
                        className="room-avatar"
                        style={{ '--tint': tintFor(player.id) } as CSSProperties}
                      >
                        {initialsFor(player.name)}
                      </span>
                      <span className="standing-name">
                        {player.name}
                        {player.id === playerId && <em>you</em>}
                        {player.host && <i>host</i>}
                      </span>
                      <span className="standing-best">{player.best} pts</span>
                      <span className="standing-alt">
                        {player.altitude.toLocaleString('en-IN')} m
                      </span>
                    </li>
                  ))}
                </ol>

                <div className="card-actions summit-actions">
                  {isHost ? (
                    <button
                      className="btn btn-solid"
                      type="button"
                      onClick={again}
                      disabled={busy || !online}
                    >
                      {busy ? 'Resetting…' : 'Climb again'}{' '}
                      <span className="arrow">→</span>
                    </button>
                  ) : (
                    <p className="room-wait">
                      {hostName} can call another climb.
                    </p>
                  )}
                  <button className="card-back" type="button" onClick={onLeave}>
                    Leave room
                  </button>
                </div>
              </>
            )}

            {lostSeat && room && (
              <div className="room-lost">
                <p className="eyebrow">Base camp</p>
                <h1 className="card-title">Off the rope.</h1>
                <p className="card-lede">
                  That seat is no longer in this room. Start fresh or join with the
                  code.
                </p>
                <div className="card-actions">
                  <button className="btn btn-solid" type="button" onClick={onLeave}>
                    Back to base camp
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <p className="scene-credit">Himalaya · photo via Unsplash</p>
    </main>
  )
}
