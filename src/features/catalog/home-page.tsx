import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useFeatured, useNftList } from '@/api/nfts'
import { MobileTopBar } from '@/components/layout/MobileChrome'
import { NftImage } from '@/components/common/NftImage'
import { CatalogBlog, CatalogPromos } from './editorial'
import { CatalogFilters, FilterSheet } from './filters'
import { CatalogHero } from './hero'
import { CatalogEmpty, CatalogError, CatalogGrid, CatalogPagination, CatalogToolbar } from './catalog-results'
import { serializeCatalogSearch, type CatalogSearch } from './search-params'

export function HomePage({
  search,
  onSearch,
}: {
  search: CatalogSearch
  onSearch: (next: CatalogSearch) => void
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const featured = useFeatured()
  const list = useNftList(search)

  function patch(partial: Partial<CatalogSearch>, options: { resetPage?: boolean } = {}) {
    const resetPage = options.resetPage ?? true
    onSearch(
      serializeCatalogSearch({
        ...search,
        ...partial,
        page: resetPage ? 1 : (partial.page ?? search.page),
      }),
    )
  }

  function clearFilters() {
    onSearch(serializeCatalogSearch({ ...search, q: undefined, categories: undefined, networks: undefined, minPrice: undefined, maxPrice: undefined, tab: 'all', page: 1 }))
  }

  const items = list.data?.items ?? []
  const facets = list.data?.facets
  const totalPages = list.data?.pagination.totalPages ?? 0
  const showSkeleton = list.isPending && !list.data
  const showError = list.isError && !list.data
  const showEmpty = Boolean(list.data && items.length === 0)
  const refreshing = list.isFetching && Boolean(list.data)

  return (
    <>
      <MobileTopBar key={search.q ?? ''} onOpenFilters={() => setFiltersOpen(true)} initialQuery={search.q ?? ''} />

      <div className="page-container flex min-w-0 flex-col gap-16 overflow-x-clip pt-6 pb-8 lg:gap-24 lg:pt-8">
        <CatalogHero featured={featured.data} isPending={featured.isPending} />

        <section id="catalogo" className="flex min-w-0 flex-col gap-8 scroll-mt-6 lg:flex-row lg:gap-12">
          <aside className="hidden w-[310px] shrink-0 flex-col gap-6 lg:flex">
            <div className="bg-surface p-5">
              <CatalogFilters search={search} facets={facets} onPatch={patch} />
            </div>
            <Spotlight nftId={featured.data?.spotlight.id} image={featured.data?.spotlight.image} />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col gap-8 lg:gap-[88px]">
            <div className="flex min-w-0 flex-col gap-8">
              <CatalogToolbar search={search} onPatch={patch} refreshing={refreshing} />
              {showSkeleton ? <CatalogGrid items={[]} isPending /> : null}
              {showError ? <CatalogError error={list.error} onRetry={() => void Promise.all([list.refetch(), featured.refetch()])} /> : null}
              {showEmpty ? <CatalogEmpty search={search} onClear={clearFilters} /> : null}
              {!showSkeleton && !showError && !showEmpty ? (
                <div aria-busy={refreshing}>
                  <CatalogGrid items={items} isPending={false} />
                </div>
              ) : null}
            </div>
            {!showSkeleton && !showError && !showEmpty ? <CatalogPagination search={search} totalPages={totalPages} /> : null}
          </div>
        </section>

        <CatalogPromos featured={featured.data} isPending={featured.isPending} />
        <CatalogBlog />
      </div>

      <FilterSheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CatalogFilters search={search} facets={facets} onPatch={patch} showSort />
      </FilterSheet>
    </>
  )
}

function Spotlight({ nftId, image }: { nftId?: string; image?: { base: string; alt: string } }) {
  if (!nftId || !image) {
    return <div className="hidden h-[470px] bg-[linear-gradient(180deg,#d28a4c1a_0%,#d28a4c08_100%)] lg:block" />
  }
  return (
    <Link
      to="/nft/$id"
      params={{ id: nftId }}
      className="flex flex-col gap-4 bg-[linear-gradient(180deg,#d28a4c1a_0%,#d28a4c08_100%)] pt-6 pb-1"
      aria-label="NFT em destaque, oferta limitada"
    >
      <div className="px-5 text-center">
        <p className="text-2xl leading-8 font-bold text-amber">NFT EM DESTAQUE</p>
        <p className="mt-4 text-[22px] leading-4 font-bold text-cream">OFERTA LIMITADA</p>
      </div>
      <NftImage image={image} sizes="310px" className="h-[368px] rounded-[22px] object-cover" />
    </Link>
  )
}
