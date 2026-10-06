import { Link } from '@tanstack/react-router'
import type { Edition } from '@/api/contracts'
import { CartIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'
import { FavoriteButton } from './FavoriteButton'
import { QuantityStepper } from './QuantityStepper'
import { editionLimit, isEditionSoldOut } from './format'

export function buyLabel(edition: Edition | undefined, allSoldOut: boolean) {
  if (allSoldOut) return 'Esgotado'
  if (!edition || isEditionSoldOut(edition)) return 'Edição esgotada'
  return null
}

export function NftDesktopPurchase({
  nftId,
  edition,
  quantity,
  onQuantity,
  onBuy,
  pending,
  allSoldOut,
}: {
  nftId: string
  edition: Edition
  quantity: number
  onQuantity: (n: number) => void
  onBuy: () => void
  pending: boolean
  allSoldOut: boolean
}) {
  const soldOut = allSoldOut || isEditionSoldOut(edition)
  const label = buyLabel(edition, allSoldOut) ?? 'COMPRAR'
  const max = editionLimit(edition)

  return (
    <div className="flex items-center justify-between gap-4">
      <QuantityStepper value={quantity} max={max} onChange={onQuantity} disabled={soldOut} />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={onBuy}
          disabled={soldOut || pending}
          aria-disabled={soldOut || pending}
          className="h-10 w-[130px] uppercase"
        >
          {label}
        </Button>
        <FavoriteButton nftId={nftId} />
      </div>
    </div>
  )
}

export function NftMobilePurchase({
  edition,
  quantity,
  onQuantity,
  onBuy,
  pending,
  allSoldOut,
}: {
  edition: Edition
  quantity: number
  onQuantity: (n: number) => void
  onBuy: () => void
  pending: boolean
  allSoldOut: boolean
}) {
  const soldOut = allSoldOut || isEditionSoldOut(edition)
  const label = buyLabel(edition, allSoldOut) ?? 'Comprar NFT'
  const max = editionLimit(edition)

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-[40px] bg-surface px-6 pt-5 pb-9 shadow-glow lg:hidden">
      <div className="mx-auto flex max-w-[366px] flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-medium text-sand">Qtd.</span>
            <QuantityStepper value={quantity} max={max} onChange={onQuantity} disabled={soldOut} size="mobile" />
          </div>
          <p className="text-xl font-bold text-amber">{formatEth(edition.priceEth)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="gradient"
            size="xl"
            onClick={onBuy}
            disabled={soldOut || pending}
            aria-disabled={soldOut || pending}
            className={cn('min-w-[196px] flex-1 text-base', soldOut && 'opacity-50')}
          >
            {label}
          </Button>
          <Button asChild variant="secondary" size="icon-lg" className="border border-border bg-surface-2">
            <Link to="/cart" aria-label="Abrir carrinho">
              <CartIcon aria-hidden className="size-5 text-khaki" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
