import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/dev/mocks')({
  staticData: { title: 'Controle dos mocks', mobileChrome: 'none' },
  component: MocksPage,
})

function MocksPage() {
  const control = typeof window !== 'undefined' ? window.__mock : undefined
  const [scenario, setScenario] = useState(control?.scenario() ?? '—')
  const [message, setMessage] = useState('')

  if (!control) {
    return (
      <section className="page-container py-16">
        <h1 className="text-2xl font-bold">Mocks desligados</h1>
        <p className="mt-2 text-sand">Defina VITE_ENABLE_MOCKS=true para ativar esta página.</p>
      </section>
    )
  }

  return (
    <section className="page-container py-12" aria-labelledby="mocks-title">
      <h1 id="mocks-title" className="text-2xl font-bold text-cream">
        Cenários MSW
      </h1>
      <p className="mt-2 text-sm text-sand">
        Cenário ativo: <strong className="text-amber">{scenario}</strong>
      </p>
      {message ? (
        <p role="status" className="mt-2 text-sm text-success">
          {message}
        </p>
      ) : null}
      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        {control.scenarios.map((s) => (
          <li key={s.id} className="rounded-md bg-surface p-4">
            <p className="font-bold text-cream">{s.label}</p>
            <p className="mt-1 text-sm text-sand">{s.description}</p>
            <Button
              className="mt-3"
              size="sm"
              onClick={() => {
                control.setScenario(s.id)
                setScenario(s.id)
                setMessage(`Cenário ${s.id} selecionado. Recarregue para aplicar o reset completo.`)
              }}
            >
              Ativar
            </Button>
          </li>
        ))}
      </ul>
      <Button
        className="mt-8"
        variant="outline"
        onClick={() => {
          control.reset('default')
          window.location.assign('/')
        }}
      >
        Resetar fixtures e voltar ao início
      </Button>
    </section>
  )
}
