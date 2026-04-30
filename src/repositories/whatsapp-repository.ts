import http from '@/utils/axios'

export type WhatsAppInstanceStatus = 'PENDENTE' | 'CONECTADA' | 'DESCONECTADA' | 'CONECTANDO' | 'ERRO'
export type WhatsAppConversationStatus = 'ABERTA' | 'PENDENTE' | 'FINALIZADA'
export type WhatsAppMessageDirection = 'ENTRADA' | 'SAIDA'
export type WhatsAppMessageType = 'TEXTO' | 'IMAGEM' | 'AUDIO' | 'VIDEO' | 'DOCUMENTO' | 'OUTRO'
export type WhatsAppMessageStatus = 'PENDENTE' | 'ENVIADA' | 'ENTREGUE' | 'LIDA' | 'ERRO' | 'RECEBIDA'

export interface WhatsAppInstance {
  id: number
  nome: string
  instanceId: string
  status: WhatsAppInstanceStatus
  numeroConectado?: string | null
  ativo: boolean
  tokenConfigurado: boolean
  lastSyncAt?: string | null
  ultimoErro?: string | null
  createdAt: string
  updatedAt: string
}

export interface WhatsAppContact {
  id: number
  telefone: string
  nome?: string | null
  foto?: string | null
  clienteId?: number | null
}

export interface WhatsAppLinkedCustomer {
  id: number
  nome: string
  telefone?: string | null
  whastapp?: string | null
}

export interface WhatsAppConversation {
  id: number
  instanciaId: number
  contatoId: number
  clienteId?: number | null
  telefone: string
  status: WhatsAppConversationStatus
  atendenteId?: number | null
  setor?: string | null
  fila?: string | null
  canal: string
  ultimaMensagem?: string | null
  ultimaInteracaoEm?: string | null
  naoLidas: number
  Contato?: WhatsAppContact
  Cliente?: WhatsAppLinkedCustomer | null
  Atendente?: { id: number; nome: string } | null
  Instancia?: Pick<WhatsAppInstance, 'id' | 'nome' | 'status' | 'numeroConectado'>
}

export interface WhatsAppMessage {
  id: number
  conversaId: number
  direcao: WhatsAppMessageDirection
  tipo: WhatsAppMessageType
  externalMessageId: string
  conteudo?: string | null
  mediaUrl?: string | null
  mediaMimeType?: string | null
  fileName?: string | null
  statusEnvio: WhatsAppMessageStatus
  erroEnvio?: string | null
  enviadoEm?: string | null
  lidoEm?: string | null
  createdAt: string
}

export interface WhatsAppWebhookUrls {
  connected?: string
  disconnected?: string
  delivery?: string
  received?: string
  status?: string
  presence?: string
}

export interface WhatsAppWebhookCallback {
  key: keyof WhatsAppWebhookUrls
  label: string
  endpoint: string
  url: string
}

export interface WhatsAppWebhookSyncResult {
  key: keyof WhatsAppWebhookUrls
  label: string
  endpoint: string
  value?: string
  skipped?: boolean
  ok: boolean
  response?: unknown
  error?: unknown
}

export interface WhatsAppWebhookConfig {
  instance: WhatsAppInstance
  webhookUrls: WhatsAppWebhookUrls
  callbacks: WhatsAppWebhookCallback[]
  results?: WhatsAppWebhookSyncResult[]
  success?: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  nextCursor?: number | null
}

export class WhatsAppRepository {
  static async listInstances() {
    const { data } = await http.get('/whatsapp/instances')
    return data.data as WhatsAppInstance[]
  }

  static async createInstance(payload: { nome: string; instanceId: string; token: string; ativo?: boolean }) {
    const { data } = await http.post('/whatsapp/instances', payload)
    return data.data as WhatsAppInstance
  }

  static async updateInstance(id: number, payload: Partial<{ nome: string; instanceId: string; token: string | null; ativo: boolean }>) {
    const { data } = await http.put(`/whatsapp/instances/${id}`, payload)
    return data.data as WhatsAppInstance
  }

  static async getInstanceWebhooks(id: number) {
    const { data } = await http.get(`/whatsapp/instances/${id}/webhooks`)
    return data.data as WhatsAppWebhookConfig
  }

  static async configureInstanceWebhooks(id: number, webhookUrls?: WhatsAppWebhookUrls) {
    const { data } = await http.post(`/whatsapp/instances/${id}/webhooks`, { webhookUrls })
    return data.data as WhatsAppWebhookConfig
  }

  static async instanceAction(id: number, action: 'qrCode' | 'pairingCode' | 'restart' | 'disconnect' | 'status' | 'device' | 'setupWebhooks', payload?: Record<string, unknown>) {
    const { data } = await http.post(`/whatsapp/instances/${id}/${action}`, payload || {})
    return data.data
  }

  static async listConversations(params: { search?: string; status?: WhatsAppConversationStatus; take?: number; cursor?: number } = {}) {
    const { data } = await http.get('/whatsapp/conversas', { params })
    return data.data as PaginatedResponse<WhatsAppConversation>
  }

  static async listMessages(conversaId: number, params: { take?: number; cursor?: number } = {}) {
    const { data } = await http.get(`/whatsapp/conversas/${conversaId}/mensagens`, { params })
    return data.data as PaginatedResponse<WhatsAppMessage>
  }

  static async sendMessage(conversaId: number, payload: { tipo?: 'text' | 'image' | 'audio' | 'video' | 'document'; conteudo?: string; mediaUrl?: string; caption?: string; fileName?: string; extension?: string }) {
    const { data } = await http.post(`/whatsapp/conversas/${conversaId}/mensagens`, payload)
    return data.data as WhatsAppMessage
  }

  static async updateConversation(conversaId: number, payload: Partial<{ status: WhatsAppConversationStatus; atendenteId: number | null; setor: string | null; fila: string | null; clienteId: number | null }>) {
    const { data } = await http.patch(`/whatsapp/conversas/${conversaId}`, payload)
    return data.data as WhatsAppConversation
  }

  static async markAsRead(conversaId: number) {
    const { data } = await http.post(`/whatsapp/conversas/${conversaId}/read`)
    return data.data as WhatsAppConversation
  }
}
