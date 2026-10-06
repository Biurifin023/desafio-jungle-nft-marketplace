import type { CartItem } from '@/api/contracts'

/** Teto da quantidade: estoque atual e limite por pedido da edição. */
export function maxQuantity(item: CartItem) {
  return Math.min(item.available, item.maxPerOrder)
}
