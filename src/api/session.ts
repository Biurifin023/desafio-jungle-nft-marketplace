import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { CurrentSessionResponse, SessionResponse, type LoginInput, type RegisterInput, type User } from './contracts'
import { cartApi } from './cart'
import { qk } from './query-keys'
import { http, request } from '@/lib/http'
import { STORAGE_KEYS, session } from '@/lib/storage'
import { sessionStore, useSessionSnapshot } from '@/features/session/session-store'
import { guestCart } from '@/features/cart/guest-cart'
import { clearPrivateCache } from '@/app/query-client'
import { disconnectSocket } from '@/lib/socket'

export const sessionApi = {
  current: (signal?: AbortSignal) => request(CurrentSessionResponse, { url: '/session', signal }),
  login: (input: LoginInput) => request(SessionResponse, { url: '/session', method: 'POST', data: input }),
  register: (input: RegisterInput) => request(SessionResponse, { url: '/accounts', method: 'POST', data: input }),
  logout: () => http.delete('/session').then(() => undefined),
}

export const currentSessionQuery = (token: string | null) =>
  queryOptions({
    queryKey: qk.session(token),
    queryFn: ({ signal }) => sessionApi.current(signal),
    enabled: Boolean(token),
    staleTime: 60_000,
    retry: false,
  })

/** Sessão validada no servidor; `snapshot` é o estado local imediato. */
export function useSession() {
  const snapshot = useSessionSnapshot()
  const token = snapshot.status === 'authenticated' ? snapshot.token : null
  const query = useQuery(currentSessionQuery(token))
  return { snapshot, query, user: snapshot.status === 'authenticated' ? snapshot.user : null }
}

async function adoptGuestCart(queryClient: QueryClient, userId: string) {
  const guestId = guestCart.id()
  if (!guestId) return
  try {
    const cart = await cartApi.merge(guestId)
    guestCart.clear()
    queryClient.setQueryData(qk.cart(`user:${userId}`), cart)
    queryClient.removeQueries({ queryKey: ['cart', 'guest'] })
  } catch {
    /* merge é melhor-esforço; o id do visitante permanece para nova tentativa */
  }
}

function beginSession(queryClient: QueryClient, s: { token: string; user: User; expiresAt: string }) {
  disconnectSocket()
  clearPrivateCache(queryClient)
  sessionStore.signIn(s.token, s.user, s.expiresAt)
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sessionApi.login,
    onSuccess: (s) => {
      beginSession(queryClient, s)
      void adoptGuestCart(queryClient, s.user.id)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sessionApi.register,
    onSuccess: (s) => {
      beginSession(queryClient, s)
      void adoptGuestCart(queryClient, s.user.id)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sessionApi.logout,
    onSettled: () => {
      disconnectSocket()
      session.remove(STORAGE_KEYS.checkoutDraft)
      session.remove(STORAGE_KEYS.checkoutAttempt)
      sessionStore.signOut()
      clearPrivateCache(queryClient)
    },
  })
}
