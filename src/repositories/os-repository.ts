import type {
  IDetalheOrdemServico,
  ItensOrdensServico,
  MetodoPagamento,
  OrdensServico,
  SaveOrdemServico,
} from '@/types/schemas'
import http from '@/utils/axios'

export interface OrdemServicoEfetivarPayload {
  pagamento: MetodoPagamento
  dataPagamento: Date | string
  categoria: number | null
  conta: number | null
  lancamentoManual: boolean
  cancelarCobrancaExterna?: boolean
}

export class OrdensServicoRepository {
  static async get(
    id: number,
  ): Promise<OrdensServico & { ItensOrdensServico: ItensOrdensServico[] }> {
    const { data } = await http.get(`/servicos/ordens/${id}`)
    return data.data
  }
  static async getDetalhes(id: number): Promise<IDetalheOrdemServico> {
    const { data } = await http.get(`/servicos/ordem-detalhe/${id}`)
    return data.data
  }
  static async addMensagem(id: number, mensagem: string) {
    const { data } = await http.post(`/servicos/ordens/mensagens/${id}`, { mensagem })
    return data.data
  }
  static async getOsPdf(id: number, UID: string, withPix: boolean = false): Promise<any> {
    const data = await http.get(
      `/servicos/ordens/relatorio/${id}${withPix ? '?withPix=true' : ''}`,
      {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/pdf',
        },
      },
    )

    const url = window.URL.createObjectURL(data.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `${UID}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
  static async getAll() {
    const data = await http.get(`/servicos/ordens`)
    return data.data
  }
  static async getEventos(inicio?: string, fim?: string) {
    const data = await http.get(`/servicos/ordens/dashboard/eventos`, {
      params: {
        inicio,
        fim,
      },
    })
    return data.data
  }
  static async getResumo() {
    const data = await http.get(`/servicos/ordens/dashboard/resumo`)
    return data.data
  }
  static async remove(id: number) {
    await http.delete(`/servicos/ordens/${id}`)
  }
  static async efetivar(id: number, data: OrdemServicoEfetivarPayload) {
    const response = await http.post(`/servicos/ordens/${id}/efetivar`, data)
    return response.data
  }
  static async estornar(id: number) {
    const response = await http.get(`/servicos/ordens/${id}/estornar`)
    return response.data
  }
  static async update(data: Partial<SaveOrdemServico>, id: number) {
    await http.post(`/servicos/ordens?id=${id}`, data)
  }
  static async save(data: Omit<SaveOrdemServico, 'id'>) {
    await http.post(`/servicos/ordens`, data)
  }
}
