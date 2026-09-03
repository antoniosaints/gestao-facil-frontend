import http from '@/utils/axios'
import type { ThemeCustomization } from '@/types/schemas'

export type RestaurantePapel =
  | 'GESTOR'
  | 'CAIXA'
  | 'GARCOM'
  | 'COZINHA'
  | 'EXPEDICAO'
  | 'ENTREGADOR'
export type RestauranteCapability =
  | 'SALAO_VISUALIZAR'
  | 'SALAO_OPERAR'
  | 'SALAO_CONFIGURAR'
  | 'COMANDAS_OPERAR'
  | 'KDS_VISUALIZAR'
  | 'KDS_OPERAR'
  | 'KDS_CONFIGURAR'
  | 'IMPRESSAO_VISUALIZAR'
  | 'IMPRESSAO_CONFIGURAR'
  | 'CARDAPIO_VISUALIZAR'
  | 'CARDAPIO_CONFIGURAR'
  | 'PEDIDOS_VISUALIZAR'
  | 'PEDIDOS_OPERAR'
  | 'CONFIGURACOES_GERENCIAR'
  | 'PAPEIS_GERENCIAR'

export interface RestauranteAccess {
  papeis: RestaurantePapel[]
  capabilities: RestauranteCapability[]
  fallbackLegado: boolean
}

export interface RestauranteUsuarioPapeis {
  id: number
  nome: string
  email: string
  status: string
  permissao: string
  papeis: RestaurantePapel[]
}

export type RestaurantePedidoStatus =
  | 'RECEBIDO'
  | 'CONFIRMADO'
  | 'EM_PREPARO'
  | 'PRONTO'
  | 'CONCLUIDO'
  | 'CANCELADO'

export type RestauranteEntregaStatus =
  | 'NAO_APLICAVEL'
  | 'AGUARDANDO_DESPACHO'
  | 'OFERTADA'
  | 'ATRIBUIDA'
  | 'RETIRADA'
  | 'EM_ROTA'
  | 'ENTREGUE'
  | 'FALHOU'

export interface RestaurantePedido {
  id: number
  codigo: string
  origem: string
  status: RestaurantePedidoStatus
  producaoStatus: string
  pagamentoStatus: string
  entregaStatus: RestauranteEntregaStatus
  clienteNomeSnapshot?: string | null
  clienteTelefone?: string | null
  clienteEmail?: string | null
  enderecoSnapshotJson?: {
    cep?: string
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    uf?: string
    referencia?: string
    latitude?: number | null
    longitude?: number | null
  } | null
  pagamentoMetodoSnapshot?: string | null
  trocoParaSnapshot?: string | number | null
  subtotal: string | number
  frete: string | number
  desconto?: string | number
  total: string | number
  observacao?: string | null
  version: number
  createdAt: string
  Mesa?: { nome: string } | null
  tickets?: Array<{ id: number; pontoId: number }>
  Entrega?: {
    id: number
    entregadorId?: number | null
    ofertadaAt?: string | null
    atribuidaAt?: string | null
    retiradaAt?: string | null
    emRotaAt?: string | null
    entregueAt?: string | null
    falhouAt?: string | null
    Entregador?: {
      ultimaLatitude?: number | null
      ultimaLongitude?: number | null
      ultimaLocalizacaoAt?: string | null
      Usuario?: { nome: string }
    } | null
  } | null
  itens: Array<{
    id: number
    catalogoItemId?: number | null
    nomeSnapshot: string
    quantidade: string | number
    subtotalSnapshot: string | number
    tamanhoSnapshot?: string | null
    selecoesSnapshotJson?: Array<{ grupoId?: number; nome?: string }> | null
    observacao?: string | null
  }>
}

export interface RestauranteEntregadorContexto {
  driver: { id: number; disponivel: boolean; ultimaLocalizacaoAt?: string | null }
  empresa: {
    nome: string
    nomeFantasia?: string | null
    profile?: string | null
    endereco?: string | null
    telefone?: string | null
  } | null
  ofertas: RestaurantePedido[]
  entregaAtiva: RestaurantePedido | null
}

export interface RestaurantePainel {
  periodo: { inicio: string; fim: string }
  resumo: {
    pedidos: number
    faturamento: number
    ticketMedio: number
    cancelamentos: number
    taxaCancelamento: number
    pedidosEmAberto: number
  }
  operacao: {
    tempoMedioProducaoMinutos: number | null
    pedidosComTempoProducao: number
    tempoMedioEntregaMinutos: number | null
    entregasConcluidas: number
    tempoMedioRetiradaMinutos: number | null
  }
  produtosMaisVendidos: Array<{ nome: string; quantidade: number; faturamento: number }>
  formasPagamento: Array<{ metodo: string; pedidos: number; valor: number }>
  canais: Array<{ origem: string; pedidos: number; valor: number }>
  vendasPorDia: Array<{ data: string; pedidos: number; valor: number }>
}

