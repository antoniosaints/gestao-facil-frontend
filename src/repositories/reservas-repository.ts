import type { ArenaAgendamentos } from '@/types/schemas'
import http from '@/utils/axios'

export interface SaveReservaPublico {
  contaId: number
  quadraId: number
  inicio: string
  fim: string
  modoPagamento: 'PARCIAL' | 'TOTAL'
  nomeCliente?: string
  telefoneCliente?: string
  enderecoCliente?: string
  observacoes?: string
}
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
  static async getResumoMensalChart(ano?: number) {
    const data = await http.get(`/arenas/graficos/receita-mensal`, {
      params: {
        ano,
      },
    })
    return data.data
  }
  static async getTable(
    searchQuery: string,
    page: number = 1,
    limit: number = 10,
    quadraId?: number,
    inicio?: string,
    fim?: string,
  ) {
    const data = await http.get(`/arenas/reservas/tabela`, {
      params: {
        search: searchQuery,
        limit,
        page,
        quadraId,
        inicio,
        fim,
      },
    })
    return data.data
  }
  static async getHorariosPublicoReservar(
    contaId: number,
    quadraId: number,
    inicio: string,
    fim: string,
  ) {
    const data = await http.post(`/arenas/reservas/publico/horarios`, {
      contaId,
      quadraId,
      inicio,
      fim,
    })
    return data.data
  }
  static async save(data: Omit<ArenaAgendamentos, 'id'>) {
    await http.post(`/arenas/reservas/agendar`, {
      ...data,
    })
  }
  static async savePublico(data: SaveReservaPublico) {
    await http.post(`/arenas/reservas/publico/agendamento`, {
      ...data,
    })
  }
  static async update(id: number, data: ArenaAgendamentos) {
    await http.post(`/arenas/reservas/agendar?id=${id}`, {
      ...data,
    })
  }
  static async delete(id: number) {
    await http.delete(`/arenas/reservas?id=${id}`)
  }
  static async estornar(id: number) {
    await http.get(`/arenas/reservas/estornar?id=${id}`)
  }
  static async cancelar(id: number) {
    await http.get(`/arenas/reservas/cancelar?id=${id}`)
  }
  static async confirmar(id: number) {
    await http.get(`/arenas/reservas/confirmar?id=${id}`)
  }
  static async finalizar(id: number) {
    await http.get(`/arenas/reservas/finalizar?id=${id}`)
  }
}
