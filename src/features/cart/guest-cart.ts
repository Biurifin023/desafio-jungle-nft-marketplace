import { STORAGE_KEYS, local } from '@/lib/storage'

/** Identificador do carrinho do visitante, enviado no header `X-Guest-Cart`. */
export const guestCart = {
  id: () => local.get<string>(STORAGE_KEYS.guestCart),
  set: (id: string) => local.set(STORAGE_KEYS.guestCart, id),
  clear: () => local.remove(STORAGE_KEYS.guestCart),
}
