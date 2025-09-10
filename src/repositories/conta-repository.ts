import type { FaturasContas } from '@/types/schemas'
import http from '@/utils/axios'
interface StatusConta {
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
export class ContaRepository {
  static async status(): Promise<StatusConta> {
    const data = await http.get(`/contas/assinatura/status`)
    return data.data
  }
}
