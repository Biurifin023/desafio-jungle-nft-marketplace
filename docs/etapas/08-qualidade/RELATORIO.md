# Relatório — Etapa 8 Qualidade

## O que foi feito

- **Teste 11** (`e2e/08-qualidade/a11y.spec.ts`): link de pular conteúdo, foco visível, navegação do card por Enter, foco preso e devolvido ao gatilho na galeria, no modal de login, no diálogo social e no drawer de filtros, erros associados via `aria-describedby` no login e no checkout.
- **Responsividade** (`responsive.spec.ts`): as 12 telas (públicas, privadas, 404 e recibo) em 390, 768, 1440 e 720 px (1440 com zoom de 200%), sem overflow horizontal.
- **Regressão visual** (`visual.spec.ts`): início, detalhe, carrinho e pagamento, desktop e mobile, cenário `fast`, animações desligadas. Baselines versionados.
- **Lighthouse**: `lighthouserc.cjs` + `scripts/lighthouse.ts`, 3 execuções por página e perfil, mediana, relatórios HTML/JSON e `docs/lighthouse/RESULTADOS.md`.
- `README.md`, `ARCHITECTURE.md` e `vercel.json` (rewrite de SPA).

## Correções encontradas pelos testes

- Diálogos controlados (sem `Dialog.Trigger`) não devolviam o foco. `useReturnFocus` corrige isso em `DialogContent` e `SheetContent`.
- A busca mobile não tinha indicador de foco.
- Lighthouse: ordem de headings, área de toque dos pontos do carrossel e nome acessível do card (accessibility de 95 para 100).
- Bundle do MSW de 476 KB para 186 KB (stub do `tough-cookie`).

## Playwright

A suíte roda contra `pnpm build:demo` + `vite preview`:

```
pnpm test:e2e
92 passed, 4 skipped (chromium-desktop 1440 + chromium-mobile 390)
```

Os 4 pulos são intencionais: drawer de filtros só no mobile, zoom da galeria só no desktop e os 2 testes responsivos só no projeto desktop (eles trocam o viewport sozinhos).

## Lighthouse (mediana)

Início: mobile 87 / desktop 98. Detalhe: mobile 88 / desktop 99. Accessibility, Best Practices e SEO em 100 nas quatro combinações. A justificativa da performance mobile está em `docs/lighthouse/RESULTADOS.md`.

## Deploy

Vercel, com o projeto ligado ao repositório do GitHub (build `pnpm build:demo`, `VITE_ENABLE_MOCKS=true`). URL e verificação em produção no `README.md`.
