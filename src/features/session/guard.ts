import { redirect, type ParsedLocation } from '@tanstack/react-router'
import { sessionStore } from './session-store'

/**
 * `beforeLoad` das rotas privadas: sem sessão, redireciona para o login guardando o destino
 * (`redirect`) para retomar o fluxo depois de autenticar.
 */
export function requireAuth({ location }: { location: ParsedLocation }) {
  if (sessionStore.get().status !== 'authenticated') {
    throw redirect({ to: '/login', search: { redirect: location.href } })
  }
}

/** Só aceita destinos internos (evita open redirect). */
export function safeRedirect(target: string | undefined, fallback = '/') {
  if (!target || !target.startsWith('/') || target.startsWith('//')) return fallback
  return target
}
