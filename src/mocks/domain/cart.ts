import { db } from '../db/store'
import type { CartRecord, UserRecord } from '../db/schema'
import { ApiFail } from '../network'
import { findNft } from './catalog'
import { optionalUser } from './auth'

const now = () => new Date().toISOString()

export const cartOwnerKey = (cart: CartRecord) => (cart.owner.type === 'user' ? `user:${cart.owner.userId}` : `guest:${cart.id}`)

function newCart(owner: CartRecord['owner']): CartRecord {
  const cart: CartRecord = { id: db.nextId(owner.type === 'user' ? 'cart_u' : 'cart_g'), owner, items: [], couponCode: null, version: 1, updatedAt: now() }
  db.mutate((s) => s.carts.push(cart))
  return cart
}

export function userCart(user: UserRecord): CartRecord {
  return db.get().carts.find((c) => c.owner.type === 'user' && c.owner.userId === user.id) ?? newCart({ type: 'user', userId: user.id })
}

/** Carrinho do usuário autenticado ou do visitante (header `X-Guest-Cart`). */
export function resolveCart(request: Request): CartRecord {
  const user = optionalUser(request)
  if (user) return userCart(user)
  const guestId = request.headers.get('X-Guest-Cart')
  const existing = guestId ? db.get().carts.find((c) => c.id === guestId && c.owner.type === 'guest') : undefined
  return existing ?? newCart({ type: 'guest' })
}

function touch(cart: CartRecord) {
  cart.version++
  cart.updatedAt = now()
}

function editionOf(nftId: string, editionId: string) {
  const nft = findNft(nftId)
  const edition = nft.editions.find((e) => e.id === editionId)
  if (!edition) throw new ApiFail(404, 'not_found', 'Edição não encontrada.')
  return { nft, edition }
}

function assertQuantity(nftId: string, editionId: string, quantity: number) {
  const { edition } = editionOf(nftId, editionId)
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ApiFail(422, 'validation_error', 'Quantidade inválida.', { quantity: 'Informe uma quantidade inteira maior que zero' })
  }
  if (edition.available === 0) throw new ApiFail(409, 'out_of_stock', `A edição ${edition.label} está esgotada.`, undefined, { available: 0 })
  if (quantity > edition.available) {
    throw new ApiFail(409, 'insufficient_stock', `Só há ${edition.available} unidade(s) disponível(is) da edição ${edition.label}.`, undefined, {
      available: edition.available,
    })
  }
  if (quantity > edition.maxPerOrder) {
    throw new ApiFail(422, 'validation_error', `Limite de ${edition.maxPerOrder} por pedido nesta edição.`, {
      quantity: `Máximo de ${edition.maxPerOrder} por pedido`,
    })
  }
  return edition
}

export function addItem(cart: CartRecord, nftId: string, editionId: string, quantity: number) {
  const current = cart.items.find((i) => i.nftId === nftId && i.editionId === editionId)
  const edition = assertQuantity(nftId, editionId, (current?.quantity ?? 0) + quantity)
  db.mutate((s) => {
    const c = s.carts.find((x) => x.id === cart.id)!
    const item = c.items.find((i) => i.nftId === nftId && i.editionId === editionId)
    if (item) item.quantity += quantity
    else c.items.push({ nftId, editionId, quantity, addedPriceEth: edition.priceEth })
    touch(c)
  })
}

function splitItemId(itemId: string) {
  const [nftId, editionId] = decodeURIComponent(itemId).split(':')
  if (!nftId || !editionId) throw new ApiFail(404, 'not_found', 'Item não encontrado no carrinho.')
  return { nftId, editionId }
}

export function updateItem(cart: CartRecord, itemId: string, quantity: number) {
  const { nftId, editionId } = splitItemId(itemId)
  if (!cart.items.some((i) => i.nftId === nftId && i.editionId === editionId)) throw new ApiFail(404, 'not_found', 'Item não encontrado no carrinho.')
  assertQuantity(nftId, editionId, quantity)
  db.mutate((s) => {
    const c = s.carts.find((x) => x.id === cart.id)!
    c.items.find((i) => i.nftId === nftId && i.editionId === editionId)!.quantity = quantity
    touch(c)
  })
}

