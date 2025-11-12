import type { Contas, FaturasContas, UpdateParametrosConta, Usuarios } from '@/types/schemas'
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
export interface CreateConta {
  nome: string
  email: string
  senha: string
  telefone: string
  conta: string
  tipo: string
  funcionarios: number
  dicasNovidades: boolean
  cpfCnpj: string
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
  static async create(data: CreateConta): Promise<Contas> {
    const res = await http.post(`/contas/cadastro`, data)
    return res.data
  }
  static async parametros(data: UpdateParametrosConta): Promise<any> {
    const res = await http.post(`/contas/parametros`, data)
    return res.data
  }
  static async getParametros(): Promise<any> {
    const res = await http.get(`/contas/parametros`)
    return res.data
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
  static async uploadPerfil(file: File) {
    const data = new FormData()
    data.append('profileImage', file)
    await http.post('/uploads/profile', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }
}
