import type { ClientesFornecedores } from '@/types/schemas'
import http from '@/utils/axios'
export class OrdensServicoRepository {
  static async get(id: number) {
    const data = await http.get(`/ordens-servico/${id}`)
    return data.data
  }
  static async remove(id: number) {
    await http.delete(`/ordens-servico/${id}`)
  }
  static async update(data: Partial<ClientesFornecedores>, id: number) {
    data.id = id
    await http.post(`/ordens-servico`, data)
  }
  static async save(data: Omit<ClientesFornecedores, 'id'>) {
    await http.post(`/ordens-servico`, data)
  }
}
