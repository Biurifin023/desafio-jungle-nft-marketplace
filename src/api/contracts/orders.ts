import { z } from 'zod'
import { EthAmount, ImageRef, IsoDate, Network, WalletProvider } from './common'

export const OrderStatus = z.enum(['pending', 'confirmed', 'declined'])
export type OrderStatus = z.infer<typeof OrderStatus>

export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = ['confirmed', 'declined']

export const CollectorDetails = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição').max(60),
  username: z.string().trim().min(3, 'Informe o nome de usuário').max(24),
  profileName: z.string().trim().min(2, 'Informe o nome do perfil').max(60),
  email: z.email('Informe um e-mail válido'),
  referralCode: z.string().trim().min(3, 'Informe o código de indicação').max(20),
  ensName: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{3,32}$/, 'Use 3 a 32 caracteres: letras minúsculas, números ou "-"'),
  note: z.string().max(500).optional(),
})
export type CollectorDetails = z.infer<typeof CollectorDetails>

export const CreateOrderInput = z.object({
  quoteId: z.string(),
  walletId: z.string(),
  network: Network,
  collector: CollectorDetails,
})
export type CreateOrderInput = z.infer<typeof CreateOrderInput>

export const OrderLine = z.object({
  itemId: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  editionLabel: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: ImageRef,
  quantity: z.number().int().positive(),
  unitPriceEth: EthAmount,
  lineTotalEth: EthAmount,
})
export type OrderLine = z.infer<typeof OrderLine>

/** Pedido com snapshot imutável dos itens e valores (o recibo nunca relê o catálogo). */
export const Order = z.object({
  id: z.string(),
  userId: z.string(),
  status: OrderStatus,
  quoteId: z.string(),
  lines: z.array(OrderLine),
  subtotalEth: EthAmount,
  discountEth: EthAmount,
  networkFeeEth: EthAmount,
  totalEth: EthAmount,
  couponCode: z.string().nullable(),
  network: Network,
  wallet: z.object({ id: z.string(), label: z.string(), address: z.string(), provider: WalletProvider }),
  collector: CollectorDetails,
  transaction: z.object({ hash: z.string(), explorerUrl: z.string() }).nullable(),
  failureReason: z.string().nullable(),
  createdAt: IsoDate,
  updatedAt: IsoDate,
  version: z.number().int(),
})
export type Order = z.infer<typeof Order>

export const OrderResponse = z.object({ order: Order })
export const OrderListResponse = z.object({ items: z.array(Order) })

export const IDEMPOTENCY_HEADER = 'Idempotency-Key'
