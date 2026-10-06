# Resultados Lighthouse

Medição de 06/10/2026 sobre o build de demonstração (`pnpm build:demo`) servido por `vite preview`, mocks no cenário **padrão** (`?scenario=default`, latência de 120–380 ms com seed fixa). Três execuções por página e perfil; a tabela mostra a mediana. Os dados brutos estão em `summary.json` e cada execução tem relatório HTML e JSON nesta pasta (`<pagina>-<perfil>-runN.report.html|json`).

## Medianas

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início (`/`) | mobile | **87** | 100 | 100 | 100 | 3,52 s | 0,024 | 101 ms |
| Início (`/`) | desktop | 98 | 100 | 100 | 100 | 1,00 s | 0 | 5 ms |
| Detalhe (`/nft/emerald-ape-042`) | mobile | **88** | 100 | 100 | 100 | 3,43 s | 0 | 116 ms |
| Detalhe (`/nft/emerald-ape-042`) | desktop | 99 | 100 | 100 | 100 | 0,88 s | 0 | 0 ms |
| **Meta** | | ≥ 90 | ≥ 95 | ≥ 95 | ≥ 90 | | | |

Execuções individuais de performance: início mobile 72 / 88 / 87, início desktop 98 / 98 / 99, detalhe mobile 88 / 88 / 88, detalhe desktop 99 / 99 / 99.

## Ambiente e condições

| Item | Valor |
| --- | --- |
| Lighthouse | 13.5.0 (CLI, `pnpm lighthouse`) |
| Navegador | HeadlessChrome 154, `--headless --no-sandbox` |
| Node | 24.16.0 |
| Sistema | Windows 11 x64 (benchmarkIndex ≈ 3000) |
| Mobile | preset padrão: emulação Moto G Power, throttling simulado (RTT 150 ms, 1,6 Mbps, CPU 4×) |
| Desktop | `--preset=desktop`: RTT 40 ms, 10 Mbps, CPU 1× |
| Configuração | `lighthouserc.cjs` (URLs, 3 execuções, metas) |

A auditoria carrega a aplicação completa: MSW no Service Worker, fixtures, Socket.IO, fontes Roboto Mono auto-hospedadas e imagens WebP. Nada é desligado para pontuar.

## Abaixo da meta: performance mobile (87 e 88)

Accessibility, Best Practices e SEO ficam em 100 nas quatro combinações, e a performance desktop fica entre 98 e 99. No mobile, a performance fica 2–3 pontos abaixo de 90 por causa do LCP (3,4–3,5 s, enquanto a nota máxima do LCP exige ≤ 2,5 s). FCP 2,3–2,4 s, TBT ~100 ms e CLS ~0 estão dentro do esperado.

Causa: a página só pinta depois de uma cadeia sequencial de inicialização no cliente, que o 4G simulado (RTT de 150 ms por ida e volta e CPU 4× mais lenta) penaliza:

1. HTML → `index.js` (React) → import dinâmico de `src/mocks/browser.ts`.
2. Registro e ativação do Service Worker do MSW (`mockServiceWorker.js`). O app precisa esperar, porque `engine.io-client` captura `WebSocket` na importação e o interceptor Socket.IO do MSW tem que estar ativo antes (ver `ARCHITECTURE.md`).
3. Import de `providers` (Router, Query, Axios, Zod) → chunk da rota.
4. Requisições REST simuladas (latência do cenário padrão) → render → download da imagem LCP (card ou arte do NFT, 28 KB em WebP).

Não há HTML pré-renderizado: a entrega é uma SPA com Vite, e o backend só existe dentro do navegador (MSW). Num backend real, os passos 1–2 sairiam do caminho crítico; com SSR/SSG, o conteúdo apareceria no primeiro byte.

A primeira execução do início mobile (72) é ruído: o TBT dela foi 3× maior que o das outras duas, com o mesmo build e a mesma página. Por isso a mediana é o número reportado.

## O que foi otimizado

| Mudança | Efeito medido |
| --- | --- |
| Alias de `tough-cookie` para um stub (o cookie store do MSW não é usado: a API simulada autentica por Bearer) | Chunk do MSW de 476 KB para 186 KB (176 → 56 KB gzip) |
| Ordem dos headings, área de toque de 24 px nos pontos do carrossel, nome acessível do card igual ao texto visível | Accessibility do início de 95 para 100 |
| Code splitting por rota, imagens WebP com `srcset` + `width`/`height`, `fetchpriority="high"` na imagem LCP, fontes auto-hospedadas | CLS ~0 e LCP desktop ≤ 1 s |
| `modulepreload` dos chunks de boot (testado e revertido) | Piorou: o detalhe mobile caiu de 88 para 77 porque os chunks disputavam banda com a imagem LCP |

Evolução nesta sessão (mediana da performance mobile, início / detalhe): 81 / 84 → 75 / 75 (com preload) → 79 / 77 (stub do cookie store, ainda com preload) → **87 / 88** (stub do cookie store, sem preload).

## Como reproduzir

```bash
pnpm build:demo
pnpm lighthouse
```

O script sobe o preview em `http://127.0.0.1:4173`, roda as 12 auditorias e reescreve `summary.json` e os relatórios. Os números variam com a CPU da máquina (veja `benchmarkIndex` em cada relatório).
