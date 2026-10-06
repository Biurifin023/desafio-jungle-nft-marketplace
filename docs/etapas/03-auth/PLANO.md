# Etapa 3 — Login, cadastro e sessão

Worktree: `../desafio-jungle-wt/e3-auth` · branch `feat/e3-auth`

## Escopo

Frames Login/Cadastro desktop (modal 500px sobre o marketplace) e mobile (tela cheia, marca KURIO). Ver `docs/figma/frames/desktop-login.txt`, `desktop-cadastro.txt`, `mobile-login.txt`, `mobile-cadastro.txt`.

- `react-hook-form` + zod (`LoginInput`, `RegisterInput`)
- Erros da API em `fields` via `aria-describedby`
- Conflito 409 (e-mail)
- `redirect` seguro (`safeRedirect`)
- Refresh recupera sessão (`sessionStore` + GET `/session`)
- Expiração: interceptor 401 → `sessionStore.expire()` + banner + login com retorno
- Logout: `disconnectSocket` + `clearPrivateCache` (já na fundação)
- Login social: `NotAvailableLink`
- Credenciais: `ana@kurio.dev` / `Kurio@2026`

## Testes — `e2e/03-auth/`

3. Cadastro, login, expiração (`__mock.expireSessions()`), logout, troca Ana → Bruno (cache privado some)

## Aceite

`pnpm typecheck && pnpm lint && pnpm test:e2e -- e2e/00-fundacao e2e/03-auth`
