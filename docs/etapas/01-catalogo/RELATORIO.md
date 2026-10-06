# Relatório — Etapa 1 Catálogo

## Feito

Home com hero, filtros (categoria, preço, rede), tabs, ordenação, paginação na URL, grid, drawer mobile, estados vazio/erro/skeleton, seções editoriais via `NotAvailableLink`.

## Fechamento

- Locators ajustados (dois links do Emerald Ape no desktop, skeleton escondido no mobile, ordenação dentro do drawer no mobile).
- Overflow em 768 px coberto aqui e em `e2e/08-qualidade/responsive.spec.ts`.
- Acessibilidade: heading `h2` (sr-only) para a seção do catálogo, nome acessível do card igual ao texto visível, pontos do carrossel com área de toque de 24 px, anel de foco na busca mobile.

## Playwright

`e2e/01-catalogo`: 7 testes × 2 projetos, todos verdes na suíte completa (ver etapa 8).

## Typecheck / lint

Passam.
