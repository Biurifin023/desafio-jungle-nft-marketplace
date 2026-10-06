import { z } from 'zod'
import { EthAmount, ImageRef, IsoDate, Network, Pagination } from './common'

export const Category = z.enum([
  'arte-digital',
  'fotografia',
  'musica',
  'arte-3d',
  'colecionaveis',
  'generativa',
  'jogos',
  'assinaturas',
  'utilidade',
])
export type Category = z.infer<typeof Category>

export const CATEGORY_LABEL: Record<Category, string> = {
  'arte-digital': 'Arte digital',
  fotografia: 'Fotografia',
  musica: 'Música',
  'arte-3d': 'Arte 3D',
  colecionaveis: 'Colecionáveis',
  generativa: 'Generativa',
  jogos: 'Jogos',
  assinaturas: 'Assinaturas',
  utilidade: 'Utilidade',
}

/** Edição de um NFT (ex.: 1/1, 1/10, 1/50, ABERTA). `supply` nulo = edição aberta. */
export const Edition = z.object({
  id: z.string(),
  label: z.string(),
  supply: z.number().int().positive().nullable(),
  available: z.number().int().min(0),
  priceEth: EthAmount,
  maxPerOrder: z.number().int().positive(),
})
export type Edition = z.infer<typeof Edition>

export const NftBadge = z.enum(['raro', 'novo', 'oferta'])
export type NftBadge = z.infer<typeof NftBadge>

export const NftSummary = z.object({
  id: z.string(),
  tokenId: z.string(),
  name: z.string(),
  collection: z.object({ id: z.string(), name: z.string() }),
  category: Category,
  network: Network,
  image: ImageRef,
  /** Preço da edição padrão (a mesma pré-selecionada no detalhe). */
  priceEth: EthAmount,
  /** Preço anterior (exibido riscado), quando houver redução. */
  compareAtPriceEth: EthAmount.nullable(),
  badge: NftBadge.nullable(),
  available: z.number().int().min(0),
  listedAt: IsoDate,
  version: z.number().int(),
})
export type NftSummary = z.infer<typeof NftSummary>

export const Nft = NftSummary.extend({
  description: z.string(),
  story: z.array(z.string()),
  creator: z.object({ name: z.string(), handle: z.string() }),
  gallery: z.array(ImageRef).min(1),
  editions: z.array(Edition).min(1),
  /** Edição pré-selecionada no detalhe; seu preço é o `priceEth` exibido no card. */
  defaultEditionId: z.string(),
  attributes: z.array(z.string()),
  rating: z.object({ average: z.number(), count: z.number().int() }),
  contract: z.object({ address: z.string(), standard: z.string(), royaltiesPct: z.number() }),
  networkInfo: z.string(),
})
export type Nft = z.infer<typeof Nft>

export const NftTab = z.enum(['all', 'new', 'trending'])
export type NftTab = z.infer<typeof NftTab>

export const NftSort = z.enum(['recent', 'price-asc', 'price-desc', 'name'])
export type NftSort = z.infer<typeof NftSort>

export const NFT_SORT_LABEL: Record<NftSort, string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  name: 'Nome (A–Z)',
}

/** Parâmetros aceitos por GET /api/nfts (também o estado de busca da URL da Home). */
export const NftListQuery = z.object({
  q: z.string().trim().max(80).optional(),
  categories: z.array(Category).optional(),
  networks: z.array(Network).optional(),
  minPrice: EthAmount.optional(),
  maxPrice: EthAmount.optional(),
  tab: NftTab.default('all'),
  sort: NftSort.default('recent'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(48).default(9),
})
export type NftListQuery = z.input<typeof NftListQuery>

export const NftFacets = z.object({
  categories: z.record(Category, z.number().int()),
  networks: z.record(Network, z.number().int()),
  price: z.object({ min: EthAmount, max: EthAmount }),
})
export type NftFacets = z.infer<typeof NftFacets>

export const NftListResponse = z.object({
  items: z.array(NftSummary),
  pagination: Pagination,
  facets: NftFacets,
})
export type NftListResponse = z.infer<typeof NftListResponse>

export const FeaturedResponse = z.object({
  hero: z.array(NftSummary).min(1),
  spotlight: NftSummary,
  collections: z.array(
    z.object({ id: z.string(), title: z.string(), description: z.string(), image: ImageRef, nftId: z.string() }),
  ),
})
export type FeaturedResponse = z.infer<typeof FeaturedResponse>

export const NftResponse = z.object({ nft: Nft })
export const RelatedResponse = z.object({ items: z.array(NftSummary) })
