# Eventos Socket.IO

Transporte: `socket.io-client` no cliente. Nos mocks, `@mswjs/socket.io-binding` (Etapa 7). Até lá, `src/mocks/realtime/transport.ts` é um no-op e os eventos ficam no barramento em memória.

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
- Sem a Etapa 7, `deliver()` não chega ao `socket.io-client`.
