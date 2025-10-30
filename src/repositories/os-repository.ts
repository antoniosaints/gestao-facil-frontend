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
  static async getAll() {
    const data = await http.get(`/servicos/ordens`)
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
