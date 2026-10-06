import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { FeaturedResponse, NftSummary } from '@/api/contracts'
import { NftImage } from '@/components/common/NftImage'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRightIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

export function CatalogHero({
  featured,
  isPending,
}: {
  featured?: FeaturedResponse
  isPending: boolean
}) {
  const slides = featured?.hero ?? []
  const [index, setIndex] = useState(0)
  const safeIndex = slides.length ? index % slides.length : 0
  const current = slides[safeIndex]

  useEffect(() => {
    if (slides.length < 2) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduce.matches) return
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [slides.length])

  if (isPending && !featured) {
    return (
      <section aria-label="Destaques" data-testid="catalog-hero">
        <Skeleton className="hidden h-[450px] w-full rounded-none lg:block" />
        <Skeleton className="h-[190px] w-full rounded-xl lg:hidden" />
      </section>
    )
  }

  return (
    <>
      <DesktopHero current={current} slides={slides} index={safeIndex} onIndex={setIndex} />
      <MobileHero current={current} secondary={slides[1] ?? current} slides={slides} index={safeIndex} onIndex={setIndex} />
    </>
  )
}

function DesktopHero({
  current,
  slides,
  index,
  onIndex,
}: {
  current?: NftSummary
  slides: NftSummary[]
  index: number
  onIndex: (i: number) => void
}) {
  return (
    <section
      className="relative hidden h-[450px] w-full items-center lg:flex"
      aria-labelledby="home-title"
      data-testid="catalog-hero"
    >
      <div className="flex h-full w-full min-w-0 items-center justify-between gap-6 xl:gap-10">
        <div className="flex max-w-[600px] min-w-0 flex-1 flex-col justify-end gap-8 self-stretch pb-10 pt-8">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium tracking-[0.1em] text-cream">Bem-vindo à Kurio</p>
              <h1 id="home-title" className="text-[43px] leading-[70px] font-bold text-cream">
                SEJA DONO DO FUTURO
                <br />
                DA ARTE DIGITAL
              </h1>
            </div>
            <p className="max-w-[557px] text-sm leading-6 text-sand">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie
              artistas e tenha uma parte da cultura da internet.
            </p>
          </div>
          <a
            href="#catalogo"
            className="inline-flex h-10 w-[140px] items-center justify-center rounded-md bg-copper text-base font-bold text-ink hover:bg-amber"
          >
            EXPLORAR
          </a>
        </div>
        {current ? (
          <Link to="/nft/$id" params={{ id: current.id }} className="size-[min(450px,38vw)] shrink-0 overflow-hidden rounded-3xl">
            <NftImage image={current.image} sizes="450px" priority className="size-full rounded-3xl" />
          </Link>
        ) : (
          <div className="size-[min(450px,38vw)] shrink-0 rounded-3xl bg-surface" />
        )}
      </div>
      <HeroDots slides={slides} index={index} onIndex={onIndex} className="absolute bottom-2 left-[40%] hidden lg:flex" />
    </section>
  )
}

function MobileHero({
  current,
  secondary,
  slides,
  index,
  onIndex,
}: {
  current?: NftSummary
  secondary?: NftSummary
  slides: NftSummary[]
  index: number
  onIndex: (i: number) => void
}) {
  return (
    <section
      className="relative overflow-hidden rounded-xl bg-[linear-gradient(180deg,#d28a4c33_0%,#d28a4c1a_100%)] px-4 py-3 lg:hidden"
      aria-labelledby="home-title-mobile"
    >
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-[0.08em] text-cream">Bem-vindo à Kurio</p>
          <h1 id="home-title-mobile" className="mt-1.5 text-lg leading-[29px] font-bold text-cream">
            SEJA DONO DA
            <br />
            CULTURA DIGITAL
          </h1>
          <p className="mt-2 text-xs leading-[18px] text-sand">Descubra NFTs selecionados de criadores do mundo todo.</p>
          <a href="#catalogo" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-amber">
            EXPLORAR
            <ArrowRightIcon className="size-4 text-copper" />
          </a>
        </div>
        <div className="relative h-[146px] w-[138px] shrink-0">
          {current ? (
            <NftImage
              image={current.image}
              sizes="138px"
              priority
              className="absolute top-0 left-0 size-[138px] rounded-2xl"
            />
          ) : null}
          {secondary ? (
            <NftImage
              image={secondary.image}
              sizes="58px"
              className="absolute right-0 bottom-0 size-[58px] rounded-2xl"
            />
          ) : null}
        </div>
      </div>
      <HeroDots slides={slides} index={index} onIndex={onIndex} className="mt-2 justify-center" />
    </section>
  )
}

function HeroDots({
  slides,
  index,
  onIndex,
  className,
}: {
  slides: NftSummary[]
  index: number
  onIndex: (i: number) => void
  className?: string
}) {
  if (slides.length < 2) return null
  return (
    <div className={cn('-mx-2 flex items-center', className)} role="tablist" aria-label="Destaques">
      {slides.map((slide, i) => (
        <button
          key={slide.id}
          type="button"
          role="tab"
          aria-selected={i === index}
          aria-label={`Destaque ${i + 1} de ${slides.length}`}
          onClick={() => onIndex(i)}
          className="grid size-6 cursor-pointer place-items-center rounded-full"
        >
          <span aria-hidden className={cn('size-2 rounded-full', i === index ? 'bg-copper' : 'bg-copper/40')} />
        </button>
      ))}
    </div>
  )
}
