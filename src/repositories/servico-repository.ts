import type { ClientesFornecedores } from '@/types/schemas'
import http from '@/utils/axios'
export class ServicoRepository {
  static async get(id: number) {
    const data = await http.get(`/servicos/${id}`)
    return data.data
  }
  static async remove(id: number) {
    await http.delete(`/servicos/${id}`)
  }
  static async update(data: Partial<ClientesFornecedores>, id: number) {
    data.id = id
    await http.post(`/servicos`, data)
  }
  static async save(data: Omit<ClientesFornecedores, 'id'>) {
    await http.post(`/servicos`, data)
  }
}
