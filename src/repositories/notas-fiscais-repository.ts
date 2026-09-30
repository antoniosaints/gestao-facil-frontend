import http from '@/utils/axios'

export type FiscalConfig = {
  razaoSocial: string
  nomeFantasia: string
  documento: string
  inscricaoEstadual: string
  inscricaoMunicipal: string
  regimeTributario: number
  codigoMunicipioIbge: string
  codigoMunicipioPrestador: string
  municipioNome: string
  uf: string
  cep: string
  logradouro: string
  numero: string
  bairro: string
  complemento: string
  email: string
  telefone: string
  ambiente: 'HOMOLOGACAO' | 'PRODUCAO'
  nfseHabilitado: boolean
  nfeHabilitado: boolean
  nfceHabilitado: boolean
  modoEmissaoNfse: 'GERANET' | 'NACIONAL' | 'LEGADO_D2TI'
  provedorNfse: string
  serieRps: number
  proximoNumeroRps: number
  serieNfe: number
  proximoNumeroNfe: number
  serieNfce: number
  proximoNumeroNfce: number
  nfce: { cscId: string; cscConfigurado: boolean }
  nfse: {
    codigoServicoNacional: string
    codigoTributacaoMunicipio: string
    codigoCnae: string
    dataOpcaoSimples: string
    regimeApuracaoSn: string
    issRetido: string
    responsavelRetencao: string
    naturezaOperacao: string
    incentivadorCultural: string
    exigibilidadeIss: string
    regimeEspecialTributacao: string
  }
  nfe: {
    naturezaOperacao: string
    tipoAtividade: string
    indicadorPresenca: string
    indicativoIntermediador: string
    frete: string
  }
  responsavelTecnico: {
    cnpj: string
    contato: string
    email: string
    telefone: string
    csrtId: string
    csrtConfigurado: boolean
  }
  codigoServicoPadrao: string
  descricaoServicoPadrao: string
  codigoAtividadePadrao: string
  descricaoAtividadePadrao: string
  tipoTributacaoPadrao: number | null
  tipoRecolhimentoPadrao: number | null
  notaIntermediadaPadrao: number
  aliquotaIssPadrao: number | null
  certificado: { configurado: boolean; nome: string | null; atualizadoEm: string | null }
  criptografiaFiscalDisponivel: boolean
  integracao: {
    tipo: 'TOKEN_D2TI' | 'CERTIFICADO_A1'
    configurada: boolean
    atualizadoEm: string | null
  }
  emissaoNfsePronta: boolean
  emissaoNfePronta: boolean
  emissaoNfcePronta: boolean
}

export type MunicipioIbge = { codigoIbge: string; nome: string; uf: string }

export type NfseListItem = {
  id: number
  status: string
  valorTotal: number
  numero?: string | null
  rpsNumero?: string | null
  codigoServico?: string | null
  discriminacao?: string | null
  ambiente?: string | null
  pdfPath?: string | null
  criadoEm: string
  cliente?: { id: number; nome: string; documento?: string | null }
}

export type FiscalParty = {
  nome: string | null
  documento: string | null
  inscricaoEstadual: string | null
  inscricaoMunicipal: string | null
  telefone: string | null
  endereco: string | null
}
export type FiscalDocument = {
  id: number
  vendaId?: number | null
  vendaUid?: string | null
  tipo: 'NFE' | 'NFCE' | 'NFSE'
  status: string
  ambiente?: 'HOMOLOGACAO' | 'PRODUCAO' | null
  serie?: number | null
  numero?: string | null
  rpsNumero?: string | null
  codigoServico?: string | null
  discriminacao?: string | null
  chaveAcesso?: string | null
  protocolo?: string | null
  codigoVerificacao?: string | null
  modelo?: string | null
  naturezaOperacao?: string | null
  emitente?: FiscalParty
  destinatario?: FiscalParty
  totais?: {
    produtos: number | null
    frete: number | null
    desconto: number | null
    valorNota: number
  }
  tributos?: Array<{ label: string; valor: number | null }>
  provedor?: string | null
  xmlDisponivel?: boolean
  pdfDisponivel?: boolean
  pdfGeravel?: boolean
  exclusaoPermitida?: boolean
  valorTotal: number
  erroMensagem?: string | null
  criadoEm: string
  atualizadaEm?: string | null
  emitidaEm?: string | null
  canceladaEm?: string | null
  cliente?: { id: number; nome: string; documento?: string | null } | null
  eventos?: Array<{
    id: number
    tipo: string
    status: string
    motivo?: string | null
    createdAt: string
    processadoEm?: string | null
  }>
  itens?: Array<{
    id: number
    descricao: string
    quantidade: number
    produtoId?: number | null
    unidade?: string | null
    valorUnitario?: number | null
    valorTotal: number
    ncm?: string | null
    cfop?: string | null
  }>
}

