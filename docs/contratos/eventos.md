# Eventos Socket.IO

Transporte: `socket.io-client` no cliente (`src/lib/socket.ts`). Nos mocks, `@mswjs/socket.io-binding` em `src/mocks/realtime/socket.ts`. Mutações do DB publicam em `realtimeBus`; o transporte entrega aos sockets conectados.

Todo evento carrega:

- `eventId` — identidade estável (duplicatas são ignoradas)
- `resource` — `{ type, id }`
- `version` — versão do recurso após a mudança (eventos com versão ≤ à aplicada são ignorados)
- `occurredAt`

## `nft.updated`

Público. Atualiza preço e disponibilidade no catálogo, detalhe e carrinho.

```json
{
  "eventId": "evt_1",
  "type": "nft.updated",
  "resource": { "type": "nft", "id": "emerald-ape-042" },
  "version": 3,
  "occurredAt": "2026-10-01T12:00:00.000Z",
  "data": {
    "priceEth": "1.45",
    "available": 4,
    "editions": [{ "id": "ed_default", "priceEth": "1.45", "available": 4 }],
    "reason": "price_changed"
  }
}
```

## `order.updated`

Privado (`userId`). Só chega às conexões autenticadas daquele usuário.

```json
{
  "eventId": "evt_2",
  "type": "order.updated",
  "resource": { "type": "order", "id": "ord_1" },
  "version": 2,
  "userId": "usr_ana",
  "occurredAt": "2026-10-01T12:00:00.000Z",
  "data": { "status": "confirmed", "transaction": { "hash": "0x…", "explorerUrl": "https://…" }, "failureReason": null }
}
```

## Limitações no ambiente de mocks

- O binding Socket.IO do MSW não replica um cluster real: reconexão, salas e auth via handshake são simulados no worker do navegador.
- Eventos disparados por `__mock.updateNft` / mutações do DB passam pelo mesmo barramento que o cliente escuta.
- O MSW remove o prefixo `/socket.io/` antes de casar o handler; o link é `/.*/` e conexões que não são Socket.IO (HMR) passam adiante.
- `engine.io-client` captura `WebSocket` na carga do módulo. O app só é importado depois de `startMocks()` (`src/main.tsx`) para o interceptor do MSW estar ativo.
