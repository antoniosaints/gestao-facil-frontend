import http from '@/utils/axios'

export type TipoMeta = 'VENDAS' | 'SERVICOS' | 'FINANCEIRO'
export type MetricaMeta = 'VALOR' | 'QUANTIDADE'
export type PeriodicidadeMeta = 'MENSAL' | 'TRIMESTRAL' | 'ANUAL' | 'PERSONALIZADO'
export type FinanceiroTipoMeta = 'RECEITA' | 'DESPESA'

export type MetaResumo = {
  id: number
  nome: string
  descricao?: string | null
  tipo: TipoMeta
  metrica: MetricaMeta
  periodicidade: PeriodicidadeMeta
  financeiroTipo?: FinanceiroTipoMeta | null
  ativo: boolean
  valorAlvo: number
  valorAtual: number
  percentual: number
  atingida: boolean
  restante: number
  periodoAtual: {
    label: string
    inicio: string | Date
    fim: string | Date
  }
  historico: Array<{
    label: string
    inicio: string | Date
    fim: string | Date
    valorAtual: number
    percentual: number
    atingida: boolean
  }>
}

export type MetaPayload = {
  id?: number | null
  nome: string
  descricao?: string | null
  tipo: TipoMeta
  metrica: MetricaMeta
  periodicidade: PeriodicidadeMeta
  valorAlvo: number
  dataInicio: string
  dataFim?: string | null
  financeiroTipo?: FinanceiroTipoMeta | null
  ativo: boolean
}

export class MetasRepository {
  static async listar(): Promise<{ data: MetaResumo[] }> {
    const response = await http.get('/metas')
    return response.data
  }

  static async resumo(): Promise<{ data: MetaResumo[] }> {
    const response = await http.get('/metas/resumo')
    return response.data
  }

  static async salvar(payload: MetaPayload): Promise<{ data: MetaResumo; message: string }> {
    const response = await http.post('/metas', payload)
    return response.data
  }

  static async excluir(id: number): Promise<{ message: string }> {
    const response = await http.delete(`/metas/${id}`)
    return response.data
  }
}
