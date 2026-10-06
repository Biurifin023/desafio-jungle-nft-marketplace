import type { NftListQuery, Network } from './contracts'

/**
 * Chaves do TanStack Query. Dados privados sempre incluem o dono (userId ou guest:<cartId>)
 * para que caches de usuários diferentes nunca se misturem.
 */
export const qk = {
  session: (token: string | null) => ['session', token] as const,

  nfts: {
    all: ['nfts'] as const,
    lists: () => ['nfts', 'list'] as const,
    list: (query: NftListQuery) => ['nfts', 'list', query] as const,
    detail: (id: string) => ['nfts', 'detail', id] as const,
    related: (id: string) => ['nfts', 'related', id] as const,
    featured: () => ['nfts', 'featured'] as const,
  },

  cart: (owner: string) => ['cart', owner] as const,
  quote: (owner: string, cartVersion: number | undefined, network: Network) => ['quote', owner, cartVersion, network] as const,
  quotes: (owner: string) => ['quote', owner] as const,

  favorites: (userId: string) => ['private', userId, 'favorites'] as const,
  profile: (userId: string) => ['private', userId, 'profile'] as const,
  wallets: (userId: string) => ['private', userId, 'wallets'] as const,
  orders: {
    all: (userId: string) => ['private', userId, 'orders'] as const,
    detail: (userId: string, orderId: string) => ['private', userId, 'orders', orderId] as const,
    pending: (userId: string) => ['private', userId, 'orders', 'pending'] as const,
  },
}

/** Dono do carrinho atual (usuário autenticado ou visitante). */
export const cartOwnerKey = (userId: string | null, guestCartId: string | null) =>
  userId ? `user:${userId}` : `guest:${guestCartId ?? 'new'}`
