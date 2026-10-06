import { Link } from '@tanstack/react-router'
import type { NftListResponse, NftTab } from '@/api/contracts'
import { ArrowRightIcon } from '@/components/icons'
import { BackgroundRefresh, EmptyState, ErrorState } from '@/components/common/QueryState'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { NftCard, NftCardSkeleton } from './nft-card'
import { SortSelect } from './filters'
import { catalogPage, catalogSort, catalogTab, hasActiveFilters, serializeCatalogSearch, type CatalogSearch } from './search-params'

const TABS: { id: NftTab; label: string; short: string }[] = [
  { id: 'all', label: 'Todos os NFTs', short: 'Todos os NFTs' },
  { id: 'new', label: 'Novos lançamentos', short: 'Novos lançamentos' },
  { id: 'trending', label: 'Em alta', short: 'Em alta' },
]

export function CatalogToolbar({
  search,
  onPatch,
  refreshing,
}: {
  search: CatalogSearch
  onPatch: (patch: Partial<CatalogSearch>) => void
  refreshing: boolean
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <CatalogTabs value={catalogTab(search)} onChange={(tab) => onPatch({ tab })} />
        <BackgroundRefresh active={refreshing} />
      </div>
      <div className="hidden min-w-0 lg:block">
        <SortSelect value={catalogSort(search)} onChange={(sort) => onPatch({ sort })} />
      </div>
    </div>
  )
}

function CatalogTabs({ value, onChange }: { value: NftTab; onChange: (tab: NftTab) => void }) {
  return (
    <div className="flex w-full min-w-0 flex-wrap items-end justify-between gap-x-2 gap-y-1 lg:w-auto lg:justify-start lg:gap-5" role="tablist" aria-label="Aba do catálogo">
      {TABS.map((tab) => {
        const active = value === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative pb-1 text-sm leading-4 whitespace-nowrap',
              active ? 'font-bold text-amber lg:font-medium' : 'font-normal text-cream lg:font-medium',
            )}
          >
            {tab.label}
            {active ? <span aria-hidden className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-copper" /> : null}
          </button>
        )
      })}
    </div>
  )
}

export function CatalogGrid({
  items,
  isPending,
}: {
  items: NftListResponse['items']
  isPending: boolean
}) {
  if (isPending) {
    return (
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-[72px]" data-testid="catalog-skeleton">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className={cn('min-w-0', i % 2 === 1 && 'pt-8 lg:pt-0')}>
            <NftCardSkeleton />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-[72px]" data-testid="nft-grid">
      {items.map((nft, i) => (
        <li key={nft.id} className={cn('min-w-0', i % 2 === 1 && 'pt-8 lg:pt-0')}>
          <NftCard nft={nft} priority={i < 2} />
        </li>
      ))}
    </ul>
  )
}

export function CatalogEmpty({ search, onClear }: { search: CatalogSearch; onClear: () => void }) {
  return (
    <EmptyState
      title="Nenhum NFT encontrado"
      description="Tente outro termo, outra aba ou limpe os filtros para ver o catálogo."
      action={
        hasActiveFilters(search) ? (
          <Button type="button" variant="outline" onClick={onClear}>
            Limpar filtros
          </Button>
        ) : null
      }
    />
  )
}

export function CatalogError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return <ErrorState error={error} onRetry={onRetry} title="Não foi possível carregar o catálogo" />
}

export function CatalogPagination({ search, totalPages }: { search: CatalogSearch; totalPages: number }) {
  if (totalPages <= 1) return null
  const current = catalogPage(search)
  const pages = visiblePages(current, totalPages)
  const next = Math.min(totalPages, current + 1)

  return (
    <nav aria-label="Paginação" className="flex justify-end" data-testid="catalog-pagination">
      <ul className="flex items-center gap-2">
        {pages.map((page) => (
          <li key={page}>
            <Link
              to="/"
              search={serializeCatalogSearch({ ...search, page })}
              aria-label={`Página ${page}`}
              aria-current={page === current ? 'page' : undefined}
              className={cn(
                'grid size-[35px] place-items-center rounded-[4px] text-lg',
                page === current ? 'bg-copper font-bold text-ink' : 'border border-border font-normal text-cream hover:border-copper hover:text-amber',
              )}
            >
              {page}
            </Link>
          </li>
        ))}
        <li>
          <Link
            to="/"
            search={serializeCatalogSearch({ ...search, page: next })}
            aria-label="Próxima página"
            aria-disabled={current >= totalPages}
            className={cn(
              'grid size-[35px] place-items-center rounded-[4px] border border-border text-cream hover:border-copper hover:text-amber',
              current >= totalPages && 'pointer-events-none opacity-40',
            )}
          >
            <ArrowRightIcon className="size-[18px]" />
          </Link>
        </li>
      </ul>
    </nav>
  )
}

function visiblePages(current: number, total: number) {
  if (total <= 4) return Array.from({ length: total }, (_, i) => i + 1)
  const start = Math.min(Math.max(1, current - 1), total - 3)
  return [start, start + 1, start + 2, start + 3]
}
