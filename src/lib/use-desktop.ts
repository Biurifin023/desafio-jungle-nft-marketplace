import { useSyncExternalStore } from 'react'

const QUERY = '(min-width: 1024px)'

/** Breakpoint `lg` do Tailwind; telas com árvores diferentes no mobile renderizam só uma delas. */
export function useDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(QUERY)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}
