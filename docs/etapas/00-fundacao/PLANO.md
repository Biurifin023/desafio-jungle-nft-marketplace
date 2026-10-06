# Etapa 0 — Fundação

## Escopo

Scaffold da stack obrigatória, tokens do Figma, contratos, mock DB, cenários MSW, layout, sessão, stubs de rotas, Playwright e documentação.

## Requisitos cobertos

Seções 2, 4 (base), 5, 6 (handlers e cenários), 8 (tokens, layout, a11y de chrome), 12 (docs parciais).

## Arquivos previstos

`src/api/**`, `src/mocks/**`, `src/routes/**`, `src/components/layout/**`, `playwright.config.ts`, `e2e/00-fundacao`, `docs/contratos/**`.

## Testes

Smoke: app sobe, 404, checkout redireciona para login.

## Aceite

`pnpm typecheck`, `pnpm lint` e `pnpm test:e2e` (smoke) passam. Mocks ligados por `VITE_ENABLE_MOCKS=true`.
