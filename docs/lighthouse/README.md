# Auditoria Lighthouse

Resultados, ambiente e análise: [RESULTADOS.md](./RESULTADOS.md).

## Como executar

```bash
pnpm build:demo
pnpm lighthouse
```

`scripts/lighthouse.ts` lê `lighthouserc.cjs`, sobe o preview em `http://127.0.0.1:4173`, audita `/` e `/nft/emerald-ape-042` em mobile e desktop (três vezes cada, cenário padrão dos mocks) e grava:

- `summary.json`: medianas, execuções individuais, metas, LCP/CLS/TBT, versão do Lighthouse e do Chrome, throttling e `benchmarkIndex`;
- `<pagina>-<perfil>-runN.report.html` e `.report.json`: relatório completo de cada execução.

`LH_SKIP_SERVER=1` reaproveita um preview já no ar; `LH_BASE_URL` aponta para outra origem (por exemplo, o deploy).

## Metas

| Categoria | Meta |
| --- | ---: |
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 90 |
