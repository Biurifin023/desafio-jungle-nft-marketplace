import Decimal from 'decimal.js'
import type { Network, Quote, QuoteIssue, QuoteLine } from '@/api/contracts'
import { db } from '../db/store'
import type { CartRecord } from '../db/schema'
import { cartOwnerKey, couponStatus } from './cart'

export const NETWORK_FEE: Record<Network, string> = {
  ethereum: '0.016',
  polygon: '0.002',
  solana: '0.001',
}

const QUOTE_TTL_MS = 5 * 60_000

const str = (d: Decimal) => {
  const s = d.toDecimalPlaces(18).toFixed()
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s
}

/** Calcula a cotação do carrinho com preços/estoque atuais. Não persiste. */
export function computeQuote(cart: CartRecord, network: Network): Omit<Quote, 'id' | 'createdAt' | 'expiresAt'> {
  const lines: QuoteLine[] = []
  const issues: QuoteIssue[] = []
  let subtotal = new Decimal(0)

  for (const item of cart.items) {
    const nft = db.get().nfts.find((n) => n.id === item.nftId)
    const edition = nft?.editions.find((e) => e.id === item.editionId)
    if (!nft || !edition) continue
    const itemId = `${item.nftId}:${item.editionId}`
    const lineTotal = new Decimal(edition.priceEth).times(item.quantity)
    subtotal = subtotal.plus(lineTotal)
    lines.push({
      itemId,
      nftId: nft.id,
      editionId: edition.id,
      name: nft.name,
      quantity: item.quantity,
      unitPriceEth: edition.priceEth,
      lineTotalEth: str(lineTotal),
      available: edition.available,
    })
    if (edition.available === 0) {
      issues.push({ type: 'out_of_stock', itemId, message: `${nft.name} (${edition.label}) esgotou.` })
    } else if (item.quantity > edition.available) {
      issues.push({
        type: 'insufficient_stock',
        itemId,
        message: `${nft.name} (${edition.label}): só restam ${edition.available} unidade(s).`,
        previous: String(item.quantity),
        current: String(edition.available),
      })
    }
    if (!new Decimal(item.addedPriceEth).eq(edition.priceEth)) {
      issues.push({
        type: 'price_changed',
        itemId,
        message: `O preço de ${nft.name} mudou de ${item.addedPriceEth} para ${edition.priceEth} ETH.`,
        previous: item.addedPriceEth,
        current: edition.priceEth,
      })
    }
  }

  let discount = new Decimal(0)
  let coupon: Quote['coupon'] = null
  if (cart.couponCode) {
    const { status, coupon: record } = couponStatus(cart.couponCode)
    coupon = { code: cart.couponCode, status, description: record?.description ?? 'Código inválido' }
    if (status === 'applied' && record) discount = subtotal.times(record.percentOff).dividedBy(100).toDecimalPlaces(6)
    else issues.push({ type: status === 'expired' ? 'coupon_expired' : 'coupon_invalid', message: status === 'expired' ? 'O cupom aplicado expirou.' : 'O cupom aplicado é inválido.' })
  }

  const fee = lines.length ? new Decimal(NETWORK_FEE[network]) : new Decimal(0)
  const total = Decimal.max(subtotal.minus(discount), 0).plus(fee)
  const blocking = issues.some((i) => i.type !== 'price_changed')

  return {
    cartId: cart.id,
    cartVersion: cart.version,
    network,
    lines,
    subtotalEth: str(subtotal),
    discountEth: str(discount),
    networkFeeEth: str(fee),
    totalEth: str(total),
    coupon,
    issues,
    valid: lines.length > 0 && !blocking,
  }
}

export function issueQuote(cart: CartRecord, network: Network): Quote {
  const base = computeQuote(cart, network)
  const now = Date.now()
  const quote: Quote = {
    ...base,
    id: db.nextId('quo'),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
  }
  db.mutate((s) => {
    s.quotes = s.quotes.filter((q) => Date.parse(q.expiresAt) > now).slice(-50)
    s.quotes.push({ ...quote, ownerKey: cartOwnerKey(cart) })
  })
  return quote
}

/** Mesma composição de valores? (ignora id/datas e o aviso informativo de preço). */
export function sameQuote(a: Omit<Quote, 'id' | 'createdAt' | 'expiresAt'>, b: Omit<Quote, 'id' | 'createdAt' | 'expiresAt'>) {
  const key = (q: typeof a) =>
    JSON.stringify([q.cartVersion, q.network, q.lines.map((l) => [l.itemId, l.quantity, l.unitPriceEth]), q.discountEth, q.networkFeeEth, q.totalEth])
  return key(a) === key(b)
}
