import { useEffect, useState, type FocusEvent, type HTMLAttributes } from 'react'
import { Link } from '@tanstack/react-router'
import type { FeaturedResponse, NftSummary } from '@/api/contracts'
import { NftImage } from '@/components/common/NftImage'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRightIcon } from '@/components/icons'
import { useDesktop } from '@/lib/use-desktop'
import { cn } from '@/lib/utils'

const AUTOPLAY_MS = 3000

/**
 * O texto do destaque é fixo; só a imagem depende da API. Por isso a moldura real aparece desde o início
 * (skeleton só no lugar da imagem) e a altura não muda quando os dados chegam (sem CLS).
 * Uma árvore por breakpoint: a imagem `priority` da versão escondida baixaria em alta prioridade e
 * disputaria banda com o LCP.
 */
export function CatalogHero({ featured, isPending }: { featured?: FeaturedResponse; isPending: boolean }) {
  const desktop = useDesktop()
  const slides = featured?.hero ?? []
  const [index, setIndex] = useState(0)
  const [reduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [interacting, setInteracting] = useState(false)
  const safeIndex = slides.length ? index % slides.length : 0
  const current = slides[safeIndex]
  const autoplay = slides.length > 1 && !reduceMotion

  useEffect(() => {
    if (!autoplay || interacting) return
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [autoplay, interacting, slides.length])

  /** Passar o mouse ou focar algo dentro do destaque segura a troca automática. */
  const interaction = {
    onMouseEnter: () => setInteracting(true),
    onMouseLeave: () => setInteracting(false),
    onFocus: () => setInteracting(true),
    onBlur: (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setInteracting(false)
    },
  }
  const controls: HeroControls = {
    slides,
    index: safeIndex,
    onIndex: setIndex,
    pending: isPending && !featured,
  }

  return desktop ? (
    <DesktopHero current={current} controls={controls} interaction={interaction} />
  ) : (
    <MobileHero current={current} controls={controls} interaction={interaction} />
  )
}

type HeroControls = {
  slides: NftSummary[]
  index: number
  onIndex: (i: number) => void
  pending: boolean
}

type HeroInteraction = Pick<HTMLAttributes<HTMLElement>, 'onMouseEnter' | 'onMouseLeave' | 'onFocus' | 'onBlur'>

function DesktopHero({
  current,
  controls,
  interaction,
}: {
  current?: NftSummary
  controls: HeroControls
  interaction: HeroInteraction
}) {
  return (
    <section
      className="relative hidden h-[450px] w-full items-center lg:flex"
      aria-labelledby="home-title"
      aria-roledescription="carrossel"
      data-testid="catalog-hero"
      {...interaction}
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
          <Link
            to="."
            search
            hash="catalogo"
            resetScroll={false}
            className="inline-flex h-10 w-[140px] items-center justify-center rounded-md bg-copper text-base font-bold text-ink hover:bg-amber"
          >
            EXPLORAR
          </Link>
        </div>
        {current ? (
          <Link to="/nft/$id" params={{ id: current.id }} className="size-[min(450px,38vw)] shrink-0 overflow-hidden rounded-3xl">
            <NftImage image={current.image} sizes="450px" priority className="size-full rounded-3xl" />
          </Link>
        ) : controls.pending ? (
          <Skeleton className="size-[min(450px,38vw)] shrink-0 rounded-3xl" />
        ) : (
          <div className="size-[min(450px,38vw)] shrink-0 rounded-3xl bg-surface" />
        )}
      </div>
      <HeroDots {...controls} className="absolute bottom-2 left-[40%] hidden lg:flex" />
    </section>
  )
}

function MobileHero({
  current,
  controls,
  interaction,
}: {
  current?: NftSummary
  controls: HeroControls
  interaction: HeroInteraction
}) {
  return (
    <section
      className="relative overflow-hidden rounded-xl bg-[linear-gradient(180deg,#d28a4c33_0%,#d28a4c1a_100%)] px-4 py-3 lg:hidden"
      aria-labelledby="home-title-mobile"
      aria-roledescription="carrossel"
      {...interaction}
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
          <Link to="." search hash="catalogo" resetScroll={false} className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-amber">
            EXPLORAR
            <ArrowRightIcon className="size-4 text-copper" />
          </Link>
        </div>
        <div className="size-[138px] shrink-0">
          {current ? (
            <NftImage image={current.image} sizes="138px" priority className="size-full rounded-2xl" />
          ) : controls.pending ? (
            <Skeleton className="size-full rounded-2xl" />
          ) : (
            <div className="size-full rounded-2xl bg-surface" />
          )}
        </div>
      </div>
      {/* Altura dos pontos reservada antes de os destaques chegarem. */}
      <div className="mt-2 h-6">
        <HeroDots {...controls} className="justify-center" />
      </div>
    </section>
  )
}

function HeroDots({ slides, index, onIndex, className }: HeroControls & { className?: string }) {
  if (slides.length < 2) return null
  return (
    <div className={cn('-mx-2 flex items-center', className)} role="group" aria-label="Escolher destaque">
      {slides.map((slide, i) => (
        <button
          key={slide.id}
          type="button"
          aria-label={`Destaque ${i + 1} de ${slides.length}`}
          aria-current={i === index ? 'true' : undefined}
          onClick={() => onIndex(i)}
          className="grid size-6 cursor-pointer place-items-center rounded-full"
        >
          <span aria-hidden className={cn('size-2 rounded-full', i === index ? 'bg-copper' : 'bg-copper/40')} />
        </button>
      ))}
    </div>
  )
}
