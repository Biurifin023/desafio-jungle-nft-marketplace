import { Link, useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { CloseIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { MarketplaceBackdrop } from './MarketplaceBackdrop'
import { SocialAuth } from './SocialAuth'
import { useDesktopAuth } from './use-desktop'

export type AuthMode = 'login' | 'register'

const COPY: Record<
  AuthMode,
  { title: string; mobileTitle: string; description: string; switchHint: string; switchLabel: string; switchTo: '/login' | '/register' }
> = {
  login: {
    title: 'Entrar',
    mobileTitle: 'Entrar',
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
    switchHint: 'Novo na Kurio?',
    switchLabel: 'Crie uma conta',
    switchTo: '/register',
  },
  register: {
    title: 'Criar conta',
    mobileTitle: 'Criar perfil de colecionador',
    description: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
    switchHint: 'Já tem uma conta?',
    switchLabel: 'Entre',
    switchTo: '/login',
  },
}

function ModeTabs({ mode, redirect }: { mode: AuthMode; redirect?: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Link
        to="/login"
        search={{ redirect }}
        className={cn('text-xl font-medium', mode === 'login' ? 'text-amber' : 'text-cream')}
        aria-current={mode === 'login' ? 'page' : undefined}
      >
        Entrar
      </Link>
      <span aria-hidden className="h-5 w-px bg-coral" />
      <Link
        to="/register"
        search={{ redirect }}
        className={cn('text-xl font-medium', mode === 'register' ? 'text-amber' : 'text-cream')}
        aria-current={mode === 'register' ? 'page' : undefined}
      >
        Criar conta
      </Link>
    </div>
  )
}

export function AuthChrome({
  mode,
  redirect,
  children,
}: {
  mode: AuthMode
  redirect?: string
  children: ReactNode
}) {
  const desktop = useDesktopAuth()
  const navigate = useNavigate()
  const copy = COPY[mode]

  if (desktop) {
    return (
      <>
        <MarketplaceBackdrop />
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) void navigate({ to: '/' })
          }}
        >
          <DialogContent
            showCloseButton={false}
            data-testid="auth-modal"
            className="w-[500px] max-w-[500px] gap-0 overflow-hidden rounded-lg border-0 border-b-[10px] border-b-copper bg-surface p-0 sm:max-w-[500px]"
          >
            <button
              type="button"
              onClick={() => void navigate({ to: '/' })}
              className="absolute top-[11px] right-[11px] grid size-[18px] place-items-center text-copper hover:text-amber"
              aria-label="Fechar"
            >
              <CloseIcon aria-hidden className="size-3" />
            </button>
            <div className="flex flex-col items-center px-12 pt-12">
              <ModeTabs mode={mode} redirect={redirect} />
              <DialogTitle className="sr-only">{copy.title}</DialogTitle>
              <DialogDescription className="mt-10 max-w-[404px] text-center text-[13px] leading-4 text-cream">
                {copy.description}
              </DialogDescription>
            </div>
            <div className="flex flex-col gap-6 px-20 pt-6 pb-6">
              {children}
              <SocialAuth />
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <section className="mx-auto flex min-h-[100dvh] w-full max-w-[414px] flex-col px-7 pt-20 pb-6" data-testid="mobile-auth">
      <p className="flex h-[136px] items-center justify-center text-[32px] leading-[42px] font-bold tracking-[0.1em] text-cream">
        KURIO
      </p>
      <h1 className="text-center text-xl font-bold text-cream">{copy.mobileTitle}</h1>
      <div className="mt-10 flex flex-col gap-10">
        {children}
        <SocialAuth />
      </div>
      <p className="mt-10 text-center text-[15px] text-sand">
        {copy.switchHint}{' '}
        <Link to={copy.switchTo} search={{ redirect }} className="text-sand underline-offset-4 hover:text-amber hover:underline">
          {copy.switchLabel}
        </Link>
      </p>
    </section>
  )
}
