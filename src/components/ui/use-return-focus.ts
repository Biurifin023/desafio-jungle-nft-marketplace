import { useRef, type ComponentProps } from "react"
import type { Dialog as DialogPrimitive } from "radix-ui"

type ContentProps = ComponentProps<typeof DialogPrimitive.Content>

/**
 * O Radix só devolve o foco a um `Dialog.Trigger`. Diálogos controlados (sem Trigger) devolvem
 * o foco ao elemento que estava focado quando abriram.
 */
export function useReturnFocus({
  onOpenAutoFocus,
  onCloseAutoFocus,
}: Pick<ContentProps, "onOpenAutoFocus" | "onCloseAutoFocus">) {
  const returnTo = useRef<HTMLElement | null>(null)

  return {
    onOpenAutoFocus: (event: Event) => {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      onOpenAutoFocus?.(event)
    },
    onCloseAutoFocus: (event: Event) => {
      onCloseAutoFocus?.(event)
      const target = returnTo.current
      returnTo.current = null
      if (event.defaultPrevented || !target?.isConnected || target === document.body) return
      event.preventDefault()
      target.focus()
    },
  }
}
