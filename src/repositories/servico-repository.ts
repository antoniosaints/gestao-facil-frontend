import type { Servicos } from '@/types/schemas'
import http from '@/utils/axios'
export class ServicoRepository {
  static async get(id: number) {
    const data = await http.get(`/servicos/${id}`)
    return data.data
  }
  static async getMobile(search: string, page: number = 1, limit: number = 10) {
    const data = await http.get(`/servicos/lista/mobile`, {
      params: {
        search,
        limit,
        page,
      },
    })
    return data.data
  }
  static async getAll() {
    const data = await http.get(`/servicos`)
    return data.data
  }
  static async remove(id: number) {
    await http.delete(`/servicos/${id}`)
  }
  static async saveOrUpdate(data: Servicos) {
    await http.post(`/servicos`, data)
  }
}
