import { NftListQuery, type Category, type Network, type NftListQuery as NftListQueryInput } from '@/api/contracts'

/** Search da Home. Campos com default no Zod ficam opcionais para `Link to="/"` sem `search`. */
export type CatalogSearch = NftListQueryInput

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

/**
 * Serializa o estado do catálogo para a URL.
 * Omite defaults (`tab=all`, `sort=recent`, `page=1`, `pageSize`) para manter a query limpa.
 */
export function serializeCatalogSearch(search: CatalogSearch): NftListQueryInput {
  return {
    q: search.q?.trim() ? search.q.trim() : undefined,
    categories: search.categories?.length ? search.categories : undefined,
    networks: search.networks?.length ? search.networks : undefined,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    tab: search.tab && search.tab !== 'all' ? search.tab : undefined,
    sort: search.sort && search.sort !== 'recent' ? search.sort : undefined,
    page: search.page && search.page > 1 ? search.page : undefined,
    pageSize: undefined,
  }
}

export function catalogTab(search: CatalogSearch) {
  return search.tab ?? 'all'
}

export function catalogSort(search: CatalogSearch) {
  return search.sort ?? 'recent'
}

export function catalogPage(search: CatalogSearch) {
  return search.page ?? 1
}

export const PRICE_FLOOR = '0.02'
export const PRICE_CEILING = '12.30'

export function hasActiveFilters(search: CatalogSearch) {
  return Boolean(
    search.q ||
      search.categories?.length ||
      search.networks?.length ||
      search.minPrice ||
      search.maxPrice ||
      (search.tab && search.tab !== 'all'),
  )
}
