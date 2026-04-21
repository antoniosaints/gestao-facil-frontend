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
- `repositories/`: acesso à API, incluindo o novo `assinatura-repository.ts` para o domínio recorrente `/assinaturas`.
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
- No domínio financeiro, contas financeiras e categorias seguem como fluxos auxiliares de configuração dentro de `financeiro/lancamentos`, enquanto as jornadas operacionais podem ser separadas em `lancamentos`, `acompanhamento`, `contas a receber` e `contas a pagar` para reduzir atrito de uso.
- A listagem principal de `financeiro/lancamentos` agora deve tratar filtros avançados como contrato real de backend/frontend, usando período, tipo, status, conta, categoria e cliente/fornecedor como filtros estruturados além da busca textual do `DataTable`.
- As barras inferiores mobile dessas telas operacionais devem reutilizar `components/mobile/MobileBottomBar.vue` para manter o mesmo padrão visual e de navegação usado na dashboard principal, em vendas e nas demais listagens móveis.
- O domínio `assinaturas` reutiliza esse mesmo repertório de UI para cadastro de planos e contratos, além de padronizar os selects de gateway e tipo de pagamento com o mesmo conjunto visível no gerador de cobrança do financeiro.
- As páginas `assinaturas/AssinaturasHome.vue` e `assinaturas/PlanosHome.vue` passaram a seguir o padrão maduro do projeto: `DataTable` no desktop, cards paginados no mobile e edição via modal no mesmo contexto da listagem.
- Os detalhes de assinatura agora devem separar `Cobranças`, `Comodatos` e `Histórico` em tabs com o mesmo padrão visual e estrutural já usado em `produtos/others/DetalhesProduto.vue`, inclusive com scroll horizontal natural em telas menores.
- No domínio de assinaturas, a exclusão de plano só é permitida sem assinaturas vinculadas; a exclusão de assinatura bloqueia comodatos em uso, cobranças ativas e ciclos já pagos para preservar consistência operacional e financeira.
- Cobranças recorrentes desse domínio agora expõem geração direta no gateway com PIX, boleto e link de pagamento, mantendo no próprio ciclo a referência do gateway e o link retornado para uso posterior.
- Cancelamento e estorno no fluxo recorrente seguem as mesmas restrições do financeiro: cancelamento apenas para cobrança pendente e estorno apenas para cobrança efetivada, ambos somente em PIX/boleto quando o gateway suportar a operação.
- A exclusão manual da cobrança recorrente no ciclo agora bloqueia PIX e boleto até que a cobrança tenha sido cancelada/estornada, mas libera a remoção de links de pagamento quando o fluxo do gateway não oferece bloqueio automático.
- O reajuste de cobrança recorrente agora cancela a cobrança pendente anterior no gateway, atualiza o valor do ciclo e recria automaticamente a nova cobrança, preservando rastreabilidade no histórico da assinatura.
- A geração manual de ciclo recorrente exige confirmação explícita em modal antes da execução, com loading e prevenção de clique duplicado durante o envio.
- A App Store e a sidebar principal agora tratam `assinaturas`, `core-ia` e `whatsapp` como apps pagos por conta, além dos apps gratuitos `mercado-pago` e `abacatepay`: a Store organiza a vitrine em categorias com cards compactos de catálogo, um resumo horizontal mais enxuto no topo, o menu só aparece quando o módulo está ativo e a seção `Apps` da sidebar só é renderizada quando existe pelo menos um app visível na conta; o superadmin pode alternar esses apps em `pages/admin/assinantes/ModalGerenciarAssinante.vue`.
- As credenciais operacionais de Mercado Pago e AbacatePay saíram de `configs/ConfiguracaoPage.vue` e passaram a ser configuradas diretamente nos modais dos apps correspondentes em `pages/store/StorePage.vue`, mantendo o mesmo contrato de `ParametrosConta` no backend.
- A tela `configs/ConfiguracaoPage.vue` voltou a concentrar apenas preferências operacionais gerais, notificações, impressão e parâmetros financeiros que não pertencem à App Store.
- O frontend agora também expõe a página `pages/whatsapp/WhatsAppPage.vue` como ponto dedicado de configuração do app WhatsApp quando o módulo estiver ativo.
- Quando a mensalidade do SaaS usa AbacatePay, a experiência final de pagamento oferece PIX e cartão no mesmo link de renovação, sem expor chaves da plataforma na UI da conta.
- Nas cobranças internas do ERP, Mercado Pago e AbacatePay usam credenciais salvas em `ParametrosConta`, preservando a separação entre tenant e plataforma; no caso da AbacatePay, o backend ainda tenta sincronizar a webhook da conta automaticamente quando a `BASE_URL` é HTTPS.
- Telas financeiras de acompanhamento, contas a pagar e contas a receber devem expor filtros operacionais claros, criação rápida de lançamento, abas compactas para lista/KPI/calendário e cálculos de saldo, pendências e atrasos sempre baseados nas parcelas do lançamento, não apenas no cabeçalho.
- O domínio de ordens de serviço agora também deve tratar faturamento e geração de cobrança como fluxos operacionais de primeira classe, reaproveitando os modais e stores do financeiro quando houver aderência em vez de criar uma UX paralela.
- Ordens de serviço faturadas não devem abrir fluxo de edição no frontend; a UI precisa bloquear essa entrada antes do usuário entrar em um formulário inválido.
- Componentes de tabs devem permitir scroll horizontal nativo em telas menores quando a quantidade de abas ultrapassar a largura disponível.
- Comportamento transversal ou reutilizável vai para `composables`.
- Infraestrutura e detalhes técnicos ficam em `utils` ou `lib`.

## Cuidados
- Evitar lógica de regra de negócio grande direto em componentes visuais.
- Evitar chamadas `axios` direto em páginas, exceto manutenção pontual muito localizada.
- Ao criar funcionalidade nova, seguir o domínio mais próximo já existente em `pages`.
- Evitar estado fake/local para fluxos que dependem de API; em detalhes operacionais, preferir loading explícito, reload e feedback visual coerente.