export type GeranetCity = MunicipioIbge & { provedor: string; versao?: string }
export type NfseIbsCbs = {
  finNFSe: string
  cst: string
  cIndOp: string
  tpOper?: '1' | '2' | '3' | '4' | '5'
  indFinal: '0' | '1'
  indDest: '0' | '1'
  indOpeOne: '0' | '1'
  ibsEstadual: { aliquota: number; reducaoAliquota: number }
  ibsMunicipal: { aliquota: number; reducaoAliquota: number }
  cbsFederal: { aliquota: number; reducaoAliquota: number }
}
export type NfseEmission = {
  clienteId: number
  valorTotal: number
  codigoServico?: string
  discriminacao: string
  dataCompetencia?: string
  codigoNbs?: string
  codigoAnexoCnae?: string
  percentualTributosSimplesNacional?: number | null
  municipioIncidencia?: string
  substitutoTributario?: '1' | '2'
  valorIssRetido?: number | null
  codigoClassificacaoTributaria?: string
  ibscbs?: NfseIbsCbs
}
export type NfseConsultRecord = {
  nsu: string | number
  chaveDfe?: string
  numeroNota?: string
  codigoVerificacao?: string
  data?: string
  descricaoSituacao?: string
  xml?: string
  dadosNota?: {
    prestador?: { razaoSocial?: string }
    servico?: { discriminacao?: string; valores?: { valorServicos?: number } }
  }
}
export type NfseConsultResult = {
  ultimoNsu: string
  maximoNsu: string
  proximoNsuSugerido: string | null
  temMais: boolean
  registros: NfseConsultRecord[]
}

export type FiscalReportSummary = {
  total: number
  authorized: number
  homologated: number
  pending: number
  uncertain: number
  rejected: number
  canceled: number
  authorizedValue: number
  byStatus: Record<string, number>
}

export type FiscalDashboard = {
  kpis: {
    total: number
    authorized: number
    authorizedValue: number
    approvalRate: number
    previous: { total: number; authorized: number; authorizedValue: number }
  }
  byStatus: Record<string, number>
  byType: Record<string, number>
  series: Array<{ data: string; total: number; autorizadas: number }>
  attention: Array<{
    id: number
    tipo: string
    status: string
    criadoEm: string
    erroMensagem?: string | null
    cliente: string
  }>
}

export type UninvoicedSale = {
  id: number
  uid: string
  valorTotal: number
  data: string
  cliente: { id: number; nome: string; documento?: string | null; documentoValido?: boolean } | null
}

export type FiscalBatchResult = {
  emitidas: Array<{ vendaId: number; notaFiscalId: number }>
  pendencias: Array<{
    vendaId: number
    codigo: string
    mensagem: string
    detalhes?: { itens?: Array<{ produtoId: number | null; descricao: string; campos: string[] }> }
  }>
}

export class NotasFiscaisRepository {
  static async getFiscalSaleCustomer(vendaId: number) {
    const { data } = await http.get(`/v1/notas-fiscais/vendas/${vendaId}/cliente`)
    return data.data as UninvoicedSale
  }

  static async linkFiscalSaleCustomer(vendaId: number, clienteId: number) {
    const { data } = await http.patch(`/v1/notas-fiscais/vendas/${vendaId}/cliente`, { clienteId })
    return data.data as UninvoicedSale
  }

  static async getConfig() {
    const { data } = await http.get('/v1/notas-fiscais/configuracao')
    return data.data as FiscalConfig
  }

  static async saveConfig(
    payload: Omit<
      FiscalConfig,
      | 'certificado'
      | 'criptografiaFiscalDisponivel'
      | 'integracao'
      | 'emissaoNfsePronta'
      | 'proximoNumeroRps'
    >,
  ) {
    const { data } = await http.put('/v1/notas-fiscais/configuracao', payload)
    return data.data as FiscalConfig
  }

  static async buscarMunicipios(uf: string, busca: string) {
    const { data } = await http.get('/v1/notas-fiscais/municipios', { params: { uf, busca } })
    return data.data as MunicipioIbge[]
  }

  static async consultarParametrosMunicipais() {
    const { data } = await http.get('/v1/notas-fiscais/parametros-municipais')
    return data.data as unknown
  }

  static async geranetHomologacao() {
    const { data } = await http.get('/v1/notas-fiscais/homologacao/geranet')
    return data.data as {
      apiKeyValida: boolean
      certificadoConfigurado: boolean
      nfsePronta: boolean
      nfePronta: boolean
      nfcePronta: boolean
      motivo?: string
    }
  }

