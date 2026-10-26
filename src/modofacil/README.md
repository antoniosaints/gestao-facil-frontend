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
