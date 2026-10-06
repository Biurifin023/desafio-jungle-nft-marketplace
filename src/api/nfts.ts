import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { FeaturedResponse, NftListResponse, NftResponse, RelatedResponse, type NftListQuery } from './contracts'
import { qk } from './query-keys'
import { request } from '@/lib/http'

/** Serializa a query para os parâmetros REST (arrays como lista separada por vírgula). */
export function toNftSearchParams(query: NftListQuery) {
  const params: Record<string, string> = {}
  if (query.q) params.q = query.q
  if (query.categories?.length) params.categories = query.categories.join(',')
  if (query.networks?.length) params.networks = query.networks.join(',')
  if (query.minPrice) params.minPrice = query.minPrice
  if (query.maxPrice) params.maxPrice = query.maxPrice
  if (query.tab) params.tab = query.tab
  if (query.sort) params.sort = query.sort
  if (query.page) params.page = String(query.page)
  if (query.pageSize) params.pageSize = String(query.pageSize)
  return params
}

export const nftsApi = {
  list: (query: NftListQuery, signal?: AbortSignal) =>
    request(NftListResponse, { url: '/nfts', params: toNftSearchParams(query), signal }),
  detail: (id: string, signal?: AbortSignal) =>
    request(NftResponse, { url: `/nfts/${encodeURIComponent(id)}`, signal }).then((r) => r.nft),
  related: (id: string, signal?: AbortSignal) =>
    request(RelatedResponse, { url: `/nfts/${encodeURIComponent(id)}/related`, signal }).then((r) => r.items),
  featured: (signal?: AbortSignal) => request(FeaturedResponse, { url: '/nfts/featured', signal }),
}

/**
 * O `signal` do TanStack Query cancela a requisição anterior quando a chave muda;
 * a resposta obsoleta é descartada porque pertence a outra chave.
 */
export const nftListQuery = (query: NftListQuery) =>
  queryOptions({
    queryKey: qk.nfts.list(query),
    queryFn: ({ signal }) => nftsApi.list(query, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

export const nftDetailQuery = (id: string) =>
  queryOptions({
    queryKey: qk.nfts.detail(id),
    queryFn: ({ signal }) => nftsApi.detail(id, signal),
    staleTime: 30_000,
  })

export const nftRelatedQuery = (id: string) =>
  queryOptions({
    queryKey: qk.nfts.related(id),
    queryFn: ({ signal }) => nftsApi.related(id, signal),
    staleTime: 60_000,
  })

export const featuredQuery = () =>
  queryOptions({
    queryKey: qk.nfts.featured(),
    queryFn: ({ signal }) => nftsApi.featured(signal),
    staleTime: 60_000,
  })

export const useNftList = (query: NftListQuery) => useQuery(nftListQuery(query))
export const useNft = (id: string) => useQuery(nftDetailQuery(id))
export const useRelatedNfts = (id: string) => useQuery(nftRelatedQuery(id))
export const useFeatured = () => useQuery(featuredQuery())