  static async uploadCertificate(file: File, senha: string) {
    const form = new FormData()
    form.append('certificado', file)
    form.append('senha', senha)
    const { data } = await http.post('/v1/notas-fiscais/certificado', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data as { configurado: boolean; nome: string; atualizadoEm: string }
  }

  static async buscarCidadesGeranet(busca: string) {
    const { data } = await http.get('/v1/notas-fiscais/nfs-e/cidades', { params: { busca } })
    return data.data as GeranetCity[]
  }

  static async consultarNfse(payload: { ultimoNsu: string; chaveNfse?: string }) {
    const { data } = await http.post('/v1/notas-fiscais/nfs-e/consultar', payload)
    return data.data as NfseConsultResult
  }

  static async gerarPdfNfse(id: number) {
    await http.post(`/v1/notas-fiscais/documentos/${id}/gerar-pdf`)
  }

  static async listNfse(page = 1) {
    const { data } = await http.get('/v1/notas-fiscais/nfs-e', { params: { page, limit: 20 } })
    return data as {
      data: NfseListItem[]
      pagination: { page: number; total: number; pages: number }
    }
  }

  static async createRps(payload: {
    clienteId: number
    valorTotal: number
    codigoServico?: string
    discriminacao: string
  }) {
    const { data } = await http.post('/v1/notas-fiscais/nfs-e/rps', payload)
    return data.data as NfseListItem
  }

  static async saveD2tiToken(token: string) {
    const { data } = await http.post('/v1/notas-fiscais/integracao/d2ti/token', { token })
    return data.data as { configurado: boolean; atualizadoEm: string }
  }

  static async emitNfse(payload: NfseEmission, idempotencyKey: string) {
    const { data } = await http.post('/v1/notas-fiscais/nfs-e/geranet/emitir', payload, {
      headers: { 'Idempotency-Key': idempotencyKey },
    })
    return data.data as NfseListItem
  }

  static async emitNfseHomologacao(payload: NfseEmission, idempotencyKey: string) {
    const { data } = await http.post(
      '/v1/notas-fiscais/homologacao/nfs-e/geranet/emitir',
      payload,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    )
    return data.data as NfseListItem
  }

  static async emitSaleHomologacao(vendaId: number, tipo: 'NFE' | 'NFCE') {
    const { data } = await http.post(
      `/v1/notas-fiscais/homologacao/vendas/${vendaId}/documentos`,
      { tipo },
      { headers: { 'Idempotency-Key': crypto.randomUUID() } },
    )
    return data.data as FiscalDocument
  }

  static async listDocuments(tipo?: FiscalDocument['tipo'], page = 1) {
    const { data } = await http.get('/v1/notas-fiscais/documentos', {
      params: { tipo, page, limit: 30 },
    })
    return data as {
      data: FiscalDocument[]
      pagination: { page: number; total: number; pages: number }
    }
  }

  static async getDocument(id: number) {
    const { data } = await http.get(`/v1/notas-fiscais/documentos/${id}`)
    return data.data as FiscalDocument
  }

  static async summarizeDocuments(filters: Record<string, string>) {
    const { data } = await http.get('/v1/notas-fiscais/documentos/resumo', { params: filters })
    return data.data as FiscalReportSummary
  }

  static async getDashboard(inicio: string, fim: string) {
    const { data } = await http.get('/v1/notas-fiscais/documentos/painel', {
      params: { inicio, fim },
    })
    return data.data as FiscalDashboard
  }

  static async createSaleDocument(vendaId: number, tipo: 'NFE' | 'NFCE') {
    const { data } = await http.post(
      `/v1/notas-fiscais/vendas/${vendaId}/documentos`,
      { tipo },
      { headers: { 'Idempotency-Key': crypto.randomUUID() } },
    )
    return data.data as FiscalDocument
  }

  static async createSaleDocumentsBatch(vendaIds: number[], tipo: 'NFE' | 'NFCE') {
    const { data } = await http.post('/v1/notas-fiscais/vendas/documentos/lote', { vendaIds, tipo })
    return data.data as FiscalBatchResult
  }

  static async deleteDocument(id: number) {
    const { data } = await http.delete(`/v1/notas-fiscais/documentos/${id}`)
    return data.data as { id: number; vendaId: number | null; excluida: boolean }
  }

  static async retryDocument(id: number) {
    const { data } = await http.post(`/v1/notas-fiscais/documentos/${id}/reprocessar`)
    return data.data as FiscalDocument
  }

  static async cancelDocument(id: number, motivo: string, codigoCancelamento?: string) {
    const { data } = await http.post(
      `/v1/notas-fiscais/documentos/${id}/cancelamento`,
      { motivo, ...(codigoCancelamento ? { codigoCancelamento } : {}) },
      { headers: { 'Idempotency-Key': crypto.randomUUID() } },
    )
    return data.data as { eventoId: number; status: string }
  }

  static async downloadDocument(id: number, format: 'xml' | 'pdf', filename: string) {
    const { data } = await http.get(`/v1/notas-fiscais/documentos/${id}/arquivo/${format}`, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
  }
}
