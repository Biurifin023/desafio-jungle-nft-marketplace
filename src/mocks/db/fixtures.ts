import type { Category, Edition, ImageRef, Network, NftBadge } from '@/api/contracts'
import type { CouponRecord, DbState, NftRecord, UserRecord, WalletsRecord } from './schema'

/**
 * Fixtures determinísticas: o mesmo `buildInitialState()` sempre gera o mesmo catálogo,
 * usuários, carteiras e cupons. Os 9 primeiros NFTs reproduzem os cards do Figma.
 */

export const FIXTURE_NOW = '2026-10-01T12:00:00.000Z'

type Artwork = 'emerald-ape' | 'violet-nomad' | 'ivory-baron' | 'golden-beat'

const ART_ALT: Record<Artwork, string> = {
  'emerald-ape': 'Macaco de pelo castanho com óculos redondos e jaqueta college verde',
  'violet-nomad': 'Gorila com chapéu bucket verde-oliva e moletom lilás',
  'ivory-baron': 'Chimpanzé de pelo escuro com gola alta verde e blazer creme',
  'golden-beat': 'Orangotango dourado com fones de ouvido verdes e jaqueta creme',
}

const img = (art: Artwork, name: string): ImageRef => ({ base: `/assets/nfts/${art}`, alt: `${name}: ${ART_ALT[art]}` })

const COLLECTIONS = {
  'kurio-apes': 'Kurio Apes',
  'nomad-club': 'Nomad Club',
  'baron-society': 'Baron Society',
  'golden-hour': 'Golden Hour',
} as const
type CollectionId = keyof typeof COLLECTIONS

const ART_COLLECTION: Record<Artwork, CollectionId> = {
  'emerald-ape': 'kurio-apes',
  'violet-nomad': 'nomad-club',
  'ivory-baron': 'baron-society',
  'golden-beat': 'golden-hour',
}

const CATEGORIES: Category[] = [
  'arte-digital',
  'fotografia',
  'musica',
  'arte-3d',
  'colecionaveis',
  'generativa',
  'jogos',
  'assinaturas',
  'utilidade',
]
const NETWORKS: Network[] = ['ethereum', 'polygon', 'solana']

/** Os 9 cards do frame "Desktop / Início", na mesma ordem e preços. */
const FIGMA_GRID: { name: string; art: Artwork; price: string; compareAt?: string; badge?: NftBadge }[] = [
  { name: 'Emerald Ape #042', art: 'emerald-ape', price: '1.19' },
  { name: 'Sage Nomad #009', art: 'violet-nomad', price: '1.69' },
  { name: 'Neon Vessel #552', art: 'ivory-baron', price: '1.99', compareAt: '2.29', badge: 'raro' },
  { name: 'Cosmic Bloom #118', art: 'violet-nomad', price: '1.29' },
  { name: 'Violet Nomad #314', art: 'violet-nomad', price: '1.39' },
  { name: 'Ivory Baron #088', art: 'ivory-baron', price: '1.79' },
  { name: 'Golden Beat #207', art: 'golden-beat', price: '0.99' },
  { name: 'Golden Frequency #071', art: 'golden-beat', price: '0.59' },
  { name: 'Golden Signal #160', art: 'golden-beat', price: '0.39' },
]

const EXTRA_NAMES: Record<Artwork, string[]> = {
  'emerald-ape': ['Jade Monarch', 'Verdant Rogue', 'Forest Dandy', 'Malachite Ace', 'Clover Captain', 'Fern Voyager', 'Moss Maestro', 'Pine Rebel', 'Olive Courier', 'Emerald Echo', 'Lime Admiral', 'Ivy Wanderer'],
  'violet-nomad': ['Lilac Drifter', 'Orchid Pilgrim', 'Plum Stroller', 'Amethyst Rover', 'Iris Hiker', 'Mauve Mystic', 'Heather Scout', 'Lavender Loner', 'Grape Ranger', 'Violet Haze', 'Sage Pathfinder', 'Thistle Monk'],
  'ivory-baron': ['Onyx Scholar', 'Midnight Sage', 'Obsidian Count', 'Ivory Duke', 'Ebony Curator', 'Charcoal Envoy', 'Slate Regent', 'Ink Diplomat', 'Raven Patron', 'Basalt Baron', 'Shadow Archivist', 'Coal Marquis'],
  'golden-beat': ['Amber Echo', 'Honey Groove', 'Saffron Tempo', 'Copper Rhythm', 'Marigold Bass', 'Sunset Synth', 'Topaz Chorus', 'Ochre Verse', 'Bronze Melody', 'Golden Static', 'Tangerine Loop', 'Citrine Pulse'],
}

