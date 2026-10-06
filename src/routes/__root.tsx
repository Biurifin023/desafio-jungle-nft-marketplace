import { createRootRouteWithContext, HeadContent } from '@tanstack/react-router'
import type { RouterContext } from '@/app/router'
import { AppShell } from '@/components/layout/AppShell'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
})

function Root() {
  return (
    <>
      <HeadContent />
      <AppShell />
    </>
  )
}
