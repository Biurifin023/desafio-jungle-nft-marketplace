import { createFileRoute } from '@tanstack/react-router'
import { WalletsPage } from '@/features/account/WalletsPage'
import { requireAuth } from '@/features/session/guard'

export const Route = createFileRoute('/wallets')({
  beforeLoad: requireAuth,
  staticData: { nav: 'inicio', title: 'Carteiras', mobileChrome: 'tabbar', hideFooter: true },
  component: WalletsPage,
})
