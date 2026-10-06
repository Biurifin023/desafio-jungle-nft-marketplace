import { NftImage } from '@/components/common/NftImage'
import { CATEGORY_LABEL, NETWORK_LABEL, type Category, type ImageRef, type Network } from '@/api/contracts'
import { formatEth, formatEthPtBr } from '@/lib/money'
import { cn } from '@/lib/utils'

type Art = 'emerald-ape' | 'violet-nomad' | 'ivory-baron' | 'golden-beat'

const ALT: Record<Art, string> = {
  'emerald-ape': 'Macaco de pelo castanho com óculos redondos e jaqueta college verde',
  'violet-nomad': 'Gorila com chapéu bucket verde-oliva e moletom lilás',
  'ivory-baron': 'Chimpanzé de pelo escuro com gola alta verde e blazer creme',
  'golden-beat': 'Orangotango dourado com fones de ouvido verdes e jaqueta creme',
}

const img = (art: Art, name: string): ImageRef => ({
  base: `/assets/nfts/${art}`,
  alt: `${name}: ${ALT[art]}`,
})

const GRID: { name: string; art: Art; price: string; compareAt?: string; badge?: string }[] = [
  { name: 'Emerald Ape #042', art: 'emerald-ape', price: '1.19' },
  { name: 'Sage Nomad #009', art: 'violet-nomad', price: '1.69' },
  { name: 'Neon Vessel #552', art: 'ivory-baron', price: '1.99', compareAt: '2.29', badge: 'RARO' },
  { name: 'Cosmic Bloom #118', art: 'violet-nomad', price: '1.29' },
  { name: 'Violet Nomad #314', art: 'violet-nomad', price: '1.39' },
  { name: 'Ivory Baron #088', art: 'ivory-baron', price: '1.79' },
  { name: 'Golden Beat #207', art: 'golden-beat', price: '0.99' },
  { name: 'Golden Frequency #071', art: 'golden-beat', price: '0.59' },
  { name: 'Golden Signal #160', art: 'golden-beat', price: '0.39' },
]

const COLLECTIONS: { id: Category; count: number }[] = [
  { id: 'arte-digital', count: 33 },
  { id: 'fotografia', count: 12 },
  { id: 'musica', count: 65 },
  { id: 'arte-3d', count: 39 },
  { id: 'colecionaveis', count: 23 },
  { id: 'generativa', count: 17 },
  { id: 'jogos', count: 19 },
  { id: 'assinaturas', count: 13 },
  { id: 'utilidade', count: 18 },
]

const NETWORKS: { id: Network; count: number }[] = [
  { id: 'ethereum', count: 119 },
  { id: 'polygon', count: 78 },
  { id: 'solana', count: 86 },
]

/** Réplica visual estática do marketplace (Figma) para o fundo do modal de auth. */
export function MarketplaceBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none hidden select-none lg:block">
      <div className="page-container pt-3">
        <section className="relative flex min-h-[450px] items-center">
          <div className="max-w-[600px] py-16">
            <p className="text-sm font-medium tracking-[0.1em] text-cream">Bem-vindo à Kurio</p>
            <p className="mt-2 max-w-xl text-[43px] leading-[70px] font-bold text-cream">
              SEJA DONO DO FUTURO
              <br />
              DA ARTE DIGITAL
            </p>
            <p className="mt-5 max-w-[557px] text-sm leading-6 text-sand">
              Descubra NFTs selecionados de criadores do mundo todo e colecione arte digital verificada.
            </p>
            <span className="mt-8 inline-flex h-10 w-[140px] items-center justify-center rounded-md bg-copper text-base font-bold text-ink">
              EXPLORAR
            </span>
          </div>
          <img
            src="/assets/nfts/emerald-ape-640.webp"
            alt=""
            width={450}
            height={450}
            className="absolute top-0 right-0 hidden size-[450px] rounded-2xl object-cover xl:block"
          />
        </section>

        <div className="mt-6 grid grid-cols-[310px_1fr] gap-12 pb-16">
          <aside className="bg-surface p-5">
            <p className="text-lg font-bold text-cream">Coleções</p>
            <ul className="mt-3 space-y-0">
              {COLLECTIONS.map((c, i) => (
                <li
                  key={c.id}
                  className={cn('flex h-10 items-center justify-between text-[15px]', i === 0 ? 'font-normal text-amber' : 'text-sand')}
                >
                  <span>{CATEGORY_LABEL[c.id]}</span>
                  <span className={i === 0 ? 'font-bold' : 'font-bold'}>
                    ({c.count})
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-lg font-bold text-cream">Faixa de preço</p>
            <div className="mt-3 px-1">
              <div className="relative h-5">
                <span className="absolute top-1/2 right-8 left-2 h-1 -translate-y-1/2 bg-copper" />
                <span className="absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full border-[3px] border-ink bg-copper" />
                <span className="absolute top-1/2 right-12 size-3.5 -translate-y-1/2 rounded-full border-[3px] border-ink bg-copper" />
              </div>
              <p className="mt-2 text-[15px] text-cream">
                Preço: {formatEthPtBr('0.02')} - {formatEthPtBr('12.30')} ETH
              </p>
              <span className="mt-3 inline-flex h-9 items-center rounded-md bg-copper px-3 text-base font-bold text-ink">
                Aplicar
              </span>
            </div>
            <p className="mt-8 text-lg font-bold text-cream">Rede</p>
            <ul className="mt-3">
              {NETWORKS.map((n) => (
                <li key={n.id} className="flex h-10 items-center justify-between text-[15px] text-sand">
                  <span>{NETWORK_LABEL[n.id]}</span>
                  <span>({n.count})</span>
                </li>
              ))}
            </ul>
          </aside>

          <div>
            <div className="mb-6 flex items-center justify-end text-[15px] text-cream">
              Ordenar por: Listados recentemente
            </div>
            <ul className="grid grid-cols-3 gap-x-8 gap-y-10">
              {GRID.map((item) => (
                <li key={item.name} className="relative">
                  <div className="relative bg-surface">
                    {item.badge ? (
                      <span className="absolute top-3.5 left-0 z-10 bg-copper px-3 py-1.5 text-base font-medium text-ink">
                        {item.badge}
                      </span>
                    ) : null}
                    <NftImage image={img(item.art, item.name)} sizes="250px" className="rounded-2xl p-1" decorative />
                  </div>
                  <p className="mt-3 text-base text-cream">{item.name}</p>
                  <p className="mt-1 text-lg font-bold text-amber">
                    {formatEth(item.price)}
                    {item.compareAt ? (
                      <span className="ml-2 font-normal text-khaki line-through">{formatEth(item.compareAt)}</span>
                    ) : null}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
