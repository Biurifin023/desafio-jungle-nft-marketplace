import { z } from 'zod'
import { EthAmount, IsoDate } from './common'
import { OrderStatus } from './orders'

/**
 * Eventos Socket.IO. Todo evento carrega identidade estável (`eventId`), o recurso afetado
 * e a `version` do recurso após a mudança. O cliente descarta duplicatas (eventId já visto)
 * e eventos com versão menor ou igual à última aplicada.
 */
export const NftUpdatedEvent = z.object({
  eventId: z.string(),
  type: z.literal('nft.updated'),
  resource: z.object({ type: z.literal('nft'), id: z.string() }),
  version: z.number().int(),
  occurredAt: IsoDate,
  data: z.object({
    priceEth: EthAmount,
    available: z.number().int().min(0),
    editions: z.array(z.object({ id: z.string(), priceEth: EthAmount, available: z.number().int().min(0) })),
    reason: z.enum(['price_changed', 'availability_changed', 'sold_out', 'restocked']),
  }),
})
export type NftUpdatedEvent = z.infer<typeof NftUpdatedEvent>

export const OrderUpdatedEvent = z.object({
  eventId: z.string(),
  type: z.literal('order.updated'),
  resource: z.object({ type: z.literal('order'), id: z.string() }),
  version: z.number().int(),
  occurredAt: IsoDate,
  /** Eventos privados: entregues apenas às conexões autenticadas deste usuário. */
  userId: z.string(),
  data: z.object({
    status: OrderStatus,
    transaction: z.object({ hash: z.string(), explorerUrl: z.string() }).nullable(),
    failureReason: z.string().nullable(),
  }),
})
export type OrderUpdatedEvent = z.infer<typeof OrderUpdatedEvent>

export const RealtimeEvent = z.discriminatedUnion('type', [NftUpdatedEvent, OrderUpdatedEvent])
export type RealtimeEvent = z.infer<typeof RealtimeEvent>

export const REALTIME_EVENTS = ['nft.updated', 'order.updated'] as const
