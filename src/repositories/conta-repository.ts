import type { Contas, UpdateParametrosConta, Usuarios } from '@/types/schemas'
import http from '@/utils/axios'

export interface ContaAssinanteAdmin {
  id: number
  Uid: string
  nome: string
  nomeFantasia?: string | null
  email: string
  telefone?: string | null
  documento?: string | null
  status: string
  vencimento: Date | string
  valor: number
  data: Date | string
  funcionarios: number
  gateway: string
  tipo?: string | null
  createdAt: Date | string
  usuariosTotal: number
  diasParaVencer: number
  statusAssinatura: 'EM_DIA' | 'VENCE_HOJE' | 'VENCIDA'
  linkPagamentoPendente?: string | null
}

export interface PaginatedAdminResponse<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface UpdateAssinanteAdminPayload {
  status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO'
  vencimento?: string
}

export interface FaturaContaAdmin {
  id: number
  Uid: string
  asaasPaymentId: string
  descricao?: string | null
  vencimento: Date | string
  valor: number
  urlPagamento: string
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO'
  criadoEm: Date | string
  diasParaVencer: number
  conta: {
    id: number
    nome: string
    nomeFantasia?: string | null
    email: string
    telefone?: string | null
    gateway: string
    status: string
    vencimento: Date | string
  }
}

export interface UpdateFaturaAdminPayload {
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO'
  vencimento?: string
  descricao?: string
}

export interface DashboardAdminKpis {
  totalAssinantes: number
  faturamentoMes: number
  receberMes: number
  pendenteTotal: number
  atrasadoTotal: number
  totalAReceber: number
  novosAssinantes: number
}

export interface DashboardAdminCardItem {
  id: number
  nome: string
  email: string
  vencimento: Date | string
  diasParaVencer: number
  valorPlano: number
}

export interface DashboardAdminRankItem {
  id?: number
  nome: string
  total?: number
  diasInativo?: number
  status?: string
  email?: string
}

export interface DashboardAdminCharts {
  novosAssinantes: any
  faturamentoMensal: any
  topInvestidores: any
  inativosMaisTempo: any
}

export interface DashboardAdminResponse {
  data: {
    kpis: DashboardAdminKpis
    proximosVencimentos: DashboardAdminCardItem[]
    topInvestidores: DashboardAdminRankItem[]
    inativosMaisTempo: DashboardAdminRankItem[]
    charts: DashboardAdminCharts
  }
}

export interface StatusContaFatura {
  id: string
  asaasPaymentId: string
  descricao?: string | null
  vencimento: Date | string
  valor: number | string
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO'
  linkPagamento?: string | null
  color?: string
  origem: 'MENSALIDADE' | 'APP'
  criadoEm?: Date | string
}

export interface StatusConta {
  status: string
  valor: string
  faturas: StatusContaFatura[]
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

  static async listarAssinantes(params?: Record<string, any>): Promise<PaginatedAdminResponse<ContaAssinanteAdmin>> {
    const res = await http.get('/admin/assinantes', {
      params,
    })
    return res.data
  }

  static async gerenciarAssinante(id: number, payload: UpdateAssinanteAdminPayload) {
    const res = await http.post(`/admin/assinantes/${id}/controle`, payload)
    return res.data
  }

  static async listarFaturasAdmin(params?: Record<string, any>): Promise<PaginatedAdminResponse<FaturaContaAdmin>> {
    const res = await http.get('/admin/faturas', {
      params,
    })
    return res.data
  }

  static async gerenciarFaturaAdmin(id: number, payload: UpdateFaturaAdminPayload) {
    const res = await http.post(`/admin/faturas/${id}/controle`, payload)
    return res.data
  }

  static async getDashboardAdmin(): Promise<DashboardAdminResponse> {
    const res = await http.get('/admin/faturas/dashboard')
    return res.data
  }
}
