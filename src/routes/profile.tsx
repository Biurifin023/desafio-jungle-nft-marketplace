import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/features/account/ProfilePage'
import { requireAuth } from '@/features/session/guard'

export const Route = createFileRoute('/profile')({
  beforeLoad: requireAuth,
  staticData: { nav: 'inicio', title: 'Perfil', mobileChrome: 'tabbar', hideFooter: true },
  component: ProfilePage,
})
