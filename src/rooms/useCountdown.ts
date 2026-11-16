import { useEffect, useState } from 'react'

export function useCountdown(deadline: number | null): number {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (deadline === null) {
      setSeconds(0)
      return
    }

    const tick = () => {
      setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [deadline])

  return seconds
}
