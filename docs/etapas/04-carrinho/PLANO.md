# Etapa 4 — Carrinho

Worktree: `../desafio-jungle-wt/e4-carrinho` · branch `feat/e4-carrinho`

## Escopo

Frames Carrinho desktop/mobile. `useCart`, `useQuote`, mutations da fundação.

- Quantidade limitada por `available`/`maxPerOrder`
- Remoção, cupom `KURIO10` (ok), `FOO` (inválido), `GENESIS` (expirado)
- Resumo da cotação: subtotal, desconto, taxa de rede, total (`formatEth`)
- Visitante persistido (`X-Guest-Cart`); merge no login (já na fundação)
- Skeleton no resumo
- CTA para `/checkout` (pede auth)

## Testes — `e2e/04-carrinho/`

5. Add (via API ou detalhe se E2 já merged — senão usar `fetch /api/cart/items` + reload), qty, remover, cupom, refresh
12. Skeleton `slow` no resumo

## Aceite

`pnpm typecheck && pnpm lint && pnpm test:e2e -- e2e/00-fundacao e2e/04-carrinho`
