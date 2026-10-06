import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { CartItem, QuoteLine } from '@/api/contracts'
import { useRemoveCartItem, useUpdateCartItem } from '@/api/cart'
import { NftImage } from '@/components/common/NftImage'
import { DeleteIcon } from '@/components/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { announce } from '@/lib/announce'
import { formatEth } from '@/lib/money'
import { errorMessage } from '@/components/common/QueryState'
import { useDesktop } from '@/lib/use-desktop'
import { cn } from '@/lib/utils'
import { maxQuantity } from './limits'
import { QuantityStepper } from './QuantityStepper'

export function CartItems({ items, lines, quotePending }: { items: CartItem[]; lines: QuoteLine[] | undefined; quotePending: boolean }) {
  const lineById = new Map(lines?.map((line) => [line.itemId, line]))

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-3 hidden grid-cols-[minmax(0,1fr)_77px_75px_87px_24px] items-center gap-x-6 border-b border-copper/30 pr-3 pb-3 text-base text-cream lg:grid">
        <p className="font-bold">NFTs</p>
        <p className="text-center font-medium">Preço</p>
        <p className="text-center font-bold">Edições</p>
        <p className="text-right font-medium">Total</p>
        <span className="sr-only">Remover</span>
      </div>

      <ul className="flex flex-col gap-5 lg:gap-3">
        {items.map((item) => (
          <CartItemRow key={item.id} item={item} line={lineById.get(item.id)} quotePending={quotePending} />
        ))}
      </ul>
    </div>
  )
}

function CartItemRow({ item, line, quotePending }: { item: CartItem; line: QuoteLine | undefined; quotePending: boolean }) {
  const desktop = useDesktop()
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const max = maxQuantity(item)
  const busy = (update.isPending && update.variables?.itemId === item.id) || (remove.isPending && remove.variables === item.id)
  const lineTotal = line?.lineTotalEth

  function changeQty(quantity: number) {
    update.mutate(
      { itemId: item.id, quantity },
      {
        onSuccess: () => announce(`Quantidade de ${item.name} atualizada para ${quantity}`),
        onError: (error) => {
          toast.error(errorMessage(error, 'Não foi possível atualizar a quantidade'))
          announce(errorMessage(error, 'Não foi possível atualizar a quantidade'), 'assertive')
        },
      },
    )
  }

  function onRemove() {
    remove.mutate(item.id, {
      onSuccess: () => {
        announce(`${item.name} removido do carrinho`)
        toast.success(`${item.name} removido do carrinho`)
      },
      onError: (error) => {
        toast.error(errorMessage(error, 'Não foi possível remover o item'))
        announce(errorMessage(error, 'Não foi possível remover o item'), 'assertive')
      },
    })
  }

  const stepper = (
    <QuantityStepper
      variant={desktop ? 'desktop' : 'mobile'}
      value={item.quantity}
      max={max}
      name={item.name}
      disabled={busy}
      onDecrease={() => changeQty(item.quantity - 1)}
      onIncrease={() => changeQty(item.quantity + 1)}
    />
  )

  return (
    <li
      data-testid="cart-item"
      data-item-id={item.id}
      data-edition={item.editionLabel}
      className={cn('lg:grid lg:grid-cols-[minmax(0,1fr)_77px_75px_87px_24px] lg:items-center lg:gap-x-6 lg:bg-surface lg:pr-3', busy && 'opacity-80')}
    >
      <article className="relative flex overflow-hidden rounded-[14px] bg-surface shadow-[0_6px_20px_0_#0a060473] lg:rounded-none lg:bg-transparent lg:shadow-none">
        <Link to="/nft/$id" params={{ id: item.nftId }} className="shrink-0" aria-label={`Ver ${item.name}`}>
          <NftImage image={item.image} sizes="100px" className="size-[100px] rounded-[14px] object-cover lg:size-[70px] lg:rounded-md" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-3 py-2.5 lg:px-4">
          <Link to="/nft/$id" params={{ id: item.nftId }} className="truncate text-[15px] font-bold text-cream hover:text-amber lg:text-base">
            {item.name}
          </Link>
          <p className="truncate text-sm text-sand lg:hidden">Edição: {item.editionLabel}</p>
          <p className="hidden truncate text-sm text-khaki lg:block">ID do token: {item.tokenId}</p>
          <p className="text-lg font-bold text-amber lg:hidden">{lineTotal && !quotePending ? formatEth(lineTotal) : formatEth(item.unitPriceEth)}</p>
        </div>
        <div className="flex flex-col items-end justify-center gap-2 pr-3 lg:hidden">
          {desktop ? null : stepper}
          {desktop ? null : <RemoveButton name={item.name} onClick={onRemove} disabled={busy} className="text-copper" />}
        </div>
      </article>

      <p className="hidden text-center text-base font-bold text-sand lg:block">{formatEth(item.unitPriceEth)}</p>
      <div className="hidden lg:block">{desktop ? stepper : null}</div>
      <div className="hidden text-right lg:block">
        {quotePending ? (
          <Skeleton className="ml-auto h-4 w-20" />
        ) : !lineTotal ? (
          <p className="text-base font-bold text-khaki">—</p>
        ) : (
          <p className="text-base font-bold text-amber">{formatEth(lineTotal)}</p>
        )}
      </div>
      <div className="hidden lg:grid lg:place-items-center">
        {desktop ? <RemoveButton name={item.name} onClick={onRemove} disabled={busy} className="text-khaki hover:text-coral" /> : null}
      </div>
    </li>
  )
}

function RemoveButton({ name, onClick, disabled, className }: { name: string; onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      data-testid="cart-remove"
      aria-label={`Remover ${name} do carrinho`}
      disabled={disabled}
      onClick={onClick}
      className={cn('grid size-6 place-items-center disabled:opacity-40', className)}
    >
      <DeleteIcon aria-hidden className="size-6" />
    </button>
  )
}

export function CartItemsSkeleton() {
  return (
    <div className="min-w-0 flex-1 space-y-3" aria-hidden>
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-[100px] w-full rounded-[14px] lg:h-[70px] lg:rounded-md" />
      ))}
    </div>
  )
}
