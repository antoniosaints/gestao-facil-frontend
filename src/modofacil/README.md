# Modo Fácil — entrega local de frontend

Status: **partial**. Há fluxos próprios ligados à API; esta entrega não representa paridade integral nem liberação para clientes.

## Fronteira e integração

Toda a implementação nova fica em `src/modofacil/`. Não há importação de páginas antigas. Os controles de formulário compartilhados são reutilizados: Input, Textarea, ModalView e Select2Ajax. Estilização com utilitários Tailwind sob `.modo-facil`; layout próprio aninhado no `Default.vue`, sem edição de App/Main/Default, aparência ou `estiloUi`.

Pontos de integração fora do módulo:

- `src/router/index.ts`: registra a árvore e chama o bootstrap. O bootstrap primeiro executa `handleRouteGuard` intacto; somente se o resultado for `true` aplica a política da experiência.
- `src/pages/configs/ConfiguracaoPage.vue`: aba Experiência com o componente dedicado.
- `src/components/formulario/ModalView.vue`: opção de modal móvel estável entre breakpoints.
- `src/components/formulario/Select2Ajax.vue`: carregador opcional, paginação, registro selecionado completo, retry e proteção contra respostas atrasadas; o contrato de URL legado é mantido.

Acesso por URL respeita metadados de permissão da operação. CEO, rotas públicas, assinatura, entregador e PDV bloqueado permanecem sob as guardas existentes. O PDV especializado não é interceptado. Módulos setoriais sem equivalente têm rota de cobertura explícita; recuperação administrativa permanece em `/configuracoes` e `/modofacil/configuracoes`.

A preferência de experiência da conta não é armazenada no navegador. O tema utiliza a preferência de aparência existente do sistema. A leitura é revalidada na navegação, no foco e em `sessao:updated`. Estado em memória separado pela sessão/token; respostas antigas não são aplicadas a outra sessão. Falha de leitura não é interpretada como NORMAL. Uma experiência já aberta mantém o conteúdo enquanto a operação está em andamento; a mudança é avisada e aplicada na próxima navegação. Formulários têm confirmação de saída e aviso de fechamento da aba.

Leituras dedicadas recebem um identificador aleatório por requisição para não reaproveitar respostas privadas do cache NetworkFirst do PWA entre sessões. O PWA global não foi modificado.

## Cobertura por pacote

| Pacote | Implementado localmente                                                                                                                                                                                                                                                   | Pendências explícitas                                                                                                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MF-C   | Shell próprio, rotas privadas, menu desktop/móvel, página 404, estados, aba Experiência, concorrência 409 e recuperação                                                                                                                                                   | Homologação com sessão real, propagação entre dispositivos, matriz completa de teclado/zoom                                                                                                            |
| MF-D   | Listagem paginada; nove dados em três etapas; categoria pesquisável/paginada com criação sem sair; consulta de variantes; edição básica somente dos campos alterados; foto separada de até 5 MiB com retry exclusivo; reposição/descarte fracionados e histórico paginado | Criar variantes; edição avançada; reposição em lote; fornecedor na entrada; data histórica de reposição; ajuste auditado; remoção de imagem                                                            |
| MF-E   | Lista e detalhes próprios; composição de produtos/serviços; cliente opcional/crediário; revisão; pagamento único; abertura/entrada/reforço/sangria/fechamento de caixa; comprovante existente                                                                             | Pagamento composto; orçamento; devolução; cancelamento/estorno; edição integral; fiscal; fechamento discriminado por método; homologação transacional                                                  |
| MF-F   | Resumo real; lista por tipo/status/busca/período; receita/despesa manual à vista com chave idempotente; revisão; detalhes de parcelas; pagamento integral com conta/data/método                                                                                           | Parcelamento manual; baixa parcial; estorno; recorrência; transferência; cobranças; anexos; configuração de contas/categorias; homologação de métricas                                                 |
| MF-G   | Serviços listados e cadastrados; OS guiada com cliente/necessidade/itens/revisão; consulta/PDF; pessoas com cadastro, consulta e PATCH restrito de nome/contatos                                                                                                          | Faturamento/status/estorno/edição de OS; equipamento/prazo/assinatura/anexos/comunicação; edição de serviço; documentos/endereço e histórico operacional de pessoas; outras configurações e relatórios |
| MF-H   | Vendas reconhecidas, recebido, pendências, assinaturas previstas separadas, gráfico com alternativa textual, estoque baixo e OS; fontes condicionadas à permissão; período preservado no acesso aos detalhes de vendas/dinheiro                                           | Rankings; relatórios próprios; filtros adicionais; conciliação com massa isolada; validação semântica do saldo legado antes de exibi-lo                                                                |
| MF-I   | Inventário explícito com status de contratação e de cobertura; páginas `/recursos/:modulo`                                                                                                                                                                                | Todas as jornadas setoriais permanecem pendentes; os cartões não são considerados implementação                                                                                                        |

Inventário MF-I: restaurante-delivery, arena, reservas, ourives, assinaturas, loja-virtual, notas-fiscais, combos, atendimento, core-ia, whatsapp. Nenhum módulo é ativado, desativado ou cobrado por este módulo. CEO e páginas públicas ficam fora da experiência da conta.

## Contratos conferidos

Fonte: `../docs/modofacil/contratos-api.md`, incluindo a publicação final de MF-E/F/G, e handlers locais correspondentes.

- Configuração: GET/PUT `/modofacil/configuracao`, objeto direto, versão e `podeAlterar`. Resposta é validada, erro 409 pede recarga.
- Produtos: POST com `chaveOperacao` estável e PATCH `/produtos/:base/variantes/:variante/basico` sob o prefixo `/modofacil`. Edição jamais envia estoque/foto/fiscal/promoção/SKU. ProdutoBase e variante conservam identificações explícitas. Custo ausente fica null, custo zero fica zero.
- Foto: multipart `file` somente após obter `varianteId`; falha não recria produto. O cadastro pode ser repetido com a mesma chave e o mesmo corpo; uma tentativa com corpo diferente é bloqueada.
- Estoque: reposição/descarte/histórico dedicados. Reposição não envia `data`, pois o contrato restrito não a aceita. Operações com resultado incerto não são repetidas automaticamente.
- Venda: `/modofacil/vendas/caixa/finalizar-venda` recebe o contrato de PDV. Uma única chamada produz os efeitos de venda, estoque e financeiro. A tela não cria uma receita paralela.
- Caixa: contexto/abrir/movimentar/fechar pelo prefixo novo. Entrada em caixa já aberto e leitura de resumo ainda reutilizam `CaixaRepository` legado por não haver esses endpoints no adaptador novo.
- Financeiro: `/modofacil/financeiro/*`. Registro manual usa corpo fechado de lançamento à vista e chave UUID; não envia vínculo venda/OS. Pagamento altera a parcela pela operação própria. A conta financeira é escolhida explicitamente; nenhuma conta arbitrária é usada.
- Serviços/OS/pessoas: prefixo `/modofacil`, criação própria e consulta. Pessoas usam PATCH básico apenas para valores alterados; documento, endereço, tipo e status não são reenviados.
- Métricas: `/vendas/resumo/painel`, `/servicos/ordens/dashboard/painel`, `/modofacil/financeiro/resumo` e lista real de estoque baixo. O financeiro atual retorna `data.cards`, verificado no controller (o parágrafo do contrato menciona genericamente `data.resumo`; o consumidor usa os nomes reais). Nenhum dado financeiro é inferido de `/dashboard/resumo`.
- Leituras de itens para venda/OS ainda usam a tabela de variantes `/produtos`, equivalente à seleção atual; ficam isoladas no adaptador/componente próprio. Exportações de comprovante e PDF de OS reutilizam os repositórios de domínio. Nenhuma página antiga é renderizada.

**Limitação de precisão confirmada:** estoque é Decimal(12,3); itens de venda/OS são Int no domínio atual. A composição exige inteiros, explica a restrição e não oferece venda fracionada. Essa evolução exige backend próprio e não foi simulada.

## Interface de referência — 26/10/2026

A apresentação foi migrada para utilitários Tailwind nos templates, com os padrões compartilhados em `application/ui.ts`. O arquivo de CSS próprio e o bloco de CSS do layout foram removidos. A interface usa fundo claro, painéis brancos, bordas discretas, ações azuis e menu escuro recolhível.

- Menu móvel com controle de foco, Escape e conteúdo de fundo inerte; busca de páginas e acesso às buscas de pessoas, produtos e vendas, respeitando permissões.
- Dashboard com indicadores reais, gráfico de barras com alternativa textual e distribuição das ordens abertas/em andamento. A referência visual não adiciona métricas fictícias ao produto.
- Pessoas em tabela com status e ações de consulta/edição; produtos em cards com imagem ou ícone de ausência, estoque, busca e filtros compatíveis com a API; paginação numerada.
- Formulário de pessoa compacto e confirmações de descarte em diálogo nativo, estilizado com Tailwind. Fechar a aba continua usando a proteção do navegador.
- Prévia local com Tailwind e exemplos em memória. Foram conferidos dashboard, menu recolhido, tabela e filtro de pessoas, cards de produtos, busca na listagem já aberta e cancelamento do descarte preservando os campos. Tabela e produtos conferidos em viewport móvel sem transbordamento da página; a tabela permite rolagem interna.

Regressão desta revisão: 61 testes passaram em 10 arquivos. A geração do bundle de produção passou. O typecheck global continua apontando erros fora de `src/modofacil`, listados na validação anterior; não deve ser considerado aprovado.

## Revisão de todas as telas e dispositivos móveis

As páginas usam uma base compartilhada de Tailwind: `PageFrame`, `PageHeader`, `RecordsTable`, `StatusBadge`, `ReviewPanel`, `SuccessPanel` e `ModalDialog`. Não há CSS próprio nem estilos inline no módulo.

