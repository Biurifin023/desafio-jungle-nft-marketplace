import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAddToCart } from '@/api/cart'
import { useNft, useRelatedNfts } from '@/api/nfts'
import { ArrowLeftIcon } from '@/components/icons'
import { ErrorState, errorMessage } from '@/components/common/QueryState'
import { NotFound } from '@/components/common/NotFound'
import { NftImage } from '@/components/common/NftImage'
import { isApiError } from '@/lib/http'
import { announce } from '@/lib/announce'
import { formatEth } from '@/lib/money'
import { usePageTitle } from '@/lib/use-page-title'
import { FavoriteButton } from './FavoriteButton'
import { NftDesktopPurchase, NftMobilePurchase } from './NftPurchase'
import { NftEditions } from './NftEditions'
import { NftGallery } from './NftGallery'
import { NftMeta, NftShare, NftStory } from './NftDetails'
import { NftRelated } from './NftRelated'
import { NftSkeleton } from './NftSkeleton'
import { NftStars } from './NftStars'
import { isEditionSoldOut } from './format'

export function NftDetailPage({ id }: { id: string }) {
  const nftQuery = useNft(id)
  const relatedQuery = useRelatedNfts(id)
  const addToCart = useAddToCart()
  const [editionId, setEditionId] = useState<string>()
  const [quantity, setQuantity] = useState(1)

  const nft = nftQuery.data
  const edition = useMemo(() => {
    if (!nft) return undefined
    return nft.editions.find((item) => item.id === (editionId ?? nft.defaultEditionId)) ?? nft.editions[0]
  }, [nft, editionId])
  const maxQuantity = edition ? Math.min(edition.available, edition.maxPerOrder) : 1
  const clampedQuantity = Math.min(Math.max(1, quantity), Math.max(1, maxQuantity))

  function selectEdition(nextId: string) {
    setEditionId(nextId)
    const next = nft?.editions.find((item) => item.id === nextId)
    if (!next) return
    const limit = Math.min(next.available, next.maxPerOrder)
    setQuantity((current) => Math.min(Math.max(1, current), Math.max(1, limit)))
  }

  usePageTitle(nft?.name, nft?.description)

  if (nftQuery.isPending) return <NftSkeleton />

  if (nftQuery.isError) {
    if (isApiError(nftQuery.error) && (nftQuery.error.status === 404 || nftQuery.error.code === 'not_found')) {
      return <NotFound title="NFT não encontrado" description="Este colecionável não existe ou foi removido do mercado." />
    }
    return (
      <div className="page-container py-16">
        <ErrorState error={nftQuery.error} onRetry={() => void nftQuery.refetch()} title="Não foi possível carregar o NFT" />
      </div>
    )
  }

  if (!nft || !edition) {
    return <NotFound title="NFT não encontrado" description="Este colecionável não existe ou foi removido do mercado." />
  }

  const allSoldOut = nft.editions.every(isEditionSoldOut)

  function buy() {
    if (!nft || !edition || isEditionSoldOut(edition) || allSoldOut) return
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity: clampedQuantity },
      {
        onSuccess: () => {
          announce(`${nft.name} adicionado ao carrinho`)
          toast.success('Adicionado ao carrinho')
        },
        onError: (error) => {
          const message = errorMessage(error, 'Não foi possível adicionar ao carrinho.')
          announce(message, 'assertive')
          toast.error(message)
        },
      },
    )
  }

  return (
    <article>
      <div className="lg:hidden">
        <div className="relative bg-[linear-gradient(180deg,#241612_0%,#2f1d15_100%)] px-7 pt-6 pb-16">
          <div className="mb-2 flex items-center justify-between">
            <Link
              to="/"
              aria-label="Voltar ao início"
              className="grid size-[35px] place-items-center rounded-full border border-border bg-surface-2 text-sand"
            >
              <ArrowLeftIcon aria-hidden className="size-5" />
            </Link>
            <FavoriteButton nftId={nft.id} variant="icon" />
          </div>
          <div className="mx-auto aspect-square w-full max-w-[361px] overflow-hidden rounded-3xl">
            <NftImage image={nft.image} sizes="(max-width: 414px) 86vw, 361px" priority className="size-full rounded-3xl" />
          </div>
        </div>
        <div className="-mt-8 rounded-t-[31px] bg-surface px-6 pt-8 pb-44">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-cream">{nft.name}</h1>
            <div className="shrink-0 rounded-full border border-copper px-2 py-1">
              <NftStars average={nft.rating.average} count={nft.rating.count} compact />
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-sand">{nft.description}</p>
          <div className="mt-6">
            <NftEditions editions={nft.editions} selectedId={edition.id} onSelect={selectEdition} />
          </div>
          <div className="mt-6">
            <NftMeta nft={nft} />
          </div>
          <div className="mt-10">
            <NftRelated
              items={relatedQuery.data}
              isPending={relatedQuery.isPending}
              isError={relatedQuery.isError}
              error={relatedQuery.error}
              onRetry={() => void relatedQuery.refetch()}
            />
          </div>
        </div>
        <NftMobilePurchase
          edition={edition}
          quantity={clampedQuantity}
          onQuantity={setQuantity}
          onBuy={buy}
          pending={addToCart.isPending}
          allSoldOut={allSoldOut}
        />
      </div>

      <div className="page-container hidden flex-col gap-24 py-8 lg:flex">
        <div className="flex flex-col gap-3">
          <nav aria-label="Trilha de navegação" className="text-[15px] font-bold text-cream">
            <Link to="/" className="transition-colors hover:text-amber">
              Início
            </Link>
            <span aria-hidden> / </span>
            <Link to="/" hash="catalogo" resetScroll={false} className="transition-colors hover:text-amber">
              Catálogo
            </Link>
            <span aria-hidden> / </span>
            <span aria-current="page" className="text-amber">
              {nft.name}
            </span>
          </nav>
          <div className="flex items-start gap-8">
            <NftGallery images={nft.gallery} name={nft.name} />
            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <div className="flex flex-col gap-3 border-b border-copper/30 pb-3">
                <h1 className="text-[28px] leading-[36.9px] font-bold text-cream">{nft.name}</h1>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[22px] font-bold text-amber">{formatEth(edition.priceEth)}</p>
                  <NftStars average={nft.rating.average} count={nft.rating.count} />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-[15px] font-bold text-cream">Sobre este NFT:</p>
                <p className="text-sm leading-6 text-sand">{nft.description}</p>
              </div>
              <NftEditions editions={nft.editions} selectedId={edition.id} onSelect={selectEdition} />
              <NftDesktopPurchase
                nftId={nft.id}
                edition={edition}
                quantity={clampedQuantity}
                onQuantity={setQuantity}
                onBuy={buy}
                pending={addToCart.isPending}
                allSoldOut={allSoldOut}
              />
              <NftMeta nft={nft} />
              <NftShare />
            </div>
          </div>
        </div>

        <NftStory nft={nft} />

        <NftRelated
          items={relatedQuery.data}
          isPending={relatedQuery.isPending}
          isError={relatedQuery.isError}
          error={relatedQuery.error}
          onRetry={() => void relatedQuery.refetch()}
        />
      </div>
    </article>
  )
}
