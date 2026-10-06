import { z } from 'zod'
import { EthAmount, IsoDate, Network } from './common'

export const QuoteIssue = z.object({
  type: z.enum(['price_changed', 'out_of_stock', 'insufficient_stock', 'coupon_invalid', 'coupon_expired']),
  itemId: z.string().optional(),
  message: z.string(),
  previous: z.string().optional(),
  current: z.string().optional(),
})
export type QuoteIssue = z.infer<typeof QuoteIssue>

export const QuoteLine = z.object({
  itemId: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPriceEth: EthAmount,
  lineTotalEth: EthAmount,
  available: z.number().int().min(0),
})
export type QuoteLine = z.infer<typeof QuoteLine>

/**
 * Cotação calculada pela API para o carrinho atual. É a referência de valores para
 * o resumo e para finalizar o pedido (POST /orders exige `quoteId` válido).
 */
export const Quote = z.object({
  id: z.string(),
  cartId: z.string(),
  cartVersion: z.number().int(),
  network: Network,
  lines: z.array(QuoteLine),
  subtotalEth: EthAmount,
  discountEth: EthAmount,
  networkFeeEth: EthAmount,
  totalEth: EthAmount,
  coupon: z
    .object({
      code: z.string(),
      status: z.enum(['applied', 'invalid', 'expired']),
      description: z.string(),
    })
    .nullable(),
  issues: z.array(QuoteIssue),
  /** `false` quando há itens indisponíveis ou cupom inválido; o checkout fica bloqueado. */
  valid: z.boolean(),
  createdAt: IsoDate,
  expiresAt: IsoDate,
})
export type Quote = z.infer<typeof Quote>

export const QuoteResponse = z.object({ quote: Quote })

export const QuoteQuery = z.object({ network: Network.default('ethereum') })
export type QuoteQuery = z.input<typeof QuoteQuery>
