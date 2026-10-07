# Kurio — NFT Marketplace

Entrega do desafio frontend (React, TypeScript, TanStack Router/Query, Axios, MSW, Socket.IO, Tailwind, shadcn/ui, Playwright, Lighthouse).

- Produção: https://kurio-nft-marketplace-woad.vercel.app
- Repositório: https://github.com/Biurifin023/desafio-jungle-nft-marketplace

## Setup

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev:mocks
```

Abra http://localhost:5173.

A partir de um checkout limpo:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test:e2e
```

## Credenciais fictícias

| Usuário | E-mail | Senha |
| --- | --- | --- |
| Ana | `ana@kurio.dev` | `Kurio@2026` |
| Bruno | `bruno@kurio.dev` | `Kurio@2026` |

Cupom válido: `KURIO10`. Expirado: `GENESIS`.

Não armazene senhas reais. As fixtures usam hash SHA-256 com salt.

## Variáveis de ambiente

| Variável | Padrão | Uso |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` | Ativa MSW (obrigatório na demo) |
| `VITE_API_URL` | `/api` | Base do Axios |
| `VITE_REQUEST_TIMEOUT_MS` | `8000` | Timeout do cliente (cenário `order-timeout` usa 12 s) |

## Cenários

Lista em `/dev/mocks` ou `?scenario=<id>` (o parâmetro some da URL após o reset).

Exemplos: `fast`, `slow`, `empty`, `payment-declined`, `order-timeout`, `price-changed`, `wallet-rejected`, `validation-error`, `payment-pending`.

Reset completo (fixtures + sessão + carrinho):

```js
window.__mock.reset('default')
```

Controle pontual: `window.__mock.setScenario`, `failNext`, `updateNft`, `expireSessions`, `settleOrder`, `realtime.disconnect` / `replay` / `emitRaw`.

## Comandos

| Comando | Uso |
| --- | --- |
| `pnpm dev:mocks` | Desenvolvimento com MSW |
| `pnpm build` | Typecheck + build |
| `pnpm build:demo` | Build com mocks (demonstração / Vercel) |
| `pnpm preview` | Preview estático na porta 4173 |
| `pnpm typecheck` | TypeScript |
| `pnpm lint` | ESLint |
| `pnpm test:e2e` | Playwright contra o build de demonstração (desktop 1440 + mobile 390) |
| `pnpm test:e2e:update` | Atualiza baselines visuais |
| `pnpm test:e2e:report` | Relatório HTML (traces das falhas em `test-results/`) |
| `pnpm lighthouse` | Auditoria (3× início/detalhe × mobile/desktop, requer `pnpm build:demo`) |

Contra uma URL publicada (sem servidor local):

```powershell
$env:E2E_BASE_URL = "https://kurio-nft-marketplace-woad.vercel.app"; pnpm test:e2e
$env:LH_BASE_URL = "https://kurio-nft-marketplace-woad.vercel.app"; $env:LH_SKIP_SERVER = "1"; $env:LH_OUT_DIR = "docs/lighthouse/producao"; pnpm lighthouse
```

## Testes e qualidade

- Playwright: 160 testes (149 executados e 11 pulados por viewport), cobrindo os itens 1–12 da seção 9, responsividade em 390/768/1440 + zoom 200%, regressão visual, correções pós-entrega (`e2e/09-correcoes`) e ajustes de estados de erro, sessão e acessibilidade (`e2e/10-ajustes`). O `webServer` gera `pnpm build:demo` e sobe `vite preview`. Na etapa 8, a suíte da época passou também contra produção (92 aprovados).
- Os baselines visuais foram gerados no Windows (`*-win32.png`). Em Linux ou macOS, gere os locais uma vez com `pnpm test:e2e:update -- e2e/08-qualidade/visual.spec.ts`.
- CI (`.github/workflows/ci.yml`): em push na `main` e em pull requests roda typecheck, lint, build e o Playwright no Ubuntu, sem a regressão visual (os baselines são do Windows). A versão do Node fica em `.nvmrc`.
- Lighthouse em produção (mediana de 3): início 96 mobile / 100 desktop, detalhe 98 mobile / 100 desktop, CLS 0 em todas; Accessibility, Best Practices e SEO em 100. No `vite preview` local: 87 / 98 e 88 / 99. Análise em `docs/lighthouse/RESULTADOS.md`.

## Fluxos de falha para reproduzir

1. **Cupom:** no carrinho, `FOO` (inválido) e `GENESIS` (expirado); `KURIO10` aplica 10%.
2. **Pagamento recusado:** `?scenario=payment-declined`, checkout até confirmar.
3. **Timeout + idempotência:** `order-timeout` — a primeira confirmação estoura o timeout; a segunda recupera o mesmo `order id`.
4. **Preço no checkout:** `price-changed` — a primeira confirmação recebe cotação obsoleta.
5. **Carteira recusa:** `wallet-rejected` no botão Conectar carteira.
6. **Sessão:** `window.__mock.expireSessions()` e recarregar uma rota privada.
7. **Tempo real:** no checkout, `window.__mock.updateNft('emerald-ape-042', { editionId: '1-50', priceEth: '1.50' })`.
8. **Pedido pendente:** `payment-pending` + `window.__mock.realtime.disconnect()` + `settleOrder(id, 'confirmed')`.

## Documentação

- Contratos REST: `docs/contratos/rest.md`
- Eventos: `docs/contratos/eventos.md`
- Etapas e pontuação: `docs/etapas/`
- Decisões: `ARCHITECTURE.md`
- Lighthouse: `docs/lighthouse/`

## Deploy

Vercel, projeto `kurio-nft-marketplace` ligado à branch `main` (cada push gera um deploy). O `vercel.json` fixa o pnpm 11.13.1, roda `pnpm build:demo` (MSW ligado), publica `dist/`, reescreve as rotas do SPA para `index.html` (refresh e acesso direto funcionam) e serve `mockServiceWorker.js` sem cache.

Na demonstração não existe backend: API e Socket.IO são simulados no navegador, e cada visitante tem seu próprio estado em `localStorage`/`sessionStorage`.
