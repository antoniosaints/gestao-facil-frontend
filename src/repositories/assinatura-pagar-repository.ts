import http from '@/utils/axios'

export type PeriodicidadeAssinaturaPagar = 'SEMANAL' | 'QUINZENAL' | 'MENSAL' | 'ANUAL' | 'PERSONALIZADO'
export type StatusAssinaturaPagar = 'ATIVA' | 'INATIVA' | 'CANCELADA'
export type OrigemLancamentoFinanceiro = 'MANUAL' | 'ASSINATURA_PAGAR'

export interface AssinaturaPagarLinkPayload {
  titulo: string
  url: string
}

export interface AssinaturaPagarPayload {
  id?: number
  nomeServico: string
  valor: number
  periodicidade: PeriodicidadeAssinaturaPagar
  intervaloDiasPersonalizado?: number | null
  inicio: string
  fim?: string | null
  proximoVencimento: string
  status: StatusAssinaturaPagar
  gerarFinanceiro: boolean
  gerarAutomatico: boolean
  contaFinanceiraId?: number | null
  categoriaId?: number | null
  formaPagamento?: 'DINHEIRO' | 'DEBITO' | 'CREDITO' | 'BOLETO' | 'TRANSFERENCIA' | 'CHEQUE' | 'PIX' | 'GATEWAY' | 'OUTRO' | null
  corDestaque?: string | null
  observacoes?: string | null
  links: AssinaturaPagarLinkPayload[]
}

export interface AssinaturaPagarListItem {
  id: number
  Uid: string
  nomeServico: string
  valor: number
  periodicidade: PeriodicidadeAssinaturaPagar
  intervaloDiasPersonalizado?: number | null
  inicio: string
  fim?: string | null
  proximoVencimento?: string | null
  status: StatusAssinaturaPagar
  gerarFinanceiro: boolean
  gerarAutomatico: boolean
  contaFinanceiraId?: number | null
  categoriaId?: number | null
  formaPagamento?: string | null
  icone?: string | null
  corDestaque?: string | null
  observacoes?: string | null
  links: Array<{ id?: number; titulo: string; url: string }>
  resumo: {
    links: number
    lancamentos: number
    pendentes: number
    pagos: number
  }
  lancamentoAtual?: {
    id: number
    status: string
    referenciaRecorrencia?: string | null
    dataLancamento: string
  } | null
}

export class AssinaturaPagarRepository {
  static async listar(params?: Record<string, any>): Promise<{ data: AssinaturaPagarListItem[] }> {
    const response = await http.get('/lancamentos/assinaturas-pagar', { params })
    return response.data
  }

  static async detalhes(id: number): Promise<{ data: AssinaturaPagarListItem }> {
    const response = await http.get(`/lancamentos/assinaturas-pagar/${id}`)
    return response.data
  }

  static async salvar(payload: AssinaturaPagarPayload) {
    const response = await http.post('/lancamentos/assinaturas-pagar', payload)
    return response.data
  }

  static async excluir(id: number) {
    const response = await http.delete(`/lancamentos/assinaturas-pagar/${id}`)
    return response.data
  }

  static async atualizarStatus(id: number, status: StatusAssinaturaPagar) {
    const response = await http.post(`/lancamentos/assinaturas-pagar/${id}/status`, { status })
    return response.data
  }

  static async gerarFinanceiro(id: number) {
    const response = await http.post(`/lancamentos/assinaturas-pagar/${id}/gerar-financeiro`)
    return response.data
  }

  static async uploadIcon(id: number, file: File) {
    const data = new FormData()
    data.append('serviceIcon', file)
    const response = await http.post(`/uploads/subscriptions-pay/${id}/icon`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
}
