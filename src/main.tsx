import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/roboto-mono/wght.css'
import '@/styles/index.css'

const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS === 'true'

async function bootstrap() {
  if (mocksEnabled) {
    const { startMocks } = await import('@/mocks/browser')
    const ready = startMocks()
    window.__mockReady = ready
    await ready
  }
  // App (e o socket.io-client) só carregam depois do MSW patchar `WebSocket`.
  const { AppProviders } = await import('@/app/providers')
  const root = document.getElementById('root')
  if (!root) throw new Error('Elemento #root ausente')
  createRoot(root).render(
    <StrictMode>
      <AppProviders />
    </StrictMode>,
  )
}

void bootstrap()
