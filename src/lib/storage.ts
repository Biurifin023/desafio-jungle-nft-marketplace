/** Acesso seguro ao localStorage/sessionStorage (modo privado, quota, SSR). */
function safe(storage: () => Storage) {
  return {
    get<T>(key: string): T | null {
      try {
        const raw = storage().getItem(key)
        return raw ? (JSON.parse(raw) as T) : null
      } catch {
        return null
      }
    },
    set(key: string, value: unknown) {
      try {
        storage().setItem(key, JSON.stringify(value))
      } catch {
        /* quota excedida ou storage indisponível */
      }
    },
    remove(key: string) {
      try {
        storage().removeItem(key)
      } catch {
        /* noop */
      }
    },
  }
}

export const local = safe(() => window.localStorage)
export const session = safe(() => window.sessionStorage)

export const STORAGE_KEYS = {
  session: 'kurio.session',
  guestCart: 'kurio.guestCartId',
  checkoutDraft: 'kurio.checkoutDraft',
  checkoutAttempt: 'kurio.checkoutAttempt',
} as const
