import type { ClientesFornecedores } from '@/types/schemas'
import http from '@/utils/axios'
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
    await http.post(`/clientes`, data)
  }
}
