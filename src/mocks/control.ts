import type { MockControl } from '@/types/mock-control'
import type { RealtimeEvent } from '@/api/contracts'
import { db } from './db/store'
import { networkState } from './network'
import { SCENARIOS, scenarioState, type ScenarioOverrides } from './scenarios'
import { realtimeBus } from './realtime/bus'
import { realtimeTransport } from './realtime/transport'
import { updateNft } from './domain/catalog'
import { ordersState, settleOrder } from './domain/orders'

/** Chaves do cliente limpas no reset (sessão, carrinho do visitante, rascunhos de checkout). */
const CLIENT_KEYS_PREFIX = 'kurio.'
const MOCK_KEYS = ['kurio.mock.db', 'kurio.mock.scenario', 'kurio.mock.overrides']

function clearClientState() {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of Object.keys(storage)) {
      if (key.startsWith(CLIENT_KEYS_PREFIX) && !MOCK_KEYS.includes(key)) storage.removeItem(key)
    }
  }
}

export function resetMocks(scenarioId = 'default') {
  ordersState.reset()
  networkState.reset()
  realtimeBus.reset()
  scenarioState.set(scenarioId)
  db.reset()
  clearClientState()
}

export const mockControl: MockControl = {
  scenarios: SCENARIOS.map(({ id, label, description }) => ({ id, label, description })),
  scenario: () => scenarioState.activeId(),
  setScenario: (id) => {
    scenarioState.set(id)
    networkState.reset()
  },
  configure: (overrides) => scenarioState.override(overrides as ScenarioOverrides),
  failNext: (rule) => networkState.addFailure(rule),
  reset: (scenarioId) => resetMocks(scenarioId),
  state: () => structuredClone(db.get()),
  updateNft: (nftId, patch) => {
    const event = updateNft(nftId, patch)
    return { eventId: event.eventId, version: event.version }
  },
  expireSessions: () =>
    db.mutate((s) => {
      const past = new Date(Date.now() - 1000).toISOString()
      s.sessions.forEach((x) => (x.expiresAt = past))
    }),
  settleOrder: (orderId, outcome) => void settleOrder(orderId, outcome),
  realtime: {
    replay: (eventId) => void realtimeBus.replay(eventId),
    emitRaw: (event) => realtimeTransport.deliver(event as RealtimeEvent),
    history: () => realtimeBus.history().map((e) => ({ eventId: e.eventId, type: e.type, version: e.version, resource: { id: e.resource.id } })),
    disconnect: () => realtimeTransport.disconnectAll(),
    setOffline: (offline) => realtimeTransport.setOffline(offline),
    connections: () => realtimeTransport.connections(),
  },
}
