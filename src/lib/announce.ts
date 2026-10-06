import { useSyncExternalStore } from 'react'

/**
 * Região viva global (aria-live) para anunciar resultados de mutations e mudanças em tempo real
 * a leitores de tela. Complementa os toasts visuais.
 */
type Message = { id: number; text: string; politeness: 'polite' | 'assertive' }

let current: Message = { id: 0, text: '', politeness: 'polite' }
const listeners = new Set<() => void>()

export function announce(text: string, politeness: Message['politeness'] = 'polite') {
  current = { id: current.id + 1, text, politeness }
  listeners.forEach((l) => l())
}

export function useAnnouncement() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
    () => current,
  )
}
