import http from '@/utils/axios'

export type ComandaOperacaoStatus = 'ABERTA' | 'PENDENTE' | 'FATURADA' | 'CANCELADA'
export type ComandaOrigemTipo = 'PRODUTO' | 'SERVICO' | 'AVULSO'
export type ComandaPagamentoMetodo = 'PIX' | 'DINHEIRO' | 'CARTAO' | 'BOLETO' | 'PROMISSORIA'

export type ApiResponse<T> = {
  message?: string
  data: T
}

export type DecimalLike = string | number

export interface ComandaOperacaoItem {
  id: number
  comandaId: number
  origemTipo: ComandaOrigemTipo
  origemId: string | null
  nomeSnapshot: string
  valorUnitarioSnapshot: DecimalLike
  quantidade: DecimalLike
  subtotal: DecimalLike
  estoqueDebitado: boolean
  estoqueDevolvido: boolean
  quantidadeDebitada: DecimalLike
  quantidadeDevolvida: DecimalLike
  createdAt?: string
  updatedAt?: string
}

export interface ComandaOperacaoPagamento {
  id: number
  comandaId: number
  metodo: ComandaPagamentoMetodo
  valor: DecimalLike
  dataPagamento: string
  lancarFinanceiro: boolean
  financeiroLancamentoIdSnapshot?: number | null
  contaFinanceiraIdSnapshot?: number | null
  categoriaFinanceiraIdSnapshot?: number | null
}

export interface ComandaOperacaoHistorico {
  id: number
  comandaId: number
  evento: string
  usuarioId?: number | null
  payloadJson?: string | null
  createdAt: string
}

export interface ComandaOperacao {
  id: number
  Uid: string
  contaId: number
  status: ComandaOperacaoStatus
  total: DecimalLike
  abertura: string
  fechamento?: string | null
  faturamento?: string | null
  cancelamento?: string | null
  observacao?: string | null
  itens?: ComandaOperacaoItem[]
  pagamentos?: ComandaOperacaoPagamento[]
  historicos?: ComandaOperacaoHistorico[]
}

export interface ComandaConfiguracao {
  id: number
  contaId: number
  contaFinanceiraIdPadrao?: number | null
  categoriaFinanceiraIdPadrao?: number | null
  createdAt?: string
  updatedAt?: string
}

export type ComandaItemPayload = {
  origemTipo: ComandaOrigemTipo
  origemId?: number | string | null
  nome?: string | null
  valorUnitario: number
  quantidade: number
}

export type CreateComandaPayload = {
  observacao?: string | null
  itens: ComandaItemPayload[]
}

export type FaturarComandaPayload = {
  metodo: ComandaPagamentoMetodo
  dataPagamento: string
  lancarFinanceiro: boolean
  contaFinanceiraId?: number | null
  categoriaFinanceiraId?: number | null
}

export type SaveComandaConfiguracaoPayload = {
  contaFinanceiraIdPadrao?: number | null
  categoriaFinanceiraIdPadrao?: number | null
}

export type ComandaListParams = {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  inicio?: string | null
  fim?: string | null
  sortBy?: string
  order?: 'asc' | 'desc'
}

export type ComandaListResponse = {
  data: ComandaOperacao[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

function openBlob(data: BlobPart, filenameFallback: string) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const opened = window.open(url, '_blank')

  if (!opened) {
    const a = document.createElement('a')
    a.href = url
    a.download = filenameFallback
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  window.setTimeout(() => window.URL.revokeObjectURL(url), 60000)
}

export class ComandaOperacaoRepository {
  static async list(params?: ComandaListParams): Promise<ComandaListResponse> {
    const response = await http.get('/comandas', { params })
    return response.data
  }

  static async get(id: number): Promise<ApiResponse<ComandaOperacao>> {
    const response = await http.get(`/comandas/${id}`)
    return response.data
  }

  static async create(payload: CreateComandaPayload): Promise<ApiResponse<ComandaOperacao>> {
    const response = await http.post('/comandas', payload)
    return response.data
  }

  static async addItens(comandaId: number, payload: { itens: ComandaItemPayload[] }) {
    const response = await http.post(`/comandas/${comandaId}/itens`, payload)
    return response.data as ApiResponse<ComandaOperacao>
  }

  static async updateItem(
    comandaId: number,
    itemId: number,
    payload: ComandaItemPayload & { devolverDiferencaEstoque?: boolean },
  ) {
    const response = await http.put(`/comandas/${comandaId}/itens/${itemId}`, payload)
    return response.data as ApiResponse<ComandaOperacaoItem>
  }

  static async removeItem(comandaId: number, itemId: number, payload: { devolverEstoque?: boolean }) {
    const response = await http.delete(`/comandas/${comandaId}/itens/${itemId}`, { data: payload })
    return response.data as ApiResponse<{ total: DecimalLike }>
  }

  static async fechar(comandaId: number) {
    const response = await http.post(`/comandas/${comandaId}/fechar`)
    return response.data as ApiResponse<ComandaOperacao>
  }

  static async faturar(comandaId: number, payload: FaturarComandaPayload) {
    const response = await http.post(`/comandas/${comandaId}/faturar`, payload)
    return response.data as ApiResponse<ComandaOperacao>
  }

  static async cancelar(comandaId: number, payload: { devolverEstoque?: boolean; observacao?: string | null }) {
    const response = await http.post(`/comandas/${comandaId}/cancelar`, payload)
    return response.data as ApiResponse<ComandaOperacao>
  }

  static async getConfiguracao() {
    const response = await http.get('/comandas/configuracao')
    return response.data as ApiResponse<ComandaConfiguracao | null>
  }

  static async saveConfiguracao(payload: SaveComandaConfiguracaoPayload) {
    const response = await http.post('/comandas/configuracao', payload)
    return response.data as ApiResponse<ComandaConfiguracao>
  }

  static async abrirComprovante(comanda: Pick<ComandaOperacao, 'id' | 'Uid'>) {
    const response = await http.get(`/comandas/${comanda.id}/comprovante`, {
      responseType: 'blob',
      headers: { 'Content-Type': 'application/pdf' },
    })
    openBlob(response.data, `comanda-${comanda.Uid}.pdf`)
  }
}
