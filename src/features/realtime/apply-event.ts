import type { QueryClient } from '@tanstack/react-query'
import type { FeaturedResponse, Nft, NftListResponse, NftSummary, NftUpdatedEvent, Order, RealtimeEvent } from '@/api/contracts'
import { qk } from '@/api/query-keys'
import { announce } from '@/lib/announce'

function patchSummary(item: NftSummary, event: NftUpdatedEvent): NftSummary {
  if (item.id !== event.resource.id || item.version >= event.version) return item
  return { ...item, priceEth: event.data.priceEth, available: event.data.available, version: event.version }
}

function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent) {
  queryClient.setQueriesData<NftListResponse>({ queryKey: qk.nfts.lists() }, (old) => {
    if (!old) return old
    return { ...old, items: old.items.map((item) => patchSummary(item, event)) }
  })

  queryClient.setQueryData<Nft>(qk.nfts.detail(event.resource.id), (old) => {
    if (!old || old.version >= event.version) return old
    return {
      ...old,
      priceEth: event.data.priceEth,
      available: event.data.available,
      version: event.version,
      editions: old.editions.map((edition) => {
        const next = event.data.editions.find((e) => e.id === edition.id)
        return next ? { ...edition, priceEth: next.priceEth, available: next.available } : edition
      }),
    }
  })

  queryClient.setQueryData<FeaturedResponse>(qk.nfts.featured(), (old) => {
    if (!old) return old
    return {
      ...old,
      hero: old.hero.map((item) => patchSummary(item, event)),
      spotlight: patchSummary(old.spotlight, event),
    }
  })

  void queryClient.invalidateQueries({ queryKey: ['cart'] })
  void queryClient.invalidateQueries({ queryKey: ['quote'] })

  const message =
    event.data.reason === 'price_changed'
      ? 'O preço de um colecionável mudou. Revise a cotação antes de confirmar.'
      : 'A disponibilidade de um colecionável mudou. Revise a cotação antes de confirmar.'
  announce(message, 'assertive')
}

function applyOrderUpdated(queryClient: QueryClient, event: Extract<RealtimeEvent, { type: 'order.updated' }>) {
  queryClient.setQueriesData<Order>(
    { predicate: (query) => query.queryKey[2] === 'orders' && query.queryKey[3] === event.resource.id },
    (old) => {
      if (!old || old.version >= event.version) return old
      return {
        ...old,
        status: event.data.status,
        transaction: event.data.transaction,
        failureReason: event.data.failureReason,
        version: event.version,
      }
    },
  )
  void queryClient.invalidateQueries({ queryKey: ['cart'] })
  void queryClient.invalidateQueries({ queryKey: ['quote'] })

  if (event.data.status === 'confirmed') announce('Pedido confirmado')
  if (event.data.status === 'declined') announce(event.data.failureReason ?? 'Pagamento recusado', 'assertive')
}

export function applyRealtimeEvent(queryClient: QueryClient, event: RealtimeEvent) {
  if (event.type === 'nft.updated') applyNftUpdated(queryClient, event)
  if (event.type === 'order.updated') applyOrderUpdated(queryClient, event)
}
