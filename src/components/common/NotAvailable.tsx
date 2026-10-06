import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

/**
 * Ações fora do escopo (páginas editoriais, suporte, atividade, ofertas, downloads, newsletter, login social…)
 * abrem este aviso em vez de aparentar sucesso funcional.
 */
const Ctx = createContext<(feature: string) => void>(() => undefined)

export function NotAvailableProvider({ children }: { children: ReactNode }) {
  const [feature, setFeature] = useState<string | null>(null)
  const open = useCallback((f: string) => setFeature(f), [])
  const value = useMemo(() => open, [open])
  return (
    <Ctx.Provider value={value}>
      {children}
      <Dialog open={feature !== null} onOpenChange={(o) => !o && setFeature(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Indisponível na demonstração</DialogTitle>
            <DialogDescription>
              <strong className="text-cream">{feature}</strong> não faz parte desta entrega. Nenhuma ação foi executada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setFeature(null)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  )
}

export const useNotAvailable = () => useContext(Ctx)

/** Botão com aparência de link para itens fora do escopo. */
export function NotAvailableLink({ feature, children, className }: { feature: string; children: ReactNode; className?: string }) {
  const open = useNotAvailable()
  return (
    <button type="button" className={className} onClick={() => open(feature)} aria-haspopup="dialog">
      {children}
    </button>
  )
}
