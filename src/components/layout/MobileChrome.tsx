import { Link, useLocation, useMatches, useNavigate } from '@tanstack/react-router'
import { type FormEvent, type ReactNode, useState } from 'react'
import { CartBadge, Logo } from './Header'
import { CartIcon, FilterIcon, SearchMobileIcon, TabHeartIcon, TabHomeIcon, TabScanIcon, TabShopIcon, TabUserIcon } from '@/components/icons'
import { useCartCount } from '@/api/cart'
import { useSessionSnapshot } from '@/features/session/session-store'
import { useNotAvailable } from '@/components/common/NotAvailable'
import { cn } from '@/lib/utils'

export function MobileTopBar({ onOpenFilters }: { onOpenFilters?: () => void }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  function submit(e: FormEvent) {
    e.preventDefault()
    void navigate({ to: '/', search: q.trim() ? { q: q.trim() } : {}, hash: 'catalogo' })
  }
  return (
    <div className="flex items-center gap-2 px-6 pt-10 lg:hidden">
      <form role="search" onSubmit={submit} className="flex h-[45px] flex-1 items-center gap-2 rounded-[10px] bg-surface px-3">
        <label htmlFor="mobile-search" className="sr-only">
          Explorar coleções
        </label>
        <SearchMobileIcon aria-hidden className="size-[22px] text-khaki" />
        <input
          id="mobile-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Explorar coleções"
          className="h-full w-full bg-transparent text-sm font-bold text-cream outline-none placeholder:text-khaki"
        />
      </form>
      {onOpenFilters ? (
        <button
          type="button"
          onClick={onOpenFilters}
          aria-label="Abrir filtros"
          className="grid size-[45px] place-items-center rounded-[14px] bg-[linear-gradient(180deg,#d28a4c73_0%,#d28a4c_100%)] text-ink"
        >
          <FilterIcon className="size-[22px]" />
        </button>
      ) : (
        <Link to="/cart" aria-label="Carrinho" className="relative grid size-[45px] place-items-center text-cream">
          <CartIcon className="size-6" />
        </Link>
      )}
    </div>
  )
}

export function MobileTabBar() {
  const matches = useMatches()
  const chrome = [...matches].reverse().find((m) => m.staticData?.mobileChrome)?.staticData.mobileChrome
  if (chrome === 'none') return null
  return <TabBar />
}

function TabBar() {
  const location = useLocation()
  const session = useSessionSnapshot()
  const count = useCartCount()
  const unavailable = useNotAvailable()
  const path = location.pathname
  const accountTo = session.status === 'authenticated' ? '/profile' : '/login'

  return (
    <nav aria-label="Navegação mobile" className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div className="relative mx-auto h-[126px] max-w-[414px]">
        <div className="absolute inset-x-0 bottom-0 h-[95px] rounded-t-[28px] bg-surface shadow-up" />
        <button
          type="button"
          onClick={() => unavailable('Escanear QR')}
          aria-label="Escanear"
          className="absolute top-0 left-1/2 grid size-[65px] -translate-x-1/2 place-items-center rounded-full bg-[linear-gradient(180deg,#d28a4c66_0%,#d28a4c_100%)] text-cream"
        >
          <TabScanIcon className="size-6" />
        </button>
        <ul className="absolute inset-x-0 bottom-8 flex items-center justify-between px-9 text-sand">
          <TabLink to="/" label="Início" active={path === '/'}>
            <TabHomeIcon className="size-5" />
          </TabLink>
          <TabLink to="/favorites" label="Favoritos" active={path === '/favorites'}>
            <TabHeartIcon className="size-5" />
          </TabLink>
          <li className="w-8" aria-hidden />
          <TabLink to="/cart" label={`Carrinho, ${count} itens`} active={path === '/cart'}>
            <span className="relative">
              <TabShopIcon className="size-5" />
              <CartBadge count={count} className="-right-2" />
            </span>
          </TabLink>
          <TabLink to={accountTo} label="Conta" active={path === '/profile' || path === '/login'}>
            <TabUserIcon className="size-5" />
          </TabLink>
        </ul>
      </div>
    </nav>
  )
}

function TabLink({ to, label, active, children }: { to: string; label: string; active: boolean; children: ReactNode }) {
  return (
    <li>
      <Link to={to} aria-label={label} aria-current={active ? 'page' : undefined} className={cn('grid place-items-center', active ? 'text-amber' : 'text-sand')}>
        {children}
      </Link>
    </li>
  )
}

export function MobileBrandHeader() {
  return (
    <div className="flex justify-center px-6 pt-10 lg:hidden">
      <Logo className="text-xl tracking-[0.2em]" />
    </div>
  )
}
