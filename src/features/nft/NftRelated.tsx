import type { NftSummary } from '@/api/contracts'
import { ErrorState } from '@/components/common/QueryState'
import { Skeleton } from '@/components/ui/skeleton'
import { NftCard } from './NftCard'

export function NftRelated({
  items,
  isPending,
  isError,
  error,
  onRetry,
}: {
  items?: NftSummary[]
  isPending: boolean
  isError: boolean
  error: unknown
  onRetry: () => void
}) {
  return (
    <section className="flex flex-col gap-8" aria-labelledby="related-heading" data-testid="nft-related">
      <div className="border-b border-copper/30 pb-3">
        <h2 id="related-heading" className="text-[17px] font-bold text-amber">
          Mais desta coleção
        </h2>
      </div>
      {isPending ? (
        <ul className="grid grid-cols-2 gap-7 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </li>
          ))}
        </ul>
      ) : isError ? (
        <ErrorState error={error} onRetry={onRetry} title="Não foi possível carregar relacionados" />
      ) : items?.length ? (
        <ul className="grid grid-cols-2 gap-7 md:grid-cols-3 lg:grid-cols-5">
          {items.map((nft) => (
            <li key={nft.id}>
              <NftCard nft={nft} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-sand">Nenhum outro item desta coleção no momento.</p>
      )}
    </section>
  )
}
