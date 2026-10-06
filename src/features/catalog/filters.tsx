import { useId, useState, type ReactNode } from 'react'
import { CATEGORY_LABEL, NETWORK_LABEL, NFT_SORT_LABEL, type Category, type Network, type NftFacets, type NftSort } from '@/api/contracts'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatEthPtBr } from '@/lib/money'
import { cn } from '@/lib/utils'
import { PRICE_CEILING, PRICE_FLOOR, type CatalogSearch } from './search-params'

const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[]
const NETWORKS = Object.keys(NETWORK_LABEL) as Network[]
const SORTS = Object.keys(NFT_SORT_LABEL) as NftSort[]

const filterItem =
  '-mx-2 flex h-10 w-[calc(100%+1rem)] min-w-0 cursor-pointer items-center justify-between rounded-xs px-2 text-[15px] leading-10 transition-colors hover:bg-copper/10 hover:text-amber'

function toBound(value: string | undefined, fallback: string) {
  const n = Number(value)
  return Number.isFinite(n) ? n : Number(fallback)
}

export function CatalogFilters({
  search,
  facets,
  onPatch,
  showSort = false,
}: {
  search: CatalogSearch
  facets?: NftFacets
  onPatch: (patch: Partial<CatalogSearch>, options?: { resetPage?: boolean }) => void
  showSort?: boolean
}) {
  const urlMin = toBound(search.minPrice, PRICE_FLOOR)
  const urlMax = toBound(search.maxPrice, PRICE_CEILING)

  return (
    <CatalogFiltersBody
      key={`${urlMin}-${urlMax}`}
      search={search}
      facets={facets}
      onPatch={onPatch}
      showSort={showSort}
      urlMin={urlMin}
      urlMax={urlMax}
    />
  )
}

function CatalogFiltersBody({
  search,
  facets,
  onPatch,
  showSort,
  urlMin,
  urlMax,
}: {
  search: CatalogSearch
  facets?: NftFacets
  onPatch: (patch: Partial<CatalogSearch>, options?: { resetPage?: boolean }) => void
  showSort?: boolean
  urlMin: number
  urlMax: number
}) {
  const priceLabelId = useId()
  const selectedCategories = search.categories ?? []
  const selectedNetworks = search.networks ?? []
  const [range, setRange] = useState<number[]>([urlMin, urlMax])

  function toggleCategory(category: Category) {
    const next = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category]
    onPatch({ categories: next.length ? next : undefined })
  }

  function toggleNetwork(network: Network) {
    const next = selectedNetworks.includes(network)
      ? selectedNetworks.filter((n) => n !== network)
      : [...selectedNetworks, network]
    onPatch({ networks: next.length ? next : undefined })
  }

  function applyPrice() {
    const min = range[0] ?? Number(PRICE_FLOOR)
    const max = range[1] ?? Number(PRICE_CEILING)
    onPatch({
      minPrice: min <= Number(PRICE_FLOOR) + 0.001 ? undefined : min.toFixed(2),
      maxPrice: max >= Number(PRICE_CEILING) - 0.001 ? undefined : max.toFixed(2),
    })
  }

  return (
    <div className="flex flex-col gap-10" data-testid="catalog-filters">
      {showSort ? (
        <div className="flex flex-col gap-3">
          <p className="text-lg font-bold leading-4 text-cream">Ordenar</p>
          <SortSelect value={search.sort ?? 'recent'} onChange={(sort) => onPatch({ sort })} />
        </div>
      ) : null}

      <fieldset className="min-w-0">
        <legend className="text-lg font-bold leading-4 text-cream">Coleções</legend>
        <ul className="mt-3">
          {CATEGORIES.map((category) => {
            const selected = selectedCategories.includes(category)
            const count = facets?.categories[category] ?? 0
            return (
              <li key={category}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleCategory(category)}
                  className={cn(filterItem, selected ? 'font-normal text-amber' : 'text-sand')}
                >
                  <span className="truncate">{CATEGORY_LABEL[category]}</span>
                  <span className={cn('shrink-0 tabular-nums', selected && 'font-bold')}>({count})</span>
                </button>
              </li>
            )
          })}
        </ul>
      </fieldset>

      <div className="flex flex-col gap-3">
        <p id={priceLabelId} className="text-lg font-bold leading-4 text-cream">
          Faixa de preço
        </p>
        <Slider
          min={Number(PRICE_FLOOR)}
          max={Number(PRICE_CEILING)}
          step={0.01}
          value={range}
          onValueChange={setRange}
          aria-labelledby={priceLabelId}
          thumbLabels={['Preço mínimo', 'Preço máximo']}
          formatValueText={(value) => `${formatEthPtBr(value.toFixed(2))} ETH`}
        />
        <p className="text-[15px] text-cream">
          Preço: {formatEthPtBr(range[0]!.toFixed(2))} - {formatEthPtBr(range[1]!.toFixed(2))} ETH
        </p>
        <Button type="button" size="sm" className="h-9 w-[92px] self-start px-3" onClick={applyPrice}>
          Aplicar
        </Button>
      </div>

      <fieldset className="min-w-0">
        <legend className="text-lg font-bold leading-4 text-cream">Rede</legend>
        <ul className="mt-3">
          {NETWORKS.map((network) => {
            const selected = selectedNetworks.includes(network)
            const count = facets?.networks[network] ?? 0
            return (
              <li key={network}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleNetwork(network)}
                  className={cn(filterItem, selected ? 'text-amber' : 'text-sand')}
                >
                  <span className="truncate">{NETWORK_LABEL[network]}</span>
                  <span className="shrink-0 tabular-nums">({count})</span>
                </button>
              </li>
            )
          })}
        </ul>
      </fieldset>
    </div>
  )
}

export function SortSelect({ value, onChange }: { value: NftSort; onChange: (sort: NftSort) => void }) {
  const sortId = useId()
  return (
    <div className="flex min-w-0 items-center gap-1 text-[15px] text-cream">
      <Label htmlFor={sortId} className="shrink-0 font-normal text-cream">
        Ordenar por:
      </Label>
      <Select value={value} onValueChange={(next) => onChange(next as NftSort)}>
        <SelectTrigger
          id={sortId}
          size="sm"
          className="h-auto min-w-0 max-w-full cursor-pointer border-0 bg-transparent px-1 py-0 text-[15px] shadow-none [&_svg]:text-cream"
          aria-label="Ordenar por"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {SORTS.map((sort) => (
            <SelectItem key={sort} value={sort}>
              {NFT_SORT_LABEL[sort]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function FilterSheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(100%,22rem)] gap-0 overflow-y-auto p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="text-lg text-cream">Filtros</SheetTitle>
          <SheetDescription className="text-sm text-sand">Coleções, preço e rede. O foco permanece neste painel até fechar.</SheetDescription>
        </SheetHeader>
        <div className="px-5 py-6">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