const ART_ATTRIBUTES: Record<Artwork, string[]> = {
  'emerald-ape': ['Óculos', 'Esmeralda', 'Raro'],
  'violet-nomad': ['Chapéu bucket', 'Moletom', 'Comum'],
  'ivory-baron': ['Gola alta', 'Blazer', 'Incomum'],
  'golden-beat': ['Fones', 'Dourado', 'Lendário'],
}

const pad = (n: number, size = 3) => String(n).padStart(size, '0')
const toEth = (cents: number) => (cents / 100).toFixed(2)
const mulPrice = (price: string, factor: number) => (Math.round(Number(price) * 100 * factor) / 100).toFixed(2)
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/#/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function editionsFor(index: number, price: string): { editions: Edition[]; defaultEditionId: string } {
  const sold = (n: number) => (index * 13 + n * 7) % 9
  const editions: Edition[] = [
    { id: '1-1', label: '1/1', supply: 1, available: index % 3 === 0 ? 0 : 1, priceEth: mulPrice(price, 3), maxPerOrder: 1 },
    { id: '1-10', label: '1/10', supply: 10, available: 10 - sold(1), priceEth: mulPrice(price, 1.5), maxPerOrder: 3 },
    { id: '1-50', label: '1/50', supply: 50, available: 50 - sold(2) * 4, priceEth: price, maxPerOrder: 10 },
  ]
  if (index % 2 === 0) {
    editions.push({ id: 'aberta', label: 'ABERTA', supply: null, available: 999, priceEth: mulPrice(price, 0.6), maxPerOrder: 20 })
  }
  return { editions, defaultEditionId: '1-50' }
}

function buildNft(index: number, name: string, art: Artwork, price: string, compareAt: string | null, badge: NftBadge | null): NftRecord {
  const number = name.split('#')[1] ?? pad(index + 100)
  const tokenId = `#${pad(Number(number), 4)}`
  const collectionId = index === 0 ? 'kurio-apes' : ART_COLLECTION[art]
  const { editions, defaultEditionId } = editionsFor(index, price)
  const listed = new Date(Date.parse(FIXTURE_NOW) - index * 2.3 * 86_400_000)
  const baseName = name.split(' #')[0]
  return {
    id: slugify(name),
    tokenId,
    name,
    collection: { id: collectionId, name: COLLECTIONS[collectionId] },
    category: CATEGORIES[(index * 5) % CATEGORIES.length]!,
    network: NETWORKS[index % NETWORKS.length]!,
    image: img(art, name),
    gallery: [img(art, name), img(art, `${name} (detalhe 2)`), img(art, `${name} (detalhe 3)`), img(art, `${name} (detalhe 4)`)],
    editions,
    defaultEditionId,
    compareAtPriceEth: compareAt,
    badge,
    description: `Um colecionável digital finalizado à mão da coleção ${COLLECTIONS[collectionId]}, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.`,
    story: [
      `${name} é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. O criador de ${baseName} recebe 5% de royalties nas revendas, apoiando novos trabalhos e lançamentos da comunidade.`,
    ],
    creator: { name: 'Kurio Studio', handle: '@kurio.studio' },
    attributes: ART_ATTRIBUTES[art],
    rating: { average: 4.8 - (index % 5) * 0.1, count: 19 + ((index * 7) % 40) },
    contract: { address: `0x7A42${pad(index, 4)}19E8`, standard: 'ERC-721', royaltiesPct: 5 },
    networkInfo: 'Cunhado na Ethereum com procedência imutável e metadados armazenados no IPFS.',
    listedAt: listed.toISOString(),
    trendingScore: (index * 37) % 100,
    version: 1,
  }
}

