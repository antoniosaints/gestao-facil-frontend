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
  provedorNfse: string
  serieRps: number
  proximoNumeroRps: number
  codigoServicoPadrao: string
  descricaoServicoPadrao: string
  codigoAtividadePadrao: string
  descricaoAtividadePadrao: string
  tipoTributacaoPadrao: number | null
  tipoRecolhimentoPadrao: number | null
  notaIntermediadaPadrao: number
  aliquotaIssPadrao: number | null
  certificado: { configurado: boolean; nome: string | null; atualizadoEm: string | null }
  integracao: { tipo: 'TOKEN_D2TI' | 'CERTIFICADO_A1'; configurada: boolean; atualizadoEm: string | null }
  emissaoNfsePronta: boolean
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

export class NotasFiscaisRepository {
  static async getConfig() {
    const { data } = await http.get('/v1/notas-fiscais/configuracao')
    return data.data as FiscalConfig
  }

  static async saveConfig(payload: Omit<FiscalConfig, 'certificado' | 'integracao' | 'emissaoNfsePronta' | 'proximoNumeroRps'>) {
    const { data } = await http.put('/v1/notas-fiscais/configuracao', payload)
    return data.data as FiscalConfig
  }

  static async buscarMunicipios(uf: string, busca: string) {
    const { data } = await http.get('/v1/notas-fiscais/municipios', { params: { uf, busca } })
    return data.data as MunicipioIbge[]
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

  static async listNfse(page = 1) {
    const { data } = await http.get('/v1/notas-fiscais/nfs-e', { params: { page, limit: 20 } })
    return data as { data: NfseListItem[]; pagination: { page: number; total: number; pages: number } }
  }

  static async createRps(payload: { clienteId: number; valorTotal: number; codigoServico?: string; discriminacao: string }) {
    const { data } = await http.post('/v1/notas-fiscais/nfs-e/rps', payload)
    return data.data as NfseListItem
  }

  static async saveD2tiToken(token: string) {
    const { data } = await http.post('/v1/notas-fiscais/integracao/d2ti/token', { token })
    return data.data as { configurado: boolean; atualizadoEm: string }
  }

  static async emitD2ti(payload: { clienteId: number; valorTotal: number; codigoServico?: string; codigoMunicipioTomador: string; discriminacao: string }, idempotencyKey: string) {
    const { data } = await http.post('/v1/notas-fiscais/nfs-e/emitir', payload, { headers: { 'Idempotency-Key': idempotencyKey } })
    return data.data as NfseListItem
  }
}