- Vendas, ordens de serviço, serviços, pessoas, financeiro e movimentos de estoque: tabelas no desktop e cards equivalentes no celular, com status, filtros e paginação. O paginador reduz o número de botões em telas pequenas.
- Cadastros e edições: largura limitada, cabeçalhos e ações consistentes, etapas em três colunas e campos em uma coluna no celular. A seleção de categoria pode ser expandida sem ocupar todo o formulário inicialmente.
- Detalhes: separação de identificação, status, valores, itens e ações. Edição de contatos, pagamentos e estornos usam diálogos; os avisos de erro e de resultado incerto permanecem dentro deles. Diálogos têm limite pela altura disponível, rolagem interna, Escape, controle nativo de foco e bloqueio de fechamento durante envio.
- Revisões e estados de sucesso compartilham componentes. Caixa e estoque pedem confirmação explícita com os valores antes da operação.

A prévia usa `previewFixtures.ts`, com 49 variações que cobrem todas as páginas, cadastros, edições e estados de detalhe. O seletor “Tela de demonstração” só existe no harness de QA. Todos os transportes ficam em memória, incluindo respostas de sucesso simuladas; nenhuma chamada usa conta ou API real. Contratos não simulados falham localmente.

Conferência em navegador: as 49 variações abriram em 320 e 360 px sem transbordamento horizontal da página. Pagamento, faturamento, estorno e edição de contatos também foram inspecionados com o diálogo aberto em tela pequena. Testes de regressão incluem cancelar estorno sem enviar requisição, manter erro dentro do modal e bloquear repetição após resultado incerto. Isso não substitui homologação de conta real ou a matriz completa de dispositivos.

## Validação

Comando pertinente: `npx vitest run src/modofacil/tests src/composables/useRouterControl.spec.ts src/layouts/moduleAccess.spec.ts`.

Cobertura: política Normal/Fácil e recuperação; ordem de todas as guardas/redirecionamentos; sessão A/B; falha sem preferência sintética; aviso de mudança remota sem limpar operação; números pt-BR e precisão; PATCH somente alterados; IDs de base/variante; chave estável em retry; foto falha com retry exclusivo; confirmação de saída mantendo dados; um único efeito de venda/OS; proteção contra cache privado do PWA. **Resultado final: 44 testes passaram em 8 arquivos** (30 novos do Modo Fácil e 14 de regressão do guard/módulos).

`npm run build` executado: Vite gerou o bundle em 53,28 s e o PWA, mas o comando composto terminou com código 1 após falha de código 2 no typecheck com diagnósticos em arquivos não alterados: Ourive/Producao, Produtos/Home, Restaurante/CardapioPublico e publicMenuCart.spec, PDVBasic, restaurante-repository. Não corrigidos neste escopo. Nenhum diagnóstico de tipo foi apontado em `src/modofacil` na execução final. Isso não equivale a typecheck global aprovado.

`git diff --check` sem erros no momento da revisão.

Inspeção visual via navegador OpenBot: dashboard e início do formulário em desktop, dashboard em 360 px; leitura de dimensões encontrou `scrollWidth=clientWidth`, sem transbordamento horizontal. As tentativas de clique falharam no driver com `No node found at given location`; interação manual de teclado/zoom e jornadas completas de navegador não foram homologadas. Os testes de componentes operam o formulário real com Vue Router em memória.

Prévia em `tests/preview.html` e `preview.vite.config.ts`: apenas dados fictícios, sem rota de produção. Execute com `npx vite --config src/modofacil/tests/preview.vite.config.ts`. Aliases de HTTP/socket impedem transportes reais mesmo após HMR; fixtures não são a fonte de dados da aplicação. Durante desenvolvimento da prévia, antes do alias HTTP, HMR recriou o cliente e tentou um GET sem autenticação na API configurada; CORS bloqueou a leitura. Não houve gravação nem uso de conta real. O isolamento permanente foi corrigido em `previewHttp.ts`.

Não houve acesso a banco, operação em conta real, commit, push ou deploy. Migração MySQL, autenticação real, transações, storage, notificações e comparação Normal/Fácil com massa fictícia continuam pendentes no ambiente isolado. Não é uma liberação para produção.

## Tema escuro, densidade e formulários em modal

O Modo Fácil usa as cores semânticas Tailwind do tema global (`bg-card`, `text-foreground`, `border-border`, `bg-muted`) e variantes `dark:` para estados coloridos. O botão de sol/lua no cabeçalho altera `colorTheme`, com a mesma persistência utilizada pelo modo Normal. Não foi criado CSS próprio.

Cadastros, edições, campos avançados e movimentações abrem por estado local no `ModalWorkspace`, usando `ModalDialog` e o `ModalView` compartilhado. Abrir e fechar não alteram a URL nem o histórico. A página de origem fica montada com seus filtros e rascunhos. Contatos, notas da OS, caixa, cadastros financeiros, pagamentos e confirmações também usam o mesmo padrão de modal. Filtros de consulta permanecem nas listagens.

A variante móvel usa o mesmo componente de diálogo com layout Tailwind de painel inferior, rolagem interna e altura limitada. Mudar de breakpoint preserva os campos. `useFlow` protege tanto saída quanto mudança de parâmetros da mesma rota e bloqueia navegação durante envio. Confirmações e opções de selects usam a mesma pilha de camadas, incluindo categoria criada dentro de outro formulário.

A busca de pessoas, produtos/variantes, serviços e categorias usa `Select2Ajax`. O adaptador recebe o contrato paginado dedicado, emite o registro completo e preserva o carregamento de mais resultados. Inputs e áreas de texto usam os componentes existentes. As opções fixas continuam em selects nativos. Não foram adicionadas dependências.

Tabelas têm células com menor espaçamento, tipografia compacta, informação secundária em linha e ações menores no desktop. No celular, os dados usam cards compactos em duas colunas e mantêm ações de toque.

Validação desta etapa: 66 testes passaram em 12 arquivos, incluindo compatibilidade de URL do Select2Ajax, paginação, retorno do registro completo, resposta atrasada, retry, troca de operação com alterações pendentes e bloqueio de saída durante envio. `npm run build-only` passou (36,50 s); typecheck global segue com erros preexistentes fora dos arquivos alterados. As 49 variações da prévia abriram em 360 px no tema escuro e em 320 px no tema claro sem transbordamento horizontal. Inclusão de produto pela busca e preservação do formulário ao cruzar o breakpoint foram verificadas no navegador com dados fictícios.

## Preservação das listagens e carregamento

`ModalWorkspace` mantém a página montada e renderiza os formulários fora do `RouterView`, a partir do estado fornecido por `modalWorkspace`. Os controles `ModalAction` passam identificador, IDs e opções diretamente ao formulário; `useFormContext` lê esses dados sem depender dos parâmetros da URL. A listagem conserva filtros, página, linhas, foco e campos ainda não aplicados. Abrir ou cancelar não navega, remonta o fundo ou repete consultas. URLs antigas de formulários apenas redirecionam para uma página válida, sem abrir modal.

`FormBack` fecha o modal por estado. `FormResultLink` fecha quando o resultado já está na página de origem ou navega para uma página de resultado diferente. `dataChanges` guarda apenas números de revisão, sem cache de registros. Gravações confirmadas invalidam o grupo correspondente; ao fechar o último modal, `usePage` busca os dados uma vez, mantendo os resultados anteriores durante a atualização. O financeiro atualiza também seu resumo. Detalhes e outros fundos são atualizados após uma gravação, sem remontagem no cancelamento.

O carregamento inicial usa `ListLoading` em Tailwind, com skeleton de tabela/cards e versão móvel. Atualizações mantêm as linhas visíveis e exibem uma barra discreta. Não aparece mensagem de lista vazia enquanto a consulta está pendente. As animações respeitam redução de movimento.

A entrada do shell usa `useExperienceEntry`: se a preferência estiver ausente, inicia a leitura na montagem e aguarda sua resposta antes de mostrar o conteúdo. Falhas permitem tentar novamente na própria tela. A tela genérica “Experiência da conta” deixou de ser o fallback de inicialização. Um contador de sessão invalida respostas pendentes de sessões encerradas e fecha a área anterior ao trocar de sessão; uma falha de atualização na mesma sessão preserva a preferência já validada.

Validação desta revisão: 79 testes passaram em 15 arquivos e `npm run build-only` passou (44,48 s, incluindo PWA). A suíte cobre identidade da instância da listagem, contagem de buscas no abrir/cancelar/salvar, preservação de filtros/página pelo X e Cancelar, acesso direto sem troca indevida da URL, estados de skeleton/atualização/erro e recuperação/concorrência da preferência. No navegador, foram conferidos tabela pronta atrás do modal, retorno à página 3 com filtro “Silva”, skeleton desktop e skeleton móvel em 360 px sem transbordamento. A opção `scenario=slow` da prévia atrasa somente leituras simuladas, sem acesso a dados reais.

## Paleta escura neutra do Modo Fácil

A paleta `darkPaletteClasses` em `application/ui.ts` define cores locais com propriedades arbitrárias Tailwind. No modo escuro, fundo preto (`#000000`), cards/cabeçalho grafite (`#121212`), sidebar quase preta (`#0A0A0A`), textos claros e bordas neutras não dependem das cores personalizadas da conta. Ações principais continuam em azul.

O contexto `form-theme` leva a mesma paleta aos controles portaled, incluindo as opções do Select2Ajax dentro de modais. Nenhuma variável global do tema da conta é alterada pelo módulo. A prévia aceita `palette=warm` e `palette=violet` para conferir visualmente essa independência; com ambas, os valores calculados do fundo, cards e sidebar permaneceram idênticos. O menu de seleção exibiu fundo `#171717` e texto `#F2F2F2`.

Nesta revisão, 79 testes passaram em 15 arquivos e o build de produção/PWA passou (45,99 s).

## Compatibilidade de consultas e configurações

`adapters/compatibleRead.ts` trata instâncias da API que ainda não publicaram algumas rotas dedicadas. Somente um 404 que identifica explicitamente uma rota ausente permite consultar o caminho autenticado equivalente da interface completa. O mapa é restrito a consultas com o mesmo handler e contrato; preserva filtros, paginação e identificador privado de leitura. Falhas de autenticação, permissão, rede, servidor e registros não encontrados não acionam essa alternativa. A ausência não é memorizada entre consultas ou sessões.

