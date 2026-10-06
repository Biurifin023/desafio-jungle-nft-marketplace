# Relatório — Etapa 3 Auth

## Feito

Login/cadastro desktop (modal) e mobile (tela cheia), validação, 409, login social indisponível, expiração com banner e retorno, logout e troca de usuário.

## Ajustes

Testes passam a usar `getByRole('textbox', { name: 'E-mail' })` para não colidir com o campo da newsletter. Footer oculto quando `mobileChrome === 'none'`.

## Fechamento

- O menu da conta depois do cadastro foi resolvido validando a sessão em `/profile` (`session-email`), em vez de abrir o dropdown do header.
- O diálogo “Login social indisponível” devolve o foco ao botão de origem.
- A expiração durante o checkout com preservação do rascunho ficou coberta em `e2e/05-checkout`.

## Playwright

`e2e/03-auth`: 3 testes × 2 projetos (cadastro → login → expiração → logout → troca de usuário, 409 associado ao campo, login social), todos verdes na suíte completa.

## Typecheck / lint

Passam.
