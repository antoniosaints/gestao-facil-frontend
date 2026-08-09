import http from '@/utils/axios'
import type { ThemeCustomization } from '@/types/schemas'

export type RestaurantePapel = 'GESTOR' | 'CAIXA' | 'GARCOM' | 'COZINHA' | 'EXPEDICAO'
export type RestauranteCapability =
  | 'SALAO_VISUALIZAR' | 'SALAO_OPERAR' | 'SALAO_CONFIGURAR'
  | 'COMANDAS_OPERAR'
  | 'KDS_VISUALIZAR' | 'KDS_OPERAR' | 'KDS_CONFIGURAR'
  | 'IMPRESSAO_VISUALIZAR' | 'IMPRESSAO_CONFIGURAR'
  | 'CARDAPIO_VISUALIZAR' | 'CARDAPIO_CONFIGURAR'
  | 'PEDIDOS_VISUALIZAR' | 'PEDIDOS_OPERAR'
  | 'CONFIGURACOES_GERENCIAR' | 'PAPEIS_GERENCIAR'

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
  subtotal: string | number
  frete: string | number
  desconto?: string | number
  total: string | number
  observacao?: string | null
  version: number
  createdAt: string
  Mesa?: { nome: string } | null
  tickets?: Array<{ id: number }>
  itens: Array<{
    id: number
    nomeSnapshot: string
    quantidade: string | number
    subtotalSnapshot: string | number
    tamanhoSnapshot?: string | null
    selecoesSnapshotJson?: Array<{ nome?: string }> | null
    observacao?: string | null
  }>
}

export interface RestaurantePublicOrderTracking {
  codigo: string
  origem: 'RETIRADA' | 'DELIVERY' | 'MESA'
  status: RestaurantePedidoStatus
  producaoStatus: string
  pagamentoStatus: string
  entregaStatus: string
  subtotal: string | number
  frete: string | number
  total: string | number
  createdAt: string
  updatedAt: string
  concluidoAt?: string | null
  canceladoAt?: string | null
  itens: Array<{
    nomeSnapshot: string
    quantidade: string | number
    subtotalSnapshot: string | number
    selecoesSnapshotJson?: unknown
  }>
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
  Pedido: {
    id: number
    codigo: string
    origem: string
    observacao?: string | null
    createdAt: string
    Mesa?: { nome: string } | null
  }
  itens: Array<{
    quantidade: string | number
    observacao?: string | null
    PedidoItem: {
      id: number
      nomeSnapshot: string
      tamanhoSnapshot?: string | null
      selecoesSnapshotJson?: Array<{ nome: string }> | null
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
  Ponto: { id: number; nome: string }
  Ticket: { Pedido: { codigo: string } }
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

export type RestauranteWhatsAppNotificationEvent = 'PEDIDO_FEITO' | 'EM_PREPARO' | 'SAIU_ENTREGA' | 'PRONTO' | 'ENTREGUE' | 'POS_PEDIDO'
export type RestauranteWhatsAppNotifications = Record<RestauranteWhatsAppNotificationEvent, { ativo: boolean; mensagem: string }>

export interface RestauranteConfig {
  id?: number
  slug: string
  nomePublico: string
  ativo: boolean
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

export type RestauranteZonaPayload = Omit<RestauranteZonaEntrega, 'id' | 'version'> & { version?: number }

export interface RestauranteCheckoutPreview {
  subtotal: string | number
  frete: string | number
  total: string | number
  minimumOrder: string | number
  minimumReached: boolean
  zone?: { tipo: string; nome: string; taxa: string | number } | null
}

export interface RestauranteProdutoDisponivel {
  id: number
  nome: string
  nomeVariante: string
  preco: string | number
  estoque: number
  imagem?: string | null
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
  produtoId: number
  nomePublico?: string | null
  descricao?: string | null
  imagem?: string | null
  disponivel: boolean
  regraPrecoSabores: 'MAIOR_PRECO' | 'MEDIA_PROPORCIONAL' | 'SOMA'
  ordem: number
  version: number
  Produto: RestauranteProdutoDisponivel
  grupos: Array<{ grupoId: number; Grupo: RestauranteGrupoOpcao }>
}

export interface RestauranteCatalogoPayload {
  produtoId: number
  nomePublico?: string | null
  descricao?: string | null
  imagem?: string | null
  disponivel: boolean
  regraPrecoSabores: RestauranteCatalogoItem['regraPrecoSabores']
  ordem: number
  grupoIds: number[]
  version?: number
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

  static async cardapioPublico(slug: string) {
    const { data } = await http.get(`/v1/restaurante/publico/${slug}/cardapio`)
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
        temaPersonalizado?: Partial<ThemeCustomization> | null
      }
      itens: any[]
    }
  }

  static async criarPedidoPublico(slug: string, payload: unknown, idempotencyKey: string) {
    const { data } = await http.post(`/v1/restaurante/publico/${slug}/pedidos`, payload, {
      headers: { 'Idempotency-Key': idempotencyKey },
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

  static async pedidos(params: { page?: number; limit?: number; status?: string; inicio?: string; fim?: string } = {}) {
    const { data } = await http.get('/v1/restaurante/pedidos', { params })
    return data as {
      data: RestaurantePedido[]
      meta: { page: number; pages: number; total: number; localizacaoEmpresa?: RestauranteLocalizacao | null }
    }
  }

  static async transicionar(id: number, status: RestaurantePedidoStatus, version: number) {
    const { data } = await http.post(`/v1/restaurante/pedidos/${id}/transicao`, { status, version })
    return data.data as RestaurantePedido
  }

  static async configuracao() {
    const { data } = await http.get('/v1/restaurante/configuracao')
    return data.data as RestauranteConfig | null
  }

  static async salvarConfiguracao(config: RestauranteConfig) {
    const { data } = await http.put('/v1/restaurante/configuracao', config)
    return data.data as RestauranteConfig
  }

  static async catalogo(params: { page?: number; limit?: number } = {}) {
    const { data } = await http.get('/v1/restaurante/cardapio', { params })
    return data as {
      data: RestauranteCatalogoItem[]
      meta: { page: number; pages: number; total: number }
    }
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

  static async salvarMesa(payload: { nome: string; ativa: boolean; version?: number }, id?: number) {
    const response = id
      ? await http.patch(`/v1/restaurante/mesas/${id}`, payload)
      : await http.post('/v1/restaurante/mesas', payload)
    return response.data.data as RestauranteMesa
  }

  static async abrirMesa(id: number, payload: { pessoas: number; clienteNome?: string | null; observacao?: string | null }) {
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

  static async salvarPontoProducao(payload: { nome: string; cor: string; ativo: boolean; ordem: number; categoriaIds: number[]; version?: number }, id?: number) {
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

  static async salvarEstacaoImpressao(payload: { nome: string; ativa: boolean; version?: number }, id?: number) {
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

  static async heartbeatEstacao(token: string, payload: { impressoraNome: string; papel: '58mm' | '80mm' }) {
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

  static async confirmarTrabalhoEstacao(token: string, payload: { uid: string; leaseToken: string; success: boolean; error?: string | null }) {
    const { data } = await http.post('/v1/restaurante/estacao-impressao/trabalhos/ack', payload, {
      headers: { 'X-Print-Station-Token': token },
    })
    return data.data as { uid: string; status: string }
  }
}
