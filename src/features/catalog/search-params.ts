import { NftListQuery, type Category, type Network, type NftListQuery as NftListQueryInput } from '@/api/contracts'

function asList(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string' && value.length) return value.split(',')
  return undefined
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

/** Converte o search da URL (strings) no contrato de GET /api/nfts. */
export function parseNftSearch(raw: Record<string, unknown>): NftListQueryInput {
  return NftListQuery.parse({
    q: typeof raw.q === 'string' ? raw.q : undefined,
    categories: asList(raw.categories) as Category[] | undefined,
    networks: asList(raw.networks) as Network[] | undefined,
    minPrice: typeof raw.minPrice === 'string' ? raw.minPrice : undefined,
    maxPrice: typeof raw.maxPrice === 'string' ? raw.maxPrice : undefined,
    tab: raw.tab,
    sort: raw.sort,
    page: asNumber(raw.page),
    pageSize: asNumber(raw.pageSize),
  })
}
