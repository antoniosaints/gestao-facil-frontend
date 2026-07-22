import type {
  CategoriaArvoreNode,
  CategoriaFinanceiro,
  ContaFinanceiraDetalhesResponse,
  ContaFinanceiraSaldoAtualResponse,
  ContaFinanceiraTransferPreviewResponse,
  ContasFinanceiro,
  FormularioLancamento,
  MetodoPagamento,
  MetodoPagamentoFinanceiro,
  RecorrenciaConfig,
} from '@/types/schemas'
import http from '@/utils/axios'

export type RegimeDemonstrativo = 'COMPETENCIA' | 'CAIXA'

export type DemonstrativoFiltros = {
  inicio: string
  fim: string
  regime: RegimeDemonstrativo
  contaFinanceiraId?: number | null
  categoriaId?: number | null
  clienteId?: number | null
  /// Horizonte da série mensal, independente do período filtrado.
  mesesHistorico?: number | null
}

export type LinhaDemonstrativo = {
  categoriaId: number | null
  nome: string
  valor: string | number
  participacao: number
  anterior: string | number
  variacao: number | null
  subcategorias: Array<Omit<LinhaDemonstrativo, 'subcategorias'>>
}

export type DemonstrativoResponse = {
  periodo: {
    inicio: string
    fim: string
    regime: RegimeDemonstrativo
    anterior: { inicio: string; fim: string }
    serie: { inicio: string; fim: string; meses: number }
  }
  resumo: {
    receitas: string | number
    despesas: string | number
    resultado: string | number
    margem: number
    anterior: { receitas: string | number; despesas: string | number; resultado: string | number }
    variacao: { receitas: number | null; despesas: number | null; resultado: number | null }
    totalLancamentos: number
  }
  grupos: {
    receitas: LinhaDemonstrativo[]
    despesas: LinhaDemonstrativo[]
  }
  mensal: Array<{
    mes: string
    receitas: string | number
    despesas: string | number
    resultado: string | number
  }>
}

function buildDemonstrativoParams(params: DemonstrativoFiltros) {
  return {
    inicio: params.inicio,
    fim: params.fim,
    regime: params.regime,
    ...(params.contaFinanceiraId ? { contaFinanceiraId: params.contaFinanceiraId } : {}),
    ...(params.categoriaId ? { categoriaId: params.categoriaId } : {}),
    ...(params.clienteId ? { clienteId: params.clienteId } : {}),
    ...(params.mesesHistorico ? { mesesHistorico: params.mesesHistorico } : {}),
  }
}

export type ParcelaIgnoradaLote = { id: number; motivo: string }

export type ResultadoLoteParcelas<T = Record<string, never>> = {
  status: number
  message: string
  data: ({ ignoradas: ParcelaIgnoradaLote[] } & T) | null
}

