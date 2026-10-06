# Contratos REST

Base URL: `VITE_API_URL` (padrão `/api`). Autenticação: `Authorization: Bearer <token>`. Carrinho de visitante: `X-Guest-Cart: <cartId>`.

Envelope de erro:

```json
{ "error": { "code": "validation_error", "message": "...", "fields": { "email": "..." }, "retryable": false } }
```

Códigos: `validation_error` (422), `unauthorized`/`session_expired` (401), `forbidden` (403), `not_found` (404), `conflict`/`email_taken`/`username_taken`/`out_of_stock`/`insufficient_stock`/`price_changed`/`quote_stale`/`idempotency_conflict` (409), `coupon_invalid`/`coupon_expired` (422), `payment_declined` (402), `wallet_rejected` (403), `rate_limited` (429), `transient` (503), `internal` (500).

ETH: string decimal (`^\d+(\.\d{1,18})?$`). Quantidades: inteiros.

| Método | Caminho | Auth | Descrição |
| --- | --- | --- | --- |
| POST | `/session` | — | Login |
| GET | `/session` | sim | Sessão atual |
| DELETE | `/session` | sim | Logout |
| POST | `/accounts` | — | Cadastro (409 se e-mail/usuário em uso) |
| GET | `/nfts` | — | Lista: `q`, `categories`, `networks`, `minPrice`, `maxPrice`, `tab`, `sort`, `page`, `pageSize` |
| GET | `/nfts/featured` | — | Hero, spotlight e coleções |
| GET | `/nfts/:id` | — | Detalhe |
| GET | `/nfts/:id/related` | — | Relacionados |
| GET | `/cart` | opcional | Carrinho do visitante ou do usuário |
| POST | `/cart/items` | opcional | Inclui item |
| PATCH | `/cart/items/:id` | opcional | Altera quantidade |
| DELETE | `/cart/items/:id` | opcional | Remove item |
| POST | `/cart/coupon` | opcional | Aplica cupom |
| DELETE | `/cart/coupon` | opcional | Remove cupom |
| POST | `/cart/merge` | sim | Mescla o carrinho do visitante |
| POST | `/cart/acknowledge-prices` | opcional | Aceita preços atuais |
| GET | `/quote` | opcional | Cotação (`network`, `fresh=1` para não cachear) |
| POST | `/orders` | sim | Cria pedido. Header obrigatório `Idempotency-Key`. Mesma chave + mesmo corpo = mesmo pedido; chave + corpo diferente = 409 |
| GET | `/orders` | sim | Lista (`status=pending`) |
| GET | `/orders/:id` | sim | Recibo / estado |
| GET/PATCH | `/me/profile` | sim | Perfil |
| PUT/DELETE | `/me/avatar` | sim | Avatar (data URL) |
| POST | `/me/password` | sim | Troca de senha |
| GET | `/me/favorites` | sim | Favoritos |
| PUT/DELETE | `/me/favorites/:nftId` | sim | Inclui / remove |
| GET | `/me/wallets` | sim | Carteiras |
| PUT | `/me/wallets/:slot` | sim | `primary` ou `secondary` |
| POST | `/wallet-connections` | sim | Simula conexão |
| DELETE | `/wallet-connections/:id` | sim | Desconecta |

Schemas Zod em `src/api/contracts/`. Os handlers MSW e o cliente Axios usam os mesmos schemas.
