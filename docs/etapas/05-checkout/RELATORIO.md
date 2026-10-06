# Relatório — Etapa 5 Checkout

## O que foi feito

- `CheckoutPage` com `CollectorDetails`, rascunho em `kurio.checkoutDraft`, carteira/rede e revisão da cotação.
- Conexão simulada (`POST /wallet-connections`) e `Idempotency-Key` em `kurio.checkoutAttempt`.
- `quote_stale` e timeout pedem nova confirmação sem duplicar o pedido.
- `OrderPage` para pending / confirmed / declined; recibo só quando `confirmed`.
- O rascunho é salvo via `form.subscribe` do react-hook-form (compatível com o React Compiler).

## Playwright

`e2e/05-checkout`: testes 6 e 7 (compra completa do catálogo ao recibo, recusa mantendo o carrinho, clique repetido com um único pedido, timeout recuperando o mesmo `order id`) e sessão expirada no meio do checkout (rascunho e carrinho preservados, retomada após novo login). São 5 testes × 2 projetos, todos verdes.
