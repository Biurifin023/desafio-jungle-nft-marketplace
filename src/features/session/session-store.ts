import { useSyncExternalStore } from 'react'
import { z } from 'zod'
import { User } from '@/api/contracts'
import { STORAGE_KEYS, local } from '@/lib/storage'

/**
 * Estado da sessão no cliente. Só o token e o usuário mínimo ficam persistidos
 * (nunca a senha). A validade real é sempre confirmada por GET /api/session.
 */
export type SessionSnapshot =
  | { status: 'anonymous'; reason?: 'logout' | 'expired' }
  | { status: 'authenticated'; token: string; user: User; expiresAt: string }

type Listener = (next: SessionSnapshot, prev: SessionSnapshot) => void

const StoredSession = z.object({ token: z.string().min(1), user: User, expiresAt: z.string() })

/** O localStorage pode ter sido editado ou vir de uma versão antiga: dados inválidos são descartados. */
function load(): SessionSnapshot {
  const raw = local.get<unknown>(STORAGE_KEYS.session)
  if (raw == null) return { status: 'anonymous' }
  const stored = StoredSession.safeParse(raw)
  if (stored.success) return { status: 'authenticated', ...stored.data }
  local.remove(STORAGE_KEYS.session)
  return { status: 'anonymous' }
}

let snapshot: SessionSnapshot = typeof window === 'undefined' ? { status: 'anonymous' } : load()
const listeners = new Set<Listener>()

function set(next: SessionSnapshot) {
  const prev = snapshot
  snapshot = next
  if (next.status === 'authenticated') {
    local.set(STORAGE_KEYS.session, { token: next.token, user: next.user, expiresAt: next.expiresAt })
  } else {
    local.remove(STORAGE_KEYS.session)
  }
  listeners.forEach((l) => l(next, prev))
}

export const sessionStore = {
  get: () => snapshot,
  token: () => (snapshot.status === 'authenticated' ? snapshot.token : null),
  userId: () => (snapshot.status === 'authenticated' ? snapshot.user.id : null),
  signIn(token: string, user: User, expiresAt: string) {
    set({ status: 'authenticated', token, user, expiresAt })
  },
  updateUser(user: User) {
    if (snapshot.status === 'authenticated') set({ ...snapshot, user })
  },
  signOut() {
    set({ status: 'anonymous', reason: 'logout' })
  },
  /** Chamado pelo interceptor HTTP quando a API responde 401 para uma requisição autenticada. */
  expire() {
    if (snapshot.status === 'authenticated') set({ status: 'anonymous', reason: 'expired' })
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

/** Sincroniza abas: login/logout em outra aba reflete aqui. */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEYS.session) return
    const next = load()
    const prev = snapshot
    if (next.status === prev.status && (next.status === 'anonymous' || (prev.status === 'authenticated' && next.token === prev.token))) return
    snapshot = next
    listeners.forEach((l) => l(next, prev))
  })
}

export function useSessionSnapshot() {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.get, sessionStore.get)
}
