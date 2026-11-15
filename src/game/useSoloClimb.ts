import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { PROMPT_SECONDS } from '../../shared/game'
import { dailyKey, dailyPrompts } from '../../shared/prompts'
import { requestJudge } from '../net/api'
import {
  climbReducer,
  initialClimb,
  readSavedClimb,
  writeSavedClimb,
  type ClimbAction,
  type ClimbState,
  type SavedClimb,
} from './solo'

export function useSoloClimb() {
  const prompts = useMemo(() => dailyPrompts(), [])
  const date = useMemo(() => dailyKey(), [])
  const total = prompts.length

  const [state, dispatch] = useReducer(
    (current: ClimbState, action: ClimbAction) => climbReducer(current, action, total),
    initialClimb,
  )
  const [answer, setAnswer] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(PROMPT_SECONDS)
  const [saved, setSaved] = useState<SavedClimb | null>(() => readSavedClimb(date))

  const stateRef = useRef(state)
  stateRef.current = state
  const pendingRef = useRef(false)
  const lockedRound = useRef(-1)
  const submitRef = useRef<(raw: string | null) => void>(() => {})
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = useCallback(
    async (raw: string | null) => {
      const current = stateRef.current
      if (pendingRef.current || current.phase !== 'asking') return

      const roundIndex = current.rounds.length
      if (lockedRound.current === roundIndex) return

      const prompt = prompts[roundIndex]
      if (!prompt) return

      if (raw === null) {
        lockedRound.current = roundIndex
        pendingRef.current = true
        setPending(true)
        setAnswer('')
        setError('')
        dispatch({ type: 'answer', prompt, answer: '', result: null })
        pendingRef.current = false
        setPending(false)
        return
      }

      const text = raw.trim()
      if (!text) {
        setError('Type something, beta.')
        return
      }

      lockedRound.current = roundIndex
      pendingRef.current = true
      setPending(true)
      setError('')

      const response = await requestJudge(prompt.id, text)
      if (response.result) {
        dispatch({
          type: 'answer',
          prompt,
          answer: text,
          result: response.result,
        })
        setAnswer('')
      } else {
        lockedRound.current = -1
        setError(response.error ?? 'The mountain is thinking. Try again.')
      }

      pendingRef.current = false
      setPending(false)
    },
    [prompts],
  )

  useEffect(() => {
    submitRef.current = submit
  }, [submit])

  useEffect(() => {
    if (state.phase !== 'asking') return
    const deadline = Date.now() + PROMPT_SECONDS * 1000
    setSecondsLeft(PROMPT_SECONDS)
    const id = window.setInterval(() => {
      const remaining = Math.max(0, (deadline - Date.now()) / 1000)
      setSecondsLeft(Math.ceil(remaining))
      if (remaining <= 0) {
        window.clearInterval(id)
        void submitRef.current(null)
      }
    }, 120)
    return () => window.clearInterval(id)
  }, [state.phase, state.rounds.length])

  useEffect(() => {
    if (state.phase !== 'summit') return
    setSaved((previous) => writeSavedClimb(date, state, previous))
  }, [state, date])

  useEffect(() => {
    if (state.phase === 'asking') inputRef.current?.focus()
  }, [state.phase, state.rounds.length])

  const start = useCallback(() => {
    lockedRound.current = -1
    setAnswer('')
    setError('')
    setPending(false)
    pendingRef.current = false
    setSecondsLeft(PROMPT_SECONDS)
    dispatch({ type: 'start' })
  }, [])

  const next = useCallback(() => {
    setAnswer('')
    setError('')
    dispatch({ type: 'next' })
  }, [])

  const onSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      void submit(answer)
    },
    [submit, answer],
  )

  useEffect(() => {
    if (state.phase !== 'reveal') return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !(event.target instanceof HTMLInputElement)) next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.phase, next])

  const activePrompt = state.phase === 'asking' ? prompts[state.rounds.length] : undefined
  const round = state.rounds[state.rounds.length - 1]

  return {
    state,
    prompts,
    total,
    activePrompt,
    round,
    answer,
    setAnswer,
    pending,
    error,
    secondsLeft,
    saved,
    inputRef,
    start,
    next,
    onSubmit,
  }
}