function downloadBlob(data: BlobPart, filename: string) {
  const blob = data instanceof Blob ? data : new Blob([data])
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
export class LancamentosRepository {
  static async listarCategorias() {
    const data = await http.get(`/lancamentos/categorias`)
    return data.data
  }
  static async listarContas() {
    const data = await http.get(`/lancamentos/contas`)
    return data.data
  }
  static async get(id: number) {
    const data = await http.get(`/lancamentos/${id}`)
    return data.data
  }
  static async remove(id: number) {
    await http.delete(`/lancamentos/${id}`)
  }
  static async save(data: Omit<FormularioLancamento, 'id'>) {
    await http.post(`/lancamentos`, data)
  }
  static async salvarRecorrencia(
    lancamentoId: number,
    data: RecorrenciaConfig & { valorParcela?: number | string | null },
  ) {
    const response = await http.post(`/lancamentos/${lancamentoId}/recorrencia`, data)
    return response.data
  }
  static async atualizarStatusRecorrencia(
    lancamentoId: number,
    data: { ativo?: boolean; encerrar?: boolean },
  ) {
    const response = await http.post(`/lancamentos/${lancamentoId}/recorrencia/status`, data)
    return response.data
  }
  static async gerarProximaRecorrencia(lancamentoId: number) {
    const response = await http.post(`/lancamentos/${lancamentoId}/recorrencia/gerar`)
    return response.data
  }
  static async atualizarNotificacaoVencimento(id: number, ativo: boolean) {
    const response = await http.post(`/lancamentos/${id}/notificacao-vencimento`, { ativo })
    return response.data
  }
  static async atualizarNotificacaoClienteVencimento(id: number, ativo: boolean) {
    const response = await http.post(`/lancamentos/${id}/notificacao-cliente-vencimento`, { ativo })
    return response.data
  }
  static async adicionarParcela(
    lancamentoId: number,
    data: {
      valor: number
      vencimento: string
      descricao?: string | null
    },
  ) {
    const response = await http.post(`/lancamentos/${lancamentoId}/parcelas`, data)
    return response.data
  }
  static async deletarParcela(id: number) {
    const response = await http.delete(`/lancamentos/parcelas/${id}`)
    return response.data
  }
  static async reciboParcela(idParcela: number) {
    const recibo = await http.post(`/lancamentos/parcelas/${idParcela}/recibo`)
    return recibo
  }
  static async pagarParcela(
    idParcela: number,
    data: {
      dataPagamento: string
      metodoPagamento: MetodoPagamentoFinanceiro
      contaPagamento?: number | null
    },
  ) {
    await http.post(`/lancamentos/parcelas/${idParcela}/pagar`, data)
  }
  static async pagarMultiplasParcelas(
    parcelas: number[],
    data?: {
      dataPagamento?: string
      metodoPagamento?: MetodoPagamentoFinanceiro
      contaPagamento?: number | null
    },
  ) {
    const response = await http.post(`/lancamentos/parcelas/pagar-multiplas`, { parcelas, ...data })
    return response.data as ResultadoLoteParcelas<{ efetivadas: number; parcelasRecorrentesGeradas: number }>
  }
  static async estornarMultiplasParcelas(parcelas: number[]) {
    const response = await http.post(`/lancamentos/parcelas/estornar-multiplas`, { parcelas })
    return response.data as ResultadoLoteParcelas<{ estornadas: number }>
  }
  static async deletarMultiplasParcelas(parcelas: number[]) {
    const response = await http.post(`/lancamentos/parcelas/excluir-multiplas`, { parcelas })
    return response.data as ResultadoLoteParcelas<{ excluidas: number }>
  }
  static async estornarParcela(id: number) {
    await http.post(`/lancamentos/parcelas/${id}/estornar`)
  }
  static async resumoTotal() {
    const data = await http.get(`/lancamentos/relatorios/totais`)
    return data.data
  }
  static async resumoStatusTotal() {
    const data = await http.get(`/lancamentos/relatorios/valor-status`)
    return data.data
  }
  static async resumoContasFinanceiras() {
    const data = await http.get(`/lancamentos/relatorios/valor-conta`)
    return data.data
  }
  static async criarConta(data: Pick<ContasFinanceiro, 'nome'> & {
    id?: number
    saldoInicial?: number
    corDestaque?: string | null
    removeIcon?: boolean
  }) {
    const response = await http.post(`/lancamentos/contas`, data)
    return response.data
  }

  static async uploadContaFinanceiraIcon(id: number, file: File) {
    const data = new FormData()
    data.append('accountIcon', file)
    const response = await http.post(`/uploads/financial-accounts/${id}/icon`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
  static async getContaFinanceiraDetalhes(
    id: number,
    params?: {
      inicio?: string
      fim?: string
      tipo?: 'TODOS' | 'RECEITA' | 'DESPESA'
      status?: 'TODOS' | 'PAGO' | 'PENDENTE' | 'ATRASADO'
      search?: string
      categoriaId?: number | null
      clienteId?: number | null
    },
  ): Promise<{ data: ContaFinanceiraDetalhesResponse }> {
    const response = await http.get(`/lancamentos/contas/${id}/detalhes`, {
      params: {
        ...(params?.inicio ? { inicio: params.inicio } : {}),
        ...(params?.fim ? { fim: params.fim } : {}),
        ...(params?.tipo && params.tipo !== 'TODOS' ? { tipo: params.tipo } : {}),
        ...(params?.status && params.status !== 'TODOS' ? { status: params.status } : {}),
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.categoriaId ? { categoriaId: params.categoriaId } : {}),
        ...(params?.clienteId ? { clienteId: params.clienteId } : {}),
      },
    })
    return response.data
  }
  static async getContaFinanceiraSaldoAtual(id: number): Promise<{ data: ContaFinanceiraSaldoAtualResponse }> {
    const response = await http.get(`/lancamentos/contas/${id}/saldo-atual`)
    return response.data
  }
  static async previewTransferirContaFinanceira(data: {
    contaOrigemId: number
    filtros?: {
      inicio?: string
      fim?: string
      tipo?: 'TODOS' | 'RECEITA' | 'DESPESA'
      status?: 'TODOS' | 'PAGO' | 'PENDENTE' | 'ATRASADO'
      search?: string
    }
  }): Promise<{ data: ContaFinanceiraTransferPreviewResponse }> {
    const response = await http.post(`/lancamentos/contas/transferir/preview`, data)
    return response.data
  }
  static async transferirContaFinanceira(data: {
    contaOrigemId: number
    contaDestinoId: number
    modo: 'GERAR_FINANCEIRO' | 'MOVER_LANCAMENTOS'
    valor?: number
    data?: string
    descricao?: string
    filtros?: {
      inicio?: string
      fim?: string
      tipo?: 'TODOS' | 'RECEITA' | 'DESPESA'
      status?: 'TODOS' | 'PAGO' | 'PENDENTE' | 'ATRASADO'
      search?: string
    }
  }) {
    const response = await http.post(`/lancamentos/contas/transferir`, data)
    return response.data
  }
  static async ajustarSaldoContaFinanceira(data: {
    contaFinanceiraId: number
    saldoInformado: number
    modo: 'LANCAR_FINANCEIRO' | 'AJUSTE_INTERNO'
    data?: string
    descricao?: string
  }) {
    const response = await http.post(`/lancamentos/contas/ajustar-saldo`, data)
    return response.data
  }
  static async deletarConta(id: number) {
    await http.delete(`/lancamentos/contas/${id}`)
  }
  static async criarCategoria(data: Pick<CategoriaFinanceiro, 'nome'> & { id?: number; categoriaPai?: number | null }) {
    const response = await http.post(`/lancamentos/categorias`, data)
    return response.data as {
      status: number
      message: string
      data: { id: number; nome: string } | null
    }
  }
  static async deletarCategoria(id: number) {
    await http.delete(`/lancamentos/categorias/${id}`)
  }
  static async arvoreCategorias() {
    const response = await http.get(`/lancamentos/categorias/arvore`)
    return response.data as {
      message: string
      data: { arvore: CategoriaArvoreNode[]; total: number }
    }
  }
  static async moverCategoria(id: number, parentId: number | null) {
    const response = await http.post(`/lancamentos/categorias/${id}/mover`, { parentId })
    return response.data
  }
  static async getSaldoMensal(inicio?: string, fim?: string) {
    const data = await http.get(`/lancamentos/graficos/saldo-mensal`, {
      params: {
        ...(inicio ? { inicio } : {}),
        ...(fim ? { fim } : {}),
      },
    })
    return data.data
  }
  static async getDemonstrativo(params: DemonstrativoFiltros) {
    const response = await http.get(`/lancamentos/relatorios/demonstrativo`, {
      params: buildDemonstrativoParams(params),
    })
    return response.data as { data: DemonstrativoResponse }
  }

  static async exportarDemonstrativo(params: DemonstrativoFiltros, formato: 'csv' | 'pdf') {
    const response = await http.get(`/lancamentos/relatorios/demonstrativo/${formato}`, {
      responseType: 'blob',
      params: buildDemonstrativoParams(params),
    })

    downloadBlob(response.data, `demonstrativo_${params.inicio}_a_${params.fim}.${formato}`)
  }

  static async gerarDRE(inicio: string, fim: string) {
    await http.get(`/lancamentos/relatorios/dre`, {
      responseType: 'blob',
      params: {
        inicio: inicio,
        fim: fim,
      },
    })
  }
  static async getLancamentosMensais(
    month: string,
    filters?: {
      contaFinanceiraId?: number | null
      categoriaId?: number | null
      tipo?: 'TODOS' | 'RECEITA' | 'DESPESA'
      status?: 'TODOS' | 'PAGO' | 'PENDENTE' | 'ATRASADO'
      search?: string
      saldoCompleto?: boolean
    },
  ) {
    const data = await http.get(`/lancamentos/lancamentosMes`, {
      params: {
        mes: month,
        ...(filters?.contaFinanceiraId ? { contaFinanceiraId: filters.contaFinanceiraId } : {}),
        ...(filters?.categoriaId ? { categoriaId: filters.categoriaId } : {}),
        ...(filters?.tipo && filters.tipo !== 'TODOS' ? { tipo: filters.tipo } : {}),
        ...(filters?.status && filters.status !== 'TODOS' ? { status: filters.status } : {}),
        ...(filters?.search ? { search: filters.search } : {}),
        ...(filters?.saldoCompleto ? { saldoCompleto: 1 } : {}),
      },
    })
    return data.data
  }
  static async gerarDREPDF(inicio: string, fim: string) {
    const data = await http.get(`/lancamentos/relatorios/dre-pdf`, {
      responseType: 'blob',
      headers: { 'Content-Type': 'application/pdf' },
      params: {
        inicio: inicio,
        fim: fim,
      },
    })

    const url = window.URL.createObjectURL(data.data)
    const a = document.createElement('a')
    a.href = url
    const dataHoje = new Date()
      .toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\//g, '-')
    a.download = `lancamentos_dre_${dataHoje}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
  static async gerarDREPDF2(inicio: string, fim: string) {
    const data = await http.get(`/lancamentos/relatorios/dre-pdf-2`, {
      responseType: 'blob',
      headers: { 'Content-Type': 'application/pdf' },
      params: {
        inicio: inicio,
        fim: fim,
      },
    })

    const url = window.URL.createObjectURL(data.data)
    const a = document.createElement('a')
    a.href = url
    const dataHoje = new Date()
      .toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\//g, '-')
    a.download = `lancamentos_dre_${dataHoje}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
  static async graficoCategorias(inicio: Date | string, fim: Date | string) {
    const data = await http.get(`/lancamentos/graficos/categorias`, {
      params: {
        inicio: inicio,
        fim: fim,
      },
    })
    return data.data
  }
  static async graficoContas(inicio: Date | string, fim: Date | string) {
    const data = await http.get(`/lancamentos/graficos/contas`, {
      params: {
        inicio: inicio,
        fim: fim,
      },
    })
    return data.data
  }
  static async graficoStatus(inicio: Date | string, fim: Date | string) {
    const data = await http.get(`/lancamentos/graficos/status`, {
      params: {
        inicio: inicio,
        fim: fim,
      },
    })
    return data.data
  }
  static async getDashboardVisaoGeral(params?: {
    inicio?: string
    fim?: string
    contaFinanceiraId?: number | null
    categoriaId?: number | null
    tipo?: 'TODOS' | 'RECEITA' | 'DESPESA'
    search?: string
  }) {
    const data = await http.get(`/lancamentos/dashboard/visao-geral`, {
      params: {
        ...(params?.inicio ? { inicio: params.inicio } : {}),
        ...(params?.fim ? { fim: params.fim } : {}),
        ...(params?.contaFinanceiraId ? { contaFinanceiraId: params.contaFinanceiraId } : {}),
        ...(params?.categoriaId ? { categoriaId: params.categoriaId } : {}),
        ...(params?.tipo && params.tipo !== 'TODOS' ? { tipo: params.tipo } : {}),
        ...(params?.search ? { search: params.search } : {}),
      },
    })
    return data.data
  }
  static async cancelarCobranca(id: number | string) {
    const data = await http.post(`/lancamentos/cobrancas/cancelar`, {
      cobrancaId: id,
    })
    return data.data
  }
  static async atualizarParcela(
    id: number,
    body: {
      vencimento: string
      valor: number
      escopo?: 'ATUAL' | 'TODAS' | 'PENDENTES' | 'PAGAS' | 'ATUAL_EM_DIANTE' | 'ATUAL_PARA_TRAS'
    },
  ) {
    const data = await http.post(`/lancamentos/parcelas/${id}/atualizar`, {
      ...body,
    })
    return data.data
  }
  static async estornarCobranca(id: number | string) {
    const data = await http.post(`/lancamentos/cobrancas/estornar`, {
      cobrancaId: id,
    })
    return data.data
  }
  static async deletarCobranca(id: number) {
    const data = await http.delete(`/lancamentos/cobrancas/deletar/${id}`)
    return data.data
  }
  static async downloadCsvModelo() {
    const response = await http.get(`/lancamentos/download/csv`, {
      responseType: 'blob',
      headers: { 'Content-Type': 'text/csv' },
    })

    downloadBlob(response.data, 'lancamentos_base.csv')
  }

  static async importarCsv(file: File) {
    const data = new FormData()
    data.append('arquivo', file)

    const response = await http.post(`/lancamentos/importar/csv`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  }

  static async atualizarLancamento(
    id: number,
    data: Pick<FormularioLancamento, 'descricao' | 'formaPagamento' | 'clienteId' | 'categoriaId' | 'contasFinanceiroId'>,
  ) {
    const response = await http.post(`/lancamentos/${id}/atualizar-basico`, data)
    return response.data
  }
  static async gerarCobranca(
    type: 'BOLETO' | 'LINK' | 'PIX',
    value: number,
    gateway: 'mercadopago' | 'abacatepay' | 'pagseguro' | 'asaas',
    clienteId?: number | null,
    vinculo?: {
      id: number
      tipo: 'parcela' | 'venda' | 'os'
    } | null,
  ) {
    const data = await http.post(`/lancamentos/cobrancas/cobrar`, {
      type,
      value,
      gateway,
      clienteId,
      vinculo,
    })
    return data.data
  }
}
