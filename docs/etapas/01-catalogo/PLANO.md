# Etapa 1 — Início e catálogo

Worktree: `../desafio-jungle-wt/e1-catalogo` · branch `feat/e1-catalogo`

## Escopo

Tela Início desktop (1440) e mobile (414/390), fiel ao Figma (`docs/figma/frames/desktop-inicio.txt`, `mobile-inicio.txt`).

- Hero/destaques (`GET /nfts/featured`)
- Grid 3×3 desktop / 2 colunas mobile
- Busca, filtros combináveis (coleções/categorias, faixa de preço, rede), ordenação, tabs (Todos / Novos / Em alta), paginação
- Estado na URL via `validateSearch` + `parseNftSearch` (`src/features/catalog/search-params.ts`)
- Mudança de filtro zera `page` para 1
- Vazio, erro + retry, `keepPreviousData` + `signal` (já no `nftListQuery`)
- Skeleton shimmer no grid/hero
- Drawer de filtros no mobile com foco preso (`Sheet`)
- Cards navegam para `/nft/$id`
- Background refresh (`BackgroundRefresh`)
- Seções Promos/Blog do Figma: links `NotAvailableLink`

## Não fazer

Não implementar detalhe, auth, carrinho. Não inventar dados fora do MSW.

## Testes Playwright — `e2e/01-catalogo/`

1. Busca `q` altera a URL e os resultados
2. Filtros combinados (categoria + rede) e reset de página
3. Ordenação `price-asc` / `price-desc`
4. Paginação e botão voltar do histórico restaura a query
5. Cenário `empty` mostra estado vazio
6. Cenário `slow` mostra skeleton; `server-error` mostra erro; retry com `flaky` recupera

Rodar: `pnpm typecheck && pnpm lint && pnpm test:e2e -- e2e/00-fundacao e2e/01-catalogo`

## Aceite visual

390, 768, 1440 sem overflow. Tokens de `src/styles/tokens.css`. Roboto Mono. Cards com preço `formatEth`.
