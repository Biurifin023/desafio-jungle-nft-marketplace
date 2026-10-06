import type { Edition } from '@/api/contracts'
import { handleRovingKeyDown } from '@/lib/roving-focus'
import { cn } from '@/lib/utils'
import { isEditionSoldOut } from './format'

export function NftEditions({
  editions,
  selectedId,
  onSelect,
}: {
  editions: Edition[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const selectable = editions.filter((edition) => !isEditionSoldOut(edition))
  const focusableId = selectable.some((edition) => edition.id === selectedId) ? selectedId : selectable[0]?.id
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[15px] font-bold text-cream">Edição:</p>
      <div
        role="radiogroup"
        aria-label="Edição"
        className="flex flex-wrap items-center gap-1.5 lg:gap-1.5"
        onKeyDown={(event) => {
          const index = handleRovingKeyDown(event)
          if (index !== null) onSelect(editions[index]!.id)
        }}
      >
        {editions.map((edition) => {
          const soldOut = isEditionSoldOut(edition)
          const selected = edition.id === selectedId
          return (
            <button
              key={edition.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-disabled={soldOut}
              disabled={soldOut}
              tabIndex={edition.id === focusableId ? 0 : -1}
              data-roving-item
              onClick={() => onSelect(edition.id)}
              className={cn(
                'inline-flex min-h-7 items-center justify-center rounded-full border px-2 py-1 text-sm leading-4',
                selected && !soldOut && 'border-copper font-medium text-amber',
                !selected && !soldOut && 'border-border text-sand hover:border-copper/60 hover:text-amber',
                soldOut && 'cursor-not-allowed border-border text-khaki line-through decoration-khaki',
              )}
            >
              <span>{edition.label}</span>
              {soldOut ? <span className="ml-1 no-underline">esgotada</span> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
