import type { ComandaVenda } from '@/types/schemas'
import http from '@/utils/axios'

export type ComandaPayload = {
  id?: number | null
  clienteId?: number
  clienteNome: string
  observacao?: string
  reservaId?: number
}

export type ComandaItemPayload = {
  tipo: 'PRODUTO' | 'SERVICO'
  itemId: number
  quantidade: number
  valor: number
}

export type CheckoutComandaPayload = {
  itemIds: number[]
  valor: number
  gateway: 'interno' | 'mercadopago'
  tipoCobranca?: 'PIX' | 'BOLETO' | 'LINK' | null
  vencimento: string
  observacao?: string | null
  clienteId?: number | null
}

export class ComandaRepository {
  static async list(params?: {
    page?: number
    pageSize?: number
    search?: string
    status?: string
    sortBy?: string
    order?: 'asc' | 'desc'
  }) {
    const { data } = await http.get(`/vendas/comandas`, {
      params,
    })
    return data
  }

  static async get(id: number) {
    const { data } = await http.get(`/vendas/comandas/${id}`)
    return data
  }

  static async save(payload: ComandaPayload) {
    const { data } = await http.post(`/vendas/comandas`, payload)
    return data
  }

  static async remove(id: number) {
    const { data } = await http.delete(`/vendas/comandas/${id}`)
    return data
  }

  static async addItem(comandaId: number, payload: ComandaItemPayload) {
    const { data } = await http.post(`/vendas/comandas/${comandaId}/itens`, payload)
    return data
  }

  static async removeItem(comandaId: number, itemId: number) {
    const { data } = await http.delete(`/vendas/comandas/${comandaId}/itens/${itemId}`)
    return data
  }

  static async checkout(comandaId: number, payload: CheckoutComandaPayload) {
    const { data } = await http.post(`/vendas/comandas/${comandaId}/checkout`, payload)
    return data as {
      message: string
      data: {
        vendaId: number
        paymentLink: string | null
      }
    }
  }

  static mapForm(data?: Partial<ComandaVenda> | null): ComandaPayload {
    return {
      id: data?.id ?? null,
      clienteId: data?.clienteId ?? undefined,
      clienteNome: data?.clienteNome ?? '',
      observacao: data?.observacao ?? '',
      reservaId: data?.reservaId ?? undefined,
    }
  }
}
