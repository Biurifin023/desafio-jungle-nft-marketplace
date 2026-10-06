import type { KeyboardEvent } from 'react'

/**
 * Navegação por teclado de grupos com um único item na ordem de Tab (abas, rádios):
 * setas avançam/voltam em ciclo, Home/End vão ao primeiro/último item habilitado.
 * Move o foco e devolve o índice escolhido, ou `null` se a tecla não se aplica.
 */
export function handleRovingKeyDown(event: KeyboardEvent<HTMLElement>): number | null {
  const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[data-roving-item]'))
  const enabled = items.filter((item) => !item.hasAttribute('disabled') && item.getAttribute('aria-disabled') !== 'true')
  if (!enabled.length) return null
  const current = enabled.indexOf(event.target as HTMLElement)

  let next: number
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      next = current < 0 ? 0 : (current + 1) % enabled.length
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      next = current < 0 ? enabled.length - 1 : (current - 1 + enabled.length) % enabled.length
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = enabled.length - 1
      break
    default:
      return null
  }

  event.preventDefault()
  const target = enabled[next]!
  target.focus()
  return items.indexOf(target)
}
