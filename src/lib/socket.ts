import { io, type Socket } from 'socket.io-client'
import { RealtimeEvent, type RealtimeEvent as RealtimeEventType } from '@/api/contracts'
import { sessionStore } from '@/features/session/session-store'

export type SocketLifecycle = { type: 'connected' | 'disconnected' | 'reconnected' }

type EventListener = (event: RealtimeEventType) => void
type LifeListener = (event: SocketLifecycle) => void

let socket: Socket | null = null
const eventListeners = new Set<EventListener>()
const lifeListeners = new Set<LifeListener>()
let hadConnection = false

function markSocketState(state: { connected: boolean; error?: string }) {
  if (typeof window !== 'undefined') window.__kurioSocket = state
}

export function getSocket() {
  return socket
}

export function connectSocket() {
  disconnectSocket()
  markSocketState({ connected: false, error: 'connecting' })
  const token = sessionStore.token()
  socket = io({
    path: '/socket.io',
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionDelay: 400,
    reconnectionAttempts: Infinity,
  })

  socket.on('connect', () => {
    const type = hadConnection ? 'reconnected' : 'connected'
    hadConnection = true
    markSocketState({ connected: true })
    lifeListeners.forEach((listener) => listener({ type }))
  })
  socket.on('connect_error', (error) => {
    markSocketState({ connected: false, error: error.message })
  })
  socket.on('disconnect', () => {
    markSocketState({ connected: false })
    lifeListeners.forEach((listener) => listener({ type: 'disconnected' }))
  })
  socket.on('nft.updated', (payload: unknown) => dispatch(payload))
  socket.on('order.updated', (payload: unknown) => dispatch(payload))
}

function dispatch(payload: unknown) {
  const parsed = RealtimeEvent.safeParse(payload)
  if (!parsed.success) return
  eventListeners.forEach((listener) => listener(parsed.data))
}

/** Encerra a conexão atual e impede que listeners da sessão anterior recebam eventos. */
export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  hadConnection = false
}

export function onRealtimeEvent(listener: EventListener) {
  eventListeners.add(listener)
  return () => {
    eventListeners.delete(listener)
  }
}

export function onSocketLifecycle(listener: LifeListener) {
  lifeListeners.add(listener)
  return () => {
    lifeListeners.delete(listener)
  }
}
