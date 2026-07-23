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
  valorBasePlano?: number
  creditoIndicacao?: number
  codigoIndicacao?: string | null
  indicadoPorContaId?: number | null
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

export interface AcessoSuporteResponse {
  token: string
  sessaoId: number
  expiraEm: string
  conta: { id: number; nome: string; status: string }
  usuarioAlvo: { id: number; nome: string; email: string }
}

export interface AcessoSuporteLog {
  id: number
  Uid: string
  contaId: number
  contaNome: string
  superAdminId: number
  superAdminNome: string
  superAdminEmail: string
  usuarioAlvoId: number
  usuarioAlvoEmail: string
  motivo: string
  ip?: string | null
  userAgent?: string | null
  iniciadoEm: string
  expiraEm: string
  encerradoEm?: string | null
  encerradoPor?: string | null
  ativa: boolean
}

export interface UpdateAssinanteAdminPayload {
  status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO'
  vencimento?: string
  nome?: string
  nomeFantasia?: string | null
  email?: string
  telefone?: string | null
  documento?: string | null
  valorBasePlano?: number
  iaLimiteTokensMensal?: number | null
}

export interface AdminModuloItem {
  id: number
  codigo: string
  nome: string
  descricao?: string | null
  categoria: string
  preco: number
  desconto: number
  status: boolean
  contasAtivas: number
}

export interface AdminIndicacaoConfig {
  ativa: boolean
  tipoRecompensa: 'PERCENTUAL' | 'VALOR'
  valorRecompensa: number
  tipoBonusIndicado: 'PERCENTUAL' | 'VALOR'
  valorBonusIndicado: number
}

export interface MinhaIndicacaoResponse {
  codigo: string
  creditoIndicacao: number
  contaAtiva: boolean
  programa: AdminIndicacaoConfig & { ativo: boolean }
  indicados: Array<{
    id: number
    nome: string
    status: string
    recompensado: boolean
    createdAt: string
  }>
}

export interface AssinanteAdminAppItem {
  id: number
  codigo: string
  nome: string
  descricao?: string | null
  categoria: string
  preco: number
  ativo: boolean
  pendenteAtivacao: boolean
  cancelamentoAgendado: boolean
  cobrancaPendenteAtual: boolean
  vigenciaAte?: string | Date | null
  statusVinculo?: string | null
  cobrancaAtual?: {
    id: number
    status: string
    gateway: string
    linkPagamento?: string | null
    vencimento?: string | Date | null
  } | null
}

export interface AssinanteAdminAppsResponse {
  data: AssinanteAdminAppItem[]
  resumo: {
    contaId: number
    contaNome: string
    contaStatus: string
    mensalidadeAtual: number
    valorBasePlano: number
    totalAppsAtivos: number
    totalAppsPendentes: number
    vencimento: string | Date
    iaLimiteTokensMensal: number | null
    iaUsoMes: { totalTokens: number; limite: number | null; restante: number | null; custoEstimado: number }
  }
}