export interface RestaurantePublicOrderTracking {
  id: number
  cardapioSlug?: string | null
  codigo: string
  origem: 'RETIRADA' | 'DELIVERY' | 'MESA'
  status: RestaurantePedidoStatus
  producaoStatus: string
  pagamentoStatus: string
  pagamentoMetodoSnapshot?: string | null
  trocoParaSnapshot?: string | number | null
  entregaStatus: string
  subtotal: string | number
  frete: string | number
  total: string | number
  createdAt: string
  updatedAt: string
  confirmadoAt?: string | null
  emPreparoAt?: string | null
  prontoAt?: string | null
  concluidoAt?: string | null
  canceladoAt?: string | null
  timeline: Array<{
    key: string
    titulo: string
    descricao: string
    ocorreuEm: string
  }>
  tempoMedioEsperaMinutos: number
  tempoMedioBase: 'historico' | 'estimativa'
  paymentAction?: {
    type: 'PIX' | 'REDIRECT'
    url?: string | null
    pixCopiaCola?: string | null
    qrCodeDataUrl?: string | null
    expiresAt?: string | null
  } | null
  acompanhamentoEntrega?: {
    origem?: { latitude?: number; longitude?: number } | null
    entregador: { latitude: number; longitude: number; updatedAt?: string | null }
  } | null
  podeCancelar?: boolean
  itens: Array<{
    nomeSnapshot: string
    quantidade: string | number
    subtotalSnapshot: string | number
    selecoesSnapshotJson?: unknown
  }>
}

export interface RestauranteClienteEndereco {
  id: number
  rotulo?: string | null
  cep: string
  cidade: string
  bairro: string
  logradouro: string
  numero: string
  complemento?: string | null
  referencia?: string | null
  principal: boolean
}

export interface RestauranteClienteConta {
  id: number
  nome: string
  telefone: string
  email?: string | null
  enderecos: RestauranteClienteEndereco[]
  pedidos: RestaurantePublicOrderTracking[]
}

export type RestauranteMesaStatus = 'LIVRE' | 'OCUPADA' | 'AGUARDANDO_CONTA' | 'LIMPEZA'

export interface RestauranteMesa {
  id: number
  nome: string
  status: RestauranteMesaStatus
  ativa: boolean
  version: number
  sessoes: Array<{
    id: number
    status: 'ABERTA' | 'AGUARDANDO_CONTA'
    pessoas: number
    abertaAt: string
    observacao?: string | null
    comandas: Array<{
      comandaOperacaoId: number
      nome?: string | null
      ComandaOperacao: {
        id: number
        Uid: string
        status: string
        total: string | number
        itens: unknown[]
        pagamentos: unknown[]
      }
    }>
    pedidos: RestaurantePedido[]
  }>
}

export interface RestaurantePontoProducao {
  id: number
  nome: string
  cor: string
  ativo: boolean
  ordem: number
  version: number
  roteamentos: Array<{ categoriaId: number; Categoria: { id: number; nome: string } }>
}

export type RestauranteTicketStatus = 'PENDENTE' | 'PREPARANDO' | 'PRONTO' | 'ENTREGUE'

export interface RestauranteKdsTicket {
  id: number
  pontoId: number
  tipo: 'INICIAL' | 'ADICAO' | 'CANCELAMENTO'
  status: RestauranteTicketStatus
  version: number
  createdAt: string
  Ponto: RestaurantePontoProducao
  Pedido: RestaurantePedido
  itens: Array<{
    quantidade: string | number
    observacao?: string | null
    PedidoItem: {
      id: number
      nomeSnapshot: string
      tamanhoSnapshot?: string | null
      selecoesSnapshotJson?: Array<{
        nome: string
        tipo?: 'SABOR' | 'COMPLEMENTO'
        grupoId?: number
        grupoNome?: string
      }> | null
      observacao?: string | null
    }
  }>
}

export interface RestauranteEstacaoImpressao {
  id: number
  nome: string
  tokenPrefix: string
  impressoraNome?: string | null
  papelReportado?: string | null
  ativa: boolean
  online: boolean
  lastSeenAt?: string | null
  version: number
  pairingToken?: string
  _count?: { regrasPrimarias: number; trabalhos: number }
}

export interface RestauranteRegraImpressao {
  id: number
  pontoId: number
  estacaoId: number
  fallbackEstacaoId?: number | null
  papel: '58mm' | '80mm'
  vias: number
  imprimirPedidoCompleto: boolean
  ativa: boolean
  version: number
  Ponto?: { id: number; nome: string }
  destinos: Array<{
    id: number
    estacaoId: number
    fallbackEstacaoId?: number | null
    papel: '58mm' | '80mm'
    vias: number
    imprimirPedidoCompleto: boolean
    ordem: number
    Estacao?: { id: number; nome: string }
    FallbackEstacao?: { id: number; nome: string } | null
  }>
  Estacao?: { id: number; nome: string }
  FallbackEstacao?: { id: number; nome: string } | null
}

