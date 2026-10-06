import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/roboto-mono/wght.css'
import '@/styles/index.css'
import { AppProviders } from '@/app/providers'

const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS === 'true'

async function bootstrap() {
  if (mocksEnabled) {
    const { startMocks } = await import('@/mocks/browser')
    const ready = startMocks()
    window.__mockReady = ready
    await ready
  }
  const root = document.getElementById('root')
  if (!root) throw new Error('Elemento #root ausente')
  createRoot(root).render(
    <StrictMode>
      <AppProviders />
    </StrictMode>,
  )
}

void bootstrap()