As configurações operacionais usam `createOperationalSettingsApi`, com estado local à página. Quando a leitura dedicada está indisponível, carrega `/contas/parametros`, projeta apenas as preferências operacionais e usa o salvamento já existente da interface completa. Apenas campos revisados e validados são enviados; credenciais e personalização visual não entram no formulário nem no payload. O caminho de gravação é escolhido após uma leitura bem-sucedida; nenhuma gravação é repetida automaticamente em outra rota. Falha ao recarregar oculta o formulário anterior.

Contratos restritos de edição, históricos com escopo próprio e operações transacionais continuam exigindo a API dedicada atualizada. Erros 404 genéricos recebem uma mensagem em português, sem ocultar mensagens específicas do servidor. A preferência NORMAL/FACIL continua sem fallback sintético.

A prévia isolada aceita `scenario=legacy`, que devolve 404 para as rotas dedicadas e atende os caminhos equivalentes com dados fictícios. Foram conferidos no navegador o carregamento e salvamento revisado das configurações e a listagem financeira. Nenhuma operação foi enviada à API real configurada em outra instância; sua atualização permanece necessária para os contratos novos sem equivalente.

Validação desta correção: 104 testes passaram em 16 arquivos; build de produção/PWA aprovado (58,97 s). Configurações também conferidas em 360 px, sem erro e sem transbordamento horizontal. A checagem global de tipos terminou com os erros preexistentes em Ourive, Produtos, Restaurante e PDV; não apontou diagnósticos no Modo Fácil. Capturas da prévia em `/tmp/modofacil-configuracoes-404-corrigido.jpg` e `/tmp/modofacil-configuracoes-404-celular.jpg`.

## Ciclo dos modais por estado

O estado pertence ao layout e é descartado ao trocar de sessão. A permissão de cada operação é conferida ao abrir, já que o formulário não passa mais pelas guardas de uma rota. Os endpoints continuam aplicando suas autorizações e validações existentes. Nenhum parâmetro de formulário é acrescentado à URL. Navegar para uma página de verdade continua sujeito à confirmação de descarte; os diálogos são limpos somente depois de a navegação ser concluída.

A pilha mantém o formulário anterior montado quando um cadastro auxiliar é aberto. Cancelar o fornecedor dentro da reposição, por exemplo, devolve o produto e a quantidade já preenchidos. A confirmação de saída consulta as guardas locais; envio em andamento bloqueia fechamento, navegação e abertura de outra operação. O indicador de rascunho considera todos os formulários montados.

O editor de nome e contato da pessoa foi extraído para `PersonContactFormPage`, reutilizado pela listagem e pelos detalhes. A antiga query `editar=1` não controla mais um modal. Os demais formulários e seus contratos de gravação foram preservados.

Validação: 111 testes passaram em 16 arquivos. A suíte verifica URL sem alterações, ausência de push/replace ao abrir e cancelar, identidade dos campos da listagem, filtros e página preservados, atualização única após salvar, IDs/opções por estado, descarte recusado, envio bloqueado, permissões e cadastro auxiliar sem perder o rascunho. O formulário real de contato também foi exercitado com gravação somente do campo alterado. Build de produção/PWA aprovado (aproximadamente 62 s). A checagem global de tipos segue com os erros preexistentes fora do Modo Fácil; nenhum diagnóstico nos arquivos desta alteração.

Na prévia com dados fictícios, foram conferidos Novo produto, edição da variante, reposição com cadastro auxiliar de fornecedor, confirmação de descarte e layout de 360 px sem transbordamento. As capturas estão em `/tmp/modofacil-modal-por-estado.jpg` e `/tmp/modofacil-modal-estado-celular.jpg`. Nenhuma gravação foi enviada à API real.

## Navegação, controles shadcn e consulta financeira — 27/10/2026

A troca de página mostra o destino em um indicador de carregamento e no ícone do menu. `useMenuLoading` começa no clique, antes das guardas assíncronas e dos imports das páginas, e encerra na conclusão, no cancelamento ou no erro. Consultas das páginas continuam usando seus estados de skeleton e atualização; a indicação não remonta a página de fundo dos modais. Cliques com modificadores e acessos à página já aberta não iniciam o indicador.

`RecordsTable` e a alternativa textual do gráfico usam os componentes Table do shadcn existentes no projeto. Cabeçalhos, espaçamento, informações secundárias e ações seguem a mesma base. No celular, as listagens mantêm os cards equivalentes e a paginação.

Todos os selects das páginas e formulários usam `FormSelect`, composto pelos componentes Select existentes. Valores de IDs numéricos, filtros vazios e padrões nulos são preservados; a codificação interna evita o valor vazio reservado pelo Reka. O controle conserva a validação obrigatória e avisa o formulário quando há alteração. `FormSwitch` reutiliza o Switch existente com o mesmo aviso de alteração para a proteção de rascunhos. Inputs, inclusive busca global e arquivos, usam Input; áreas de texto continuam usando Textarea. Os estilos gerais do módulo deixaram de sobrescrever as dimensões, bordas e estados dos controles. Os rádios visuais de escolha da experiência mantêm sua função de seleção entre modos.

Os formulários de cadastro e contato de pessoas e de lançamento financeiro têm seções de identificação, contato e organização financeira. Parcelamento, recorrência e vínculo opcional ficam em grupos próprios. As ações dos formulários em modal compartilham alinhamento, separador e posição durante a rolagem. A versão móvel usa uma coluna e mantém os campos ao cruzar o breakpoint.

A listagem financeira passa a abrir com **todas as datas** quando a URL não contém um período. Antes, o período automático do início do mês até hoje ocultava registros anteriores e futuros e podia apresentar a lista como vazia. Períodos explícitos continuam sendo respeitados. “Limpar filtros” remove período, tipo, situação e busca, retornando à primeira página. A página solicitada na URL é preservada na entrada. Períodos invertidos são rejeitados antes da consulta. O resumo informa seu período próprio (mês atual por padrão da API) e possui erro e retry independentes, sem impedir a exibição dos lançamentos.

Validação: 123 testes passaram em 19 arquivos; build de produção e geração do PWA aprovados. A suíte cobre consulta sem período implícito, limpeza de filtros, paginação inicial, falha do resumo, período invertido, tipos de valores dos Selects, validação obrigatória, reset externo, Switch e finalização/cancelamento/erro de navegação, além dos fluxos anteriores. No navegador, a prévia isolada confirmou lançamentos, tabela de pessoas, Select dentro de modal, Switch com confirmação de descarte, formulário em 360 px sem transbordamento e preservação de campo ao retornar ao desktop. Captura com dados fictícios: `/tmp/modofacil-formularios-padronizados.png`. Não houve operação na API real durante a conferência visual.

A checagem global de tipos ainda apontou os diagnósticos preexistentes em Ourive, Produtos, Restaurante e PDV; não deve ser considerada aprovada. O log final não apontou diagnósticos em `src/modofacil`.

### Alinhamento entre rótulos e controles

O espaçamento vertical é aplicado diretamente aos controles e wrappers dentro dos labels, em vez de depender de `space-y` entre elementos. Assim, rótulos em texto puro e rótulos com asterisco obrigatório têm os mesmos 6 px até Input, Select, Textarea ou campo composto. A regra compartilhada vale para páginas, filtros e modais. Filtros com rótulos visualmente ocultos conservam a margem zero explícita; Switches e rádios conservam seu alinhamento. Na prévia, os quatro campos do cadastro de pessoas apresentaram o mesmo deslocamento vertical (22 px desde o início do label) e altura de 36 px; os sete campos do lançamento financeiro apresentaram margem de 6 px no desktop e em 360 px, sem transbordamento horizontal. Os 20 testes de controles, produtos e modais passaram nesta correção.

### Carregamento centralizado na troca de página

`NavigationViewport` substitui o indicador em faixa pelo SVG `assets/infinite-spinner.svg`, copiado sem alterações do arquivo fornecido. Durante a navegação, o conteúdo anterior fica invisível, inerte e fora da árvore acessível, enquanto o SVG ocupa o centro da área disponível entre o cabeçalho e o rodapé da janela. A centralização acompanha o menu expandido/recolhido; no celular o menu fecha assim que a navegação começa. A página permanece montada, conservando campos e posição caso a guarda recuse a saída. O rótulo do destino é anunciado somente a leitores de tela. A preferência de redução de movimento exibe uma versão estática do mesmo desenho.

A prévia isolada aceita `scenario=slow-navigation`, que atrasa apenas a navegação simulada para permitir a conferência visual; não adiciona atraso à aplicação. Conferidos SVG centralizado, conteúdo oculto e fechamento do menu em 360 px. Regressão: 125 testes passaram em 20 arquivos, incluindo preservação do rascunho durante o carregamento e restauração depois do cancelamento. Captura com dados fictícios: `/tmp/modofacil-load-centralizado.png`.

## Busca em todos os selects e catálogos paginados

`FormSelect` agora usa o `Select2Ajax` compartilhado também para opções fixas. A busca local ignora acentos e diferenças entre maiúsculas e minúsculas, sem transformar filtros vazios, booleanos, padrões nulos ou IDs numéricos em outros tipos. O campo de busca mantém navegação por teclado; Escape fecha somente o select. Mudanças de seleção continuam sinalizando o rascunho do formulário.

Categorias de produtos, categorias financeiras e contas financeiras consultam a API por busca/página, com 20 opções por vez e “Carregar mais opções”. Os endpoints autenticados são `/modofacil/produtos/categorias/opcoes`, `/modofacil/financeiro/categorias/opcoes` e `/modofacil/financeiro/contas/opcoes`. Aceitam `search`, `page`, `id` e `excludeId`; devolvem `{ results: [{ id, label }], hasMore }`. A consulta por ID recupera a seleção existente mesmo fora da primeira página. Cada consulta usa o escopo da conta autenticada, projeção de ID/nome, ordem estável e limite de 21 linhas para identificar a próxima página. Seletores de produto exigem nível 4; financeiros exigem nível 3. Falhas permitem retry no próprio campo.

