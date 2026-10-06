import { StarIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

export function NftStars({
  average,
  count,
  compact = false,
}: {
  average: number
  count: number
  compact?: boolean
}) {
  const label = `${average.toFixed(1)} de 5, ${count} avaliações de colecionadores`
  if (compact) {
    return (
      <div className="flex items-center gap-1" aria-label={label}>
        <StarIcon aria-hidden className="size-3.5 text-star" />
        <span className="text-sm font-medium text-cream">{average.toFixed(1)}</span>
        <span className="text-sm text-sand">({count})</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1" aria-label={label}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i + 1 <= Math.round(average)
        return <StarIcon key={i} aria-hidden className={cn('size-[15px]', filled ? 'text-copper' : 'text-sand')} />
      })}
      <span className="ml-1 text-[15px] text-cream">{count} avaliações de colecionadores</span>
    </div>
  )
}
