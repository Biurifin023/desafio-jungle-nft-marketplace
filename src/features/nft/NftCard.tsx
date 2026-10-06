import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/api/contracts'
import { NftImage } from '@/components/common/NftImage'
import { formatEth } from '@/lib/money'

export function NftCard({ nft }: { nft: NftSummary }) {
  return (
    <Link to="/nft/$id" params={{ id: nft.id }} className="group flex w-full flex-col gap-3">
      <div className="aspect-square w-full overflow-hidden bg-surface">
        <NftImage image={nft.image} sizes="(max-width: 1024px) 45vw, 220px" className="size-full" />
      </div>
      <div className="flex flex-col">
        <p className="text-[15px] text-cream group-hover:text-amber">{nft.name}</p>
        <p className="text-base font-bold text-amber">{formatEth(nft.priceEth)}</p>
      </div>
    </Link>
  )
}
