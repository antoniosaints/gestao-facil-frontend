import http from '@/utils/axios'

export interface IaChaveApi {
  id: number
  nome: string
  provider: string
  apiKeyMasked: string
  ativo: boolean
  isPadrao: boolean
  createdAt: string
  updatedAt: string
}

export interface IaModelo {
  id: number
  modelId: string
  nome: string
  provider: string
  ativo: boolean
  createdAt: string
  updatedAt: string
}

export interface IaChavePayload {
  nome: string
  apiKey?: string
  provider?: string
  ativo?: boolean
  isPadrao?: boolean
}

export interface IaModeloPayload {
  modelId: string
  nome: string
  provider?: string
  ativo?: boolean
}

export interface IaCoreConfig {
  id: number
  provider: string
  modelId: string
  systemPrompt: string
  defaultSystemPrompt: string
  ativo: boolean
  apiKeyMasked: string
  apiKeyConfigured: boolean
  createdAt: string
  updatedAt: string
}

export interface IaCoreConfigPayload {
  provider?: string
  modelId?: string
  apiKey?: string
  systemPrompt?: string
  ativo?: boolean
}

// Configuração de IA da plataforma (área do CEO / super admin).
export class IaAdminRepository {
  static async listChaves() {
    const res = await http.get('/admin/ia/chaves')
    return res.data.data as IaChaveApi[]
  }

  static async createChave(payload: IaChavePayload) {
    const res = await http.post('/admin/ia/chaves', payload)
    return res.data.data as IaChaveApi
  }

  static async updateChave(id: number, payload: Partial<IaChavePayload>) {
    const res = await http.put(`/admin/ia/chaves/${id}`, payload)
    return res.data.data as IaChaveApi
  }

  static async deleteChave(id: number) {
    const res = await http.delete(`/admin/ia/chaves/${id}`)
    return res.data.data as { id: number }
  }

  static async listModelos() {
    const res = await http.get('/admin/ia/modelos')
    return res.data.data as IaModelo[]
  }

  static async createModelo(payload: IaModeloPayload) {
    const res = await http.post('/admin/ia/modelos', payload)
    return res.data.data as IaModelo
  }

  static async updateModelo(id: number, payload: Partial<IaModeloPayload>) {
    const res = await http.put(`/admin/ia/modelos/${id}`, payload)
    return res.data.data as IaModelo
  }

  static async deleteModelo(id: number) {
    const res = await http.delete(`/admin/ia/modelos/${id}`)
    return res.data.data as { id: number }
  }

  // Core IA — assistente interno do ERP (modelo, chave dedicada, prompt e comportamento).
  static async getCoreConfig() {
    const res = await http.get('/admin/ia/core')
    return res.data.data as IaCoreConfig
  }

  static async saveCoreConfig(payload: IaCoreConfigPayload) {
    const res = await http.put('/admin/ia/core', payload)
    return res.data.data as IaCoreConfig
  }
}
