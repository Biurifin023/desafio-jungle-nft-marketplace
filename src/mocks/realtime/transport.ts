import type { RealtimeEvent } from '@/api/contracts'

/**
 * Ponto de extensão do transporte Socket.IO dos mocks.
 * A Etapa 7 (tempo real) registra aqui a implementação baseada em @mswjs/socket.io-binding.
 * Até lá, as operações são no-op e os eventos ficam apenas no histórico do barramento.
 */
export interface RealtimeTransport {
  deliver(event: RealtimeEvent): void
  disconnectAll(): void
  setOffline(offline: boolean): void
  connections(): number
}

const noop: RealtimeTransport = {
  deliver: () => undefined,
  disconnectAll: () => undefined,
  setOffline: () => undefined,
  connections: () => 0,
}

let impl: RealtimeTransport = noop

export const realtimeTransport: RealtimeTransport = {
  deliver: (e) => impl.deliver(e),
  disconnectAll: () => impl.disconnectAll(),
  setOffline: (o) => impl.setOffline(o),
  connections: () => impl.connections(),
}

export function registerRealtimeTransport(next: RealtimeTransport) {
  impl = next
}
