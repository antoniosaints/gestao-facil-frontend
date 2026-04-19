# Mapa de `src`

## Papel da pasta
`src` contém o código-fonte ativo do frontend. Tudo que define comportamento, layout, navegação, estado e integração com a API parte daqui.

## Estrutura principal
- `App.vue`: raiz visual da aplicação.
- `main.ts`: bootstrap do app, plugins e registro global.
- `assets/`: CSS principal e estilos compartilhados.
- `components/`: componentes reutilizáveis, incluindo primitives de UI, modais compartilhados e padrões mobile como bottombar fixa.
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
- No domínio de produtos, a tela de detalhe deve separar a variante selecionada, a lista de variantes e a visão geral consolidada do produto base para reduzir ambiguidade para o usuário final.
- Dashboards por domínio devem preferir agregações do backend via repository, incluindo filtros por período e isolamento por `contaId` do usuário autenticado.
- A dashboard principal deve atuar como central executiva do sistema, reunindo KPIs, alertas operacionais, atalhos e resumos por domínio sem quebrar o padrão visual já usado nas demais páginas.
- Módulos com produto base e variantes devem explicitar quando a ação cria um item novo do zero ou apenas uma variante adicional, e a listagem pode alternar entre visão agregada por base e visão analítica por variante.
- Fluxos de relatório do domínio devem aceitar contexto pré-selecionado (produto base ou variante) e filtros opcionais de período, em vez de exigir reescolha manual do item a cada exportação.
- Listagens mobile que substituem tabelas desktop devem preferir cards compactos, ações rápidas e bottombar fixa para busca, paginação ou atalhos do módulo.
- No domínio financeiro, contas financeiras e categorias são fluxos auxiliares do módulo de lançamentos e devem ser acessados como ações contextuais dentro de `financeiro/lancamentos`, não como navegação primária lateral.
- Telas financeiras de acompanhamento e dashboard devem expor filtros operacionais claros (conta, categoria, tipo, status/busca quando fizer sentido) e calcular saldo atual, saldo previsto, pendências e atrasos a partir das parcelas do lançamento, não apenas do cabeçalho do lançamento.
- Componentes de tabs devem permitir scroll horizontal nativo em telas menores quando a quantidade de abas ultrapassar a largura disponível.
- Comportamento transversal ou reutilizável vai para `composables`.
- Infraestrutura e detalhes técnicos ficam em `utils` ou `lib`.

## Cuidados
- Evitar lógica de regra de negócio grande direto em componentes visuais.
- Evitar chamadas `axios` direto em páginas, exceto manutenção pontual muito localizada.
- Ao criar funcionalidade nova, seguir o domínio mais próximo já existente em `pages`.
- Evitar estado fake/local para fluxos que dependem de API; em detalhes operacionais, preferir loading explícito, reload e feedback visual coerente.