Cadastros e edições financeiras, parcelas, faturamento, transferências, categoria superior e configurações operacionais deixaram de buscar catálogos completos apenas para montar selects. `useLookupOptions` retém somente as páginas e seleções consultadas pelo formulário para mostrar os nomes na revisão. Os cadastros de catálogo continuam usando seus contratos de listagem. O Select2Ajax preserva uma opção selecionada fora do resultado atual para manter rótulo e validação obrigatória, sem exibi-la como um resultado da nova busca.

**Publicação:** frontend e API devem acompanhar esta alteração. Os novos endpoints de opções não simulam paginação sobre listas integrais. A compatibilidade com APIs anteriores está descrita abaixo.

Validação: 131 testes de frontend passaram em 22 arquivos; 168 testes da API passaram. Build frontend/PWA e bundle da API aprovados. Foram verificados busca local sem acentos, busca remota, paginação, seleção distante por ID, validação obrigatória, filtros vazios, retry e isolamento/permissões da conta. No navegador, a categoria fictícia 45 foi encontrada fora das primeiras páginas e selecionada; busca e carregamento adicional também foram conferidos em 360 px. A prévia usa somente dados fictícios; captura em `/tmp/modofacil-selects-com-busca.png`.

A checagem global de tipos desta revisão apontou somente os diagnósticos preexistentes fora do Modo Fácil; continua sem aprovação global. A checagem isolada de tipos do serviço de opções da API passou.

## Placeholders nos formulários

Os inputs de texto, busca, telefone, e-mail, números e valores e todas as áreas de texto têm placeholders contextuais. Descrições financeiras distinguem receita/despesa; cadastros financeiros distinguem conta/categoria. `fieldPlaceholder` também orienta os campos dinâmicos de identificação, endereço e dados fiscais, respeitando a precisão dos números definidos em `FieldDefinition`. Placeholders existentes foram preservados. Datas conservam o seletor nativo, com atributo de formato; cor e upload usam seus controles nativos, que não exibem placeholders de texto.

Auditoria dos templates: 110 campos com placeholder estático ou dinâmico, sem ausência nos controles aplicáveis. Regressão: 28 testes de produto, modais e operações passaram; build frontend/PWA aprovado. O cadastro de serviço foi conferido no desktop e em 360 px com nome, preço e descrição vazios, mostrando os exemplos. Captura em `/tmp/modofacil-placeholders.png`, somente com dados fictícios.

## Aparência dos links de ação

Links diretos dentro de `mf-actions` e links avulsos marcados com `mf-button` compartilham borda, fundo, altura, espaçamento, foco e cor dos botões. A regra de cor dos links de texto exclui essas ações, inclusive no tema escuro. A padronização abrange configurações, operações de vendas, produtos, serviços, financeiro, cobranças, relatórios, recursos, retorno de formulários e ações nas tabelas. Links de nomes de registros e de retorno no cabeçalho conservam sua apresentação de navegação.

As abas de configurações indicam a seleção visualmente e por `aria-pressed`. Os cartões Normal/Modo Fácil mantêm o layout flex mesmo sob a regra geral dos labels. Em 360 px, ações de barras ocupam a largura disponível e mantêm pelo menos 44 px de altura; no desktop, as ações conferidas têm 40 px.

Validação: 26 testes de workspace, operações e carregamento de listas passaram; build de produção/PWA e formatação aprovados. Conferência visual da configuração no tema escuro, configuração da empresa, versão móvel sem transbordamento e navegação por Ver detalhes do financeiro, usando somente dados fictícios. Captura: `/tmp/modofacil-botoes-padronizados.png`.

## Compatibilidade de categorias e contas no SelectAjax

Quando a API responde explicitamente que a rota de opções não existe (404 de rota), a leitura usa o SelectAjax autenticado já existente: `/lancamentos/categorias/select2`, `/lancamentos/contas/select2` ou `/produtos/categorias/select2`. Busca e recuperação por ID continuam no servidor, sem baixar o catálogo integral. A rota dedicada continua sendo preferida a cada consulta e mantém paginação. Nas APIs antigas, que limitam a lista e não informam `hasMore`, o usuário encontra outros itens pela busca; a interface não oferece paginação fictícia. Metadados como o caminho hierárquico da categoria são preservados. A categoria em edição é excluída do seletor de categoria superior mesmo quando a API antiga ignora `excludeId`.

Falhas de rede, autenticação, permissão, servidor e registro inexistente não acionam a alternativa. Os erros reais continuam disponíveis para retry. Não houve confirmação da resposta autenticada da instância do usuário; a conferência visual usa `scenario=legacy`, que reproduz a ausência das rotas novas e devolve somente dados fictícios.

Validação: 40 testes passaram e build de produção/PWA aprovado, incluindo consulta HTTP através do adaptador real do catálogo, compatibilidade das três rotas, busca, seleção por ID, paginação dedicada e preservação dos erros 401/403/500. No navegador, categoria de exemplo 45 encontrada fora da lista inicial e conta financeira selecionada sem alertas de falha. Captura: `/tmp/modofacil-categorias-contas-corrigidas.png`.

### Diagnóstico do processo local da API

Na investigação do erro de carregamento, o processo HTTP da API ainda tinha início em 27/10/2026 às 08:19, anterior à inclusão das rotas de opções às 08:50. O watcher não havia reiniciado o processo após essas alterações. O arquivo de entrada foi tocado sem mudança de conteúdo, acionando o watcher; o novo processo iniciou às 09:22 e voltou a atender na porta 3000. Não houve alteração de autenticação, permissões, CORS ou registros.

Uma execução somente de leitura do serviço `selectOptions` contra o banco configurado retornou categorias financeiras, contas financeiras e categorias de produtos, incluindo buscas. Foram exibidas somente contagens, sem nomes ou credenciais. As chamadas HTTP sem token às rotas de categorias e contas responderam 401 normalmente e permitiram as origens localhost/LAN configuradas. Isso verifica disponibilidade e CORS, sem afirmar uma sessão HTTP autenticada que não estava disponível no navegador automatizado. Os 11 testes de serviço e HTTP dos endpoints passaram.

## Auditoria de todos os seletores — 27/10/2026

O inventário dos templates encontrou 48 usos de `FormSelect`, dez usos de `ItemSearch` e um de `CategoryPicker`, em 33 arquivos. Os três wrappers usam `Select2Ajax` com os componentes Select/Input do shadcn existentes; não restam selects nativos visíveis no módulo. Os campos dinâmicos de configurações e informações adicionais também passam por `FormSelect`.

| Família | Fonte de opções | Conferência |
| --- | --- | --- |
| Situação, tipo, unidades, pagamentos, frequência e demais opções fixas | Opções locais de `FormSelect` | Busca sem acentos, valores vazios/nulos, tipos preservados e alteração das opções |
| Categorias financeiras e contas | Rotas `/modofacil/financeiro/{categorias,contas}/opcoes` | Consulta real limitada, busca, seleção por ID, paginação e compatibilidade SelectAjax |
| Categorias de produtos | `/modofacil/produtos/categorias/opcoes` | Busca e ID real; rótulo de outra categoria não é reutilizado |
| Pessoas e fornecedores | `/modofacil/pessoas` e leitura equivalente | Busca paginada; filtro `tipo` aplicado no servidor antes da contagem/paginação |
| Produtos e variantes | `/produtos`, `listingMode=variante` | Consulta real, busca, paginação e registro completo para inclusão |
| Serviços | `/modofacil/servicos` e leitura equivalente | Consulta real, busca, paginação e troca da fonte ao mudar o tipo do item |
| Terminais de caixa | Contexto do caixa | Lista do contexto consumida como opções locais pesquisáveis, incluindo ausência de terminal |

Uma nova busca remove imediatamente as opções anteriores, invalida respostas atrasadas e mostra carregamento durante o debounce. A seleção recuperada por ID permanece no campo e na validação nativa, sem entrar indevidamente nos resultados de outra busca. A recuperação de seleção exige correspondência do ID; não usa o primeiro registro arbitrário retornado. Erros da lista e da seleção são independentes, e retry tenta ambas as leituras. Alterações das opções locais atualizam o nome selecionado; opções removidas são sinalizadas sem alterar silenciosamente o valor do formulário. Mudanças de URL, parâmetros ou loader recarregam a fonte. Contratos inválidos geram erro em vez de uma lista vazia aparente. SelectAjax por URL agora envia página e conserva `hasMore` quando a API oferece paginação.

A busca de fornecedores envia `tipo=FORNECEDOR`; a listagem de pessoas aplica o filtro junto ao escopo da conta antes de contar e paginar. Em API antiga, itens de outro tipo continuam desabilitados como proteção. A troca do tipo da busca remonta o seletor para não reutilizar opções de outra fonte.

Validação: 138 testes de frontend (22 arquivos) e 62 testes do módulo da API passaram; build frontend/PWA, bundle da API e tipos isolados do filtro de pessoas aprovados. A checagem global de tipos continua com os diagnósticos preexistentes em Ourive, Produtos, Restaurante, PDV e repositório de restaurante; não houve diagnóstico no Modo Fácil ou no Select2Ajax alterado. Leituras limitadas no banco configurado confirmaram as seis fontes remotas, sem gravar registros nem exibir dados dos itens. A API de desenvolvimento foi recarregada para incorporar o filtro.

No navegador isolado, foram conferidos carregamento adicional e busca de categoria fora das páginas iniciais, seleção fixa pesquisável, lista contendo somente fornecedor, escolha de fornecedor e troca de produto para serviço. Em 360 px o popup ficou contido na tela. Capturas com dados fictícios: `/tmp/modofacil-selects-revisados.png` e `/tmp/modofacil-selects-mobile.png`.

## Pendências de tipos resolvidas

A checagem global de tipos passou sem diagnósticos após corrigir as pendências registradas acima. Ourive usa substituição compatível com ES2020; o botão Novo Produto chama a ação sem passar MouseEvent como parâmetro de categoria obrigatória. O cardápio público tem contrato próprio para os produtos projetados pela API, e sua lista mantém os campos de preços e grupos após a deduplicação. O cálculo de recompensas captura o ID validado antes de usá-lo no callback. O Select do PDV aceita somente métodos de pagamento reconhecidos antes de atualizar o estado. O import duplicado de ThemeCustomization foi removido e a fixture de preço cobre itens vinculados e avulsos.

