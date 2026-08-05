# Stores

## Papel da pasta
`stores` concentra estado compartilhado, formulários, flags visuais e ações de cada domínio. A implementação usa Pinia com Composition API.

## Padrão real encontrado
- Stores de domínio como `clientes`, `produtos`, `servicos`, `vendas`, `lancamentos`, `arena` e `usuarios`.
- Stores transversais como `login/useAuthStore.ts` e `ui/uiStore.ts`.
- Estrutura comum:
  - `form` com dados do formulário;
  - flags de modal;
  - filtros com chave `update` para forçar atualização de listagens;
  - ações como `openSave`, `openUpdate`, `reset`, `updateTable`.

## Integração com o restante
- A store é consumida pela página.
- Em operações remotas, a store costuma chamar um repository do domínio.
- Estado global de sessão usa `localStorage` e tokens salvos com prefixo `gestao_facil:*`.

## Casos especiais
- `useAuthStore` controla login, logout, refresh e persistência da sessão.
- `uiStore` concentra dados do usuário logado, responsividade, loading e comportamento do shell visual; quando o app Restaurante está ativo, também mantém os papéis/capacidades retornados por `/v1/restaurante/acesso` para menus, guards e ações.
- `restaurante/useRestaurantPrintAgent.ts` mantém o agente local do QZ Tray no layout autenticado: migra a configuração legada de uma impressora, restaura uma coleção de conexões locais do `localStorage` e processa cada token/impressora de forma independente sobre a mesma sessão QZ. A store recebe eventos Socket.IO, consulta as filas periodicamente, evita reimpressão por UID e confirma o resultado ao backend. Ela não depende de `restaurante/Impressao.vue`; permanece ativa durante a navegação entre rotas privadas e é encerrada apenas quando o layout principal é desmontado.
- `baseStore.ts` funciona como referência simples de padrão de CRUD, mas não é o centro da arquitetura.

## Regras
- Manter stores focadas no domínio.
- Não colocar renderização ou marcação de interface dentro da store.
- Ao adicionar novo CRUD, seguir o padrão já usado de `form`, `openModal`, `filters` e integração com repository.
