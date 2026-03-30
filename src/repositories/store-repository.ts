import http from '@/utils/axios'

export interface StoreModule {
  id: number
  codigo: string
  nome: string
  descricao?: string | null
  detalhes?: string | null
  categoria: string
  preco: number
  ativo: boolean
  pendenteAtivacao: boolean
  cancelamentoAgendado: boolean
  cobrancaPendenteAtual: boolean
  ativacaoImediataDisponivel: boolean
  valorCobrancaProporcional: number
  valorCobrancaMensal: number
  vigenciaAte?: string | Date | null
  cobrancaAtual?: {
    id: number
    tipo?: 'PROPORCIONAL' | 'MENSAL' | null
    valor: number
    linkPagamento?: string | null
    vencimento?: string | Date | null
    status: string
    gateway: string
  } | null
}

export interface StoreResumo {
  mensalidadeAtual: number
  valorBasePlano: number
  valorAppsProximoCiclo: number
  totalAppsDisponiveis: number
  totalAppsEmUso: number
  totalAppsPendentes: number
  proximoVencimento: string | Date
  contaAtiva: boolean
}

export class StoreRepository {
  static async listar() {
    const { data } = await http.get('/contas/store/modulos')
    return data as {
      data: StoreModule[]
      resumo: StoreResumo
    }
  }

  static async ativar(id: number, billingMode: 'PROPORCIONAL' | 'MENSAL') {
    const { data } = await http.post(`/contas/store/modulos/${id}/ativar`, {
      billingMode,
    })
    return data
  }

  static async cancelar(id: number) {
    const { data } = await http.post(`/contas/store/modulos/${id}/cancelar`)
    return data
  }
}
