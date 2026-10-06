import { Outlet, useMatches } from '@tanstack/react-router'
import { Header } from './Header'
import { Footer } from './Footer'
import { MobileTabBar } from './MobileChrome'
import { SessionBanner } from '@/features/session/SessionBanner'
import { LiveRegion } from '@/components/common/LiveRegion'
import { NotAvailableProvider } from '@/components/common/NotAvailable'
import { Toaster } from '@/components/ui/sonner'
import { usePageTitle } from '@/lib/use-page-title'
import { cn } from '@/lib/utils'

export function AppShell() {
  const matches = useMatches()
  const title = [...matches].reverse().find((m) => m.staticData?.title)?.staticData.title
  const chrome = [...matches].reverse().find((m) => m.staticData?.mobileChrome)?.staticData.mobileChrome
  usePageTitle(title)

  return (
    <NotAvailableProvider>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-copper focus:px-3 focus:py-2 focus:text-ink">
        Pular para o conteúdo
      </a>
      <LiveRegion />
      <SessionBanner />
      <Header />
      <main id="conteudo" className={cn('min-h-[50vh]', chrome !== 'none' && 'pb-28 lg:pb-0')}>
        <Outlet />
      </main>
      <Footer />
      <MobileTabBar />
      <Toaster position="top-right" />
    </NotAvailableProvider>
  )
}
