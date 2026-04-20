import http from '@/utils/axios'

export type PeriodicidadeAssinatura =
  | 'SEMANAL'
  | 'QUINZENAL'
  | 'MENSAL'
  | 'BIMESTRAL'
  | 'TRIMESTRAL'
  | 'SEMESTRAL'
  | 'ANUAL'
  | 'PERSONALIZADO'

export type StatusPlanoAssinatura = 'ATIVO' | 'INATIVO'
export type StatusAssinaturaCliente = 'ATIVA' | 'SUSPENSA' | 'CANCELADA' | 'ENCERRADA'
export type ModoValorAssinatura = 'MANUAL' | 'DINAMICO'
export type TipoItemAssinatura = 'SERVICO' | 'PRODUTO'
export type StatusCicloAssinatura = 'PENDENTE' | 'COBRADO' | 'PAGO' | 'ATRASADO' | 'CANCELADO' | 'FALHA'
export type StatusComodatoAssinatura = 'EM_USO' | 'DEVOLVIDO' | 'PERDIDO' | 'AVARIADO'

export type GatewayAssinatura = 'mercadopago' | 'pagseguro' | 'asaas'
export type TipoCobrancaAssinatura = 'PIX' | 'BOLETO' | 'LINK'

export interface AssinaturaOption {
  id: number
  label: string
}

export interface AssinaturaItemForm {
  tipoItem: TipoItemAssinatura
  servicoId?: number | string | null
  produtoId?: number | string | null
  descricaoSnapshot: string
  quantidade: number
  valorUnitario: number
  cobrar: boolean
  comodato: boolean
  ativo?: boolean
  identificacao?: string | null
  dataPrevistaDevolucao?: string | Date | null
  observacoes?: string | null
}

export interface PlanoAssinaturaPayload {
  id?: number
  nome: string
  descricao?: string
  status: StatusPlanoAssinatura
  periodicidadePadrao: PeriodicidadeAssinatura
  intervaloDiasPadrao?: number
  valorBase: number
  modoValorPadrao: ModoValorAssinatura
  gatewayPadrao?: GatewayAssinatura
  tipoCobrancaPadrao?: TipoCobrancaAssinatura
  itens: AssinaturaItemForm[]
}

export interface AssinaturaClientePayload {
  id?: number
  clienteId: number | string
  planoId?: number | string
  nomeContrato: string
  status: StatusAssinaturaCliente
  modoValor: ModoValorAssinatura
  valorManual?: number
  periodicidade: PeriodicidadeAssinatura
  intervaloDiasPersonalizado?: number
  inicio: string
  fim?: string
  recorrenciaIndefinida: boolean
  proximaCobranca?: string
  cobrancaAutomatica: boolean
  gateway?: GatewayAssinatura
  tipoCobranca?: TipoCobrancaAssinatura
  gerarLancamentoFinanceiro: boolean
  observacoes?: string
  itens: AssinaturaItemForm[]
  gerarPrimeiroCiclo?: boolean
}

export interface PlanoAssinaturaListItem {
  id: number
  Uid: string
  nome: string
  descricao?: string | null
  status: StatusPlanoAssinatura
  periodicidadePadrao: PeriodicidadeAssinatura
  intervaloDiasPadrao?: number | null
  valorBase: number
  modoValorPadrao: ModoValorAssinatura
  gatewayPadrao?: GatewayAssinatura | null
  tipoCobrancaPadrao?: TipoCobrancaAssinatura | null
  itens: AssinaturaItemForm[]
  resumo: {
    itens: number
    itensCobrados: number
    assinaturasVinculadas: number
  }
  createdAt: string
  updatedAt: string
}

export interface AssinaturaClienteListItem {
  id: number
  Uid: string
  nomeContrato: string
  status: StatusAssinaturaCliente
  modoValor: ModoValorAssinatura
  valorManual?: number | null
  valorAtual: number
  periodicidade: PeriodicidadeAssinatura
  intervaloDiasPersonalizado?: number | null
  inicio: string
  fim?: string | null
  recorrenciaIndefinida: boolean
  proximaCobranca: string
  cobrancaAutomatica: boolean
  gateway?: GatewayAssinatura | null
  tipoCobranca?: TipoCobrancaAssinatura | null
  observacoes?: string | null
  cliente?: { id: number; nome: string } | null
  plano?: { id: number; nome: string } | null
  resumo: {
    itens: number
    ciclosRecentes: number
    pendencias: number
  }
}

export interface AssinaturaDashboardResponse {
  data: {
    kpis: {
      totalAssinaturas: number
      assinaturasAtivas: number
      assinaturasSuspensas: number
      assinaturasCanceladas: number
      mrrEstimado: number
      inadimplencia: number
      cobrancasPendentes: number
      cobrancasAtrasadas: number
      comodatosEmUso: number
    }
    proximosVencimentos: Array<{
      id: number
      Uid: string
      nomeContrato: string
      cliente: string
      plano?: string | null
      proximaCobranca: string
      valorPrevisto: number
      status: StatusAssinaturaCliente
      atrasada: boolean
    }>
  }
}

