# Etapa 2 — Detalhe do NFT e favoritos

Worktree: `../desafio-jungle-wt/e2-detalhe` · branch `feat/e2-detalhe`

## Escopo

Tela Detalhes desktop/mobile (`docs/figma/frames/desktop-detalhes-do-nft.txt`, `mobile-detalhes-do-nft.txt`).

- Galeria + `NftImage` com dimensões fixas (sem CLS)
- Informações, criador, atributos, contrato
- Seletor de edição, quantidade limitada por `available` e `maxPerOrder`
- `useAddToCart` da fundação
- Favorito com `useToggleFavorite` (otimista + rollback). Visitante → `/login?redirect=…`
- 404 para NFT inexistente (`NotFound`)
- Edição esgotada (`Onyx Phantom #013`)
- Relacionados
- Skeleton no detalhe
- Lista `/favorites` (rota stub já existe)

## Testes — `e2e/02-detalhe/`

2. Acesso direto `/nft/emerald-ape-042`; `/nft/nao-existe` → 404
4. Favoritar autenticado; cenário `favorites-fail` faz rollback
12. Skeleton no cenário `slow`

## Aceite

`pnpm typecheck && pnpm lint && pnpm test:e2e -- e2e/00-fundacao e2e/02-detalhe`
