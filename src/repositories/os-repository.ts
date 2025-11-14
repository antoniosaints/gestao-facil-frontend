import type {
  ClientesFornecedores,
  ItensOrdensServico,
  OrdensServico,
  SaveOrdemServico,
} from '@/types/schemas'
import http from '@/utils/axios'
export class OrdensServicoRepository {
  static async get(
    id: number,
  ): Promise<OrdensServico & { ItensOrdensServico: ItensOrdensServico[] }> {
    const { data } = await http.get(`/servicos/ordens/${id}`)
    return data.data
  }
  static async getOsPdf(id: number, UID: string): Promise<any> {
    const data = await http.get(`/servicos/ordens/relatorio/${id}`, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/pdf',
      },
    })

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
  static async update(data: Partial<SaveOrdemServico>, id: number) {
    await http.post(`/servicos/ordens?id=${id}`, data)
  }
  static async save(data: Omit<SaveOrdemServico, 'id'>) {
    await http.post(`/servicos/ordens`, data)
  }
}
