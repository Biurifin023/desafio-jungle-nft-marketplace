import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import type { NftSummary } from '@/api/contracts'
import { NftImage } from '@/components/common/NftImage'
import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'

const BADGE_LABEL: Record<NonNullable<NftSummary['badge']>, string> = {
  raro: 'RARO',
  novo: 'NOVO',
  oferta: 'OFERTA',
}

export function NftCard({ nft, priority = false }: { nft: NftSummary; priority?: boolean }) {
  const price = formatEth(nft.priceEth)
  const compareAt = nft.compareAtPriceEth ? formatEth(nft.compareAtPriceEth) : null
  const badge = nft.badge ? BADGE_LABEL[nft.badge] : null

  return (
    <article className="min-w-0" data-testid="nft-card">
      <div className="relative">
        <Link
          to="/nft/$id"
          params={{ id: nft.id }}
          className="group flex flex-col gap-2 lg:gap-3"
        >
          <div
            className={cn(
              'relative flex items-center justify-center overflow-hidden',
              'h-[200px] rounded-[20px] bg-[linear-gradient(180deg,#241612_0%,#2f1d15_100%)] p-1',
              'lg:h-[300px] lg:rounded-none lg:bg-surface lg:p-0',
            )}
          >
            <NftImage
              image={nft.image}
              sizes="(min-width: 1440px) 250px, (min-width: 1024px) 22vw, 44vw"
              priority={priority}
              className="size-[168px] rounded-2xl lg:size-[250px] lg:rounded-[15px]"
            />
            {badge ? (
              <span className="absolute top-0 left-0 z-10 grid h-8 min-w-[68px] place-items-center bg-copper px-2 text-[13px] font-medium text-ink lg:top-3 lg:left-3 lg:rounded-sm">
                {badge}
              </span>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-col gap-0 px-2 lg:gap-1.5 lg:px-0">
            <h3 className="truncate text-[15px] leading-5 text-cream lg:text-base lg:leading-4">{nft.name}</h3>
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-base font-bold text-amber lg:text-lg lg:leading-4">
              <span>{price}</span>
              {compareAt ? <span className="font-normal text-khaki line-through">{compareAt}</span> : null}
            </p>
          </div>
        </Link>
        <span
          aria-hidden
          className="pointer-events-none absolute top-3 right-3 grid size-7 place-items-center rounded-full border border-border bg-surface-2 text-copper lg:hidden"
        >
          <Heart className="size-3.5" strokeWidth={1.75} />
        </span>
      </div>
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div className="min-w-0" data-slot="skeleton" data-testid="nft-card-skeleton">
      <div className="shimmer h-[200px] rounded-[20px] lg:h-[300px] lg:rounded-none" />
      <div className="mt-2 h-4 w-3/4 shimmer rounded-sm lg:mt-3" />
      <div className="mt-2 h-4 w-1/2 shimmer rounded-sm" />
    </div>
  )
}
