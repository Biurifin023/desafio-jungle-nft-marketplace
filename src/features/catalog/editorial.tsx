import type { FeaturedResponse } from '@/api/contracts'
import { NftImage } from '@/components/common/NftImage'
import { NotAvailableLink } from '@/components/common/NotAvailable'
import { ArrowRightIcon } from '@/components/icons'
import { Skeleton } from '@/components/ui/skeleton'

const BLOG_POSTS = [
  {
    image: '/assets/nfts/ivory-baron',
    alt: 'Obra digital em close',
    meta: '12 de setembro  |  Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
  },
  {
    image: '/assets/nfts/emerald-ape',
    alt: 'Coleção em destaque',
    meta: '13 de setembro  |  Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
  },
  {
    image: '/assets/nfts/violet-nomad',
    alt: 'Retrato de colecionável',
    meta: '15 de setembro  |  Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
  },
  {
    image: '/assets/nfts/golden-beat',
    alt: 'Arte com fones de ouvido',
    meta: '15 de setembro  |  Leitura de 2 min',
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
  },
] as const

export function CatalogPromos({ featured, isPending }: { featured?: FeaturedResponse; isPending: boolean }) {
  if (isPending && !featured) {
    return (
      <section aria-label="Promoções" className="hidden grid-cols-2 gap-7 lg:grid">
        <Skeleton className="h-[250px] rounded-lg" />
        <Skeleton className="h-[250px] rounded-lg" />
      </section>
    )
  }
  if (!featured?.collections.length) return null

  return (
    <section aria-label="Promoções" className="hidden gap-7 lg:grid lg:grid-cols-2">
      {featured.collections.map((collection) => (
        <article key={collection.id} className="relative flex h-[250px] min-w-0 overflow-hidden rounded-lg bg-surface">
          <NftImage
            image={collection.image}
            sizes="292px"
            className="h-full w-[48%] max-w-[292px] rounded-[18px] object-cover"
          />
          <div className="flex min-w-0 flex-1 flex-col justify-center px-6 py-8">
            <h2 className="text-lg leading-6 font-bold text-cream">{collection.title}</h2>
            <p className="mt-2 text-sm leading-6 text-sand">{collection.description}</p>
            <NotAvailableLink
              feature={collection.title}
              className="mt-6 inline-flex h-10 w-[140px] items-center justify-center gap-2 rounded-md bg-copper text-sm font-medium text-ink hover:bg-amber"
            >
              Explorar
              <ArrowRightIcon className="size-[18px]" />
            </NotAvailableLink>
          </div>
        </article>
      ))}
    </section>
  )
}

export function CatalogBlog() {
  return (
    <section aria-labelledby="blog-title" className="hidden flex-col items-center gap-10 lg:flex">
      <header className="w-full text-center">
        <h2 id="blog-title" className="text-[28px] leading-[37px] font-bold text-cream">
          Diário da Cunhagem
        </h2>
        <p className="mt-3 text-sm text-sand">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </header>
      <ul className="grid w-full grid-cols-4 gap-6">
        {BLOG_POSTS.map((post) => (
          <li key={post.title} className="flex min-w-0 flex-col overflow-hidden rounded-lg bg-surface">
            <img
              src={`${post.image}-640.webp`}
              alt={post.alt}
              width={268}
              height={195}
              className="h-[195px] w-full object-cover"
            />
            {/* Título e resumo reservam duas linhas para os cards ficarem alinhados entre si. */}
            <div className="flex flex-1 flex-col gap-2 px-4 py-3">
              <p className="text-xs font-medium leading-4 text-sand">{post.meta}</p>
              <h3 className="line-clamp-2 min-h-[42px] text-base leading-[21px] font-bold text-cream">{post.title}</h3>
              <p className="line-clamp-2 min-h-8 text-xs font-medium leading-4 text-sand">{post.excerpt}</p>
              <NotAvailableLink feature={post.title} className="mt-auto inline-flex w-fit items-center gap-1 text-xs font-bold text-amber">
                Ler mais <span aria-hidden>→</span>
              </NotAvailableLink>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