export function removeItem(cart: CartRecord, itemId: string) {
  const { nftId, editionId } = splitItemId(itemId)
  db.mutate((s) => {
    const c = s.carts.find((x) => x.id === cart.id)!
    const before = c.items.length
    c.items = c.items.filter((i) => !(i.nftId === nftId && i.editionId === editionId))
    if (c.items.length === before) throw new ApiFail(404, 'not_found', 'Item não encontrado no carrinho.')
    touch(c)
  })
}

export function couponStatus(code: string) {
  const coupon = db.get().coupons.find((c) => c.code === code.trim().toUpperCase())
  if (!coupon) return { status: 'invalid' as const, coupon: null }
  if (Date.parse(coupon.expiresAt) < Date.now()) return { status: 'expired' as const, coupon }
  return { status: 'applied' as const, coupon }
}

export function applyCoupon(cart: CartRecord, code: string) {
  const { status, coupon } = couponStatus(code)
  if (status === 'invalid') throw new ApiFail(422, 'coupon_invalid', 'Código promocional inválido.', { code: 'Código promocional inválido' })
  if (status === 'expired') throw new ApiFail(422, 'coupon_expired', 'Este código promocional expirou.', { code: 'Este código promocional expirou' })
  db.mutate((s) => {
    const c = s.carts.find((x) => x.id === cart.id)!
    c.couponCode = coupon!.code
    touch(c)
  })
}

export function removeCoupon(cart: CartRecord) {
  db.mutate((s) => {
    const c = s.carts.find((x) => x.id === cart.id)!
    c.couponCode = null
    touch(c)
  })
}

/** O usuário viu os novos preços: o aviso `price_changed` deixa de aparecer na cotação. */
export function acknowledgePrices(cart: CartRecord) {
  db.mutate((s) => {
    const c = s.carts.find((x) => x.id === cart.id)!
    for (const item of c.items) {
      const edition = s.nfts.find((n) => n.id === item.nftId)?.editions.find((e) => e.id === item.editionId)
      if (edition) item.addedPriceEth = edition.priceEth
    }
    touch(c)
  })
}

/** Mescla o carrinho do visitante no do usuário, respeitando disponibilidade e limite por pedido. */
export function mergeGuestCart(user: UserRecord, guestCartId: string) {
  const target = userCart(user)
  const guest = db.get().carts.find((c) => c.id === guestCartId && c.owner.type === 'guest')
  if (!guest) return target
  db.mutate((s) => {
    const t = s.carts.find((c) => c.id === target.id)!
    for (const item of guest.items) {
      const nft = s.nfts.find((n) => n.id === item.nftId)
      const edition = nft?.editions.find((e) => e.id === item.editionId)
      if (!edition) continue
      const existing = t.items.find((i) => i.nftId === item.nftId && i.editionId === item.editionId)
      const desired = (existing?.quantity ?? 0) + item.quantity
      const capped = Math.min(desired, edition.available, edition.maxPerOrder)
      if (capped < 1) continue
      if (existing) existing.quantity = capped
      else t.items.push({ ...item, quantity: capped })
    }
    if (!t.couponCode && guest.couponCode) t.couponCode = guest.couponCode
    s.carts = s.carts.filter((c) => c.id !== guest.id)
    touch(t)
  })
  return db.get().carts.find((c) => c.id === target.id)!
}

/** Remove do carrinho apenas as quantidades efetivamente compradas. */
export function removePurchased(userId: string, lines: { nftId: string; editionId: string; quantity: number }[]) {
  db.mutate((s) => {
    const c = s.carts.find((x) => x.owner.type === 'user' && x.owner.userId === userId)
    if (!c) return
    for (const line of lines) {
      const item = c.items.find((i) => i.nftId === line.nftId && i.editionId === line.editionId)
      if (!item) continue
      item.quantity -= line.quantity
    }
    c.items = c.items.filter((i) => i.quantity > 0)
    touch(c)
  })
}
