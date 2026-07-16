import http from '@/utils/axios'

export interface IaTextResult {
  text: string
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
}

export interface IaMeuUso {
  totalTokens: number
  limite: number | null
  restante: number | null
  custoEstimado: number
}

// Repositório das features de IA (Gemini). Todos os endpoints exigem o app "core-ia" ativo e
// respeitam o limite mensal de tokens da conta (429 quando excedido).
export class IaRepository {
  // Fase 1 — geração de texto
  static async descricaoProduto(payload: {
    nome: string
    categoria?: string | null
    atributos?: string | null
    descricaoAtual?: string | null
  }): Promise<IaTextResult> {
    const { data } = await http.post('/ia/produto/descricao', payload)
    return data.data
  }

  static async texto(payload: {
    modo: 'gerar' | 'melhorar' | 'resumir'
    texto?: string | null
    contexto?: string | null
  }): Promise<IaTextResult> {
    const { data } = await http.post('/ia/texto', payload)
    return data.data
  }

  static async redigirOs(payload: {
    tipo: 'laudo' | 'mensagem_cliente'
    problema: string
    itens?: string | null
    cliente?: string | null
  }): Promise<IaTextResult> {
    const { data } = await http.post('/ia/os/redigir', payload)
    return data.data
  }

  // Fase 2 — atendimento (WhatsApp): sugestões para o atendente humano.
  static async sugerirRespostaAtendimento(conversaId: number): Promise<IaTextResult> {
    const { data } = await http.post('/ia/atendimento/sugerir-resposta', { conversaId })
    return data.data
  }

  static async resumoAtendimento(conversaId: number): Promise<IaTextResult> {
    const { data } = await http.post('/ia/atendimento/resumo', { conversaId })
    return data.data
  }

  // Fase 3 — análise & inteligência.
  static async insightsDashboard(payload: { inicio?: string | null; fim?: string | null }): Promise<{
    text: string
    kpis: Record<string, any>
    usage?: IaTextResult['usage']
  }> {
    const { data } = await http.post('/ia/insights/dashboard', payload)
    return data.data
  }

  static async categorizarLancamento(payload: {
    descricao: string
    valor?: number | null
    tipo?: 'RECEITA' | 'DESPESA' | null
  }): Promise<{ categoria: { id: number; nome: string } | null }> {
    const { data } = await http.post('/ia/financeiro/categorizar', payload)
    return data.data
  }

  // Uso de IA da própria conta no mês (para o indicador no Core IA).
  static async meuUso(): Promise<IaMeuUso> {
    const { data } = await http.get('/ia/uso')
    return data.data
  }
}

// Helper para identificar erro de limite de IA (HTTP 429).
export function isIaQuotaError(error: any): boolean {
  return error?.response?.status === 429
}
