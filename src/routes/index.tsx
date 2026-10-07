import { createFileRoute } from '@tanstack/react-router'
import { featuredQuery, nftListQuery } from '@/api/nfts'
import { HomePage } from '@/features/catalog/home-page'
import { parseNftSearch, serializeCatalogSearch } from '@/features/catalog/search-params'

export const Route = createFileRoute('/')({
  validateSearch: parseNftSearch,
  loaderDeps: ({ search }) => search,
  // Sem await: a página renderiza na hora com skeletons, e as requisições (que trazem a imagem do LCP)
  // começam em paralelo com o chunk do componente, em vez de esperar ele montar.
  loader: ({ context: { queryClient }, deps }) => {
    void queryClient.prefetchQuery(featuredQuery())
    void queryClient.prefetchQuery(nftListQuery(deps))
  },
  staticData: { nav: 'inicio', title: 'Início', mobileChrome: 'tabbar' },
  component: Home,
})

function Home() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <HomePage
      search={search}
      onSearch={(next) => {
        void navigate({ to: '/', search: serializeCatalogSearch(next), resetScroll: false })
      }}
    />
  )
}