Os testes antigos da seleção de produtos passaram a fornecer o contexto de rota, aguardar os imports na preparação e concluir as promessas antes das asserções; seleção, estado parcial e paginação voltaram a ser verificados. Validação final: `npm run type-check` aprovado, build de produção/PWA aprovado e 186 testes nas suítes verificadas de Modo Fácil, Restaurante, Caixa, Ourive e Produtos passaram.

## Auditoria dos fluxos e formulários — 27/10/2026

A conferência cobriu a abertura das 50 telas/cenários da prévia em desktop e em 360 px, incluindo os 24 formulários registrados no workspace. Não foram encontrados alertas inesperados de carregamento ou transbordamento horizontal nessa matriz. Os fluxos de envio usam os componentes reais dos formulários, seletores e adaptadores, com transporte HTTP simulado para verificar os dados enviados sem alterar registros reais.

Correções encontradas durante o exercício dos fluxos:

- Produto, variante, serviço, parcela, recorrência e cobrança recuperam a leitura ao clicar em Tentar novamente. Edições com falha inicial não liberam um formulário vazio.
- A cobrança vinculada à venda usa o campo `valor` do contrato de vendas para preencher o valor inicial.
- O caixa abre movimentos com uma opção válida selecionada. Depósito está disponível nos seletores financeiros de cadastro, edição e pagamento, preservando o valor `DEPOSITO` do contrato.
- O componente de pagamentos permite crediário por padrão nas vendas. A propriedade booleana opcional anteriormente assumia `false` e ocultava a opção; faturamentos que explicitamente recusam crediário continuam respeitando essa configuração.
- Valores, datas e descontos são validados antes de enviar ou avançar para revisão. Erros locais permitem corrigir os campos; trocar parcelamento por parcela única ignora os campos ocultos da modalidade anterior.
- Cadastros de pessoa e serviço, abertura de OS e movimentos de caixa bloqueiam repetição após falha de rede ou resposta 5xx com resultado incerto, seguindo a proteção já usada nos demais fluxos.

`formFlows.spec.ts` acrescenta 59 casos para envio, edição, retry e validação. Inclui pessoas, produtos/variantes e campos adicionais, serviços/OS, vendas e crediário, estoque individual/em lote, caixa, configurações, contas/categorias financeiras, lançamentos simples/parcelados/recorrentes, parcelas, cobranças, geração/pausa/retomada/encerramento de recorrência e transferências com prévia dos vínculos afetados. Os seletores são exercitados nos formulários; busca remota, busca local sem acentos, paginação, seleção por ID e falhas de carregamento continuam cobertas pelas suítes específicas.

Validação: 197 testes de frontend em 23 arquivos e 170 testes da API passaram; checagem global de tipos e build de produção/PWA aprovados. No navegador, foram exercitados cadastro de pessoa com e-mail inválido/correção, retry de edição, busca de categoria fora da página inicial, seleção de depósito, correção de valor zero antes de revisar, confirmação financeira, retorno à lista e venda a prazo com cliente obrigatório e três parcelas. Toda a prévia usa dados fictícios e transporte isolado; não foram criados registros reais ou acionados gateways de pagamento.

Evidências locais: `/tmp/modofacil-fluxos-telas.json`, `/tmp/modofacil-fluxos-mobile.json`, `/tmp/modofacil-fluxos-retry.png` e `/tmp/modofacil-fluxos-validados.png`.

## Interface baseada no Hotspot CAS — 27/10/2026

A referência visual foi conferida após o login feito pelo usuário em `https://hotspot.cas.net.br/dashboard`: dashboard, sidebar, listagens e modal de cadastro. Foram medidos os tokens de cor, a fonte Sora, a sidebar de 288 px, o cabeçalho de 65 px, os campos de 40 px e o espaçamento de 8 px entre label e controle. Não foram salvas alterações no sistema de referência.

O Modo Fácil usa esses padrões no layout e nos componentes compartilhados: sidebar com grupos recolhíveis de Cadastros, Operação e Sistema, seleção azul, hierarquia por recuo, identificação da conta no rodapé, cabeçalho compacto com busca, títulos de seção, cards de indicadores, tabelas e formulários. O carregamento de navegação acompanha as novas medidas do cabeçalho e do menu (288 px aberto / 80 px recolhido). A busca fica acessível por botão no celular; a navegação móvel filtra controles ocultos ao prender o foco e abre o grupo da página acessada.

Os estilos de `assets/interface.css` são limitados a `.mf-theme` e `.mf-surface`, incluindo os selects renderizados por portal. O tema escuro usa os tokens medidos: fundo `222 47% 7%`, cards `222 44% 10%`, bordas `217 33% 20%` e azul primário `213 94% 56%`. O tema claro usa a mesma hierarquia com superfícies claras. Os arquivos Sora Regular, Medium, Bold e ExtraBold já existentes em `/public/fonts/Sora` são registrados com pesos corretos sob o alias local `Sora Modo Facil`, preservando a configuração tipográfica da interface Normal. Não há dependência de fonte externa.

Validação: 197 testes de frontend aprovados, checagem global de tipos e build/PWA aprovados. No navegador foram conferidos desktop, temas claro/escuro, sidebar recolhida e móvel, grupos, busca de páginas, abertura/fechamento de modal e pesquisa do SelectAjax. As 50 telas/cenários da prévia passaram em 360 px sem transbordamento horizontal ou alertas inesperados. A conferência usa dados fictícios e transporte isolado.

Evidências: `/tmp/modofacil-ui-sora-dashboard.png`, `/tmp/modofacil-ui-sora-claro.png`, `/tmp/modofacil-ui-sora-formulario.png`, `/tmp/modofacil-ui-sora-mobile.png`, `/tmp/modofacil-ui-sora-select-mobile.png` e `/tmp/modofacil-ui-sora-auditoria-mobile.json`.

## Revisão das telas e detalhes financeiros

Categorias de produtos, contas/categorias financeiras, cobranças e resultados dos relatórios passaram a usar `RecordsTable`, incluindo cabeçalho, espaçamento, alinhamento de valores, estados de carregamento/vazio e cartões na versão móvel. Cobranças usam a paginação compartilhada e conservam links de origem, consulta do Pix e confirmação de cancelamento/estorno. O cabeçalho dos detalhes de produto usa `PageHeader`.

Os rodapés de formulário são identificados por `mf-form-actions`. Somente esses rodapés recebem a apresentação fixa dentro dos modais; barras de operação e blocos internos deixam de receber esse estilo indevidamente. O cadastro de categoria tem um formulário simples com campo e rodapé separados. Labels, campo de categoria, botão de criação, destaques de valores e espaçamento dos blocos seguem os componentes comuns. As consultas de Pix na lista e no resultado de criação da cobrança usam `modelValue` no Textarea: a propriedade `value` deixava o conteúdo vazio.

O detalhe do lançamento separa identificação, resumo, dados do cadastro, recorrência, parcelas e cobranças vinculadas. Mostra total registrado, valor pago/recebido, saldo em aberto, atraso, progresso de quitação, conta, categoria, cliente/fornecedor, método previsto, datas, valor bruto, desconto, entrada e vínculos quando retornados pela API. Os dados de pagamento de cada parcela distinguem data, método, valor efetivo e conta utilizada.

As parcelas têm tabela compacta, busca por número/código/descrição, filtro de situação e páginas de dez itens. Registrar pagamento continua visível; editar, criar cobrança e estornar ficam no menu Ações da linha, com tema local e portal para evitar corte pela tabela. No cenário conferido, cada linha ocupou aproximadamente 60 px. Os totais usam centavos, não somam a entrada novamente e excluem parcelas/lançamentos ignorados dos resumos, mantendo-os identificados na lista. O atraso compara o dia do vencimento; a parcela de hoje permanece pendente. O progresso usa os valores das parcelas consideradas.

Validação: 206 testes de frontend em 24 arquivos aprovados, incluindo nove casos novos para totais, ignorados, atraso, centavos, dados/vínculos, filtro/paginação, ação da parcela, registro ausente e Pix/confirmacão da cobrança. Checagem global de tipos, build/PWA e `git diff --check` aprovados. As 50 telas/cenários foram conferidas novamente em 1440 px e em 360 px, sem transbordamento horizontal ou alertas inesperados. Menus de ações, abertura de edição, modal de categoria, relatórios e detalhes financeiros foram conferidos por interação. As verificações usam dados fictícios e transporte isolado; não houve gravação de registros reais nem acionamento de gateways.

Evidências: `/tmp/modofacil-revisao-desktop.json`, `/tmp/modofacil-revisao-mobile.json`, `/tmp/modofacil-lancamento-detalhes-final.png` e `/tmp/modofacil-lancamento-detalhes-mobile.png`.

## Financeiro compacto e resumos vinculados à tabela — 27/10/2026

Os quatro cards de resumo usam cerca de 74 px de altura. Os filtros ocupam uma linha no desktop amplo e ficam recolhidos sob o botão Filtros no celular. Contas/categorias, transferência, cobranças e relatórios estão no menu Ações, liberando espaço para os lançamentos. O período, a seleção ativa e a quantidade de registros permanecem identificados.

Recebido e Pago consultam parcelas efetivadas pela data de pagamento; A receber e A pagar consultam parcelas abertas pelo vencimento. O clique conserva os limites exatos do período do resumo, limpa a busca anterior e volta à primeira página. A tabela mostra somente os lançamentos com parcelas correspondentes e o valor dessas parcelas na coluna Valor no período. Assim, pagamentos de lançamentos antigos e parcelas de lançamentos parciais também compõem corretamente o resultado. O status exibido continua sendo o estado geral do lançamento. Clicar novamente no card ou remover a seleção restaura a listagem sem período; mudanças manuais nos filtros voltam à consulta normal por data de lançamento.

A API financeira aceita `resumo=RECEBIDO|PAGO|A_RECEBER|A_PAGAR`, preserva o isolamento por conta e acrescenta `valorResumo`/`parcelasResumo` somente nesse modo. O comportamento anterior das consultas sem resumo foi preservado. Frontend e API devem ser publicados juntos para disponibilizar esse filtro; não há migração de banco.

