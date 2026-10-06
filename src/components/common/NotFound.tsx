import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/lib/use-page-title'

export function NotFound({ title = 'Página não encontrada', description }: { title?: string; description?: string }) {
  usePageTitle(title)
  return (
    <section className="page-container flex flex-col items-center gap-4 py-24 text-center" aria-labelledby="not-found-title">
      <p className="text-sm font-bold tracking-[0.1em] text-amber">ERRO 404</p>
      <h1 id="not-found-title" className="text-3xl font-bold text-cream">
        {title}
      </h1>
      <p className="max-w-md text-sand">{description ?? 'O endereço acessado não existe ou foi removido.'}</p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </section>
  )
}
