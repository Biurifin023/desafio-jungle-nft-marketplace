# Relatório — Etapa 3 Auth

## Feito

Login/cadastro desktop (modal) e mobile (tela cheia), validação, 409, login social indisponível, expiração com banner e retorno, logout e troca de usuário.

## Ajustes

Testes passam a usar `getByRole('textbox', { name: 'E-mail' })` para não colidir com o campo da newsletter. Footer oculto quando `mobileChrome === 'none'`.

## Typecheck / lint

Passaram nesta worktree.
