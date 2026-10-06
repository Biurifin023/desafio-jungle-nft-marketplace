import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSessionSnapshot } from '@/features/session/session-store'
import { connectSocket, disconnectSocket, onRealtimeEvent, onSocketLifecycle } from '@/lib/socket'
import { applyRealtimeEvent } from './apply-event'

/**
 * Conecta o cliente Socket.IO à sessão atual e aplica eventos no cache.
 * Duplicatas (`eventId`) e versões antigas são ignoradas.
 * Após reconexão, as queries ativas são reconciliadas via REST.
 */
export function useRealtime() {
  const queryClient = useQueryClient()
  const snapshot = useSessionSnapshot()
  const token = snapshot.status === 'authenticated' ? snapshot.token : 'anonymous'

  useEffect(() => {
    connectSocket()
    return () => disconnectSocket()
  }, [token])

  useEffect(() => {
    const seen = new Set<string>()
    const versions = new Map<string, number>()

    const offEvent = onRealtimeEvent((event) => {
      if (seen.has(event.eventId)) return
      seen.add(event.eventId)
      const key = `${event.resource.type}:${event.resource.id}`
      const last = versions.get(key) ?? 0
      if (event.version <= last) return
      versions.set(key, event.version)
      applyRealtimeEvent(queryClient, event)
    })

    const offLife = onSocketLifecycle((life) => {
      if (life.type === 'reconnected') {
        void queryClient.invalidateQueries()
      }
    })

    return () => {
      offEvent()
      offLife()
    }
  }, [queryClient])
}
