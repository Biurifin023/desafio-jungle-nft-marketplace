import { CreateOrderInput, type Order } from '@/api/contracts'
import { db } from '../db/store'
import type { OrderRecord, UserRecord } from '../db/schema'
import { ApiFail, zodFields } from '../network'
import { realtimeBus } from '../realtime/bus'
import { scenarioState } from '../scenarios'
import { removePurchased, userCart } from './cart'
import { updateNft } from './catalog'
import { computeQuote, issueQuote, sameQuote } from './quote'

const timers = new Map<string, ReturnType<typeof setTimeout>>()
/** Cenários "na primeira tentativa" disparam uma vez por reset. */
const firedOnce = new Set<string>()

export const ordersState = {
  reset() {
    timers.forEach((t) => clearTimeout(t))
    timers.clear()
    firedOnce.clear()
  },
}

async function hashBody(body: unknown) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(body)))
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const publicOrder = (o: OrderRecord): Order => {
  const { idempotencyKey: _k, settleAt: _s, outcome: _o, ...order } = o
  return order
}

export function getOrder(user: UserRecord, id: string): Order {
  settleDue()
  const order = db.get().orders.find((o) => o.id === id)
  // Pedido de outro usuário responde 404 para não revelar a existência.
  if (!order || order.userId !== user.id) throw new ApiFail(404, 'not_found', 'Pedido não encontrado.')
  return publicOrder(order)
}

export function listOrders(user: UserRecord, status?: string) {
  settleDue()
  return db
    .get()
    .orders.filter((o) => o.userId === user.id && (!status || o.status === status))
    .map(publicOrder)
}

function fakeHash(seed: string) {
  let h = 0x811c9dc5
  let out = ''
  for (let round = 0; round < 8; round++) {
    for (const ch of `${seed}:${round}`) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0
    out += h.toString(16).padStart(8, '0')
  }
  return `0x${out}`
}

/** Conclui o pagamento (confirmado/recusado), publica `order.updated` e ajusta estoque/carrinho. */
export function settleOrder(orderId: string, outcome?: 'confirmed' | 'declined') {
  const current = db.get().orders.find((o) => o.id === orderId)
  if (!current || current.status !== 'pending') return current ? publicOrder(current) : undefined
  const final = outcome ?? current.outcome
  timers.delete(orderId)

  const order = db.mutate((s) => {
    const o = s.orders.find((x) => x.id === orderId)!
    o.status = final
    o.version++
    o.updatedAt = new Date().toISOString()
    o.settleAt = null
    if (final === 'confirmed') {
      const hash = fakeHash(o.id)
      o.transaction = { hash, explorerUrl: `https://sepolia.etherscan.io/tx/${hash}` }
    } else {
      o.failureReason = 'A carteira recusou a assinatura da transação (simulação).'
    }
    return { ...o }
  })

  if (final === 'confirmed') {
    removePurchased(order.userId, order.lines)
  } else {
    // Estorna a reserva de estoque.
    for (const line of order.lines) {
      const edition = db.get().nfts.find((n) => n.id === line.nftId)?.editions.find((e) => e.id === line.editionId)
      if (edition) updateNft(line.nftId, { editionId: line.editionId, available: edition.available + line.quantity }, 'restocked')
    }
  }

  realtimeBus.publish({
    type: 'order.updated',
    resource: { type: 'order', id: order.id },
    version: order.version,
    userId: order.userId,
    data: { status: order.status, transaction: order.transaction, failureReason: order.failureReason },
  })
  return publicOrder(order)
}

function schedule(order: OrderRecord) {
  if (!order.settleAt || timers.has(order.id)) return
  const wait = Math.max(0, Date.parse(order.settleAt) - Date.now())
  timers.set(
    order.id,
    setTimeout(() => settleOrder(order.id), wait),
  )
}

/** Recupera pedidos pendentes após refresh: conclui os vencidos e reagenda os demais. */
export function settleDue() {
  for (const order of db.get().orders) {
    if (order.status !== 'pending' || !order.settleAt) continue
    if (Date.parse(order.settleAt) <= Date.now()) settleOrder(order.id)
    else schedule(order)
  }
}

export interface CreateOrderResult {
  order: Order
  replayed: boolean
  delayResponseMs: number
}

