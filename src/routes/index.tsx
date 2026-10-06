import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/features/catalog/home-page'
import { parseNftSearch, serializeCatalogSearch } from '@/features/catalog/search-params'

export const Route = createFileRoute('/')({
  validateSearch: parseNftSearch,
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
