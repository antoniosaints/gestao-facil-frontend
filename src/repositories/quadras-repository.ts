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
  static async getPublico(contaId: number, id?: number) {
    const data = await http.get(`/arenas/quadras/publico/agendamento`, {
      params: {
        contaId,
        id,
      },
    })
    return data.data
  }
  static async save(data: Omit<ClientesFornecedores, 'id'>) {
    await http.post(`/clientes`, data)
  }
}
