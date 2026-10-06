# Relatório — Etapa 7 Tempo real

## O que foi feito

- `socket.io-client` em `src/lib/socket.ts`.
- Binding MSW em `src/mocks/realtime/socket.ts`.
- Dedup por `eventId` e ignore de `version` antiga.
- Reconexão invalida queries; pedidos privados filtrados por `userId`.
- `nft.updated` atualiza catálogo/detalhe/carrinho; checkout bloqueia cotação obsoleta.

## Playwright

`e2e/07-realtime` — testes 9 e 10. Eventos passam pelo cliente Socket.IO.
