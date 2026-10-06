import { Skeleton } from '@/components/ui/skeleton'

export function NftSkeleton() {
  return (
    <div data-testid="nft-skeleton" aria-busy="true" aria-live="polite" aria-label="Carregando detalhe do NFT">
      <div className="hidden lg:block">
        <div className="page-container flex flex-col gap-8 py-8">
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-8">
            <div className="flex gap-7">
              <div className="flex w-[100px] flex-col gap-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="size-[100px] rounded-lg" />
                ))}
              </div>
              <Skeleton className="size-[444px] rounded-md" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <Skeleton className="h-9 w-2/3" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-20 w-72" />
            </div>
          </div>
          <Skeleton className="h-40 w-full" />
          <div className="grid grid-cols-5 gap-7">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="lg:hidden">
        <div className="px-7 pt-6">
          <Skeleton className="aspect-square w-full rounded-3xl" />
        </div>
        <div className="mt-6 flex flex-col gap-4 rounded-t-[31px] bg-surface px-6 py-8">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  )
}