Validação: regressão de 214 testes do frontend aprovada, seguida de 13 testes específicos da lista financeira (incluindo um caso adicional para edição de datas após selecionar um resumo); 178 testes da API aprovados. Checagem global de tipos do frontend, checagem dos novos filtros da API, build/PWA do frontend e build da API aprovados. No navegador foram conferidos os quatro cards, seus valores por parcela, menu de operações, temas claro/escuro, filtros recolhidos/expandidos e busca do select em 360 px. A prévia usa dados fictícios e transporte isolado, sem operações financeiras reais.

Evidências: `/tmp/modofacil-financeiro-compacto.png`, `/tmp/modofacil-financeiro-compacto-mobile.png` e `/tmp/modofacil-financeiro-cards-auditoria.json`.

## Detalhes de vendas e produtos no padrão financeiro — 27/10/2026

Os detalhes de venda e produto usam cabeçalho com retorno e ações, resumos compactos (`DetailMetrics`), informações em `mf-info-grid` e tabelas compartilhadas. Itens de venda e variantes têm busca e paginação local de dez linhas, mantendo os totais gerais durante a pesquisa.

A venda apresenta total registrado, subtotal dos itens, desconto, quantidade, cliente com vínculo, vendedor, data, garantia, observações e datas de cadastro/atualização quando disponíveis. Pagamentos simples e compostos usam uma tabela com forma e valor registrados; a situação EFETIVADO recebe o rótulo Efetivado. Os lançamentos vinculados mostram situação, total e saldo em aberto das parcelas consideradas, com acesso ao financeiro. O faturamento não volta a ficar disponível apenas porque um registro FATURADO possui o booleano legado inconsistente. Os diálogos de recebimento e estorno conservam confirmação, tratamento de erro e bloqueio de repetição incerta.

Combos registrados separadamente são incluídos nos itens e no subtotal. Quando a venda da loja já possui uma linha com o mesmo snapshot do combo (sem produto/serviço, mesmo nome, quantidade e preço), essa linha é aproveitada uma única vez, evitando duplicar o total.

O produto apresenta faixa de preços, quantidade de variantes, estoque controlado agrupado por unidade e variantes no mínimo ou abaixo. Estoques de unidades diferentes não são somados em um número único. A tabela de variantes mostra identificação/SKU, situação, preço regular/promocional válido, estoque/mínimo e custo, distinguindo custo zero de custo desconhecido. Busca por nome, código/SKU e ID e filtro por situação/estoque baixo facilitam localizar variantes.

Ver dados abre um diálogo de consulta da variante; editar, repor, descartar e histórico ficam no menu Ações da linha. Os dados fiscais comuns são consultados uma vez no produto, separados dos campos específicos da variante. Grupos adicionais exibem campos preenchidos (incluindo zero e falso), com estado vazio explícito quando não há informações. As leituras validam o registro e o contrato das variantes antes de liberar a página, permitindo recuperar falhas pelo botão Tentar novamente.

Validação: 227 testes de frontend aprovados em 25 arquivos, incluindo 12 casos dos detalhes para informações, pagamentos compostos/legados, combos, parcelas ignoradas, busca/paginação, estoque, promoção, criação e recuperação de leitura. Os 12 casos específicos passaram novamente após a revisão dos grupos adicionais. Checagem global de tipos e build/PWA aprovados. No navegador foram conferidos desktop e 360 px, temas claro/escuro, pesquisa dos itens, menu da variante, abertura da edição correta e diálogo de consulta móvel. A prévia usa dados fictícios e transporte isolado, sem gravação de registros reais.

Evidências: `/tmp/modofacil-venda-detalhes.png`, `/tmp/modofacil-produto-detalhes.png`, `/tmp/modofacil-venda-detalhes-mobile.png`, `/tmp/modofacil-produto-detalhes-mobile.png` e `/tmp/modofacil-venda-detalhes-escuro.png`.

## Carregamento ilustrado do dashboard — 27/10/2026

O dashboard usa `DashboardLoading` com o SVG local `assets/dashboard-loading.svg`: painel com barras animadas, tendência e órbita em azul/ciano. O carregamento fica centralizado na área útil e substitui o conteúdo tanto na entrada quanto na atualização do período. Permanece enquanto qualquer consulta autorizada estiver pendente; não há tempo mínimo ou atraso artificial em produção. Falhas parciais encerram o carregamento e mantêm a recuperação pelo Feedback. A animação respeita `prefers-reduced-motion`; o status é anunciado com texto acessível, sem repetir a ilustração.

Validação: quatro testes para espera da última consulta, ocultação dos indicadores anteriores na atualização, falha parcial com retry e ausência de consultas sem permissão. Checagem global de tipos e build/PWA aprovados. Conferência no navegador em desktop e 360 px, temas claro/escuro e transição para os dados carregados. O cenário isolado `dashboard-loading` simula rede lenta somente na prévia local.

Evidências: `/tmp/modofacil-dashboard-carregando.png`, `/tmp/modofacil-dashboard-carregando-mobile.png` e `/tmp/modofacil-dashboard-carregando-escuro.png`.

## Caixa reorganizado — 27/10/2026

A página de caixa usa a largura padrão do Modo Fácil, cabeçalho com retorno para Vendas, atualização e nova venda. O turno identifica código, terminal, responsável, abertura e saldo inicial. Quatro indicadores mostram saldo esperado, vendas, reforços e retiradas, usando os totais retornados pela API sem confundir as vendas por forma de pagamento com o saldo operacional do caixa.

O histórico permanece visível em RecordsTable, com data/hora, descrição, tipo, valor e vínculo da venda quando disponível. Busca sem acentos, filtro por movimento e páginas de dez registros permitem consultar o turno sem alterar seus totais. As operações Adicionar dinheiro, Retirar dinheiro e Fechar caixa têm atalhos próprios; no celular, aparecem antes do histórico. Os totais por forma de pagamento ficam em uma seção separada.

Os atalhos abrem o formulário com a operação correta e campos reiniciados. A abertura mantém saldo inicial zero válido; movimentos exigem valor positivo. O fechamento mostra o saldo esperado e a diferença em centavos somente depois de informar um valor contado válido. Confirmação e bloqueio após resultado incerto foram preservados. A consulta limpa o resumo anterior antes de atualizar, evitando exibir movimentos de um turno que deixou de estar ativo. Falhas no resumo mantêm a recuperação pelo Feedback e não exibem totais antigos.

Sem caixa ativo, a página oferece abertura ou uma tabela de caixas disponíveis com terminal, responsável e horário. O cabeçalho identifica Caixa e mantém Vendas selecionado na navegação.

Validação: 242 testes do frontend aprovados em 27 arquivos, incluindo 11 casos específicos da página e os fluxos de confirmação/cancelamento/erro dos formulários. Checagem global de tipos e build de produção/PWA aprovados. No navegador foram conferidos turno aberto, caixa ainda fechado, caixas disponíveis, pesquisa, atalhos, conferência de diferença, modal móvel e temas claro/escuro. As verificações usam dados fictícios e transporte isolado; nenhuma operação real de caixa foi executada.

Evidências: `/tmp/modofacil-caixa-revisado.png`, `/tmp/modofacil-caixa-revisado-escuro.png`, `/tmp/modofacil-caixa-fechamento.png`, `/tmp/modofacil-caixa-revisado-mobile.png` e `/tmp/modofacil-caixa-acoes-mobile.png`.

## Exclusão de vendas, lançamentos, produtos e serviços — 27/10/2026

As listas de vendas, financeiro e serviços e os cards de produtos oferecem Excluir. Os detalhes de venda, lançamento financeiro e produto também permitem a exclusão, retornando à lista após o sucesso. O botão do produto fica fora do link do card. A confirmação compartilhada identifica nome/código, ID e valor quando aplicável e informa o alcance da operação: produto com suas variantes, lançamento com suas parcelas e ausência de devolução automática de pagamentos/cobranças.

As regras do domínio foram preservadas. Venda faturada exige estorno antes da exclusão, inclusive se o booleano legado e a situação estiverem inconsistentes. Vínculos restritivos de produtos/serviços recebem mensagem específica e status 409. Não há estorno, baixa de estoque ou exclusão financeira implementados novamente no cliente. Cada confirmação envia uma única requisição DELETE ao endpoint dedicado; não há fallback de mutações para rotas antigas nem retry automático.

A lista é atualizada mantendo a busca e os filtros. Ao excluir o último registro de uma página, a paginação recua para a última página disponível. O financeiro recarrega também os resumos. Erros permanecem no diálogo, e um resultado incerto bloqueia novas tentativas. As versões desktop e móvel compartilham esse bloqueio por registro durante a vida da lista, sem estado de registros compartilhado entre contas ou páginas. Navegação durante uma exclusão em andamento fica bloqueada.

A API expõe DELETE em `/modofacil/vendas/:id` (nível 3), `/modofacil/financeiro/lancamentos/:id` (nível 3), `/modofacil/produtos/:id` (nível 4) e `/modofacil/servicos/:id` (nível 2). O inventário explícito de operações valida ID positivo, permissão atual do usuário no banco e vínculo do registro à conta autenticada antes de delegar aos controladores existentes. Frontend e API devem ser publicados juntos; não há migração de banco.

Validação: 259 testes do frontend em 28 arquivos e 181 testes da API aprovados. Incluem confirmação/cancelamento para os quatro cadastros, permissões, resposta de vínculo, venda faturada, ID inválido/outra conta, clique repetido, resposta incerta compartilhada entre layouts, retorno dos detalhes e recuperação da paginação. Checagem global de tipos do frontend e builds do frontend/PWA e API aprovados. No navegador foram conferidas exclusões de dados fictícios nos quatro módulos, cancelamento, bloqueio de venda faturada e vínculo, recálculo do resumo financeiro, retorno à lista após excluir pelos detalhes e confirmação em 360 px. Todo o transporte da prévia é isolado em memória; nenhum registro real foi excluído.

Evidências: `/tmp/modofacil-excluir-confirmacao.png` e `/tmp/modofacil-excluir-mobile.png`.

