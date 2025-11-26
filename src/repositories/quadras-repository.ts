import type { ArenaQuadras, ClientesFornecedores } from '@/types/schemas'
import http from '@/utils/axios'
import { formatToNumberValue } from '@/utils/formatters'
export class ArenaQuadrasRepository {
  static async get(id?: number) {
    const data = await http.get(`/arenas/quadras`, {
      params: {
        id,
      },
    })
    return data.data
  }
  static async getTable(searchQuery: string, page: number = 1, limit: number = 10) {
    const data = await http.get(`/arenas/quadras/tabela`, {
      params: {
        search: searchQuery,
        limit,
        page,
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
  static async save(data: Omit<ArenaQuadras, 'id'>) {
    await http.post(`/arenas/quadras/criar`, {
      ...data,
      precoHora: formatToNumberValue(data.precoHora!),
    })
  }
  static async update(id: number, data: ArenaQuadras) {
    await http.post(`/arenas/quadras/criar?id=${id}`, {
      ...data,
      precoHora: formatToNumberValue(data.precoHora!),
    })
  }
}
