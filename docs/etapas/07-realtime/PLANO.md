# Etapa 7 — Tempo real

Worktree: `../desafio-jungle-wt/e7-realtime` · branch `feat/e7-realtime`

## Escopo

- `src/lib/socket.ts` com `socket.io-client`
- MSW `@mswjs/socket.io-binding` em `registerRealtimeTransport`
- Dedup `eventId` + ignore `version` antiga
- Reconexão: invalidar queries ativas
- Isolamento por usuário (auth no handshake; recria no logout)
- `nft.updated` atualiza catálogo/detalhe/carrinho; aviso `aria-live`; checkout bloqueia cotação stale
- Pedido pendente sobrevive a drop de conexão

## Testes — `e2e/07-realtime/`

9. `__mock.updateNft` durante checkout → aviso + bloqueio
10. `__mock.realtime.replay` / `emitRaw` versão antiga; `disconnect`; retomada de pending

Eventos passam pelo cliente Socket.IO, nunca por setters da UI.

## Aceite

`pnpm typecheck && pnpm lint && pnpm test:e2e -- e2e/07-realtime`
