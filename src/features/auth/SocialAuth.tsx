import { FacebookColorIcon, GoogleColorIcon } from '@/components/icons'
import { NotAvailableLink } from '@/components/common/NotAvailable'
import { cn } from '@/lib/utils'

const socialBtn =
  'flex h-10 w-full items-center justify-center gap-3 rounded-sm border border-input text-[13px] font-medium text-sand transition-colors hover:border-copper hover:text-cream'

export function SocialAuth() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <p className="text-[13px] text-cream">Ou continue com</p>
        <span className="h-px flex-1 bg-border" />
      </div>
      <NotAvailableLink feature="Continuar com Google" className={cn(socialBtn, 'cursor-pointer')}>
        <GoogleColorIcon aria-hidden className="size-5" />
        Continuar com Google
      </NotAvailableLink>
      <NotAvailableLink feature="Continuar com Facebook" className={cn(socialBtn, 'cursor-pointer')}>
        <FacebookColorIcon aria-hidden className="size-5" />
        Continuar com Facebook
      </NotAvailableLink>
    </div>
  )
}
