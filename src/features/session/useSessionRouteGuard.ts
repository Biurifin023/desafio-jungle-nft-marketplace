import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { sessionStore } from './session-store'

/**
 * Sessão encerrada fora desta aba (logout em outra aba): reexecuta os `beforeLoad` da rota atual
 * para que `requireAuth` leve as rotas privadas ao login.
 * `logout` local já navega por conta própria e `expired` é tratado pelo `SessionBanner`.
 */
export function useSessionRouteGuard() {
  const router = useRouter()
  useEffect(() => {
    const unsubscribe = sessionStore.subscribe((next, prev) => {
      if (prev.status !== 'authenticated' || next.status === 'authenticated' || next.reason) return
      void router.invalidate()
    })
    return () => {
      unsubscribe()
    }
  }, [router])
}
