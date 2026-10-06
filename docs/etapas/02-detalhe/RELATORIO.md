# Relatório — Etapa 2 Detalhe e favoritos

## Feito

Detalhe com galeria, edições, quantidade, adicionar ao carrinho, favorito otimista, 404, esgotado, relacionados e lista `/favorites`.

## Fechamento

- O preço `1.19 ETH` ficava duplicado (mobile/desktop) e oculto num dos layouts; o assert agora filtra o elemento visível.
- Os timeouts no desktop vinham de 4 suítes rodando em paralelo contra o servidor dev. A suíte passou a rodar contra o build de preview.
- O diálogo de zoom da galeria devolve o foco ao botão que o abriu (`useReturnFocus`).

## Playwright

`e2e/02-detalhe`: 7 testes × 2 projetos (acesso direto, 404, esgotado, visitante → login, persistência e rollback de favorito, skeleton), todos verdes na suíte completa.

## Typecheck / lint

Passam.
