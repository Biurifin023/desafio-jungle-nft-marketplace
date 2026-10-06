import type { RealtimeEvent } from '@/api/contracts'

/**
 * Barramento de eventos dos mocks. Toda mutação do "banco" que afeta um NFT ou pedido
 * publica aqui; o transporte Socket.IO (src/mocks/realtime/socket.ts) entrega aos clientes.
 * O histórico permite reenviar eventos (duplicatas/antigos) nos testes.
 */
type Subscriber = (event: RealtimeEvent) => void
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
export type EventDraft = DistributiveOmit<RealtimeEvent, 'eventId' | 'occurredAt'> & { eventId?: string }

const subscribers = new Set<Subscriber>()
const history: RealtimeEvent[] = []
let counter = 0

export const realtimeBus = {
  publish(event: EventDraft) {
    const full = {
      ...event,
      eventId: event.eventId ?? `evt_${Date.now().toString(36)}_${++counter}`,
      occurredAt: new Date().toISOString(),
    } as RealtimeEvent
    history.push(full)
    if (history.length > 200) history.shift()
    subscribers.forEach((s) => s(full))
    return full
  },
  /** Reentrega um evento já publicado (simula duplicata). */
  replay(eventId: string) {
    const event = history.find((e) => e.eventId === eventId)
    if (event) subscribers.forEach((s) => s(event))
    return event
  },
  history: () => [...history],
  subscribe(fn: Subscriber) {
    subscribers.add(fn)
    return () => subscribers.delete(fn)
  },
  reset() {
    history.length = 0
  },
}
