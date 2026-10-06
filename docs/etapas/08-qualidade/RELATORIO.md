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
- Checkout: o formulário era preenchido assim que o perfil carregava. Se a lista de carteiras chegasse depois, o campo Carteira ficava vazio e "Conectar carteira" falhava. Agora o preenchimento espera as duas consultas (achado por uma falha intermitente do teste 10).

## Playwright

A suíte roda contra `pnpm build:demo` + `vite preview`:

```
pnpm test:e2e
92 passed, 4 skipped (chromium-desktop 1440 + chromium-mobile 390)
```

Os 4 pulos são intencionais: drawer de filtros só no mobile, zoom da galeria só no desktop e os 2 testes responsivos só no projeto desktop (eles trocam o viewport sozinhos).

> Atualização posterior: com `e2e/09-correcoes` e `e2e/10-ajustes`, a suíte tem 154 testes (141 executados e 13 pulados). Os pulos novos seguem a mesma regra de viewport: um teste de correção, o slider de preço, o rodapé e a aba de detalhes, que só aparecem no layout desktop, os testes dos campos do colecionador no checkout (o layout mobile mostra só a escolha da carteira) e o teste do pagamento com carteira, que só existe no mobile.

## Lighthouse (mediana)

| Ambiente | Início mobile | Início desktop | Detalhe mobile | Detalhe desktop |
| --- | ---: | ---: | ---: | ---: |
| Produção (Vercel) | 94 | 100 | 98 | 100 |
| `vite preview` local | 87 | 98 | 88 | 99 |

Accessibility, Best Practices e SEO ficam em 100 nas oito combinações. Em produção todas as metas são atingidas. O preview local serve os chunks sem compressão, e a análise completa está em `docs/lighthouse/RESULTADOS.md`.

## Deploy

- Produção: https://kurio-nft-marketplace-woad.vercel.app
- Repositório: https://github.com/Biurifin023/desafio-jungle-nft-marketplace (público; `main` mais as branches `feat/e0`–`feat/e8`)
- Projeto Vercel `kurio-nft-marketplace`, ligado à `main`. O `vercel.json` fixa o pnpm 11.13.1, roda `pnpm build:demo`, reescreve as rotas do SPA, serve `mockServiceWorker.js` sem cache e aplica cache imutável aos chunks com hash.
- Checkout limpo validado num clone novo do GitHub: `pnpm install --frozen-lockfile`, `pnpm typecheck` e `pnpm build:demo`.

Verificação em produção:

- Acesso direto e refresh em `/`, `/nft/:id`, `/cart`, `/login`, `/checkout`, `/profile` e numa rota inexistente: todos retornam 200 com o shell do SPA, e a própria aplicação resolve o 404.
- Suíte Playwright completa apontada para a URL de produção (`E2E_BASE_URL`): **92 passed, 4 skipped**, incluindo login, checkout com idempotência, Socket.IO simulado (testes 9 e 10), acessibilidade, responsividade e regressão visual.
- Lighthouse de produção na tabela acima (`docs/lighthouse/producao/`).
