import Decimal from 'decimal.js'
import { Category, Network, NftSort, NftTab, type NftFacets, type NftListResponse } from '@/api/contracts'
import { db } from '../db/store'
import type { NftRecord } from '../db/schema'
import { FIXTURE_NOW } from '../db/fixtures'
import { realtimeBus } from '../realtime/bus'
import { scenarioState } from '../scenarios'
import { defaultEdition, toSummary, totalAvailable } from './serializers'
import { ApiFail } from '../network'

const NEW_CUTOFF = Date.parse(FIXTURE_NOW) - 30 * 86_400_000

const csv = <T extends string>(value: string | null, allowed: readonly T[]) =>
  (value ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter((v): v is T => (allowed as readonly string[]).includes(v))

export function parseListParams(url: URL) {
  const p = url.searchParams
  const int = (k: string, def: number, max = Infinity) => {
    const n = Number(p.get(k))
    return Number.isInteger(n) && n >= 1 ? Math.min(n, max) : def
  }
  const price = (k: string) => {
    const v = p.get(k)
    return v && /^\d+(\.\d+)?$/.test(v) ? v : undefined
  }
  return {
    q: p.get('q')?.trim().toLowerCase() || undefined,
    categories: csv(p.get('categories'), Category.options),
    networks: csv(p.get('networks'), Network.options),
    minPrice: price('minPrice'),
    maxPrice: price('maxPrice'),
    tab: NftTab.safeParse(p.get('tab')).data ?? 'all',
    sort: NftSort.safeParse(p.get('sort')).data ?? 'recent',
    page: int('page', 1),
    pageSize: int('pageSize', 9, 48),
  }
}

type ListParams = ReturnType<typeof parseListParams>

const priceOf = (n: NftRecord) => new Decimal(defaultEdition(n).priceEth)

function facetsFor(items: NftRecord[]): NftFacets {
  const categories = Object.fromEntries(Category.options.map((c) => [c, 0])) as NftFacets['categories']
  const networks = Object.fromEntries(Network.options.map((n) => [n, 0])) as NftFacets['networks']
  for (const n of items) {
    categories[n.category]++
    networks[n.network]++
  }
  const prices = items.map(priceOf)
  return {
    categories,
    networks,
    price: {
      min: prices.length ? Decimal.min(...prices).toFixed(2) : '0.00',
      max: prices.length ? Decimal.max(...prices).toFixed(2) : '0.00',
    },
  }
}

export function listNfts(params: ListParams): NftListResponse {
  const all = scenarioState.active().business.catalogEmpty ? [] : db.get().nfts

  const matchesText = (n: NftRecord) =>
    !params.q || [n.name, n.collection.name, n.tokenId, n.creator.name].some((f) => f.toLowerCase().includes(params.q!))
  const matchesTab = (n: NftRecord) =>
    params.tab === 'all' || (params.tab === 'new' ? Date.parse(n.listedAt) >= NEW_CUTOFF : n.trendingScore >= 60)
  const matchesPrice = (n: NftRecord) =>
    (!params.minPrice || priceOf(n).gte(params.minPrice)) && (!params.maxPrice || priceOf(n).lte(params.maxPrice))

  // Facetas refletem busca + aba (não os próprios filtros), para os contadores da sidebar.
  const base = all.filter((n) => matchesText(n) && matchesTab(n))
  const filtered = base.filter(
    (n) =>
      (!params.categories.length || params.categories.includes(n.category)) &&
      (!params.networks.length || params.networks.includes(n.network)) &&
      matchesPrice(n),
  )

  const sorted = [...filtered].sort((a, b) => {
    switch (params.sort) {
      case 'price-asc':
        return priceOf(a).comparedTo(priceOf(b)) || a.name.localeCompare(b.name)
      case 'price-desc':
        return priceOf(b).comparedTo(priceOf(a)) || a.name.localeCompare(b.name)
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        if (params.tab === 'trending') return b.trendingScore - a.trendingScore
        return Date.parse(b.listedAt) - Date.parse(a.listedAt)
    }
  })

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize))
  const page = Math.min(params.page, totalPages)
  const items = sorted.slice((page - 1) * params.pageSize, page * params.pageSize).map(toSummary)
  return { items, pagination: { page, pageSize: params.pageSize, total, totalPages: total ? totalPages : 0 }, facets: facetsFor(base) }
}

export function findNft(id: string) {
  const nft = db.get().nfts.find((n) => n.id === id)
  if (!nft) throw new ApiFail(404, 'not_found', 'NFT não encontrado.')
  return nft
}

export interface NftPatch {
  editionId?: string
  priceEth?: string
  available?: number
}

/**
 * Altera preço/disponibilidade, incrementa a versão do NFT e publica `nft.updated`.
 * Usado por pedidos (reserva/estorno), cenários e `__mock.updateNft()`.
 */
export function updateNft(id: string, patch: NftPatch, reason?: 'price_changed' | 'availability_changed' | 'sold_out' | 'restocked') {
  const nft = db.mutate((s) => {
    const n = s.nfts.find((x) => x.id === id)
    if (!n) throw new ApiFail(404, 'not_found', 'NFT não encontrado.')
    const edition = n.editions.find((e) => e.id === (patch.editionId ?? n.defaultEditionId))
    if (!edition) throw new ApiFail(404, 'not_found', 'Edição não encontrada.')
    if (patch.priceEth !== undefined) edition.priceEth = new Decimal(patch.priceEth).toFixed(Math.max(2, new Decimal(patch.priceEth).decimalPlaces()))
    if (patch.available !== undefined) edition.available = Math.max(0, Math.trunc(patch.available))
    n.version++
    return n
  })
  const resolvedReason =
    reason ?? (patch.priceEth !== undefined ? 'price_changed' : totalAvailable(nft) === 0 ? 'sold_out' : 'availability_changed')
  return realtimeBus.publish({
    type: 'nft.updated',
    resource: { type: 'nft', id: nft.id },
    version: nft.version,
    data: {
      priceEth: defaultEdition(nft).priceEth,
      available: totalAvailable(nft),
      editions: nft.editions.map((e) => ({ id: e.id, priceEth: e.priceEth, available: e.available })),
      reason: resolvedReason,
    },
  })
}

export function relatedNfts(id: string) {
  const nft = findNft(id)
  return db
    .get()
    .nfts.filter((n) => n.id !== id && (n.collection.id === nft.collection.id || n.image.base === nft.image.base))
    .slice(0, 5)
    .map(toSummary)
}

export function featured() {
  const nfts = db.get().nfts
  const byId = (id: string) => nfts.find((n) => n.id === id) ?? nfts[0]!
  return {
    hero: ['emerald-ape-042', 'golden-beat-207', 'ivory-baron-088'].map((id) => toSummary(byId(id))),
    spotlight: toSummary(byId('sage-nomad-009')),
    collections: [
      {
        id: 'genesis',
        title: 'Lançamentos gênesis de edição limitada',
        description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
        image: byId('emerald-ape-042').image,
        nftId: 'emerald-ape-042',
      },
      {
        id: 'curated',
        title: 'Arte digital selecionada e muito mais',
        description: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
        image: byId('ivory-baron-088').image,
        nftId: 'ivory-baron-088',
      },
    ],
  }
}
