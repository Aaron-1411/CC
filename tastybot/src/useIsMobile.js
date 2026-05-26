import { useState, useEffect } from 'react'

export function useIsMobile(breakpoint = 640) {
  const query = `(max-width: ${breakpoint - 1}px)`
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return isMobile
}
