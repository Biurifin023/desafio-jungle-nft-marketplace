# Kurio — NFT Marketplace

Entrega do desafio frontend (React, TypeScript, TanStack Router/Query, Axios, MSW, Socket.IO, Tailwind, shadcn/ui, Playwright).

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev:mocks
```

Abra http://localhost:5173.

## Credenciais fictícias

- `ana@kurio.dev` / `Kurio@2026`
- `bruno@kurio.dev` / `Kurio@2026`

Cupom válido: `KURIO10`. Expirado: `GENESIS`.

## Comandos

| Comando | Uso |
| --- | --- |
| `pnpm dev:mocks` | Desenvolvimento com MSW |
| `pnpm typecheck` | TypeScript |
| `pnpm lint` | ESLint |
| `pnpm test:e2e` | Playwright |
| `pnpm build:demo` | Build com mocks (demonstração) |

Cenários: `/dev/mocks` ou `?scenario=slow`. Reset: `window.__mock.reset('default')`.

Documentação por etapa em `docs/etapas/`. Contratos em `docs/contratos/`.