export async function createOrder(user: UserRecord, rawBody: unknown, idempotencyKey: string | null): Promise<CreateOrderResult> {
  if (!idempotencyKey || idempotencyKey.length < 8) {
    throw new ApiFail(422, 'validation_error', 'Header Idempotency-Key obrigatório.')
  }
  const parsed = CreateOrderInput.safeParse(rawBody)
  if (!parsed.success) throw new ApiFail(422, 'validation_error', 'Revise os dados do pedido.', zodFields(parsed.error.issues))
  const input = parsed.data
  const bodyHash = await hashBody(input)

  // 1) Idempotência: mesma chave + mesmo corpo → mesmo pedido; corpo diferente → conflito.
  const previous = db.get().idempotency[idempotencyKey]
  if (previous) {
    if (previous.userId !== user.id || previous.bodyHash !== bodyHash) {
      throw new ApiFail(409, 'idempotency_conflict', 'Esta tentativa de compra já foi usada com outros dados.')
    }
    return { order: getOrder(user, previous.orderId), replayed: true, delayResponseMs: 0 }
  }

  const business = scenarioState.active().business
  const cart = userCart(user)
  const first = cart.items[0]

  // 2) Cenários de mudança durante a compra (apenas na primeira tentativa após o reset).
  if (first && business.priceChangeOnCheckout && !firedOnce.has('price')) {
    firedOnce.add('price')
    const edition = db.get().nfts.find((n) => n.id === first.nftId)!.editions.find((e) => e.id === first.editionId)!
    updateNft(first.nftId, { editionId: first.editionId, priceEth: (Number(edition.priceEth) + 0.05).toFixed(2) }, 'price_changed')
  }
  if (first && business.soldOutOnCheckout && !firedOnce.has('soldout')) {
    firedOnce.add('soldout')
    updateNft(first.nftId, { editionId: first.editionId, available: 0 }, 'sold_out')
  }

  // 3) Revalida a cotação usada na revisão.
  const quote = db.get().quotes.find((q) => q.id === input.quoteId)
  const fresh = computeQuote(db.get().carts.find((c) => c.id === cart.id)!, input.network)
  if (!quote || quote.ownerKey !== `user:${user.id}` || Date.parse(quote.expiresAt) < Date.now() || !sameQuote(quote, fresh)) {
    const newQuote = issueQuote(db.get().carts.find((c) => c.id === cart.id)!, input.network)
    throw new ApiFail(409, 'quote_stale', 'Preço, disponibilidade ou taxas mudaram. Revise e confirme novamente.', undefined, { quote: newQuote })
  }
  if (!fresh.valid) {
    const issue = fresh.issues.find((i) => i.type !== 'price_changed')
    throw new ApiFail(409, issue?.type === 'out_of_stock' ? 'out_of_stock' : 'conflict', issue?.message ?? 'O carrinho tem itens indisponíveis.', undefined, {
      quote: issueQuote(db.get().carts.find((c) => c.id === cart.id)!, input.network),
    })
  }

  // 4) Carteira precisa pertencer ao usuário.
  const wallets = db.get().wallets[user.id]
  const wallet = [wallets?.primary, wallets?.secondary].find((w) => w?.id === input.walletId)
  if (!wallet) throw new ApiFail(422, 'validation_error', 'Selecione uma carteira cadastrada.', { walletId: 'Selecione uma carteira cadastrada' })

  // 5) Cria o pedido pendente com snapshot dos itens e reserva o estoque.
  const nowIso = new Date().toISOString()
  const id = db.nextId('ord')
  const delayMs = business.paymentOutcome === 'manual' ? null : business.paymentDelayMs
  const record: OrderRecord = {
    id,
    userId: user.id,
    status: 'pending',
    quoteId: quote.id,
    lines: fresh.lines.map((l) => {
      const nft = db.get().nfts.find((n) => n.id === l.nftId)!
      const edition = nft.editions.find((e) => e.id === l.editionId)!
      return {
        itemId: l.itemId,
        nftId: l.nftId,
        editionId: l.editionId,
        editionLabel: edition.label,
        name: nft.name,
        tokenId: nft.tokenId,
        image: nft.image,
        quantity: l.quantity,
        unitPriceEth: l.unitPriceEth,
        lineTotalEth: l.lineTotalEth,
      }
    }),
    subtotalEth: fresh.subtotalEth,
    discountEth: fresh.discountEth,
    networkFeeEth: fresh.networkFeeEth,
    totalEth: fresh.totalEth,
    couponCode: fresh.coupon?.status === 'applied' ? fresh.coupon.code : null,
    network: input.network,
    wallet: { id: wallet.id, label: wallet.nickname, address: wallet.address, provider: wallet.provider },
    collector: input.collector,
    transaction: null,
    failureReason: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    version: 1,
    idempotencyKey,
    settleAt: delayMs === null ? null : new Date(Date.now() + delayMs).toISOString(),
    outcome: business.paymentOutcome === 'declined' ? 'declined' : 'confirmed',
  }
  db.mutate((s) => {
    s.orders.push(record)
    s.idempotency[idempotencyKey] = { userId: user.id, bodyHash, orderId: id }
    s.collectorDrafts[user.id] = input.collector
  })
  for (const line of record.lines) {
    const edition = db.get().nfts.find((n) => n.id === line.nftId)!.editions.find((e) => e.id === line.editionId)!
    updateNft(line.nftId, { editionId: line.editionId, available: edition.available - line.quantity }, 'availability_changed')
  }
  schedule(record)

  const timeout = business.orderTimeoutAfterCreate && !firedOnce.has('timeout')
  if (timeout) firedOnce.add('timeout')
  return { order: publicOrder(record), replayed: false, delayResponseMs: timeout ? 12_000 : 0 }
}
