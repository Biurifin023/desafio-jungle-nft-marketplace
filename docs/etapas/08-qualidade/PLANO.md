# Etapa 8 — Qualidade, auditoria e deploy

Worktree: `../desafio-jungle-wt/e8-qualidade` · branch `feat/e8-qualidade`

## Escopo

- Teste 11: teclado, foco, drawers, validação
- Regressão visual: início, detalhe, carrinho, pagamento (cenário `fast`, relógio fixo)
- Viewports 390, 768, 1440 + zoom 200%
- Lighthouse 3× início/detalhe mobile+desktop; mediana; metas 90/95/95/90
- `README.md`, `ARCHITECTURE.md`, `vercel.json`
- Checkout limpo: `pnpm install --frozen-lockfile && pnpm typecheck && pnpm test:e2e`

## Aceite

Relatórios em `docs/lighthouse/`. Deploy e remoto exigem login do usuário.
