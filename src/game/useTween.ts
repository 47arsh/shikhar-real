import { useEffect, useRef, useState } from 'react'

export function useTween(target: number, duration = 760): number {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)

  useEffect(() => {
    const from = fromRef.current
    if (from === target) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      fromRef.current = target
      setValue(target)
      return
    }

    const started = performance.now()
    let frame = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration)
      const eased = 1 - Math.pow(1 - t, 4)
      const next = from + (target - from) * eased
      fromRef.current = next
      setValue(next)
      if (t < 1) frame = window.requestAnimationFrame(step)
    }
    frame = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}
