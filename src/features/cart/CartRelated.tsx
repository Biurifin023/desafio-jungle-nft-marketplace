import { Link } from '@tanstack/react-router'
import { useNftList } from '@/api/nfts'
import { NftImage } from '@/components/common/NftImage'
import { formatEth } from '@/lib/money'

export function CartRelated({ excludeIds }: { excludeIds: string[] }) {
  const excluded = new Set(excludeIds)
  const list = useNftList({ page: 1, pageSize: 8, tab: 'all', sort: 'recent' })
  const items = (list.data?.items ?? []).filter((nft) => !excluded.has(nft.id)).slice(0, 5)

  if (!items.length) return null

  return (
    <section className="mt-24 hidden lg:block" aria-labelledby="cart-related-title">
      <h2 id="cart-related-title" className="text-[17px] font-bold text-amber">
        Colecionadores também viram
      </h2>
      <div className="mt-3 border-b border-copper/30" />
      <ul className="mt-8 grid grid-cols-5 gap-6">
        {items.map((nft) => (
          <li key={nft.id}>
            <Link to="/nft/$id" params={{ id: nft.id }} className="group block">
              <div className="grid aspect-[219/255] place-items-center bg-surface">
                <NftImage image={nft.image} sizes="220px" className="size-[88%] rounded-[17px] object-cover" />
              </div>
              <p className="mt-2 truncate text-[15px] text-cream group-hover:text-amber">{nft.name}</p>
              <p className="mt-2 text-base font-bold text-amber">{formatEth(nft.priceEth)}</p>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex justify-center gap-2" aria-hidden>
        <span className="size-3 rounded-full border border-copper" />
        <span className="size-3 rounded-full bg-copper" />
        <span className="size-3 rounded-full border border-copper" />
      </div>
    </section>
  )
}
