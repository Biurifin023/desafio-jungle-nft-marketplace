import { useNavigate } from '@tanstack/react-router'
import { useSessionSnapshot } from './session-store'
import { Button } from '@/components/ui/button'

/** Aviso persistente quando a sessão expira no meio da navegação. */
export function SessionBanner() {
  const snapshot = useSessionSnapshot()
  const navigate = useNavigate()
  if (snapshot.status !== 'anonymous' || snapshot.reason !== 'expired') return null
  return (
    <div role="alert" className="bg-coral/15 px-4 py-2 text-center text-sm text-cream">
      Sua sessão expirou.{' '}
      <Button
        variant="link"
        className="h-auto p-0 align-baseline text-sm"
        onClick={() => void navigate({ to: '/login', search: { redirect: window.location.pathname + window.location.search } })}
      >
        Entrar novamente
      </Button>
    </div>
  )
}