export interface AssinaturaDetalheResponse {
  data: {
    id: number
    Uid: string
    nomeContrato: string
    status: StatusAssinaturaCliente
    modoValor: ModoValorAssinatura
    valorManual?: number | null
    valorAtual: number
    periodicidade: PeriodicidadeAssinatura
    intervaloDiasPersonalizado?: number | null
    inicio: string
    fim?: string | null
    recorrenciaIndefinida: boolean
    proximaCobranca: string
    cobrancaAutomatica: boolean
    gateway?: GatewayAssinatura | null
    tipoCobranca?: TipoCobrancaAssinatura | null
    gerarLancamentoFinanceiro: boolean
    observacoes?: string | null
    cliente?: { id: number; nome: string; Uid: string } | null
    plano?: { id: number; nome: string; valorBase: number; periodicidadePadrao: PeriodicidadeAssinatura } | null
    resumo: {
      itens: number
      itensCobrados: number
      comodatos: number
      ciclosPendentes: number
      ciclosAtrasados: number
      historico: number
    }
    itens: Array<{
      id: number
      tipoItem: TipoItemAssinatura
      servicoId?: number | null
      produtoId?: number | null
      descricaoSnapshot: string
      quantidade: number
      valorUnitario: number
      cobrar: boolean
      comodato: boolean
      ativo: boolean
      servico?: { id: number; nome: string } | null
      produto?: { id: number; nome: string; variante?: string | null } | null
      comodatos: Array<{
        id: number
        quantidade: number
        identificacao?: string | null
        status: StatusComodatoAssinatura
        dataEntrega: string
        dataPrevistaDevolucao?: string | null
        dataDevolucao?: string | null
        observacoes?: string | null
        produto?: { id: number; nome: string; variante?: string | null } | null
      }>
    }>
    ciclos: Array<{
      id: number
      referencia: string
      inicioPeriodo: string
      fimPeriodo: string
      valorCalculado: number
      valorCobrado: number
      status: StatusCicloAssinatura
      cobrancaFinanceiraId?: number | null
      lancamentoFinanceiroId?: number | null
      gatewayUsado?: string | null
      tipoCobrancaUsado?: string | null
      createdAt: string
    }>
    historico: Array<{
      id: number
      evento: string
      payloadJson?: string | null
      autor: string
      createdAt: string
    }>
  }
}

export interface AssinaturaCicloListItem {
  id: number
  referencia: string
  inicioPeriodo: string
  fimPeriodo: string
  valorCalculado: number
  valorCobrado: number
  status: StatusCicloAssinatura
  gatewayUsado?: GatewayAssinatura | null
  tipoCobrancaUsado?: TipoCobrancaAssinatura | null
  createdAt: string
  assinatura: {
    id: number
    Uid: string
    nomeContrato: string
    cliente: string
  }
}

export interface AssinaturaComodatoListItem {
  id: number
  quantidade: number
  identificacao?: string | null
  status: StatusComodatoAssinatura
  dataEntrega: string
  dataPrevistaDevolucao?: string | null
  dataDevolucao?: string | null
  observacoes?: string | null
  produto?: { id: number; nome: string; variante?: string | null } | null
  assinatura: {
    id: number
    Uid: string
    nomeContrato: string
    cliente: string
  }
}

export class AssinaturaRepository {
  static async dashboard(): Promise<AssinaturaDashboardResponse> {
    const { data } = await http.get('/assinaturas/dashboard')
    return data
  }

  static async opcoes(): Promise<{ data: { clientes: AssinaturaOption[]; servicos: AssinaturaOption[]; produtos: AssinaturaOption[] } }> {
    const { data } = await http.get('/assinaturas/opcoes')
    return data
  }

  static async listarPlanos(params?: Record<string, any>): Promise<{ data: PlanoAssinaturaListItem[] }> {
    const { data } = await http.get('/assinaturas/planos', { params })
    return data
  }

  static async salvarPlano(payload: PlanoAssinaturaPayload) {
    const { data } = await http.post('/assinaturas/planos', payload)
    return data
  }

  static async listarAssinaturas(params?: Record<string, any>): Promise<{ data: AssinaturaClienteListItem[] }> {
    const { data } = await http.get('/assinaturas/assinaturas', { params })
    return data
  }

  static async salvarAssinatura(payload: AssinaturaClientePayload) {
    const { data } = await http.post('/assinaturas/assinaturas', payload)
    return data
  }

  static async detalhes(id: number): Promise<AssinaturaDetalheResponse> {
    const { data } = await http.get(`/assinaturas/assinaturas/${id}`)
    return data
  }

  static async atualizarStatus(id: number, status: StatusAssinaturaCliente) {
    const { data } = await http.post(`/assinaturas/assinaturas/${id}/status`, { status })
    return data
  }

  static async gerarCiclo(id: number) {
    const { data } = await http.post(`/assinaturas/assinaturas/${id}/gerar-ciclo`)
    return data
  }

  static async listarCobrancas(params?: Record<string, any>): Promise<{ data: AssinaturaCicloListItem[] }> {
    const { data } = await http.get('/assinaturas/cobrancas', { params })
    return data
  }

  static async atualizarStatusCobranca(id: number, status: StatusCicloAssinatura) {
    const { data } = await http.post(`/assinaturas/cobrancas/${id}/status`, { status })
    return data
  }

  static async listarComodatos(params?: Record<string, any>): Promise<{ data: AssinaturaComodatoListItem[] }> {
    const { data } = await http.get('/assinaturas/comodatos', { params })
    return data
  }

  static async atualizarStatusComodato(id: number, status: StatusComodatoAssinatura) {
    const { data } = await http.post(`/assinaturas/comodatos/${id}/status`, { status })
    return data
  }
}