export interface RestauranteTrabalhoImpressao {
  id: number
  uid: string
  status: 'PENDENTE' | 'EM_PROCESSAMENTO' | 'CONCLUIDO' | 'FALHOU' | 'CANCELADO'
  papel: '58mm' | '80mm'
  vias: number
  tentativas: number
  erro?: string | null
  impressoAt?: string | null
  createdAt: string
  Estacao: { id: number; nome: string; impressoraNome?: string | null }
  Ponto?: { id: number; nome: string } | null
  Ticket?: { Pedido: { codigo: string } } | null
  Pedido?: { codigo: string } | null
}

export interface RestauranteTrabalhoEstacao {
  uid: string
  leaseToken: string
  conteudo: string
  formato: string
  papel: '58mm' | '80mm'
  vias: number
  tentativas: number
}

export type RestauranteDiaFuncionamento =
  | 'SEGUNDA'
  | 'TERCA'
  | 'QUARTA'
  | 'QUINTA'
  | 'SEXTA'
  | 'SABADO'
  | 'DOMINGO'

export interface RestauranteHorarioFuncionamento {
  dia: RestauranteDiaFuncionamento
  ativo: boolean
  abertura: string
  fechamento: string
}

export interface RestauranteLocalizacao {
  latitude: number
  longitude: number
}

export type RestauranteWhatsAppNotificationEvent =
  | 'PEDIDO_FEITO'
  | 'EM_PREPARO'
  | 'SAIU_ENTREGA'
  | 'PRONTO'
  | 'ENTREGUE'
  | 'FIDELIDADE'
  | 'POS_PEDIDO'
export type RestauranteWhatsAppNotifications = Record<
  RestauranteWhatsAppNotificationEvent,
  { ativo: boolean; mensagem: string }
>

export interface RestauranteConfig {
  id?: number
  slug: string
  nomePublico: string
  ativo: boolean
  aceitarPedidosOnline: boolean
  pedidosQrDireto: boolean
  modoFrete: 'FIXO' | 'ZONAS'
  taxaFixa: string | number
  freteGratisAcima?: string | number | null
  taxaContingencia?: string | number | null
  pedidoMinimo: string | number
  retiradaAtiva: boolean
  deliveryAtivo: boolean
  pagamentoOnlineAtivo: boolean
  pagamentoNaEntregaAtivo: boolean
  localizacaoJson?: RestauranteLocalizacao | null
  horariosJson?: RestauranteHorarioFuncionamento[] | null
  whatsappNotificacoesInstanciaId?: number | null
  whatsappNotificacoesJson?: RestauranteWhatsAppNotifications | null
  version?: number
}

export interface RestauranteZonaEntrega {
  id: number
  nome: string
  cidade?: string | null
  bairros: string[]
  cepInicial?: string | null
  cepFinal?: string | null
  taxa: string | number
  pedidoMinimo: string | number
  freteGratisAcima?: string | number | null
  prioridade: number
  ativa: boolean
  version: number
}

export type RestauranteZonaPayload = Omit<RestauranteZonaEntrega, 'id' | 'version'> & {
  version?: number
}

export interface RestauranteCheckoutPreview {
  subtotal: string | number
  frete: string | number
  total: string | number
  desconto?: string | number
  minimumOrder: string | number
  minimumReached: boolean
  zone?: { tipo: string; nome: string; taxa: string | number } | null
  fidelidades?: RestauranteFidelidadePublica[]
}

export interface RestauranteFidelidadePrograma {
  id?: number
  ativo: boolean
  pedidosMeta: number
  categoriaIds: number[]
  catalogoItemIds: number[]
  premioCatalogoItemId: number | null
  descontoPercentual: number
  version?: number
}

export interface RestauranteFidelidadePublica {
  id: number
  ativo: boolean
  pedidosMeta: number
  categoriaIds: number[]
  catalogoItemIds: number[]
  categorias?: Array<{ id: number; nome: string }>
  descontoPercentual: number
  premio: { catalogoItemId: number; nome: string; imagem?: string | null } | null
  progresso: {
    itensElegiveis: number
    pedidosMeta: number
    recompensasDisponiveis: number
  } | null
}

export interface RestauranteProdutoDisponivel {
  id: number
  nome: string
  nomeVariante: string
  preco: string | number
  estoque: number
  imagem?: string | null
  ProdutoBase?: { categoriaId?: number | null; Categoria?: { id: number; nome: string } | null }
}

export interface RestauranteOpcao {
  id?: number
  produtoId?: number | null
  nome: string
  precoAdicional: string | number
  ativo: boolean
  ordem: number
}

export interface RestauranteGrupoOpcao {
  id: number
  nome: string
  tipo: 'COMPLEMENTO' | 'SABOR'
  minimo: number
  maximo: number
  ativo: boolean
  opcoes: RestauranteOpcao[]
  _count?: { itens: number }
}

