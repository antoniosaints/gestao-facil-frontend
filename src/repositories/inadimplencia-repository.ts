import http from '@/utils/axios'

export type InadimplenciaStatusFiltro = 'TODOS' | 'ATRASADOS' | 'A_VENCER'
export type LembreteOrigem = 'OVERRIDE_LANCAMENTO' | 'CONFIG_CLIENTE' | 'LEGADO' | null

export interface LembreteCanais {
  whatsapp: boolean
  email: boolean
  sms: boolean
}

export interface InadimplenciaLembreteInfo {
  ativo: boolean
  origem: LembreteOrigem
  dias: number[]
  canais: LembreteCanais
  mensagemCustom: string | null
  temOverride: boolean
  overrideAtivo: boolean | null
  temConfigCliente: boolean
}

export interface InadimplenciaItem {
  id: number
  Uid: string
  descricao: string
  status: string
  cliente: { id: number; nome: string } | null
  valorPendente: number
  valorAtrasado: number
  parcelasPendentes: number
  parcelasAtrasadas: number
  diasAtraso: number
  proximoVencimento: string | null
  proximoLembrete: string | null
  lembrete: InadimplenciaLembreteInfo
}

export interface InadimplenciaListResponse {
  data: InadimplenciaItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface InadimplenciaResumo {
  totalAReceber: number
  totalAtrasado: number
  clientesInadimplentes: number
  lancamentosComLembrete: number
}

export interface InadimplenciaConfig {
  horaEnvio: number
  dias: number[]
  mensagem: string | null
  mensagemModelo: string
}

export interface LembreteConfigPayload {
  ativo: boolean
  dias: number[]
  canalWhatsapp: boolean
  canalEmail: boolean
  canalSms: boolean
  mensagemCustom?: string | null
}

export interface InadimplenciaListParams {
  search?: string
  status?: InadimplenciaStatusFiltro
  clienteId?: number
  page?: number
  pageSize?: number
}

export class InadimplenciaRepository {
  static async listar(params?: InadimplenciaListParams): Promise<InadimplenciaListResponse> {
    const { data } = await http.get('/lancamentos/inadimplencia', { params })
    return data
  }

  static async resumo(): Promise<InadimplenciaResumo> {
    const { data } = await http.get('/lancamentos/inadimplencia/resumo')
    return data.data
  }

  static async getConfig(): Promise<InadimplenciaConfig> {
    const { data } = await http.get('/lancamentos/inadimplencia/config')
    return data.data
  }

  static async salvarConfig(payload: { horaEnvio: number; dias: number[]; mensagem?: string | null }) {
    const { data } = await http.post('/lancamentos/inadimplencia/config', payload)
    return data
  }

  static async salvarLembreteCliente(clienteId: number, payload: LembreteConfigPayload) {
    const { data } = await http.post(`/lancamentos/inadimplencia/cliente/${clienteId}/lembrete`, payload)
    return data
  }

  static async salvarLembreteLancamento(lancamentoId: number, payload: LembreteConfigPayload) {
    const { data } = await http.post(`/lancamentos/inadimplencia/lancamento/${lancamentoId}/lembrete`, payload)
    return data
  }

  static async removerLembreteLancamento(lancamentoId: number) {
    const { data } = await http.delete(`/lancamentos/inadimplencia/lancamento/${lancamentoId}/lembrete`)
    return data
  }

  static async enviarAgora(lancamentoId: number, mensagem?: string, parcelaId?: number) {
    const { data } = await http.post(`/lancamentos/inadimplencia/lancamento/${lancamentoId}/enviar-agora`, {
      mensagem: mensagem || undefined,
      parcelaId: parcelaId || undefined,
    })
    return data
  }

  static async salvarEmMassa(lancamentoIds: number[], payload: LembreteConfigPayload) {
    const { data } = await http.post('/lancamentos/inadimplencia/lembretes/massa', {
      ...payload,
      lancamentoIds,
    })
    return data
  }
}
