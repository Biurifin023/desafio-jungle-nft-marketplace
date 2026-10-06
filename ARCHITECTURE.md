# Arquitetura — Kurio NFT Marketplace

## Stack

Vite, React 19, TypeScript strict, TanStack Router (rotas em arquivo), TanStack Query, Axios, Zod, react-hook-form, Tailwind v4, shadcn/ui, MSW, Socket.IO (`socket.io-client` + `@mswjs/socket.io-binding`), Playwright, Lighthouse.

## Camadas

| Camada | Onde | Responsabilidade |
| --- | --- | --- |
| Contratos | `src/api/contracts` | Zod + tipos compartilhados (ETH como string decimal) |
| Transporte | `src/lib/http.ts`, `src/api/*` | Axios, envelope de erro, hooks Query |
| Interface | `src/features/*`, `src/routes/*` | Telas e fluxos; sem dados fictícios |
| Mocks | `src/mocks/*` | Única fonte de respostas simuladas (REST e eventos) |

A UI nunca monta payloads de negócio. Cenários e falhas passam por MSW (`?scenario=`, `localStorage`, `window.__mock`).

## Sessão e carrinho

- Token Bearer persistido em `kurio.session` (sem senha).
- Visitante: `X-Guest-Cart` + `kurio.guestCartId`.
- Login/cadastro faz merge do carrinho do visitante.
- Logout e troca de usuário: `disconnectSocket` + `clearPrivateCache`.
- Rotas privadas usam `requireAuth` e devolvem `?redirect=` para retomar o fluxo.

## Cache (TanStack Query)

Documentado em `src/app/query-client.ts`:

- Retry só em erros `retryable` (rede, timeout, 5xx, 429); no máximo 2.
- Mutations sem retry automático. Pedidos usam `Idempotency-Key` em `sessionStorage` (`kurio.checkoutAttempt`).
- Catálogo: `staleTime` 30–60 s. Carrinho e cotação: `staleTime` 0.
- `refetchOnWindowFocus` e `refetchOnReconnect` ativos.
- Chaves privadas incluem `userId` (nunca misturam Ana e Bruno).

Atualização otimista: favoritar/desfavoritar com rollback em falha.

## Tempo real

`src/lib/socket.ts` abre `socket.io-client` no origin atual (`path: /socket.io`, `auth` + `query.token`).

Os mocks registram `@mswjs/socket.io-binding` em `src/mocks/realtime/socket.ts`. Mutações do DB publicam em `realtimeBus`; o transporte entrega aos clientes conectados.

- `nft.updated` é público.
- `order.updated` só vai para a conexão do `userId`.
- Cliente descarta `eventId` repetido e `version` ≤ à aplicada.
- Após `reconnect`, invalida queries ativas (reconciliação REST).
- Eventos de uma sessão anterior não sobrevivem a `disconnectSocket`.

Limitação: o binding no navegador não replica cluster nem salas. Auth vai no `query.token`. O `engine.io-client` captura `window.WebSocket` na importação; por isso `src/main.tsx` só carrega o app depois de `startMocks()`.

## Checkout

1. Formulário `CollectorDetails` (rascunho em `kurio.checkoutDraft`).
2. Carteira cadastrada + rede; `POST /wallet-connections` (recusa no cenário `wallet-rejected`).
3. `POST /orders` com a cotação exibida e `Idempotency-Key`.
4. Cotação obsoleta (`quote_stale`) exige nova confirmação.
5. `/orders/$id` só mostra recibo se `status === 'confirmed'`. Pending e declined têm telas próprias.
6. Recibo é snapshot; o catálogo posterior não o altera.

## Acessibilidade

- Link “Pular para o conteúdo” e `:focus-visible` com contorno âmbar em todo elemento interativo.
- Diálogos e drawers (Radix) prendem o foco. Como os nossos são controlados, sem `Dialog.Trigger`, `useReturnFocus` (`src/components/ui/use-return-focus.ts`) devolve o foco ao elemento que os abriu.
- Erros de formulário usam `aria-invalid` e `aria-describedby` apontando para a mensagem (`role="alert"`).
- Mutations e eventos em tempo real são anunciados na `LiveRegion` (`aria-live`).
- O nome acessível do card do catálogo vem do conteúdo visível (imagem com `alt`, nome e preço), sem `aria-label` divergente.

## Performance

- Code splitting por rota (`autoCodeSplitting` do TanStack Router) e imports dinâmicos de mocks e providers em `src/main.tsx`.
- Imagens WebP em `srcset` (160–960 px) com `width`/`height` fixos; a imagem LCP usa `fetchpriority="high"` e `loading="eager"`.
- O cookie store do MSW usa `tough-cookie` + `tldts`, mas a API simulada autentica por Bearer e nenhum handler define cookies. Um alias no `vite.config.ts` troca o pacote por `src/mocks/vendor/tough-cookie.ts`, reduzindo o chunk do MSW de 476 KB para 186 KB (176 → 56 KB gzip). O comportamento dos mocks não muda.
- `modulepreload` dos chunks de boot foi testado e descartado: no 4G simulado eles disputam banda com a imagem LCP e o detalhe mobile caiu de 88 para 77.
- Resultados e análise: `docs/lighthouse/RESULTADOS.md`.

## Testes

- Playwright roda contra `pnpm build:demo` + `vite preview` (o mesmo artefato do deploy), em Chromium desktop 1440 e mobile 390.
- `e2e/08-qualidade/responsive.spec.ts` percorre todas as telas em 390, 768, 1440 e 720 px (1440 com zoom de 200%) verificando ausência de overflow horizontal.
- Baselines visuais em `e2e/08-qualidade/visual.spec.ts-snapshots/` foram gerados no Windows (sufixo `-win32`). A renderização de fontes muda entre sistemas; em Linux ou macOS rode `pnpm test:e2e:update -- e2e/08-qualidade/visual.spec.ts` uma vez para gerar os baselines locais.

## Desvios de UX / Figma

- Perfil, carteiras e confirmação não têm frame mobile no arquivo; a composição é a mesma empilhada (390 / 768).
- Login social (Google/Apple) abre diálogo de “fora de escopo”, sem fingir sucesso.
- Tokens e assets vieram de `docs/design-metricas` e `docs/figma` (extração automática completa depende de token de edição no Figma).
- Skeletons com shimmer respeitam `prefers-reduced-motion`.
- Pontos do carrossel de destaques: o ponto visual continua com 8 px, mas cada botão tem área de toque de 24 px (WCAG 2.5.8). Os pontos ficam 16 px mais espaçados que no Figma.
- Busca mobile: o contêiner ganha anel âmbar quando o campo recebe foco por teclado (o Figma não define estado de foco).

## Deploy

A build de demonstração usa `VITE_ENABLE_MOCKS=true`. `vercel.json` reescreve rotas para `index.html` para o refresh direto funcionar; arquivos estáticos (incluindo `mockServiceWorker.js`, servido com `Cache-Control: no-cache`) têm prioridade sobre o rewrite.
