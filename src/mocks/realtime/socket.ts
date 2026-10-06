import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import type { RealtimeEvent } from '@/api/contracts'
import { db } from '../db/store'
import { registerRealtimeTransport } from './transport'

/**
 * O MSW remove o prefixo `/socket.io/` do pathname antes do match.
 * Por isso o link é `/` (e não `/socket.io/`). Conexões que não são Socket.IO
 * (ex.: HMR do Vite) são encaminhadas ao servidor real.
 */
const link = ws.link(/.*/)

type Client = {
  emit: (event: string, data: unknown) => void
  userId: string | null
  close: () => void
}

const clients = new Set<Client>()
let offline = false

function userIdFromUrl(raw: string | URL) {
  try {
    const url = typeof raw === 'string' ? new URL(raw, 'http://localhost') : raw
    const token = url.searchParams.get('token')
    if (!token) return null
    const session = db.get().sessions.find((s) => s.token === token && !s.revoked && Date.parse(s.expiresAt) > Date.now())
    return session?.userId ?? null
  } catch {
    return null
  }
}

function isSocketIo(raw: string | URL) {
  return String(raw).includes('socket.io')
}

function deliver(event: RealtimeEvent) {
  if (offline) return
  for (const client of clients) {
    if (event.type === 'order.updated' && event.userId !== client.userId) continue
    client.emit(event.type, event)
  }
}

registerRealtimeTransport({
  deliver,
  disconnectAll() {
    for (const client of [...clients]) client.close()
  },
  setOffline(value) {
    offline = value
    if (value) {
      for (const client of [...clients]) client.close()
    }
  },
  connections: () => clients.size,
})

export const realtimeHandlers = [
  link.addEventListener('connection', (connection) => {
    if (!isSocketIo(connection.client.url)) {
      connection.server.connect()
      return
    }
    if (offline) {
      connection.client.close()
      return
    }
    const io = toSocketIo(connection)
    const client: Client = {
      emit: (event, data) => io.client.emit(event, data),
      userId: userIdFromUrl(connection.client.url),
      close: () => connection.client.close(),
    }
    clients.add(client)
    connection.client.addEventListener('close', () => {
      clients.delete(client)
    })
  }),
]
