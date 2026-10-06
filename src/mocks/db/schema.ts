import type {
  Category,
  CollectorDetails,
  Edition,
  ImageRef,
  Network,
  NftBadge,
  Order,
  Quote,
  Wallet,
  WalletConnection,
} from '@/api/contracts'

/** Registro de NFT no "banco" simulado (fonte única para REST e eventos). */
export interface NftRecord {
  id: string
  tokenId: string
  name: string
  collection: { id: string; name: string }
  category: Category
  network: Network
  image: ImageRef
  gallery: ImageRef[]
  editions: Edition[]
  defaultEditionId: string
  compareAtPriceEth: string | null
  badge: NftBadge | null
  description: string
  story: string[]
  creator: { name: string; handle: string }
  attributes: string[]
  rating: { average: number; count: number }
  contract: { address: string; standard: string; royaltiesPct: number }
  networkInfo: string
  listedAt: string
  trendingScore: number
  version: number
}

export interface UserRecord {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl: string | null
  ensName: string
  walletNickname: string
  /** `sha256$<salt>$<hex>` — nunca a senha em claro. */
  passwordHash: string
  updatedAt: string
  version: number
}

export interface SessionRecord {
  token: string
  userId: string
  createdAt: string
  expiresAt: string
  revoked: boolean
}

export interface CartItemRecord {
  nftId: string
  editionId: string
  quantity: number
  /** Preço no momento em que o item entrou no carrinho (para avisar mudança). */
  addedPriceEth: string
}

export interface CartRecord {
  id: string
  owner: { type: 'guest' } | { type: 'user'; userId: string }
  items: CartItemRecord[]
  couponCode: string | null
  version: number
  updatedAt: string
}

export interface CouponRecord {
  code: string
  description: string
  percentOff: number
  expiresAt: string
}

export interface QuoteRecord extends Quote {
  ownerKey: string
}

export interface OrderRecord extends Order {
  idempotencyKey: string
  /** Momento previsto para a simulação concluir o pagamento (null = manual). */
  settleAt: string | null
  outcome: 'confirmed' | 'declined'
}

export interface IdempotencyRecord {
  userId: string
  bodyHash: string
  orderId: string
}

export interface WalletsRecord {
  primary: Wallet | null
  secondary: Wallet | null
}

export interface DbState {
  schemaVersion: number
  seq: number
  nfts: NftRecord[]
  users: UserRecord[]
  sessions: SessionRecord[]
  carts: CartRecord[]
  coupons: CouponRecord[]
  favorites: Record<string, string[]>
  wallets: Record<string, WalletsRecord>
  connections: WalletConnection[]
  quotes: QuoteRecord[]
  orders: OrderRecord[]
  idempotency: Record<string, IdempotencyRecord>
  /** Últimos dados do colecionador usados no checkout, por usuário. */
  collectorDrafts: Record<string, CollectorDetails>
}
