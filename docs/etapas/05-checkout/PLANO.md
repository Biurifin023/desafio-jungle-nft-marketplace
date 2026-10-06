# Etapa 5 — Pagamento e confirmação

Worktree: `../desafio-jungle-wt/e5-checkout` · branch `feat/e5-checkout`

## Escopo

Frames Pagamento e Confirmação. Carteiras vêm das fixtures (Ana/Bruno já têm primary/secondary).

- Formulário `CollectorDetails` (rascunho em `kurio.checkoutDraft`)
- Seleção de carteira + rede; `accountApi.connectWallet` (recusa no cenário `wallet-rejected`)
- Revalidar cotação (`cartApi.refreshQuote`) antes de confirmar; mudança → nova confirmação
- `Idempotency-Key` em `sessionStorage` (`kurio.checkoutAttempt`)
- Botão travado no submit; timeout reutiliza a chave (cenário `order-timeout`)
- Estados pending/confirmed/declined; confirmado/recusado terminais
- Sessão expirada preserva o rascunho
- `/orders/$id` só renderiza recibo se `status === 'confirmed'`
- Snapshot imutável; após confirmado, remove do carrinho só o comprado (já no mock de orders)

## Testes — `e2e/05-checkout/`

6. Catálogo → recibo confirmado
7. `payment-declined`, clique repetido, `order-timeout` recupera o mesmo id

## Aceite

`pnpm typecheck && pnpm lint && pnpm test:e2e -- e2e/00-fundacao e2e/05-checkout`
