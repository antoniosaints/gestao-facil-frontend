import http from '@/utils/axios'

export type RestaurantePedidoStatus =
  | 'RECEBIDO'
  | 'CONFIRMADO'
  | 'EM_PREPARO'
  | 'PRONTO'
  | 'CONCLUIDO'
  | 'CANCELADO'

export interface RestaurantePedido {
  id: number
  codigo: string
  origem: string
  status: RestaurantePedidoStatus
  producaoStatus: string
  pagamentoStatus: string
  entregaStatus: string
  clienteNomeSnapshot?: string | null
  subtotal: string | number
  frete: string | number
  total: string | number
  version: number
  createdAt: string
  Mesa?: { nome: string } | null
  itens: Array<{
    id: number
    nomeSnapshot: string
    quantidade: string | number
    subtotalSnapshot: string | number
  }>
}

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
  static async cardapioPublico(slug: string) {
    const { data } = await http.get(`/v1/restaurante/publico/${slug}/cardapio`)
    return data.data as {
      restaurante: {
        nome: string
        slug: string
        pedidoMinimo: string | number
        retiradaAtiva: boolean
        deliveryAtivo: boolean
        pagamentoOnlineAtivo: boolean
        pagamentoNaEntregaAtivo: boolean
        modoFrete: 'FIXO' | 'ZONAS'
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
    return data.data as {
      codigo: string
      status: RestaurantePedidoStatus
      producaoStatus: string
      pagamentoStatus: string
      entregaStatus: string
      updatedAt: string
    }
  }

  static async pedidos(params: { page?: number; limit?: number; status?: string } = {}) {
    const { data } = await http.get('/v1/restaurante/pedidos', { params })
    return data as {
      data: RestaurantePedido[]
      meta: { page: number; pages: number; total: number }
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
}
