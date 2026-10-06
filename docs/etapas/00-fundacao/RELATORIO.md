# Relatório — Etapa 0 Fundação

## O que foi feito

- Scaffold Vite + React + TypeScript + Tailwind v4 + shadcn/ui.
- Tokens do Figma em `src/styles/tokens.css` (Roboto Mono auto-hospedada).
- Contratos Zod + clientes Axios + hooks TanStack Query para todos os recursos.
- Mock DB persistido, fixtures (~60 NFTs, 2 usuários, cupons, carteiras), cenários e handlers MSW.
- Layout (header desktop, footer, tab bar mobile), sessão, merge do carrinho no login, stubs de rotas.
- Playwright: projetos desktop 1440 e mobile 390; smoke da fundação.

## Política de cache

Documentada em `src/app/query-client.ts`: retry só em erros `retryable`; mutations sem retry; catálogo stale 30–60 s; carrinho/cotação stale 0; refetch on focus/reconnect.

## Playwright

```
pnpm test:e2e -- e2e/00-fundacao
6 passed (chromium-desktop + chromium-mobile)
```

Relatório HTML: `playwright-report/index.html`.

## Limitações

- Extração automática completa do Figma ainda depende de token/edição; tokens e frames vieram da coleta em `docs/design-metricas` e `docs/figma/`.
- Telas de produto são stubs até as etapas 1–6.
- Socket.IO é no-op até a Etapa 7.
