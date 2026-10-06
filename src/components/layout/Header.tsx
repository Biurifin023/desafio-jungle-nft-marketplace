import { Link, useLocation, useMatches, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { ChevronDown, Heart, User, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { CartIcon, LoginIcon, LogoutIcon, SearchIcon } from '@/components/icons'
import { NotAvailableLink } from '@/components/common/NotAvailable'
import { useCartCount } from '@/api/cart'
import { useLogout } from '@/api/session'
import { useSessionSnapshot } from '@/features/session/session-store'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('inline-flex h-[34px] items-center text-sm font-bold tracking-[0.1em] text-cream', className)} aria-label="Kurio, página inicial">
      KURIO
    </Link>
  )
}

const navLink =
  'relative flex h-[45px] items-start text-base text-cream transition-colors hover:text-amber after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:origin-left after:scale-x-0 after:bg-copper after:transition-transform after:duration-300 hover:after:scale-x-100 focus-visible:after:scale-x-100'
const activeNav = 'font-bold text-amber after:scale-x-100'

function useActiveNav() {
  const matches = useMatches()
  return [...matches].reverse().find((m) => m.staticData?.nav)?.staticData.nav
}

export function CartBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null
  return (
    <span
      aria-hidden
      data-testid="cart-badge"
      className={cn(
        'absolute -top-0 -right-[7px] grid h-4 min-w-4 place-items-center rounded-full border-2 border-background bg-copper px-0.5 text-[10px] leading-none font-medium text-ink',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

function HeaderSearch() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = String(new FormData(e.currentTarget).get('q') ?? '').trim()
    setOpen(false)
    void navigate({ to: '/', search: q ? { q } : {}, hash: 'catalogo', resetScroll: false })
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="grid size-9 cursor-pointer place-items-center text-cream hover:text-amber" aria-label="Buscar NFTs">
        <SearchIcon aria-hidden className="size-5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Buscar no mercado</DialogTitle>
            <DialogDescription>Pesquise por nome, coleção ou número do token.</DialogDescription>
          </DialogHeader>
          <form role="search" onSubmit={submit} className="flex gap-2">
            <label htmlFor="header-search" className="sr-only">
              Termo de busca
            </label>
            <Input id="header-search" name="q" type="search" placeholder="Explorar coleções" maxLength={80} autoFocus />
            <Button type="submit">Buscar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function AccountMenu({ username, displayName }: { username: string; displayName: string }) {
  const logout = useLogout()
  const navigate = useNavigate()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-[180px]" data-testid="account-menu">
          <User aria-hidden />
          <span className="truncate">{displayName}</span>
          <ChevronDown aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-khaki">@{username}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <User aria-hidden /> Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/wallets">
            <Wallet aria-hidden /> Carteiras
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/favorites">
            <Heart aria-hidden /> Favoritos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            void logout
              .mutateAsync()
              .catch(() => undefined)
              .then(() => navigate({ to: '/' }))
          }}
        >
          <LogoutIcon aria-hidden className="size-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Header desktop (lg+), fiel ao componente "Header With Divider" do Figma. */
export function Header() {
  const active = useActiveNav()
  const session = useSessionSnapshot()
  const count = useCartCount()
  const location = useLocation()
  const loginRedirect = location.pathname === '/login' || location.pathname === '/register' ? undefined : location.href

  return (
    <header className="page-container hidden pt-6 lg:block">
      <div className="flex h-[45px] items-start justify-between border-b border-copper/30">
        <div className="w-[160px]">
          <Logo />
        </div>
        <nav aria-label="Principal">
          <ul className="flex gap-10">
            <li>
              <Link to="/" className={cn(navLink, active === 'inicio' && activeNav)} aria-current={active === 'inicio' ? 'page' : undefined}>
                Início
              </Link>
            </li>
            <li>
              <Link to="/cart" className={cn(navLink, active === 'mercado' && activeNav)} aria-current={active === 'mercado' ? 'page' : undefined}>
                Mercado
              </Link>
            </li>
            <li>
              <NotAvailableLink feature="Criadores" className={cn(navLink, 'cursor-pointer')}>
                Criadores
              </NotAvailableLink>
            </li>
            <li>
              <NotAvailableLink feature="Aprenda" className={cn(navLink, 'cursor-pointer')}>
                Aprenda
              </NotAvailableLink>
            </li>
          </ul>
        </nav>
        <div className="flex h-[35px] items-center gap-7">
          <HeaderSearch />
          <Link to="/cart" className="relative grid h-6 w-[31px] place-items-start text-cream hover:text-amber" aria-label={`Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}>
            <CartIcon aria-hidden className="size-6" />
            <CartBadge count={count} />
          </Link>
          {session.status === 'authenticated' ? (
            <AccountMenu username={session.user.username} displayName={session.user.displayName} />
          ) : (
            <Button asChild size="sm" className="w-[100px] gap-1 font-medium">
              <Link to="/login" search={{ redirect: loginRedirect }}>
                <LoginIcon aria-hidden className="size-5" />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
