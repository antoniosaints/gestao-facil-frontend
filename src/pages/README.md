# Páginas por Domínio

## Papel da pasta
`pages` organiza as telas do produto por domínio de negócio. O router carrega essas páginas de forma lazy e usa `meta` para layout, permissão e visibilidade pública.

## Organização atual
- Domínios principais: `dashboard`, `clientes`, `produtos`, `servicos`, `financeiro`, `usuarios`, `configs`, `perfil`, `vendas`.
- Áreas complementares: `site`, `auth`, `assinatura`, `assinaturas`, `agente`, `chats`, `whatsapp` e `loja`.
- Modo alternativo do produto: `arena`, com rotas, telas e fluxos próprios.
- Administração separada: `admin`.

## Padrão de composição
Cada domínio tende a repetir esta estrutura:
- `Home.vue` ou tela principal de listagem;
- subpastas como `tabela`, `modais`, `formulario`, `dashboard`, `publico` e `others`;
- componentes locais do módulo, mantidos junto da página para reduzir acoplamento global.
- em produtos, a página principal pode combinar visão por produto base, visão por variante e modais distintos para novo produto versus nova variante.

## Relação com router e layouts
- O router define qual página é renderizada e qual layout será usado.
- `VITE_MODE_SYSTEM` altera a escolha de algumas telas, principalmente entre ERP e `arena`.
- Rotas privadas dependem de autenticação, status da conta e `permissao`.
- A rota pública `/site/termos-politica` centraliza os Termos de Uso e a Política de Privacidade em `site/TermosPolitica.vue`; os hashes `#termos` e `#privacidade` abrem diretamente o documento correspondente e devem ser usados pelos links do site, cadastro e login.
- Páginas de dashboard devem refletir filtros operacionais reais do domínio, como período e agregações segregadas por conta.
- No financeiro, o domínio pode combinar uma listagem geral de lançamentos com telas operacionais separadas para acompanhamento, contas a pagar, contas a receber e assinaturas a pagar, reutilizando a mesma base de parcelas, filtros e ações rápidas quando a segmentação melhorar a UX.
- A tela `financeiro/inadimplencia/Home.vue` deve manter as ações rápidas de lembrete na própria listagem: configurar lançamento, configurar padrão do cliente, enviar agora e ativar/desativar o lembrete por lançamento via switch sem abrir o registro.
- A página `financeiro/assinaturas-pagar/Home.vue` deve seguir o padrão do restante do domínio financeiro: `DataTable` no desktop, cards compactos no mobile, edição via modal, `Select2Ajax` para conta/categoria e integração explícita com o painel financeiro e a listagem padrão de lançamentos.
- O domínio técnico `assinaturas` deve permanecer separado de `assinatura`: `assinatura` continua representando o plano da própria conta do ERP, enquanto `assinaturas` expõe o app visível como **Contratos**, concentrando contratos recorrentes dos clientes com painel, planos, ciclos/cobranças, comodatos e automação recorrente.
- As telas e formulários de `assinaturas` devem reaproveitar o padrão do financeiro para gateway e tipo de pagamento, hoje com Mercado Pago ativo e opções futuras preservadas no select.
- Nos formulários de `assinaturas`, é obrigatório usar o select com busca padrão do projeto (`Select2Ajax`) para relações com cliente, plano, serviço e produto; não usar select simples nesses campos dinâmicos.
- Nos formulários de `assinaturas`, é obrigatório usar o datepicker padrão baseado em `@vuepic/vue-datepicker` (`Calendarpicker`) para todas as datas editáveis; não usar `input type="date"` ou `datetime-local` nesse domínio.
- As listagens principais de contratos, planos, cobranças e comodatos em `assinaturas` devem seguir explicitamente o padrão `DataTable` + cards mobile paginados + modal de edição/ação no mesmo contexto, em vez dos cards soltos como visão principal.
- Formulários e modais de `assinaturas` devem seguir o padrão global do projeto e o repertório do cadastro de produtos: header/description consistentes, corpo organizado por seções colapsáveis, switches para opções booleanas, ações de salvar/cancelar no rodapé e feedback/loading explícitos.
- As telas financeiras operacionais devem permitir criação rápida por dia, edição em cascata de parcelas por escopo (atual, todas, pagas, pendentes ou direção relativa), persistência de campos recorrentes no formulário, edição rápida dos metadados do lançamento sem reabrir valores já lançados, importação em lote por CSV com download de modelo e filtros avançados estruturados na listagem principal de lançamentos.
- A página de contas financeiras deve oferecer não só o cadastro da conta, mas também saldo atual calculado já na listagem, um modal de detalhe com visão consolidada do saldo da conta, entradas, saídas, pendências, listagem filtrável das movimentações vinculadas e ações de transferência entre contas e ajuste manual de saldo.
- O painel financeiro deve reutilizar as mesmas ações disponíveis na listagem de contas para evitar divergência entre dashboard e CRUD operacional.
- O domínio `servicos/os` agora também expõe faturamento e geração de cobrança na própria listagem e no modal de detalhes, reaproveitando o fluxo de vendas/financeiro e bloqueando exclusões quando houver vínculo financeiro ativo.
- A página `perfil/PerfilUsuario.vue` deve permitir ao usuário autenticado atualizar seus próprios dados, trocar avatar com upload imediato via serviço central de storage, e alterar a senha informando senha atual, nova senha e confirmação com validação explícita na UI e no backend.

