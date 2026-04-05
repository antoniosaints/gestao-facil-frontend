# Mapa de `src`

## Papel da pasta
`src` contém o código-fonte ativo do frontend. Tudo que define comportamento, layout, navegação, estado e integração com a API parte daqui.

## Estrutura principal
- `App.vue`: raiz visual da aplicação.
- `main.ts`: bootstrap do app, plugins e registro global.
- `assets/`: CSS principal e estilos compartilhados.
- `components/`: componentes reutilizáveis.
- `composables/`: lógica reutilizável de interface e fluxo.
- `hooks/`: helpers menores e verificações isoladas.
- `layouts/`: shells de navegação e estrutura de página.
- `lib/`: helpers utilitários de baixo nível.
- `pages/`: telas por domínio.
- `pluguins/`: integrações como socket.
- `repositories/`: acesso à API.
- `router/`: definição de rotas.
- `stores/`: estado global e por domínio.
- `types/`: contratos TypeScript consumidos pelo app.
- `utils/`: infraestrutura transversal.
- `__tests__/`: testes do frontend.

## Fluxo recomendado
- Interface de tela nasce em `pages`.
- Estado e ações compartilhadas do módulo vão para `stores`.
- Requisições externas vão para `repositories`.
- Modais e páginas de detalhe com dados vivos, como OS, produto e comprovantes operacionais do PDV, devem carregar o estado via store/repository e recarregar após mutações relevantes.
- Dashboards por domínio devem preferir agregações do backend via repository, incluindo filtros por período e isolamento por `contaId` do usuário autenticado.
- Comportamento transversal ou reutilizável vai para `composables`.
- Infraestrutura e detalhes técnicos ficam em `utils` ou `lib`.

## Cuidados
- Evitar lógica de regra de negócio grande direto em componentes visuais.
- Evitar chamadas `axios` direto em páginas, exceto manutenção pontual muito localizada.
- Ao criar funcionalidade nova, seguir o domínio mais próximo já existente em `pages`.
- Evitar estado fake/local para fluxos que dependem de API; em detalhes operacionais, preferir loading explícito, reload e feedback visual coerente.
