# Arquitetura do Frontend

## Objetivo
Este frontend concentra a interface principal do sistema em Vue 3. A base atual mistura ERP e modo `arena`, controlados por variáveis de ambiente e por rotas que escolhem páginas diferentes conforme o contexto.

## Stack principal
- Vue 3 com Composition API e Single File Components.
- Vite como bundler e ambiente de desenvolvimento.
- TypeScript em toda a aplicação.
- Pinia para estado global e por domínio.
- Vue Router para navegação, guards e metadados de permissão/layout.
- Tailwind CSS como base visual, com utilitários próprios e componentes `ui`.
- `reka-ui`, `vaul-vue`, `class-variance-authority`, `clsx` e `tailwind-merge` para primitives e composição de UI.
- `axios` para HTTP.
- `socket.io-client` para realtime.
- `vue-toastification` para feedback global.
- `@tanstack/vue-table`, `vue-chartjs`, `chart.js`, `maska`, `qz-tray` e `@vuepic/vue-datepicker` em fluxos específicos.
- `shadcn-vue` para Interface

## Entradas e infraestrutura
- `src/main.ts` monta a aplicação, registra Pinia, Router, Toast e o `DatePicker` global.
- `src/router/index.ts` centraliza as rotas e usa `meta` para:
  - `layout`;
  - `isPublic`;
  - `permissao`.
- `src/utils/axios.ts` define o cliente HTTP, injeta o token e tenta renovar sessão com refresh token.
- `src/utils/worker.ts` e `src/utils/theme.ts` inicializam comportamento global adicional.

## Organização real do código
- `src/pages` organiza telas por domínio de negócio.
- `src/components` guarda componentes compartilhados e blocos reutilizáveis.
- `src/stores` concentra estado, formulários e ações de UI por domínio.
- `src/repositories` encapsula chamadas para a API.
- `src/composables` concentra lógica reutilizável e integrações entre UI e estado.
- `src/layouts` define a casca visual de cada grupo de páginas.
- `src/utils`, `src/lib`, `src/types` e `src/hooks` sustentam infraestrutura do app.

## Fluxo padrão de implementação
O fluxo dominante do app é:

`page -> store/composable -> repository -> axios -> backend`

Na prática:
- páginas montam layout, tabela, modais e ações visuais;
- stores seguram `form`, flags de modal, filtros e mutações locais;
- repositories fazem chamadas HTTP com métodos estáticos;
- composables resolvem comportamento transversal, como tabela server-side, guardas e confirmações.
- telas de detalhe operacional, como modais ricos de ordens de serviço e páginas de detalhe de produto, devem usar store + repository para carregar, recarregar e sincronizar resumo, itens, variantes e mensagens após cada ação.
- detalhes de produto com base + variantes devem separar claramente a visão da variante selecionada, a lista de variantes e a visão geral consolidada do produto base.
- telas de catálogo que misturam produto base e variante devem manter estado explícito para o modo de listagem e para o tipo de cadastro iniciado pelo usuário.
- dashboards operacionais, como o painel de produtos, devem consumir endpoints agregados do backend filtrados por período e sempre respeitar o `contaId` do contexto autenticado para evitar mistura entre contas.
- a dashboard principal deve compor uma visão executiva transversal reutilizando agregações já existentes de vendas, financeiro, produtos e serviços antes de exigir um endpoint agregador novo, mas os gráficos precisam respeitar o período selecionado na tela e os critérios operacionais corretos de cada domínio.
- centrais de relatório do domínio devem abrir com contexto pré-preenchido quando o usuário parte de uma linha, detalhe ou variante específica, reduzindo retrabalho na seleção de filtros.

## Convenções importantes
- O módulo costuma viver perto da sua tela: `Home.vue`, subpastas `tabela`, `modais`, `formulario`, `dashboard` e variantes mobile.
- Quando uma listagem desktop precisa de adaptação mobile, a preferência é manter a tabela no desktop e usar cards compactos + bottombar fixa no mobile, reaproveitando o store e o repository do domínio.
- Em financeiro, contas e categorias continuam como fluxos auxiliares de configuração, enquanto a navegação operacional principal pode expor `lancamentos`, `acompanhamento`, `contas a receber` e `contas a pagar` como entradas separadas quando isso reduzir fricção para o usuário final.
- O módulo financeiro deve tratar dashboards, acompanhamentos, calendários operacionais e telas de detalhe com base em parcelas reais, separando saldo realizado, saldo previsto, pendências e atrasos, sempre respeitando o `contaId` autenticado em toda consulta e filtro.
- O lançamento financeiro deve aceitar parcelamento mensal, semanal, diário, quinzenal ou personalizado em dias, permitir valor total dividido ou valor fixo por parcela, manter campos operacionais recorrentes preenchidos entre lançamentos em lote manual, expor importação em massa por CSV no próprio domínio e oferecer edição rápida restrita a descrição, categoria, conta, cliente/fornecedor e forma de pagamento padrão, preservando valores, datas e parcelamento já lançados.
- A tela de contas financeiras deve combinar CRUD do cadastro com uma visão detalhada por modal, incluindo resumo da conta, entradas, saídas, pendências, lista filtrável de movimentações vinculadas, transferência entre contas com opção de gerar financeiro ou apenas mover os lançamentos filtrados com prévia de parcelas/lançamentos afetados e ajuste manual de saldo com modo financeiro ou ajuste interno invisível nas listagens.
- O mesmo domínio costuma combinar página, store e repository próprios.
- O frontend usa contrato tipado local em `src/types/schemas.ts`, espelhando os domínios principais do backend.
- O guard de rotas consulta dados do usuário, status da conta e permissão antes de liberar navegação.
- O layout muda por `meta.layout` e o conteúdo também pode mudar por `VITE_MODE_SYSTEM`.

## Áreas especiais
- `public/` contém manifesto, service worker e assets públicos.
- `dist/` é artefato gerado de build.
- `src/components/ui/` concentra primitives reutilizáveis e deve ser a primeira opção antes de criar UI nova.
- `src/components/mobile/` concentra padrões móveis compartilhados, como bottombar fixa para listagens e atalhos operacionais.
- `src/pluguins/socket.ts` e `src/utils/qzTray.ts` mostram integrações de runtime que impactam a experiência.

## Regras para futuras mudanças
- Preservar a separação por domínio já adotada em `pages`, `stores` e `repositories`.
- Reutilizar componentes de `components/ui`, `components/layout` e `components/formulario` antes de criar novos.
- Não introduzir novo padrão de acesso HTTP fora de `repositories` sem motivo forte.
- Manter `meta.layout`, `meta.permissao` e `meta.isPublic` coerentes com as regras existentes do router.
- Tratar `arena` como variação real do produto, não como exceção pontual.
