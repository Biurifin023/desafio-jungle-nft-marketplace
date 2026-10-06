import { HttpResponse } from 'msw'
import type { z } from 'zod'
import { AddCartItemInput, ApplyCouponInput, MergeCartInput, Network, UpdateCartItemInput } from '@/api/contracts'
import { db } from '../db/store'
import { ApiFail, readJson, route, zodFields } from '../network'
import { requireUser } from '../domain/auth'
import { acknowledgePrices, addItem, applyCoupon, mergeGuestCart, removeCoupon, removeItem, resolveCart, updateItem } from '../domain/cart'
import { issueQuote } from '../domain/quote'
import { toCart } from '../domain/serializers'

const current = (id: string) => db.get().carts.find((c) => c.id === id)!
const respond = (id: string) => HttpResponse.json({ cart: toCart(current(id)) })

export function parse<S extends z.ZodType>(schema: S, value: unknown): z.infer<S> {
  const r = schema.safeParse(value)
  if (!r.success) throw new ApiFail(422, 'validation_error', 'Revise os campos destacados.', zodFields(r.error.issues))
  return r.data
}

export const cartHandlers = [
  route('get', '/cart', ({ request }) => respond(resolveCart(request).id)),

  route('post', '/cart/items', async ({ request }) => {
    const cart = resolveCart(request)
    const input = parse(AddCartItemInput, await readJson(request))
    addItem(cart, input.nftId, input.editionId, input.quantity)
    return respond(cart.id)
  }),

  route<{ itemId: string }>('patch', '/cart/items/:itemId', async ({ request, params }) => {
    const cart = resolveCart(request)
    const input = parse(UpdateCartItemInput, await readJson(request))
    updateItem(cart, params.itemId, input.quantity)
    return respond(cart.id)
  }),

  route<{ itemId: string }>('delete', '/cart/items/:itemId', ({ request, params }) => {
    const cart = resolveCart(request)
    removeItem(cart, params.itemId)
    return respond(cart.id)
  }),

  route('post', '/cart/coupon', async ({ request }) => {
    const cart = resolveCart(request)
    const input = parse(ApplyCouponInput, await readJson(request))
    applyCoupon(cart, input.code)
    return respond(cart.id)
  }),

  route('delete', '/cart/coupon', ({ request }) => {
    const cart = resolveCart(request)
    removeCoupon(cart)
    return respond(cart.id)
  }),

  route('post', '/cart/acknowledge-prices', ({ request }) => {
    const cart = resolveCart(request)
    acknowledgePrices(cart)
    return respond(cart.id)
  }),

  route('post', '/cart/merge', async ({ request }) => {
    const user = requireUser(request, { privateResource: false })
    const input = parse(MergeCartInput, await readJson(request))
    const merged = mergeGuestCart(user, input.guestCartId)
    return respond(merged.id)
  }),

  route('get', '/quote', ({ request }) => {
    const cart = resolveCart(request)
    const network = Network.safeParse(new URL(request.url).searchParams.get('network') ?? 'ethereum')
    if (!network.success) throw new ApiFail(422, 'validation_error', 'Rede inválida.', { network: 'Selecione uma rede válida' })
    return HttpResponse.json({ quote: issueQuote(current(cart.id), network.data) })
  }),
]
