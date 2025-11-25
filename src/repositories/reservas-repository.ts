import type { ClientesFornecedores } from '@/types/schemas'
import http from '@/utils/axios'
export class ArenaReservasRepository {
  static async get(id?: number, quadraId?: number, inicio?: string, fim?: string) {
    const data = await http.get(`/arenas/reservas`, {
      params: {
        id,
        quadraId,
        inicio,
        fim,
      },
    })
    return data.data
  }
  static async save(data: Omit<ClientesFornecedores, 'id'>) {
    await http.post(`/clientes`, data)
  }
}
