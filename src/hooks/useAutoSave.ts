import { useEffect, useRef } from 'react'

export function useAutoSave(
  callback: () => Promise<void>,
  deps: unknown[],
  delay = 1500
) {
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }

    timerRef.current = window.setTimeout(() => {
      callback()
    }, delay)

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, deps)
}