# Relatório — Etapa 1 Catálogo

## Feito

Home com hero, filtros (categoria, preço, rede), tabs, ordenação, paginação na URL, grid, drawer mobile, estados vazio/erro/skeleton, seções editoriais via `NotAvailableLink`.

## Playwright

Rodado `pnpm test:e2e -- e2e/00-fundacao e2e/01-catalogo`. Parte da suíte passou (busca, filtros, paginação, empty, retry). Falhas restantes concentradas em sobrecarga de workers em paralelo e overflow em 768 / ordenação no mobile — revisadas no merge.

## Typecheck / lint

Passaram nesta worktree.
