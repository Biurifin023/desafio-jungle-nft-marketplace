import { useSyncExternalStore } from 'react'

const QUERY = '(min-width: 1024px)'

/** Desktop (lg+) usa o modal 500px; abaixo disso a tela cheia do Figma mobile. */
export function useDesktopAuth() {
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