function buildNfts(): NftRecord[] {
  const nfts: NftRecord[] = FIGMA_GRID.map((n, i) => buildNft(i, n.name, n.art, n.price, n.compareAt ?? null, n.badge ?? null))
  const arts: Artwork[] = ['emerald-ape', 'violet-nomad', 'ivory-baron', 'golden-beat']
  let i = nfts.length
  for (let round = 0; round < 12; round++) {
    for (const art of arts) {
      if (nfts.length >= 57) break
      const base = EXTRA_NAMES[art][round]!
      const number = pad(((i * 53) % 900) + 10)
      const cents = 2 + ((i * 337) % 1229)
      const badge: NftBadge | null = i % 11 === 0 ? 'raro' : i % 17 === 0 ? 'oferta' : null
      const compareAt = badge === 'oferta' ? toEth(Math.round(cents * 1.2)) : null
      nfts.push(buildNft(i, `${base} #${number}`, art, toEth(cents), compareAt, badge))
      i++
    }
  }
  // Extremos da faixa de preço do Figma (0,02 – 12,30 ETH) e um NFT esgotado.
  nfts.push(buildNft(i++, 'Copper Relic #002', 'golden-beat', '0.02', null, null))
  nfts.push(buildNft(i++, 'Grand Curator #999', 'ivory-baron', '12.30', null, 'raro'))
  const soldOut = buildNft(i, 'Onyx Phantom #013', 'ivory-baron', '2.49', null, null)
  soldOut.editions = soldOut.editions.map((e) => ({ ...e, available: 0 }))
  nfts.push(soldOut)
  return nfts
}

const user = (u: Omit<UserRecord, 'updatedAt' | 'version' | 'avatarUrl'>): UserRecord => ({
  ...u,
  avatarUrl: null,
  updatedAt: FIXTURE_NOW,
  version: 1,
})

/** Credenciais fictícias (README): ana@kurio.dev / Kurio@2026 e bruno@kurio.dev / Kurio@2026. */
export const FIXTURE_USERS: UserRecord[] = [
  user({
    id: 'usr_ana',
    email: 'ana@kurio.dev',
    username: 'ana.kurio',
    displayName: 'Ana Colecionadora',
    ensName: 'ana',
    walletNickname: 'Principal',
    passwordHash: 'sha256$ana-salt-01$7e5512642be6051624bcbed0f7dba197958bdd421f0c3f95840180d349b4ab58',
  }),
  user({
    id: 'usr_bruno',
    email: 'bruno@kurio.dev',
    username: 'bruno.nft',
    displayName: 'Bruno Cripto',
    ensName: 'bruno',
    walletNickname: 'Cofre',
    passwordHash: 'sha256$bruno-salt-02$8b155a3821fa056d9e7d4b8ce9c64e112a228d0b39c5e64580fac6bd0f974bbf',
  }),
]

function walletsFor(u: UserRecord, n: number): WalletsRecord {
  const base = {
    displayName: u.displayName,
    profileName: u.displayName,
    email: u.email,
    ensName: u.ensName,
    referralCode: `KURIO${n}`,
  }
  return {
    primary: {
      ...base,
      id: `wal_${u.id}_primary`,
      slot: 'primary',
      nickname: 'Principal',
      network: 'ethereum',
      provider: 'metamask',
      address: `0xA91F${String(n).repeat(32)}E82C`,
      secondaryAddress: `${u.ensName}.kurio.eth`,
      updatedAt: FIXTURE_NOW,
    },
    secondary: {
      ...base,
      id: `wal_${u.id}_secondary`,
      slot: 'secondary',
      nickname: 'Reserva',
      network: 'polygon',
      provider: 'coinbase',
      address: `0xB72C${String(n + 2).repeat(32)}4D1A`,
      secondaryAddress: `nova.${u.ensName}.eth`,
      updatedAt: FIXTURE_NOW,
    },
  }
}

export const FIXTURE_COUPONS: CouponRecord[] = [
  { code: 'KURIO10', description: '10% de desconto no lançamento', percentOff: 10, expiresAt: '2099-12-31T23:59:59.000Z' },
  { code: 'GENESIS', description: 'Cupom do lançamento gênesis', percentOff: 15, expiresAt: '2025-01-31T23:59:59.000Z' },
]

export function buildInitialState(): DbState {
  return {
    schemaVersion: 1,
    seq: 1000,
    nfts: buildNfts(),
    users: FIXTURE_USERS.map((u) => ({ ...u })),
    sessions: [],
    carts: [],
    coupons: FIXTURE_COUPONS.map((c) => ({ ...c })),
    favorites: { usr_ana: ['emerald-ape-042'], usr_bruno: [] },
    wallets: { usr_ana: walletsFor(FIXTURE_USERS[0]!, 1), usr_bruno: walletsFor(FIXTURE_USERS[1]!, 3) },
    connections: [],
    quotes: [],
    orders: [],
    idempotency: {},
    collectorDrafts: {},
  }
}
