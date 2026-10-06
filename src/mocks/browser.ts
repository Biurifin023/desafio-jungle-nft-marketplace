import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { mockControl, resetMocks } from './control'
import { findScenario, scenarioState } from './scenarios'
import { settleDue } from './domain/orders'
import { db, MOCK_DB_KEY } from './db/store'

/**
 * Inicializa o MSW (Service Worker) e a API de controle `window.__mock`.
 * `?scenario=<id>` na URL troca o cenário e restaura as fixtures (estado conhecido).
 */
export async function startMocks() {
  const url = new URL(window.location.href)
  const requested = url.searchParams.get('scenario')
  if (requested && findScenario(requested)) {
    resetMocks(requested)
    url.searchParams.delete('scenario')
    window.history.replaceState(window.history.state, '', url)
  }

  window.addEventListener('storage', (e) => {
    if (e.key === MOCK_DB_KEY) db.reload()
  })

  const worker = setupWorker(...handlers)
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: !import.meta.env.DEV,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })

  window.__mock = mockControl
  // Pedidos pendentes que venceram enquanto a página estava fechada são concluídos agora.
  settleDue()
  if (import.meta.env.DEV) console.info(`[mocks] cenário ativo: ${scenarioState.activeId()}`)
}
