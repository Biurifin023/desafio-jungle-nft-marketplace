import { createFileRoute } from '@tanstack/react-router'
import { parseNftSearch } from '@/features/catalog/search-params'

export const Route = createFileRoute('/')({
  validateSearch: parseNftSearch,
  staticData: { nav: 'inicio', title: 'Início', mobileChrome: 'tabbar' },
  component: HomeStub,
})

function HomeStub() {
  return (
    <section className="page-container py-16" aria-labelledby="home-title">
      <p className="text-sm font-medium tracking-[0.1em] text-cream">Bem-vindo à Kurio</p>
      <h1 id="home-title" className="mt-2 max-w-xl text-[43px] leading-[70px] font-bold text-cream">
        SEJA DONO DO FUTURO DA ARTE DIGITAL
      </h1>
      <p className="mt-6 max-w-xl text-sm leading-6 text-sand">
        O catálogo, os destaques e os filtros entram na Etapa 1. A fundação (rotas, mocks e sessão) já está ativa.
      </p>
    </section>
  )
}
