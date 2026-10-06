# Relatório — Etapa 1 Catálogo

Worktree: `desafio-jungle-wt/e1-catalogo` · branch `feat/e1-catalogo`

## O que foi feito

- Home completa em `src/routes/index.tsx` (`validateSearch: parseNftSearch` e `staticData` mantidos).
- Componentes em `src/features/catalog/`: hero (`GET /nfts/featured`), filtros, toolbar/tabs, grid, paginação, promos e blog.
- Dados só via `useNftList` / `useFeatured`. Sem `page.route` nos testes.

### Desktop 1440

- Hero 1200×450, sidebar 310px (Coleções, faixa 0,02–12,30 ETH, Rede), grid 3 colunas, sort, paginação 9/página.
- Spotlight, Promos e Diário da Cunhagem; CTAs editoriais com `NotAvailableLink`.

### Mobile 390

- `MobileTopBar` + `Sheet` de filtros (foco preso pelo Dialog/Radix).
- Grid 2 colunas, tabs Todos / Novos / Em alta; sort no drawer.

### URL e estados

- Query: `q`, `categories`, `networks`, `minPrice`, `maxPrice`, `tab`, `sort`, `page`.
- Mudança de filtro/aba/ordenação/busca zera `page` para 1. Histórico do browser restaura a query.
- Skeleton (`slow`), vazio (`empty`), erro + retry (`server-error` → `flaky`), `BackgroundRefresh` quando `isFetching` com dados.
- Cards: nome, `formatEth`, `compareAt` riscado, badge RARO, link `/nft/$id`.

## Desvios

- Copy mobile do hero segue o Figma (“SEJA DONO DA CULTURA DIGITAL”); o desktop mantém “SEJA DONO DO FUTURO…”. O smoke da fundação aceita `/seja dono/i`.
- Blog é conteúdo editorial do frame (não vem da API); links usam `NotAvailableLink`.
- Favoritar no card mobile é só visual (Etapa 2).
- `overflow-x: clip` em `html`/`body` e tabs `justify-between` para caber em 390 sem overflow.

## Verificações

| Comando | Resultado |
| --- | --- |
| `pnpm typecheck` | **pass** |
| `pnpm lint` | **pass** |
| `pnpm test:e2e -- e2e/00-fundacao e2e/01-catalogo --workers=2` | **20 passed** (0 failed) · ~1,1 min |

Playwright: 2 projetos (chromium-desktop 1440 + chromium-mobile 390) × 10 testes = 20. webServer nesta worktree: porta **4174**. Relatório HTML: `playwright-report/index.html`.

Cobertura do PLANO: busca `q`, filtros combinados + reset de página, `price-asc`/`price-desc`, paginação + histórico, `empty`, skeleton/`server-error`/retry `flaky`, overflow 390/768/1440.