## Detalhes da ordem de serviço no padrão operacional — 27/10/2026

A OS usa cabeçalho com retorno e ações, resumo compacto de total, subtotal, desconto e quantidade e uma seção de atendimento com cliente, responsável, garantia, datas, necessidade do cliente e descrição. Itens e cobranças usam as tabelas compartilhadas e páginas de dez registros; itens têm busca sem acentos. O cálculo monetário usa centavos e o helper compartilhado com vendas inclui combos sem duplicar os snapshots já registrados nos itens.

Cobranças vinculadas apresentam código, situação, forma, valor e vencimento, respeitando a permissão financeira. A criação de cobrança conserva o vínculo com a OS e os estados permitidos. PDF, edição, recebimento/faturamento e estorno mantêm os contratos existentes e as regras por situação.

O histórico apresenta as atualizações mais recentes primeiro, com autor, tipo, horário, busca por mensagem/autor e paginação. A nota interna tem contador, validação de 1 a 191 caracteres e revisão antes de confirmar. Após salvar, a busca é limpa e o histórico volta à primeira página para exibir a nova nota. A navegação durante o envio e a repetição após resultado incerto permanecem bloqueadas.

Validação: 270 testes do frontend aprovados em 29 arquivos, incluindo 11 casos específicos dos detalhes da OS. Checagem global de tipos, build de produção/PWA e `git diff --check` aprovados. No navegador foram conferidos OS aberta/faturada, dados e cobranças, buscas sem acentos, revisão e registro de nota, desktop e 360 px e temas claro/escuro. A prévia usa dados fictícios e transporte isolado em memória, sem gravação de registros reais.

Evidências: `/tmp/modofacil-ordem-detalhes.png`, `/tmp/modofacil-ordem-detalhes-mobile.png` e `/tmp/modofacil-ordem-nota-mobile-dark.png`.

## Modal de movimentação de estoque — 27/10/2026

Reposição e descarte apresentam produto/variante e uma prévia compacta de saldo atual, quantidade movimentada e saldo previsto. Quantidades vazias ou inválidas não exibem saldo calculado. Os campos obrigatórios têm unidade e orientações; o motivo do descarte e a nota fiscal respeitam o limite de 191 caracteres.

Os dados opcionais da compra ficam em uma seção recolhível, com busca de fornecedor pelo SelectAjax, fornecedor selecionado identificado e nota fiscal, frete e desconto alinhados. O total previsto considera quantidade × custo + frete − desconto, em centavos. A confirmação identifica variante, quantidade e saldo previsto, além de custo, total e fornecedor na reposição. A informação de que a entrada não gera despesa financeira fica antes das ações.

Trocar produto ou concluir a entrada limpa fornecedor, nota, frete, desconto, quantidade e motivo. Cancelar a confirmação conserva o preenchimento; resultados incertos continuam bloqueando reenvio e troca de produto. Os contratos de movimentação e as validações finais do servidor foram preservados.

Validação: 75 testes dos formulários, workspace e navegação aprovados, incluindo três novos casos para prévias, limpeza dos dados e proteção de envio. Checagem global de tipos, build de produção/PWA e `git diff --check` aprovados. Conferência visual em desktop e 360 px, temas claro/escuro, seleção de produto/fornecedor, total com frete/desconto, cancelamento da confirmação e prévia do descarte. A prévia usa dados fictícios e transporte isolado; nenhum estoque real foi alterado.

Evidências: `/tmp/modofacil-movimentacao-estoque.png`, `/tmp/modofacil-movimentacao-estoque-mobile.png` e `/tmp/modofacil-movimentacao-descarte-mobile.png`.

## Pessoas: lista compacta, ações e cadastro completo — 27/10/2026

A lista reduz o espaçamento das linhas e a altura do link do nome, mantém telefone sem quebra e oferece consulta, edição, ativação/desativação e exclusão. Os filtros pesquisáveis incluem tipo de pessoa e situação. As ações preservam busca/filtros e recuperam a última página disponível quando o registro deixa a lista. Ativação/desativação exige confirmação e altera somente `status`; exclusão identifica a pessoa e informa o caráter permanente. As ações desktop/móvel e a exclusão compartilham o bloqueio de envio em andamento ou de resposta incerta por registro.

Criação e edição usam `PersonFields`: nome, tipo Cliente/Fornecedor, situação, e-mail, telefone e WhatsApp. Documento, endereço e observações ficam recolhidos como dados opcionais. Tipo e situação são editáveis no formulário principal; todos os selects mantêm busca. A edição envia apenas os campos alterados, preserva omissões e protege o preenchimento ao sair. A API reutiliza a validação de CPF/CNPJ e CEP e aceita os mesmos campos de cadastro no POST e PATCH básico, com normalização dos documentos. Os dados adicionais continuam acessíveis pela rota anterior.

Os detalhes apresentam contato com atalhos, endereço, documentos, observações e datas do cadastro no padrão das demais operações. O resumo financeiro usa as estatísticas da pessoa e fica restrito à permissão financeira, assim como o histórico. Este usa tabela compartilhada, consulta automática, busca e paginação de dez registros; troca de categoria ignora respostas antigas. Vendas mostram o valor registrado e ordens calculam itens menos desconto, sem exibir valor desconhecido como zero.

DELETE `/modofacil/pessoas/:id` exige nível 2, ID positivo e vínculo com a conta antes de delegar à exclusão existente. Restrições de chave estrangeira retornam 409 com orientação para desativar o cadastro. POST de pessoas e PATCH `/pessoas/:id/basico` mantêm schemas estritos e isolamento por conta. Frontend e API precisam ser publicados juntos; não há migração de banco.

Validação: regressão de 289 testes do frontend aprovada, seguida de 87 testes dos formulários, workspace e pessoas após os ajustes finais. Os 185 testes da API, checagem global de tipos do frontend e builds de produção/PWA e API passaram. Verificação de diff do frontend e da API (considerando CRLF existente) aprovada. No navegador foram conferidos ativação, edição de tipo, criação e exclusão de pessoa temporária, atualização da lista, detalhes, pesquisa do select móvel e proteção de alterações não salvas. Conferência em desktop e 360 px, temas claro/escuro e sem transbordamento horizontal. Todo o transporte da prévia é isolado em memória; nenhum cadastro real foi alterado ou excluído.

Evidências: `/tmp/modofacil-pessoas-lista.png`, `/tmp/modofacil-pessoa-edicao.png`, `/tmp/modofacil-pessoa-detalhes.png`, `/tmp/modofacil-pessoa-edicao-mobile.png` e `/tmp/modofacil-pessoa-detalhes-mobile-dark.png`.

## Serviços compactos e produtos em tabela com foto — 27/10/2026

A lista de serviços usa linhas de aproximadamente 52 px no cenário conferido, descrição em uma linha e ações compactas de editar, ativar/desativar, consultar o fiscal e excluir. O filtro de situação é pesquisável e respeita serviços inativos. A API converte `true`/`false` e os valores legados de situação para boolean antes de consultar o Prisma. Ativação/desativação usa a rota existente de status e conserva busca, filtros e paginação. `RecordStatusAction` compartilha o padrão e a proteção de envio com pessoas e com a exclusão de cada registro. Informações fiscais continuam restritas ao administrador.

Criação e edição de serviços usam as mesmas seções de dados e descrição, inputs shadcn e switch de situação, preço em reais, placeholders e limites de 191 caracteres. A edição faz um único PATCH básico com os campos alterados, incluindo situação quando modificada; preço, status e fiscal omitidos são preservados. A criação aceita cadastro inativo. Validação ocorre antes do envio, e respostas incertas bloqueiam repetição.

Produtos usam RecordsTable em desktop e celular, sem a grade de cards. A primeira coluna contém uma miniatura de 36 × 36 px; o clique abre a imagem em ModalDialog sem navegar. Imagens ausentes ou com falha exibem alternativa, e a troca de imagem reinicia esse estado. Nome/código, categoria, variantes, preço da variante padrão, estoque total, situação e ações ficam em colunas. O nome usa reticências para manter a altura da linha, com texto completo no tooltip e nos detalhes. Em telas pequenas a rolagem horizontal fica dentro da tabela. Os filtros, a paginação e as operações de estoque foram preservados.

Frontend e API devem ser publicados juntos para aceitar a situação no cadastro/PATCH básico de serviço; não há migração de banco. Os dados fiscais continuam separados das mutações do catálogo.

Validação: 299 testes do frontend em 31 arquivos e 189 testes da API aprovados. Oito testes específicos do catálogo passaram novamente durante a revisão final. Checagem global de tipos do frontend, builds de produção/PWA e API e verificação de diff (considerando o CRLF existente na API) aprovados. No navegador foram conferidos filtro de inativos, ativação com remoção da lista filtrada, criação de serviço inativo, edição parcial, formulários em desktop/360 px, tabela de produtos sem transbordamento da página e visualização de foto em temas claro/escuro. As verificações usam transporte isolado e dados fictícios; nenhum cadastro real foi alterado.

Evidências: `/tmp/modofacil-servicos-lista.png`, `/tmp/modofacil-servico-formulario.png`, `/tmp/modofacil-servico-formulario-mobile-dark.png`, `/tmp/modofacil-produtos-tabela.png`, `/tmp/modofacil-produtos-tabela-mobile.png`, `/tmp/modofacil-produto-foto.png` e `/tmp/modofacil-produto-foto-mobile-dark.png`.

## Situação dos produtos e largura dos menus de ações — 27/10/2026

Produtos oferecem ativação/desativação na lista e no cabeçalho dos detalhes, usando o mesmo RecordStatusAction de pessoas e serviços. A confirmação identifica o produto e informa que todas as variantes acompanham a situação. Após salvar, a lista conserva filtros/paginação e o detalhe recarrega produto e variantes. Respostas incertas bloqueiam novas alterações e a exclusão do mesmo registro. A permissão segue o nível 4 já exigido pelo módulo de produtos.

A nova rota PATCH `/modofacil/produtos/:produtoBaseId/status` aceita somente `status: ATIVO | INATIVO`. A transação bloqueia o cadastro base, verifica a conta e altera apenas a situação do produto e de suas variantes, preservando estoque, preços, dados fiscais e histórico. Testes cobrem isolamento por conta, rollback, permissões, validação e atualização dos filtros. Frontend e API devem ser publicados juntos; não há migração de banco.