export interface RestauranteCatalogoItem {
  id: number
  produtoId?: number | null
  categoriaId?: number | null
  categoriaSugestaoId?: number | null
  preco: string | number
  nomePublico?: string | null
  descricao?: string | null
  imagem?: string | null
  disponivel: boolean
  maisPedido: boolean
  regraPrecoSabores: 'MAIOR_PRECO' | 'MEDIA_PROPORCIONAL' | 'SOMA'
  ordem: number
  version: number
  Produto?: RestauranteProdutoDisponivel | null
  Categoria?: { id: number; nome: string } | null
  grupos: Array<{ grupoId: number; Grupo: RestauranteGrupoOpcao }>
}

export interface RestauranteCatalogoPayload {
  modoCadastro: 'VINCULAR' | 'AVULSO' | 'CRIAR_PRODUTO'
  produtoId?: number | null
  categoriaId?: number | null
  categoriaSugestaoId?: number | null
  preco: number
  nomePublico?: string | null
  descricao?: string | null
  imagem?: string | null
  disponivel: boolean
  maisPedido: boolean
  regraPrecoSabores: RestauranteCatalogoItem['regraPrecoSabores']
  ordem: number
  grupoIds: number[]
  version?: number
}

export interface RestauranteCaixaSessao {
  id: number
  codigo: string
  status: 'ABERTO' | 'FECHADO' | 'CANCELADO'
  abertoEm: string
  fechadoEm?: string | null
  saldoInicial: number
  saldoEsperado: number
  saldoContado?: number | null
  diferenca?: number | null
  observacaoAbertura?: string | null
  observacaoFechamento?: string | null
  abertoPor?: { id: number; nome: string }
  fechadoPor?: { id: number; nome: string } | null
  movimentos: Array<{
    id: number
    tipo: 'ABERTURA' | 'SANGRIA' | 'REFORCO' | 'FECHAMENTO'
    valor: number
    descricao?: string | null
    createdAt: string
    Usuario?: { id: number; nome: string }
  }>
  pedidos: Array<{
    id: number
    codigo: string
    origem: string
    status: string
    pagamentoStatus: string
    pagamentoMetodoSnapshot?: string | null
    total: number
    createdAt: string
  }>
}

export interface RestauranteCaixaContexto {
  caixa: RestauranteCaixaSessao
  resumo: {
    pedidos: number
    totalPedidos: number
    porMetodo: Record<string, number>
    totalReforcos: number
    totalSangrias: number
  }
}