- A página `whatsapp/WhatsAppPage.vue` concentra a operação do app WhatsApp: inbox, histórico, envio de texto/mídias, vínculo com cliente ERP e gestão de instâncias W-API por conta. A configuração de webhooks abre um modal com as URLs do backend já preenchidas por instância, permite copiar/conferir os callbacks e só envia para a W-API após confirmação do usuário. Ela deve preservar o padrão visual do ERP e consumir `repositories/whatsapp-repository.ts`, não chamadas HTTP soltas fora de casos auxiliares pontuais.
- `loja/LojaVirtualPage.vue` separa Pedidos e Personalização. `loja/publico/LojaPublica.vue` atende `/lojas/:slug`, usa os presets Essencial/Editorial/Impacto e precisa respeitar `mode: CATALOGO|LOJA`; em catálogo não deve expor carrinho, login ou checkout. `ContaCliente.vue` concentra as jornadas públicas de autenticação e histórico sem reutilizar a sessão do ERP.

## Regras
- No PDV, enquanto nao houver controle operacional de terminais/pontos de venda, a abertura de caixa nao deve pedir selecao de PDV; no modo PRO, atalhos e botoes de caixa devem alternar entre abrir e fechar conforme o estado atual do caixa, o caixa fechado deve bloquear visualmente a venda, o pagamento rapido deve focar em PIX/dinheiro/cartao/crediario, o painel lateral deve priorizar metricas operacionais, o modal de caixa deve concentrar sangria/reforco/fechamento com resumo do turno, e o comprovante pos-venda deve favorecer nova venda como acao principal. Todo fechamento, no PDV Basico, PDV Pro ou painel de caixas, deve reutilizar `vendas/caixas/ModalFechamentoCaixa.vue`, incluindo a conferencia opcional por metodo e sem manter formularios paralelos.
- Ao criar funcionalidade nova, encaixar dentro do domínio correto antes de abrir uma nova área.
- Componentes específicos da tela devem ficar próximos dela.
- Regras de acesso devem ser refletidas tanto no router quanto na experiência visual da página.
- Fluxos operacionais como PDV, comprovante pós-venda e modais de envio devem manter ações principais visíveis, feedback imediato e estados explícitos de disponibilidade ou desenvolvimento.
- Listagens mobile de domínios operacionais devem preferir cards compactos com ações rápidas e barra inferior fixa de navegação/atalhos quando o fluxo exigir paginação, busca e menu de ações, seguindo o padrão usado em vendas e produtos.
- Quando a listagem mobile não exigir paginação, a bottombar ainda deve concentrar as ações principais do módulo, como busca, criação, limpeza de filtro e atualização.
- Tablists com múltiplas opções devem aceitar scroll lateral nativo em larguras pequenas, evitando quebra visual ou tabs inacessíveis no mobile.
- Sempre use Tanstack table para criação de listagens desktop, acesse outras tabelas para entender o padrão
