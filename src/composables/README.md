# Composables

## Papel da pasta
`composables` guarda lógica reutilizável que não pertence a um único componente e não justifica virar store global.

## Casos atuais
- `useRouterControl.ts`: controle de navegação, autenticação, status da conta e permissões.
- `useServerTable.ts`: tabela server-side com busca, ordenação e paginação.
- `useConfirm.ts`: confirmação de ações.
- `useChartOptions.ts`, `useCountUp.ts`, `useScrollReveal.ts`: apoio visual e de experiência.

## Padrão de uso
- Composable recebe parâmetros simples.
- Expõe `refs`, ações e estados necessários para a página ou componente.
- Pode depender de `stores`, `repositories` ou `utils`, mas sem virar dono do domínio inteiro.

## Regras
- Usar composable para comportamento reutilizável em mais de um ponto.
- Se a lógica precisar guardar estado global persistente, considerar store.
- Se a lógica for apenas detalhe interno de uma tela, mantê-la local à página.
