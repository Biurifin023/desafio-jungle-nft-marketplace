import { createFileRoute } from '@tanstack/react-router'
import { FavoritesPage } from '@/features/nft/FavoritesPage'
import { requireAuth } from '@/features/session/guard'

export const Route = createFileRoute('/favorites')({
  beforeLoad: requireAuth,
  staticData: { title: 'Favoritos', mobileChrome: 'tabbar' },
  component: FavoritesPage,
})
