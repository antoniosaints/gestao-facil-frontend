import http from '@/utils/axios'

export type RelatoBugSeveridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
export type RelatoBugStatus = 'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO' | 'DESCARTADO'

export interface RelatoBug {
  id: number
  titulo: string
  descricao: string
  severidade: RelatoBugSeveridade
  status: RelatoBugStatus
  rota?: string | null
  userAgent?: string | null
  respostaAdmin?: string | null
  resolvidoEm?: string | null
  createdAt: string
  Usuario?: { id: number; nome: string; email: string } | null
  Conta?: { id: number; nome: string } | null
  ResolvidoPor?: { id: number; nome: string } | null
}

export interface RelatoBugPayload {
  titulo: string
  descricao: string
  severidade?: RelatoBugSeveridade
  rota?: string | null
}

export class BugRepository {
  // ---- Usuário ----
  static async criar(payload: RelatoBugPayload) {
    const { data } = await http.post('/bugs', payload)
    return data.data as RelatoBug
  }

  static async meus() {
    const { data } = await http.get('/bugs/meus')
    return (data.data || []) as RelatoBug[]
  }

  // ---- Admin (CEO) ----
  static async listarAdmin(status?: RelatoBugStatus | 'TODOS') {
    const params = status && status !== 'TODOS' ? { status } : {}
    const { data } = await http.get('/admin/bugs', { params })
    return (data.data || []) as RelatoBug[]
  }

  static async atualizarAdmin(
    id: number,
    payload: { status: RelatoBugStatus; respostaAdmin?: string | null },
  ) {
    const { data } = await http.put(`/admin/bugs/${id}`, payload)
    return data.data as RelatoBug
  }

  static async removerAdmin(id: number) {
    const { data } = await http.delete(`/admin/bugs/${id}`)
    return data.data
  }
}