RecordActions faz cada item ocupar toda a largura útil do menu, alinhado à esquerda, inclusive quando renderizado como botão ModalAction ou RouterLink. O ajuste vale para variantes, parcelas e operações financeiras. A conferência no navegador mediu larguras iguais entre todas as opções de cada menu e confirmou a área clicável até a borda direita, o destaque e a navegação por teclado.

Validação: 307 testes do frontend em 31 arquivos e 192 testes da API aprovados, além da checagem global de tipos do frontend e dos builds de produção/PWA e API. Diff verificado no frontend e na API considerando o CRLF existente. Testados ativação/desativação, remoção da lista filtrada, atualização das variantes e modal de confirmação em desktop/360 px, temas claro/escuro, sem transbordamento da página. A prévia usa apenas dados fictícios em memória; nenhum produto real foi alterado.

Evidências: `/tmp/modofacil-dropdown-largura-corrigida.png` e `/tmp/modofacil-dropdown-mobile-dark.png`.

## Lista de ordens de serviço compacta — 27/10/2026

A lista segue o padrão dos catálogos: filtros compactos com busca por código/cliente/descrição, situação pesquisável e linhas de aproximadamente 52 px no cenário conferido. Cliente e descrição ficam em uma linha cada, com reticências e texto completo no tooltip. Data e código não quebram. A sidebar expandida não corta as ações no cenário desktop de 1280 px.

Consulta e edição usam botões compactos com ícones, nomes acessíveis e tooltips. O menu RecordActions reúne PDF e criação de cobrança vinculada à OS selecionada, com largura útil completa em todas as opções. Edição segue a permissão de atendimento e não aparece em ordens faturadas; cobrança exige permissão financeira e não aparece em ordens faturadas/canceladas. No celular as ações permanecem na mesma linha, dentro da apresentação responsiva já usada pelas listas.

O PDF utiliza o mesmo download dos detalhes, informa a preparação, bloqueia solicitações simultâneas e oferece nova tentativa em caso de erro. A edição e a cobrança mantêm a busca, os filtros e a paginação da lista de origem. São reutilizados os formulários e contratos existentes, sem alteração da API.

Verificação funcional: 34 testes da lista, dos detalhes da OS e dos catálogos aprovados, incluindo oito casos novos para edição, filtros, cobrança, permissões, situações e download/recuperação do PDF. Checagem global de tipos, build de produção/PWA, formatação dos arquivos e verificação de diff aprovados. Conferência visual em desktop e 360 px, temas claro/escuro, busca de situação, abertura dos formulários corretos e menus sem transbordamento da página. A prévia usa apenas dados fictícios em memória; nenhuma ordem ou cobrança real foi alterada.

Evidências: `/tmp/modofacil-ordens-lista-compacta.png` e `/tmp/modofacil-ordens-lista-mobile-dark.png`.

## Lista de vendas compacta — 27/10/2026

Vendas seguem a organização das ordens de serviço e dos catálogos: filtros compactos, situação pesquisável, linhas de aproximadamente 49 px e botões com ícones para consulta, edição e exclusão. Código e cliente usam reticências com texto completo no tooltip; datas e valores não quebram. Os botões mantêm a mesma altura no celular. A tabela cabe com sidebar expandida no cenário de 1280 px; a apresentação móvel existente foi preservada sem transbordamento da página.

O menu de cada venda reúne comprovante e cobrança vinculada à origem correta. Edição não aparece se a venda está faturada, considerando tanto o status quanto o campo `faturado`. Cobrança exige permissão financeira e não aparece em vendas faturadas ou canceladas. A exclusão continua usando o componente compartilhado, com confirmação, proteção de vendas faturadas e recuperação da lista após excluir. O download do comprovante bloqueia solicitações simultâneas e oferece nova tentativa após falha.

O menu do cabeçalho agrupa orçamento e caixa ao lado da ação principal de nova venda. Edição, orçamento e cobrança usam os formulários existentes sem sair da lista. Busca, período, situação e paginação mantêm os contratos anteriores.

Verificação funcional: 51 testes das listas de vendas/OS, dos detalhes e das exclusões aprovados, incluindo 11 casos novos para ações, filtros/período, orçamento/caixa, permissões, situação financeira e comprovante. Checagem global de tipos, build de produção/PWA, formatação dos arquivos e verificação de diff aprovados. Conferência visual em desktop/360 px e temas claro/escuro, edição e cobrança da venda correta, menus de vendas pendentes/faturadas e bloqueio de exclusão. A prévia usa dados fictícios em memória; nenhuma venda ou cobrança real foi alterada.

Evidências: `/tmp/modofacil-vendas-lista-compacta.png` e `/tmp/modofacil-vendas-lista-mobile-dark.png`.

## Lista de lançamentos financeiros compacta — 27/10/2026

Lançamentos seguem a densidade das listas de vendas e OS: linhas de aproximadamente 49 px no cenário conferido, descrição/categoria em uma linha com reticências e tooltip, valores sem quebra e ações alinhadas. Consulta, edição e exclusão usam ícones com nomes acessíveis; os botões têm a mesma altura no desktop e no celular. Os vínculos aparecem identificados por venda/OS, com acesso à operação de origem no menu da linha.

RecordActions reúne adição de parcela e organização de recorrência, além dos vínculos existentes. As ações de edição, parcelas e recorrência respeitam a permissão financeira e abrem os formulários do lançamento selecionado sem sair da lista. O modal de parcela distingue o título de inclusão e edição conforme a presença de `parcelaId`. O menu de operações financeiras também usa ícones nas opções de contas/categorias, transferência, cobranças e relatórios.

Os cards continuam filtrando valores e parcelas no período correspondente; a exclusão atualiza a tabela e o resumo, conservando os filtros. Busca, período, situação, paginação e apresentação móvel mantêm os contratos existentes.

Validação: 60 testes de lista/detalhes financeiros, exclusões e workspace aprovados, incluindo oito casos novos para ações, vínculos, permissões, atualização dos resumos e títulos dos modais de parcela. Checagem global de tipos, build de produção/PWA, formatação e verificação de diff aprovados. Conferidos no navegador edição, inclusão de parcela, recorrência, filtro “A pagar” com valores de parcelas e menus em desktop/360 px e temas claro/escuro. Tabela sem corte de ações com sidebar expandida e página sem transbordamento horizontal. A prévia usa apenas dados fictícios em memória; nenhum lançamento real foi alterado.

Evidências: `/tmp/modofacil-financeiro-lista-compacta.png` e `/tmp/modofacil-financeiro-lista-mobile-dark.png`.

## Toasts do Modo Fácil — 27/10/2026

O Modo Fácil reutiliza vue-toastification com notificações locais ao seu padrão visual: fonte Sora, fundo de card conforme o tema, borda/ícone verdes para sucesso, vermelhos para erro e âmbar para resultado incerto. Há botão “Fechar notificação”, pausa ao passar o mouse/perder foco e respeito à preferência por movimento reduzido. Sucessos duram 4,5 s, erros 7 s e avisos de resultado incerto 10 s. No celular a notificação respeita as margens e a largura disponível.

useDomainMutation notifica somente após a operação terminar. Feedback cobre validação, falhas de carregamento e os formulários com confirmação própria; ModalDialog e FieldsEditor cobrem os erros locais. Cadastro de pessoa, categoria em modal e foto de variante também confirmam sucesso. Caixa, categorias e estoque limpam a mensagem anterior antes de outra operação. Os avisos inline continuam disponíveis, inclusive depois que o toast desaparece. Notificações iguais usam o mesmo identificador e atualizam a instância existente, evitando duplicação entre operação, formulário e modal. Uma falha ao exibir o toast nunca transforma uma gravação confirmada em erro, e notificações não repetem requisições.

O container compartilhado foi identificado como região viva para leitores de tela, mantendo as notificações acessíveis com um modal aberto. ModalDialog habilita a proteção opcional do ModalView contra fechamento por interação no toast; clicar em “Fechar notificação” não fecha o formulário nem libera reenvio de resultado incerto. Modais que não habilitam essa proteção mantêm o comportamento anterior.

Validação: 345 testes do frontend em 34 arquivos aprovados, incluindo 11 casos novos para sucesso após confirmação, erros conhecidos/incertos, bloqueio de envios, falha do mecanismo de toast, preservação do feedback inline e interação externa dos modais. Checagem global de tipos, build de produção/PWA e verificação de diff aprovados; formatação dos arquivos novos e do Modo Fácil conferida. No navegador foram validados sucesso, erro e resultado incerto, instância única no cadastro/ação rápida, fechamento sem dispensar o formulário, região viva acessível e tema escuro em 360 px sem transbordamento. A prévia inclui um cenário de resposta incerta e usa somente dados fictícios em memória; nenhum cadastro real foi alterado.

Evidências: `/tmp/modofacil-toasts.png`, `/tmp/modofacil-toast-erro.png`, `/tmp/modofacil-toast-resultado-incerto.png`, `/tmp/modofacil-toast-mobile-dark.png` e `/tmp/modofacil-toast-cadastro-mobile.png`.

## Total na lista de ordens de serviço — 27/10/2026

A lista de OS apresenta a coluna Total, alinhada à direita e formatada em reais, também na apresentação móvel. O cálculo compartilhado com os detalhes soma quantidade × valor dos itens em centavos e aplica o desconto. Combos já espelhados nos itens são contados uma única vez. A tabela mantém linhas de 52 px e todas as ações visíveis no cenário desktop de 1280 px com sidebar expandida.

Validação: 36 testes de lista/detalhes de OS e detalhes de vendas/produtos aprovados, incluindo quatro novos casos de total com desconto, decimais, ordem sem itens e combos. Conferência visual em desktop e 360 px sem transbordamento da página. Checagem global de tipos, formatação e verificação de diff aprovadas.

Evidências: `/tmp/modofacil-ordens-com-total.png` e `/tmp/modofacil-ordens-com-total-mobile.png`.