export interface ToggleAssinanteAdminAppPayload {
  ativo: boolean
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

export interface CreateFaturaManualPayload {
  contaId: number
  valor: number
  descricao?: string
  vencimento?: string
  status: 'PAGO' | 'PENDENTE'
  renovarConta: boolean
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

export interface AdminGatewayConfigResponse {
  data: {
    gateway: 'mercadopago' | 'abacatepay'
    mercadoPagoConfigured: boolean
    abacatePayConfigured: boolean
    updatedAccounts?: number
  }
}

export interface UpdateAdminGatewayPayload {
  gateway: 'mercadopago' | 'abacatepay'
}

export interface CreateAssinanteAdminPayload {
  conta: string
  nomeUsuario: string
  email: string
  senha: string
  telefone: string
  tipo?: string
  funcionarios?: number
  valorBasePlano?: number
  diasTeste?: number
}

export interface AdminFinanceiroPainelResponse {
  resumo: {
    mrrEstimado: number
    contasAtivas: number
    totalContas: number
    recebidoMes: number
    faturasPagasMes: number
    pendenteTotal: number
    faturasPendentes: number
    atrasadoTotal: number
    faturasAtrasadas: number
  }
  receitaMensal: Array<{ mes: string; recebido: number; gerado: number }>
  statusDistribuicao: Array<{ status: string; quantidade: number; valor: number }>
  topInadimplentes: Array<{
    contaId: number
    nome: string
    email: string | null
    status: string | null
    faturas: number
    valor: number
  }>
}

export interface AdminMonitoramentoResponse {
  geradoEm: string
  servidor: {
    hostname: string
    plataforma: string
    nodeVersion: string
    uptimeSegundos: number
    processoUptimeSegundos: number
    cpus: number
    loadAvg: number[]
    memoriaTotalMb: number
    memoriaLivreMb: number
    memoriaUsoPercent: number
    processoRssMb: number
    processoHeapMb: number
  }
  banco: { ok: boolean; latencyMs: number; error: string | null }
  redis: { ok: boolean; latencyMs: number; error: string | null; status: string }
  filas: Array<Record<string, any>>
}

export interface WhatsAppNotificationInstanceOption {
  id: number
  nome: string
  instanceId: string
  status: string
  numeroConectado?: string | null
  ativo: boolean
  lastSyncAt?: string | Date | null
  createdAt: string | Date
  updatedAt: string | Date
}

export interface MercadoPagoIntegracaoStatus {
  oauthDisponivel: boolean
  conectado: boolean
  modo: 'OAUTH' | 'API_KEY' | 'NENHUM'
  mpUserId: string | null
  liveMode: boolean | null
  conectadoEm: string | null
  expiraEm: string | null
  ultimaRenovacaoEm: string | null
  ultimoErro: string | null
  possuiChaveManual: boolean
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

export interface RenovacaoBreakdown {
  base: number
  apps: number
  subtotal: number
  creditoIndicacao: number
  desconto: number
  total: number
  cobreTotalmente: boolean
  /// Mensalidade zerada (base + apps = 0): plano gratuito, não há o que cobrar.
  planoGratuito: boolean
  /// Nada a pagar nesta renovação — por crédito de indicação ou por plano gratuito.
  semCusto: boolean
  saldoRestante: number
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
  renovacao?: RenovacaoBreakdown
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
  indicacao?: string
}
export class ContaRepository {
  static async status(forceRefresh = false): Promise<{ data: StatusConta }> {
    const data = await http.get(`/contas/assinatura/status`, {
      params: forceRefresh ? { refresh: 1 } : undefined,
    })
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
  static async concluirTourOnboarding(): Promise<any> {
    const res = await http.patch(`/contas/onboarding/tour`)
    return res.data
  }
  static async statusMercadoPago(): Promise<MercadoPagoIntegracaoStatus> {
    const res = await http.get('/contas/integracoes/mercadopago/status')
    return res.data.data
  }
  static async conectarMercadoPago(): Promise<{ url: string }> {
    const res = await http.get('/contas/integracoes/mercadopago/conectar')
    return res.data.data
  }
  static async desconectarMercadoPago(): Promise<MercadoPagoIntegracaoStatus> {
    const res = await http.post('/contas/integracoes/mercadopago/desconectar')
    return res.data.data
  }
  static async listarInstanciasWhatsappNotificacao(): Promise<WhatsAppNotificationInstanceOption[]> {
    const res = await http.get('/contas/parametros/whatsapp-instancias')
    return res.data.data
  }
  static async detalhes(): Promise<Contas> {
    const data = await http.get(`/contas/detalhes`)
    return data.data
  }
  static async update(data: Partial<UpdateConta>): Promise<void> {
    await http.post(`/contas/atualizar`, data)
  }
  static async gerarLink(): Promise<{ link: string }> {
    const data = await http.get(`/contas/assinatura/checkout`)
    return data.data
  }
  static async renovarGratis(): Promise<{ message: string; vencimento: string }> {
    const { data } = await http.post(`/contas/assinatura/renovar-gratis`)
    return data
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

  static async listarAppsAssinante(id: number): Promise<AssinanteAdminAppsResponse> {
    const res = await http.get(`/admin/assinantes/${id}/apps`)
    return res.data
  }

  static async alternarAppAssinante(id: number, moduleId: number, payload: ToggleAssinanteAdminAppPayload) {
    const res = await http.post(`/admin/assinantes/${id}/apps/${moduleId}`, payload)
    return res.data
  }

  static async criarAssinanteAdmin(payload: CreateAssinanteAdminPayload) {
    const res = await http.post('/admin/assinantes', payload)
    return res.data
  }

  static async deletarAssinanteAdmin(id: number) {
    const res = await http.delete(`/admin/assinantes/${id}`)
    return res.data
  }

  static async resetarSenhaRootAdmin(id: number, senha: string): Promise<{
    message?: string
    data?: { contaId: number; email: string; nome: string; totalUsuariosRoot: number }
  }> {
    const res = await http.post(`/admin/assinantes/${id}/reset-senha-root`, { senha })
    return res.data
  }

  static async acessarContaAdmin(
    id: number,
    payload: { senha: string; motivo: string },
  ): Promise<{ message?: string; data: AcessoSuporteResponse }> {
    const res = await http.post(`/admin/assinantes/${id}/acessar`, payload)
    return res.data
  }

  static async encerrarSuporte() {
    const res = await http.post('/auth/suporte/encerrar')
    return res.data
  }

  static async listarAcessosSuporte(
    params?: Record<string, any>,
  ): Promise<PaginatedAdminResponse<AcessoSuporteLog>> {
    const res = await http.get('/admin/suporte/acessos', { params })
    return res.data
  }

  static async revogarAcessoSuporte(id: number) {
    const res = await http.post(`/admin/suporte/acessos/${id}/revogar`)
    return res.data
  }

  static async getFinanceiroPainelAdmin(): Promise<AdminFinanceiroPainelResponse> {
    const res = await http.get('/admin/financeiro/painel')
    return res.data.data
  }

  static async getMonitoramentoAdmin(): Promise<AdminMonitoramentoResponse> {
    const res = await http.get('/admin/monitoramento')
    return res.data.data
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

  static async criarFaturaManualAdmin(payload: CreateFaturaManualPayload) {
    const res = await http.post('/admin/faturas/manual', payload)
    return res.data
  }

  static async excluirFaturaAdmin(id: number) {
    const res = await http.delete(`/admin/faturas/${id}`)
    return res.data
  }

  static async getDashboardAdmin(): Promise<DashboardAdminResponse> {
    const res = await http.get('/admin/faturas/dashboard')
    return res.data
  }

  static async getAdminGatewayConfig(): Promise<AdminGatewayConfigResponse> {
    const res = await http.get('/admin/configuracoes/gateway')
    return res.data
  }

  static async saveAdminGatewayConfig(payload: UpdateAdminGatewayPayload): Promise<AdminGatewayConfigResponse> {
    const res = await http.post('/admin/configuracoes/gateway', payload)
    return res.data
  }

  static async listarModulosAdmin(): Promise<{ data: AdminModuloItem[] }> {
    const res = await http.get('/admin/modulos')
    return res.data
  }

  static async atualizarModuloAdmin(
    id: number,
    payload: { preco: number; desconto?: number; status?: boolean },
  ) {
    const res = await http.patch(`/admin/modulos/${id}`, payload)
    return res.data
  }

  static async getAdminIndicacaoConfig(): Promise<{ data: AdminIndicacaoConfig }> {
    const res = await http.get('/admin/configuracoes/indicacao')
    return res.data
  }

  static async saveAdminIndicacaoConfig(payload: AdminIndicacaoConfig) {
    const res = await http.post('/admin/configuracoes/indicacao', payload)
    return res.data
  }

  static async getMinhaIndicacao(): Promise<MinhaIndicacaoResponse> {
    const res = await http.get('/contas/indicacao')
    return res.data.data
  }
}
