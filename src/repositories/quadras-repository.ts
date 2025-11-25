import type { ClientesFornecedores } from '@/types/schemas'
import http from '@/utils/axios'
export class ArenaQuadrasRepository {
  static async get(id?: number) {
    const data = await http.get(`/arenas/quadras`, {
      params: {
        id,
      },
    })
    return data.data
  }
  static async save(data: Omit<ClientesFornecedores, 'id'>) {
    await http.post(`/clientes`, data)
  }
}
