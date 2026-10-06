import { z } from 'zod'

/** Valores em ETH trafegam como string decimal (até 18 casas) para preservar precisão. */
export const EthAmount = z.string().regex(/^\d+(\.\d{1,18})?$/, 'Valor ETH inválido')
export type EthAmount = z.infer<typeof EthAmount>

export const IsoDate = z.iso.datetime({ offset: true })

export const Network = z.enum(['ethereum', 'polygon', 'solana'])
export type Network = z.infer<typeof Network>

export const NETWORK_LABEL: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export const WalletProvider = z.enum(['metamask', 'walletconnect', 'coinbase'])
export type WalletProvider = z.infer<typeof WalletProvider>

export const WALLET_PROVIDER_LABEL: Record<WalletProvider, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

/**
 * Códigos de erro do envelope padronizado.
 * - validation_error (422), unauthorized/session_expired (401), forbidden (403), not_found (404)
 * - conflict, email_taken, username_taken, out_of_stock, price_changed, quote_stale,
 *   idempotency_conflict (409)
 * - coupon_invalid, coupon_expired (422), payment_declined, wallet_rejected (402/403)
 * - transient (503), internal (500), rate_limited (429)
 */
export const ApiErrorCode = z.enum([
  'validation_error',
  'unauthorized',
  'session_expired',
  'forbidden',
  'not_found',
  'conflict',
  'email_taken',
  'username_taken',
  'out_of_stock',
  'insufficient_stock',
  'price_changed',
  'quote_stale',
  'idempotency_conflict',
  'coupon_invalid',
  'coupon_expired',
  'payment_declined',
  'wallet_rejected',
  'rate_limited',
  'transient',
  'internal',
])
export type ApiErrorCode = z.infer<typeof ApiErrorCode>

export const ApiErrorBody = z.object({
  error: z.object({
    code: ApiErrorCode,
    message: z.string(),
    /** Erros por campo (nome do campo -> mensagem), usados nos formulários. */
    fields: z.record(z.string(), z.string()).optional(),
    retryable: z.boolean(),
    details: z.unknown().optional(),
  }),
})
export type ApiErrorBody = z.infer<typeof ApiErrorBody>

export const Pagination = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
})
export type Pagination = z.infer<typeof Pagination>

/** Imagem responsiva: `base` + `-{160|320|640|960}.webp`. */
export const ImageRef = z.object({
  base: z.string(),
  alt: z.string(),
})
export type ImageRef = z.infer<typeof ImageRef>
