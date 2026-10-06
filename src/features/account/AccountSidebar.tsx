import type { ComponentType, ReactNode, SVGProps } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useLogout } from '@/api/session'
import { useNotAvailable } from '@/components/common/NotAvailable'
import { ActivityIcon, DangerIcon, DownloadIcon, HeartIcon, LocationIcon, LogoutIcon, ShoppingIcon, UserIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

type Icon = ComponentType<SVGProps<SVGSVGElement>>

type Item = {
  label: string
  icon: Icon
  /** Classes de tamanho/espaçamento do ícone, medidas no Figma (o texto começa em posições diferentes). */
  iconClassName: string
} & ({ to: '/profile' | '/wallets' | '/favorites'; id?: 'profile' | 'wallets' } | { feature: string })

const ITEMS: Item[] = [
  { label: 'Dados do perfil', icon: UserIcon, iconClassName: 'mr-4 size-[18px]', to: '/profile', id: 'profile' },
  { label: 'Carteiras', icon: LocationIcon, iconClassName: 'mr-3 size-5', to: '/wallets', id: 'wallets' },
  { label: 'Atividade', icon: ShoppingIcon, iconClassName: 'mr-3 size-[18px]', feature: 'Atividade da conta' },
  { label: 'Lista de interesse', icon: HeartIcon, iconClassName: 'mr-3 size-4', to: '/favorites' },
  { label: 'Ofertas', icon: ActivityIcon, iconClassName: 'mr-3 size-[18px]', feature: 'Ofertas' },
  { label: 'Arquivos baixados', icon: DownloadIcon, iconClassName: 'mr-3 size-[18px]', feature: 'Arquivos baixados' },
  { label: 'Suporte', icon: DangerIcon, iconClassName: 'mr-3 size-[18px]', feature: 'Suporte' },
]

const itemClass =
  'relative flex h-[45px] w-full cursor-pointer items-center px-4 text-left text-[15px] leading-[45px] text-amber transition-colors hover:bg-copper/10'

export function AccountSidebar({ active }: { active: 'profile' | 'wallets' }) {
  const openNotAvailable = useNotAvailable()
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <nav aria-labelledby="account-nav-title" className="w-full self-start bg-surface py-2 lg:w-[310px]">
      <h2 id="account-nav-title" className="p-2.5 text-lg leading-4 font-bold text-cream">
        Meu perfil
      </h2>
      <ul>
        {ITEMS.map((item) => {
          const current = 'id' in item && item.id === active
          const content = <ItemContent item={item} current={current} />
          return (
            <li key={item.label}>
              {'to' in item ? (
                <Link to={item.to} aria-current={current ? 'page' : undefined} className={itemClass}>
                  {content}
                </Link>
              ) : (
                <button type="button" aria-haspopup="dialog" className={itemClass} onClick={() => openNotAvailable(item.feature)}>
                  {content}
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <div className="relative -mt-px border-t border-copper/25">
        <button
          type="button"
          data-testid="logout"
          disabled={logout.isPending}
          onClick={() => logout.mutate(undefined, { onSettled: () => void navigate({ to: '/' }) })}
          className="flex h-10 w-full cursor-pointer items-center gap-2 px-4 text-[15px] leading-[15px] font-bold text-amber transition-colors hover:bg-copper/10"
        >
          <LogoutIcon aria-hidden className="size-5 text-copper" />
          Sair
        </button>
      </div>
    </nav>
  )
}

function ItemContent({ item, current }: { item: Item; current: boolean }): ReactNode {
  const Icon = item.icon
  return (
    <>
      {current ? <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-copper" /> : null}
      <Icon aria-hidden className={cn('shrink-0', item.iconClassName, current ? 'text-copper' : 'text-khaki')} />
      <span className="truncate">{item.label}</span>
    </>
  )
}
