import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CartResponse, QuoteResponse, type AddCartItemInput, type Cart, type Network } from './contracts'
import { qk } from './query-keys'
import { request } from '@/lib/http'
import { guestCart } from '@/features/cart/guest-cart'
import { useSessionSnapshot } from '@/features/session/session-store'

/** O servidor devolve o carrinho atualizado em toda mutation; o id do visitante é persistido. */
function remember(cart: Cart) {
  if (cart.owner.type === 'guest') guestCart.set(cart.id)
  return cart
}

export const cartApi = {
  get: (signal?: AbortSignal) => request(CartResponse, { url: '/cart', signal }).then((r) => remember(r.cart)),
  addItem: (input: AddCartItemInput) =>
    request(CartResponse, { url: '/cart/items', method: 'POST', data: input }).then((r) => remember(r.cart)),
  updateItem: (itemId: string, quantity: number) =>
    request(CartResponse, { url: `/cart/items/${encodeURIComponent(itemId)}`, method: 'PATCH', data: { quantity } }).then((r) =>
      remember(r.cart),
    ),
  removeItem: (itemId: string) =>
    request(CartResponse, { url: `/cart/items/${encodeURIComponent(itemId)}`, method: 'DELETE' }).then((r) => remember(r.cart)),
  applyCoupon: (code: string) =>
    request(CartResponse, { url: '/cart/coupon', method: 'POST', data: { code } }).then((r) => remember(r.cart)),
  removeCoupon: () => request(CartResponse, { url: '/cart/coupon', method: 'DELETE' }).then((r) => remember(r.cart)),
  merge: (guestCartId: string) =>
    request(CartResponse, { url: '/cart/merge', method: 'POST', data: { guestCartId } }).then((r) => r.cart),
  quote: (network: Network, signal?: AbortSignal) =>
    request(QuoteResponse, { url: '/quote', params: { network }, signal }).then((r) => r.quote),
  /** Cotação nova e não cacheada, usada pelo checkout para revalidar antes de confirmar. */
  refreshQuote: (network: Network) => request(QuoteResponse, { url: '/quote', params: { network, fresh: 1 } }).then((r) => r.quote),
  /** Aceita os preços atuais dos itens cujo preço mudou desde que foram adicionados. */
  acknowledgePrices: () =>
    request(CartResponse, { url: '/cart/acknowledge-prices', method: 'POST' }).then((r) => remember(r.cart)),
}

/** Dono do carrinho no cache: `user:<id>` ou `guest`. */
export function useCartOwner() {
  const snapshot = useSessionSnapshot()
  return snapshot.status === 'authenticated' ? `user:${snapshot.user.id}` : 'guest'
}

export const cartQuery = (owner: string) =>
  queryOptions({
    queryKey: qk.cart(owner),
    queryFn: ({ signal }) => cartApi.get(signal),
    staleTime: 0,
  })

export const quoteQuery = (owner: string, cart: Cart | undefined, network: Network) =>
  queryOptions({
    queryKey: qk.quote(owner, cart?.version, network),
    queryFn: ({ signal }) => cartApi.quote(network, signal),
    enabled: Boolean(cart && cart.items.length > 0),
    staleTime: 0,
  })

export function useCart() {
  const owner = useCartOwner()
  return useQuery(cartQuery(owner))
}

export function useQuote(network: Network = 'ethereum') {
  const owner = useCartOwner()
  const cart = useQuery(cartQuery(owner)).data
  return useQuery(quoteQuery(owner, cart, network))
}

function useCartMutation<TVars>(fn: (vars: TVars) => Promise<Cart>) {
  const queryClient = useQueryClient()
  const owner = useCartOwner()
  return useMutation({
    mutationFn: fn,
    onSuccess: (cart) => {
      queryClient.setQueryData(qk.cart(owner), cart)
      void queryClient.invalidateQueries({ queryKey: qk.quotes(owner) })
    },
  })
}

export const useAddToCart = () => useCartMutation((input: AddCartItemInput) => cartApi.addItem(input))
export const useUpdateCartItem = () =>
  useCartMutation(({ itemId, quantity }: { itemId: string; quantity: number }) => cartApi.updateItem(itemId, quantity))
export const useRemoveCartItem = () => useCartMutation((itemId: string) => cartApi.removeItem(itemId))
export const useApplyCoupon = () => useCartMutation((code: string) => cartApi.applyCoupon(code))
export const useRemoveCoupon = () => useCartMutation((_: void) => cartApi.removeCoupon())
export const useAcknowledgePrices = () => useCartMutation((_: void) => cartApi.acknowledgePrices())

/** Quantidade total de itens (badge do header e da barra mobile). */
export function useCartCount() {
  const { data } = useCart()
  return data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
}
