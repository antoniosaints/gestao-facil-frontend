import type { Contas, FaturasContas, Usuarios } from '@/types/schemas'
import http from '@/utils/axios'
export interface StatusConta {
  status: string
  valor: string
  faturas: FaturasContas[]
  diasParaVencer: number
  proximoVencimento: string
  valorTotal: string
  valorPendente: string
  valorPago: string
  valorCancelado: string
  proximoLinkPagamento: string | null
  labelAssinatura: string
}
export interface UpdateConta {
  nome: string
  nomeFantasia: string
  documento: string
  telefone: string
  endereco: string
  tipo: string
}
export class ContaRepository {
  static async status(): Promise<{ data: StatusConta }> {
    const data = await http.get(`/contas/assinatura/status`)
    return data.data
  }
  static async info(): Promise<Contas & { Usuarios: Usuarios[] }> {
    const data = await http.get(`/contas/infos`)
    return data.data
  }
  static async detalhes(): Promise<Contas> {
    const data = await http.get(`/contas/detalhes`)
    return data.data
  }
  static async update(data: Partial<UpdateConta>): Promise<void> {
    await http.post(`/contas/atualizar`, data)
  }
  static async gerarLink(): Promise<{ link: string }> {
    const data = await http.get(`/contas/assinatura/mercadopago`)
    return data.data
  }
}
