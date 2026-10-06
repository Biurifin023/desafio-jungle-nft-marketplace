import { useLocation, useNavigate } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useFavorites, useToggleFavorite } from '@/api/favorites'
import { errorMessage } from '@/components/common/QueryState'
import { Button } from '@/components/ui/button'
import { useSessionSnapshot } from '@/features/session/session-store'
import { announce } from '@/lib/announce'
import { cn } from '@/lib/utils'

export function FavoriteButton({
  nftId,
  variant = 'button',
  className,
}: {
  nftId: string
  variant?: 'button' | 'icon'
  className?: string
}) {
  const session = useSessionSnapshot()
  const navigate = useNavigate()
  const location = useLocation()
  const favorites = useFavorites()
  const toggle = useToggleFavorite()
  const isFavorite = favorites.data?.nftIds.includes(nftId) ?? false
  const label = isFavorite ? 'Remover dos favoritos' : 'Favoritar'

  function onToggle() {
    if (session.status !== 'authenticated') {
      void navigate({ to: '/login', search: { redirect: location.href } })
      return
    }
    const next = !isFavorite
    toggle.mutate(
      { nftId, favorite: next },
      {
        onSuccess: () => announce(next ? 'Adicionado aos favoritos' : 'Removido dos favoritos'),
        onError: (error) => {
          const message = errorMessage(error, 'Não foi possível salvar o favorito.')
          announce(message, 'assertive')
          toast.error(message)
        },
      },
    )
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={isFavorite}
        onClick={onToggle}
        className={cn(
          'grid size-[35px] place-items-center rounded-full border border-border bg-surface-2 text-amber',
          className,
        )}
      >
        <Heart aria-hidden className={cn('size-4', isFavorite && 'fill-amber')} />
      </button>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      aria-label={label}
      aria-pressed={isFavorite}
      onClick={onToggle}
      className={cn('h-10 w-[130px] gap-2 font-medium text-amber', className)}
    >
      <Heart aria-hidden className={cn('size-5', isFavorite && 'fill-copper text-copper')} />
      Favoritar
    </Button>
  )
}
