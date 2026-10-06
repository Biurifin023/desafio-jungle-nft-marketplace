import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FavoritesResponse } from './contracts'
import { qk } from './query-keys'
import { http, request } from '@/lib/http'
import { useSessionSnapshot } from '@/features/session/session-store'

export const favoritesApi = {
  list: (signal?: AbortSignal) => request(FavoritesResponse, { url: '/me/favorites', signal }),
  add: (nftId: string) => http.put(`/me/favorites/${encodeURIComponent(nftId)}`).then(() => undefined),
  remove: (nftId: string) => http.delete(`/me/favorites/${encodeURIComponent(nftId)}`).then(() => undefined),
}

export const favoritesQuery = (userId: string) =>
  queryOptions({
    queryKey: qk.favorites(userId),
    queryFn: ({ signal }) => favoritesApi.list(signal),
    staleTime: 60_000,
  })

export function useFavorites() {
  const snapshot = useSessionSnapshot()
  const userId = snapshot.status === 'authenticated' ? snapshot.user.id : null
  return useQuery({ ...favoritesQuery(userId ?? 'anonymous'), enabled: Boolean(userId) })
}

/**
 * Favoritar/desfavoritar com atualização otimista: a lista muda na hora e,
 * em caso de falha, volta ao estado anterior (rollback) e o servidor é reconsultado.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const snapshot = useSessionSnapshot()
  const userId = snapshot.status === 'authenticated' ? snapshot.user.id : 'anonymous'
  const key = qk.favorites(userId)

  return useMutation({
    mutationKey: ['favorites', 'toggle', userId],
    mutationFn: ({ nftId, favorite }: { nftId: string; favorite: boolean }) =>
      favorite ? favoritesApi.add(nftId) : favoritesApi.remove(nftId),
    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<FavoritesResponse>(key)
      const ids = new Set(previous?.nftIds ?? [])
      if (favorite) ids.add(nftId)
      else ids.delete(nftId)
      queryClient.setQueryData<FavoritesResponse>(key, { nftIds: [...ids] })
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
