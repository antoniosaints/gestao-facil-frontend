import type { ClientesFornecedores } from '@/types/schemas'
import http from '@/utils/axios'

export type ClienteWhatsappPayload =
  | { tipo: 'COBRANCA'; cobrancaId: number }
  | { tipo: 'MENSAGEM'; mensagem: string }
  | { tipo: 'LANCAMENTO'; lancamentoId: number }
  | { tipo: 'ORCAMENTO_VENDA'; vendaId: number }
  | { tipo: 'COMPROVANTE_VENDA'; vendaId: number }

export type ClienteDetalhesTab = 'cobrancas' | 'lancamentos' | 'vendas' | 'ordens'

export interface ClienteDetalhesOperacionaisParams {
  tab: ClienteDetalhesTab
  search?: string
  page?: number
  limit?: number
  inicio?: string | null
  fim?: string | null
}

export class ClienteRepository {
  static async get(id: number) {
    const data = await http.get(`/clientes/${id}`)
    return data.data
  }
  static async remove(id: number) {
    await http.delete(`/clientes/${id}`)
  }
  static async update(data: Partial<ClientesFornecedores>, id: number) {
    data.id = id
    await http.post(`/clientes`, data)
  }
  static async save(data: Omit<ClientesFornecedores, 'id'>) {
    const response = await http.post(`/clientes`, data)
    return response.data as {
      status: number
      message: string
      data: ClientesFornecedores | null
    }
  }
  static async getStats(id: number) {
    const { data } = await http.get(`/clientes/${id}/estatisticas`)
    return data.data
  }
  static async getDetalhesOperacionais(id: number, params: ClienteDetalhesOperacionaisParams) {
    const { data } = await http.get(`/clientes/${id}/detalhes-operacionais`, {
      params: {
        tab: params.tab,
        search: params.search || undefined,
        page: params.page || 1,
        limit: params.limit || 10,
        inicio: params.inicio || undefined,
        fim: params.fim || undefined,
      },
    })
    return data.data
  }
  static async enviarWhatsapp(id: number, payload: ClienteWhatsappPayload) {
    const { data } = await http.post(`/clientes/${id}/whatsapp/enviar`, payload)
    return data.data
  }
  static async select2(search?: string) {
    const { data } = await http.get('/clientes/select2', { params: { search } })
    return data.results as Array<{ id: number; label: string }>
  }
}
