# Etapa 6 — Perfil e carteiras

Worktree: `../desafio-jungle-wt/e6-conta` · branch `feat/e6-conta`

## Escopo

Frames Perfil e Carteiras. Mobile sem frame: mesma composição empilhada, 390/768.

- `UpdateProfileInput`, avatar data URL, `ChangePasswordInput` (senha atual)
- Carteiras primary/secondary (`WalletInput`)
- Erros de API nos campos; persistência após refresh
- Cenário `validation-error` para 422

## Testes — `e2e/06-conta/`

8. Editar perfil, avatar, senha, carteiras; validação cliente e API

## Aceite

`pnpm typecheck && pnpm lint && pnpm test:e2e -- e2e/00-fundacao e2e/06-conta`
