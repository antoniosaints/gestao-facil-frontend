import http from '@/utils/axios'

export type InformativoSeveridade = 'INFO' | 'ATENCAO' | 'INDISPONIBILIDADE'
export type InformativoSituacao = 'INVESTIGANDO' | 'MONITORANDO' | 'RESOLVIDO'
export type InformativoStatus = 'RASCUNHO' | 'PUBLICADO' | 'RESOLVIDO' | 'ARQUIVADO'
export type InformativoEscopo = 'GLOBAL' | 'MODULO' | 'CONTAS'

export interface InformativoSistema {
  id: number
  titulo: string
  mensagem: string
  integracao: string
  severidade: InformativoSeveridade
  situacao: InformativoSituacao
  status: InformativoStatus
  escopo: InformativoEscopo
  moduloCodigo?: string | null
  inicioEm?: string | null
  fimEm?: string | null
  publicadoEm?: string | null
  resolvidoEm?: string | null
  createdAt: string
  updatedAt: string
  lido?: boolean
  dispensado?: boolean
  CriadoPor?: { id: number; nome: string } | null
  contas?: Array<{ contaId: number; Conta: { id: number; nome: string } }>
  _count?: { leituras: number }
}

export interface InformativoPayload {
  titulo: string
  mensagem: string
  integracao: string
  severidade: InformativoSeveridade
  situacao: InformativoSituacao
  escopo: InformativoEscopo
  moduloCodigo?: string | null
  contaIds?: number[]
  inicioEm?: string | null
  fimEm?: string | null
}

export class InformativoRepository {
  static async ativos() {
    const { data } = await http.get('/informativos/ativos')
    return (data.data || []) as InformativoSistema[]
  }

  static async marcarLido(id: number) {
    await http.post(`/informativos/${id}/leitura`)
  }

  static async dispensar(id: number) {
    await http.post(`/informativos/${id}/dispensar`)
  }

  static async listarAdmin() {
    const { data } = await http.get('/admin/informativos')
    return (data.data || []) as InformativoSistema[]
  }

  static async criar(payload: InformativoPayload) {
    const { data } = await http.post('/admin/informativos', payload)
    return data.data as InformativoSistema
  }

  static async atualizar(id: number, payload: InformativoPayload) {
    const { data } = await http.put(`/admin/informativos/${id}`, payload)
    return data.data as InformativoSistema
  }

  static async publicar(id: number) {
    const { data } = await http.post(`/admin/informativos/${id}/publicar`)
    return data.data as InformativoSistema
  }

  static async resolver(id: number) {
    const { data } = await http.post(`/admin/informativos/${id}/resolver`)
    return data.data as InformativoSistema
  }

  static async arquivar(id: number) {
    const { data } = await http.post(`/admin/informativos/${id}/arquivar`)
    return data.data as InformativoSistema
  }
}