export interface RestauranteCaixaRelatorio {
  caixas: RestauranteCaixaContexto[]
  resumo: {
    caixas: number
    pedidos: number
    totalPedidos: number
    totalReforcos: number
    totalSangrias: number
    diferenca: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type RestauranteCatalogoBulkAction =
  | 'EXIBIR'
  | 'OCULTAR'
  | 'DESTACAR'
  | 'REMOVER_DESTAQUE'
  | 'EXCLUIR'
  | 'ALTERAR_CATEGORIA'
  | 'DEFINIR_CATEGORIA_SUGESTAO'
  | 'ADICIONAR_GRUPOS'

export type RestauranteCatalogoBulkOptions = {
  categoriaId?: number
  grupoIds?: number[]
}

export interface RestauranteGrupoPayload {
  nome: string
  tipo: RestauranteGrupoOpcao['tipo']
  minimo: number
  maximo: number
  ativo: boolean
  opcoes: RestauranteOpcao[]
}

export class RestauranteRepository {
  static async relatorioCaixas(params?: {
    inicio?: string
    fim?: string
    status?: 'ABERTO' | 'FECHADO' | 'CANCELADO'
    page?: number
    limit?: number
  }) {
    const { data } = await http.get('/v1/restaurante/caixa', { params })
    return data.data as RestauranteCaixaRelatorio
  }

  static async contextoCaixa() {
    const { data } = await http.get('/v1/restaurante/caixa/contexto')
    return data.data as RestauranteCaixaContexto | null
  }

  static async abrirCaixa(payload: { valorInicial: number; observacao?: string }) {
    const { data } = await http.post('/v1/restaurante/caixa/abrir', payload)
    return data.data as RestauranteCaixaContexto
  }

  static async movimentarCaixa(payload: {
    tipo: 'SANGRIA' | 'REFORCO'
    valor: number
    descricao?: string
  }) {
    const { data } = await http.post('/v1/restaurante/caixa/movimentos', payload)
    return data.data as RestauranteCaixaContexto
  }

  static async fecharCaixa(payload: {
    valorFechamento: number
    descricao?: string
    metodosContados?: Array<{ metodo: string; esperado: number; contado: number; diferenca: number }>
  }) {
    const { data } = await http.put('/v1/restaurante/caixa/fechar', payload)
    return data.data as RestauranteCaixaContexto
  }

  static async acesso() {
    const { data } = await http.get('/v1/restaurante/acesso')
    return data.data as RestauranteAccess
  }

  static async usuariosPapeis() {
    const { data } = await http.get('/v1/restaurante/usuarios-papeis')
    return data.data as RestauranteUsuarioPapeis[]
  }

  static async salvarUsuarioPapeis(usuarioId: number, papeis: RestaurantePapel[]) {
    const { data } = await http.put(`/v1/restaurante/usuarios-papeis/${usuarioId}`, { papeis })
    return data.data as { usuarioId: number; papeis: RestaurantePapel[] }
  }

  static async cardapioPublico(slug: string, customerAccessToken?: string | null) {
    const { data } = await http.get(`/v1/restaurante/publico/${slug}/cardapio`, {
      headers: customerAccessToken ? { Authorization: `Bearer ${customerAccessToken}` } : undefined,
    })
    return data.data as {
      restaurante: {
        nome: string
        logo?: string | null
        slug: string
        pedidoMinimo: string | number
        retiradaAtiva: boolean
        deliveryAtivo: boolean
        pagamentoOnlineAtivo: boolean
        pagamentoNaEntregaAtivo: boolean
        atendimento: {
          aberto: boolean
          mensagem: string
          configurado: boolean
        }
        modoFrete: 'FIXO' | 'ZONAS'
        freteGratisAcima?: string | number | null
        temaPersonalizado?: Partial<ThemeCustomization> | null
        fidelidades?: RestauranteFidelidadePublica[]
      }
      itens: any[]
    }
  }

  static async criarPedidoPublico(
    slug: string,
    payload: unknown,
    idempotencyKey: string,
    customerAccessToken?: string | null,
  ) {
    const { data } = await http.post(`/v1/restaurante/publico/${slug}/pedidos`, payload, {
      headers: {
        'Idempotency-Key': idempotencyKey,
        ...(customerAccessToken ? { Authorization: `Bearer ${customerAccessToken}` } : {}),
      },
    })
    return data.data
  }

  static async previaCheckoutPublico(slug: string, payload: unknown) {
    const { data } = await http.post(`/v1/restaurante/publico/${slug}/checkout/previa`, payload)
    return data.data as RestauranteCheckoutPreview
  }

  static async acompanharPedido(token: string) {
    const { data } = await http.get(`/v1/restaurante/publico/pedidos/${token}`)
    return data.data as RestaurantePublicOrderTracking
  }

  static async cancelarPedidoPublico(token: string) {
    const { data } = await http.post(`/v1/restaurante/publico/pedidos/${token}/cancelamento`)
    return data.data as RestaurantePublicOrderTracking
  }

  static async cadastrarContaCliente(
    slug: string,
    payload: { nome: string; telefone: string; email?: string | null; senha: string },
  ) {
    const { data } = await http.post(`/v1/restaurante/publico/${slug}/conta/cadastro`, payload)
    return data.data as {
      customer: { id: number; nome: string; telefone: string }
      accessToken: string
    }
  }

  static async entrarContaCliente(slug: string, payload: { telefone: string; senha: string }) {
    const { data } = await http.post(`/v1/restaurante/publico/${slug}/conta/login`, payload)
    return data.data as {
      customer: { id: number; nome: string; telefone: string }
      accessToken: string
    }
  }

  static async contaCliente(slug: string, accessToken: string) {
    const { data } = await http.get(`/v1/restaurante/publico/${slug}/conta`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return data.data as RestauranteClienteConta
  }

  static async atualizarContaCliente(
    slug: string,
    accessToken: string,
    payload: { nome: string; email?: string | null },
  ) {
    const { data } = await http.patch(`/v1/restaurante/publico/${slug}/conta`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return data.data
  }

  static async salvarEnderecoContaCliente(
    slug: string,
    accessToken: string,
    payload: Omit<RestauranteClienteEndereco, 'id'>,
    id?: number,
  ) {
    const url = `/v1/restaurante/publico/${slug}/conta/enderecos${id ? `/${id}` : ''}`
    const { data } = await http.request({
      url,
      method: id ? 'put' : 'post',
      data: payload,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return data.data as RestauranteClienteEndereco
  }

  static async removerEnderecoContaCliente(slug: string, accessToken: string, id: number) {
    await http.delete(`/v1/restaurante/publico/${slug}/conta/enderecos/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  }

  static async pedidos(
    params: { page?: number; limit?: number; status?: string; inicio?: string; fim?: string } = {},
  ) {
    const { data } = await http.get('/v1/restaurante/pedidos', { params })
    return data as {
      data: RestaurantePedido[]
      meta: {
        page: number
        pages: number
        total: number
        localizacaoEmpresa?: RestauranteLocalizacao | null
      }
    }
  }

  static async painel(params: { inicio?: string; fim?: string } = {}) {
    const { data } = await http.get('/v1/restaurante/painel', { params })
    return data.data as RestaurantePainel
  }

  static async entregadorContexto() {
    const { data } = await http.get('/v1/restaurante/entregador/contexto')
    return data.data as RestauranteEntregadorContexto
  }

  static async historicoEntregador(params: { page?: number; limit?: number } = {}) {
    const { data } = await http.get('/v1/restaurante/entregador/historico', { params })
    return data as {
      data: RestaurantePedido[]
      meta: { page: number; pages: number; total: number }
    }
  }

  static async atualizarDisponibilidadeEntregador(disponivel: boolean) {
    const { data } = await http.put('/v1/restaurante/entregador/disponibilidade', { disponivel })
    return data.data as { id: number; disponivel: boolean }
  }

  static async aceitarEntrega(pedidoId: number) {
    const { data } = await http.post(`/v1/restaurante/entregador/entregas/${pedidoId}/aceitar`)
    return data.data as RestaurantePedido
  }

  static async atualizarStatusEntrega(
    pedidoId: number,
    status: Extract<RestauranteEntregaStatus, 'RETIRADA' | 'EM_ROTA' | 'ENTREGUE' | 'FALHOU'>,
  ) {
    const { data } = await http.post(`/v1/restaurante/entregador/entregas/${pedidoId}/status`, {
      status,
    })
    return data.data as RestaurantePedido
  }

  static async enviarLocalizacaoEntrega(
    pedidoId: number,
    payload: { latitude: number; longitude: number; precisaoMetros?: number | null },
  ) {
    await http.post(`/v1/restaurante/entregador/entregas/${pedidoId}/localizacao`, payload)
  }

  static async despachoEntregas() {
    const { data } = await http.get('/v1/restaurante/entregas/despacho')
    return data.data as {
      pedidos: RestaurantePedido[]
      entregadores: Array<{
        id: number
        disponivel: boolean
        Usuario: { nome: string; telefone?: string | null }
      }>
    }
  }

  static async ofertarEntrega(pedidoId: number) {
    const { data } = await http.post(`/v1/restaurante/entregas/${pedidoId}/ofertar`)
    return data.data
  }

  static async direcionarEntrega(pedidoId: number, entregadorId: number) {
    const { data } = await http.post(`/v1/restaurante/entregas/${pedidoId}/direcionar`, {
      entregadorId,
    })
    return data.data
  }

  static async transicionar(id: number, status: RestaurantePedidoStatus, version: number) {
    const { data } = await http.post(`/v1/restaurante/pedidos/${id}/transicao`, { status, version })
    return data.data as RestaurantePedido
  }

  static async criarPedidoManual(payload: {
    itens: Array<{
      catalogoItemId: number
      quantidade: number
      selecaoIds: number[]
      observacao?: string
    }>
    observacao?: string | null
    clienteId?: number | null
    clienteNome?: string | null
    clienteTelefone?: string | null
  }) {
    const { data } = await http.post('/v1/restaurante/pedidos', payload)
    return data.data as RestaurantePedido
  }

  static async atualizarClientePedido(
    id: number,
    payload: {
      clienteNome?: string | null
      clienteTelefone?: string | null
      clienteEmail?: string | null
      version: number
    },
  ) {
    const { data } = await http.patch(`/v1/restaurante/pedidos/${id}/cliente`, payload)
    return data.data as RestaurantePedido
  }

  static async atualizarItensPedido(
    id: number,
    payload: {
      itens: Array<{
        catalogoItemId: number
        quantidade: number
        selecaoIds: number[]
        observacao?: string
      }>
      observacao?: string | null
      version: number
    },
  ) {
    const { data } = await http.patch(`/v1/restaurante/pedidos/${id}/itens`, payload)
    return data.data as RestaurantePedido
  }

  static async imprimirPedido(id: number, estacaoIds: number[]) {
    const { data } = await http.post(`/v1/restaurante/pedidos/${id}/imprimir`, { estacaoIds })
    return data.data as RestauranteTrabalhoImpressao[]
  }

  static async configuracao() {
    const { data } = await http.get('/v1/restaurante/configuracao')
    return data.data as RestauranteConfig | null
  }

  static async salvarConfiguracao(config: RestauranteConfig) {
    // O status de pedidos online é salvo exclusivamente pelo controle rápido
    // do cabeçalho, evitando que este formulário reverta uma alteração recente.
    const { aceitarPedidosOnline: _aceitarPedidosOnline, ...payload } = config
    const { data } = await http.put('/v1/restaurante/configuracao', payload)
    return data.data as RestauranteConfig
  }

  static async statusPedidosOnline() {
    const { data } = await http.get('/v1/restaurante/pedidos-online')
    return data.data as { aceitarPedidosOnline: boolean }
  }

  static async salvarStatusPedidosOnline(aceitarPedidosOnline: boolean) {
    const { data } = await http.put('/v1/restaurante/pedidos-online', { aceitarPedidosOnline })
    return data.data as { aceitarPedidosOnline: boolean }
  }

  static async fidelidades() {
    const { data } = await http.get('/v1/restaurante/fidelidade')
    return data.data as RestauranteFidelidadePrograma[]
  }

  static async opcoesFidelidade() {
    const { data } = await http.get('/v1/restaurante/fidelidade/opcoes')
    return data.data as {
      itens: Array<{ id: number; nome: string; imagem?: string | null }>
      categorias: Array<{ id: number; nome: string }>
    }
  }

  static async salvarFidelidade(payload: RestauranteFidelidadePrograma) {
    const { id, ...body } = payload
    const { data } = id
      ? await http.put(`/v1/restaurante/fidelidade/${id}`, body)
      : await http.post('/v1/restaurante/fidelidade', body)
    return data.data as RestauranteFidelidadePrograma
  }

  static async excluirFidelidade(id: number) {
    await http.delete(`/v1/restaurante/fidelidade/${id}`)
  }

  static async catalogo(params: { page?: number; limit?: number } = {}) {
    const { data } = await http.get('/v1/restaurante/cardapio', { params })
    return data as {
      data: RestauranteCatalogoItem[]
      meta: { page: number; pages: number; total: number }
    }
  }

  static async catalogoCompleto() {
    const firstPage = await this.catalogo({ page: 1, limit: 100 })
    const remainingPages = await Promise.all(
      Array.from({ length: Math.max(firstPage.meta.pages - 1, 0) }, (_, index) =>
        this.catalogo({ page: index + 2, limit: 100 }),
      ),
    )
    const items = [firstPage.data, ...remainingPages.map((page) => page.data)].flat()
    return [...new Map(items.map((item) => [item.id, item])).values()]
  }

  static async produtosCardapio(search = '') {
    const { data } = await http.get('/v1/restaurante/cardapio/produtos', {
      params: { search },
    })
    return data.data as RestauranteProdutoDisponivel[]
  }

  static async salvarItemCardapio(payload: RestauranteCatalogoPayload, id?: number) {
    const response = id
      ? await http.patch(`/v1/restaurante/cardapio/${id}`, payload)
      : await http.post('/v1/restaurante/cardapio', payload)
    return response.data.data as RestauranteCatalogoItem
  }

  static async aplicarAcoesEmMassaCardapio(
    ids: number[],
    acao: RestauranteCatalogoBulkAction,
    options: RestauranteCatalogoBulkOptions = {},
  ) {
    const { data } = await http.post('/v1/restaurante/cardapio/acoes-em-massa', {
      ids,
      acao,
      ...options,
    })
    return data.data as { affected: number; acao: RestauranteCatalogoBulkAction }
  }

  static async enviarImagemItemCardapio(id: number, file: File, atualizarProduto = false) {
    const form = new FormData()
    form.append('file', file)
    const { data } = await http.post(`/v1/restaurante/cardapio/${id}/imagem`, form, {
      params: atualizarProduto ? { atualizarProduto: true } : undefined,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data as RestauranteCatalogoItem
  }

  static async removerImagemItemCardapio(id: number) {
    const { data } = await http.delete(`/v1/restaurante/cardapio/${id}/imagem`)
    return data.data as RestauranteCatalogoItem
  }

  static async gruposOpcoes() {
    const { data } = await http.get('/v1/restaurante/grupos-opcoes')
    return data.data as RestauranteGrupoOpcao[]
  }

  static async salvarGrupoOpcoes(payload: RestauranteGrupoPayload, id?: number) {
    const response = id
      ? await http.patch(`/v1/restaurante/grupos-opcoes/${id}`, payload)
      : await http.post('/v1/restaurante/grupos-opcoes', payload)
    return response.data.data as RestauranteGrupoOpcao
  }
  static async zonasEntrega() {
    const { data } = await http.get('/v1/restaurante/zonas-entrega')
    return data.data as RestauranteZonaEntrega[]
  }

  static async salvarZonaEntrega(payload: RestauranteZonaPayload, id?: number) {
    const response = id
      ? await http.patch(`/v1/restaurante/zonas-entrega/${id}`, payload)
      : await http.post('/v1/restaurante/zonas-entrega', payload)
    return response.data.data as RestauranteZonaEntrega
  }

  static async mesas() {
    const { data } = await http.get('/v1/restaurante/mesas')
    return data.data as RestauranteMesa[]
  }

  static async salvarMesa(
    payload: { nome: string; ativa: boolean; version?: number },
    id?: number,
  ) {
    const response = id
      ? await http.patch(`/v1/restaurante/mesas/${id}`, payload)
      : await http.post('/v1/restaurante/mesas', payload)
    return response.data.data as RestauranteMesa
  }

  static async abrirMesa(
    id: number,
    payload: { pessoas: number; clienteNome?: string | null; observacao?: string | null },
  ) {
    const { data } = await http.post(`/v1/restaurante/mesas/${id}/abrir`, payload)
    return data.data
  }

  static async solicitarContaMesa(id: number) {
    const { data } = await http.post(`/v1/restaurante/mesas/${id}/aguardar-conta`)
    return data.data
  }

  static async liberarMesa(id: number) {
    const { data } = await http.post(`/v1/restaurante/mesas/${id}/liberar`)
    return data.data
  }

  static async finalizarLimpezaMesa(id: number) {
    const { data } = await http.post(`/v1/restaurante/mesas/${id}/finalizar-limpeza`)
    return data.data
  }

  static async criarPedidoMesa(sessaoId: number, payload: unknown) {
    const { data } = await http.post(`/v1/restaurante/sessoes-mesa/${sessaoId}/pedidos`, payload)
    return data.data as RestaurantePedido
  }

  static async categoriasProducao() {
    const { data } = await http.get('/v1/restaurante/pontos-producao/categorias')
    return data.data as Array<{ id: number; nome: string }>
  }

  static async pontosProducao() {
    const { data } = await http.get('/v1/restaurante/pontos-producao')
    return data.data as RestaurantePontoProducao[]
  }

  static async salvarPontoProducao(
    payload: {
      nome: string
      cor: string
      ativo: boolean
      ordem: number
      categoriaIds: number[]
      version?: number
    },
    id?: number,
  ) {
    const response = id
      ? await http.patch(`/v1/restaurante/pontos-producao/${id}`, payload)
      : await http.post('/v1/restaurante/pontos-producao', payload)
    return response.data.data as RestaurantePontoProducao
  }

  static async ticketsKds(params: { pontoId?: number; status?: string } = {}) {
    const { data } = await http.get('/v1/restaurante/kds', { params })
    return data.data as RestauranteKdsTicket[]
  }

  static async transicionarTicketKds(id: number, status: RestauranteTicketStatus, version: number) {
    const { data } = await http.post(`/v1/restaurante/kds/${id}/transicao`, { status, version })
    return data.data as RestauranteKdsTicket
  }

  static async estacoesImpressao() {
    const { data } = await http.get('/v1/restaurante/estacoes-impressao')
    return data.data as RestauranteEstacaoImpressao[]
  }

  static async salvarEstacaoImpressao(
    payload: { nome: string; ativa: boolean; version?: number },
    id?: number,
  ) {
    const response = id
      ? await http.patch(`/v1/restaurante/estacoes-impressao/${id}`, payload)
      : await http.post('/v1/restaurante/estacoes-impressao', payload)
    return response.data.data as RestauranteEstacaoImpressao
  }

  static async regenerarTokenEstacao(id: number) {
    const { data } = await http.post(`/v1/restaurante/estacoes-impressao/${id}/regenerar-token`)
    return data.data as { pairingToken: string; tokenPrefix: string }
  }

  static async regrasImpressao() {
    const { data } = await http.get('/v1/restaurante/regras-impressao')
    return data.data as RestauranteRegraImpressao[]
  }

  static async salvarRegraImpressao(payload: {
    pontoId: number
    estacaoId: number
    fallbackEstacaoId?: number | null
    papel: '58mm' | '80mm'
    vias: number
    imprimirPedidoCompleto: boolean
    destinosAdicionais: Array<{
      estacaoId: number
      fallbackEstacaoId?: number | null
      papel: '58mm' | '80mm'
      vias: number
      imprimirPedidoCompleto: boolean
    }>
    ativa: boolean
    version?: number
  }) {
    const { data } = await http.put('/v1/restaurante/regras-impressao', payload)
    return data.data as RestauranteRegraImpressao
  }

  static async trabalhosImpressao(status = 'TODOS') {
    const { data } = await http.get('/v1/restaurante/trabalhos-impressao', { params: { status } })
    return data.data as RestauranteTrabalhoImpressao[]
  }

  static async reimprimirTicket(id: number) {
    const { data } = await http.post(`/v1/restaurante/kds/${id}/reimprimir`)
    return data.data as RestauranteTrabalhoImpressao[]
  }

  static async heartbeatEstacao(
    token: string,
    payload: { impressoraNome: string; papel: '58mm' | '80mm' },
  ) {
    const { data } = await http.post('/v1/restaurante/estacao-impressao/heartbeat', payload, {
      headers: { 'X-Print-Station-Token': token },
    })
    return data.data
  }

  static async buscarTrabalhosEstacao(token: string) {
    const { data } = await http.get('/v1/restaurante/estacao-impressao/trabalhos', {
      headers: { 'X-Print-Station-Token': token },
    })
    return data.data as RestauranteTrabalhoEstacao[]
  }

  static async confirmarTrabalhoEstacao(
    token: string,
    payload: { uid: string; leaseToken: string; success: boolean; error?: string | null },
  ) {
    const { data } = await http.post('/v1/restaurante/estacao-impressao/trabalhos/ack', payload, {
      headers: { 'X-Print-Station-Token': token },
    })
    return data.data as { uid: string; status: string }
  }
}
