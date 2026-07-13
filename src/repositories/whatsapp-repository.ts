import http from '@/utils/axios'

export type WhatsAppInstanceStatus = 'PENDENTE' | 'CONECTADA' | 'DESCONECTADA' | 'CONECTANDO' | 'ERRO'
export type WhatsAppConversationStatus = 'ABERTA' | 'PENDENTE' | 'FINALIZADA'
export type WhatsAppMessageDirection = 'ENTRADA' | 'SAIDA'
export type WhatsAppMessageType =
  | 'TEXTO'
  | 'IMAGEM'
  | 'AUDIO'
  | 'VIDEO'
  | 'DOCUMENTO'
  | 'STICKER'
  | 'LOCALIZACAO'
  | 'CONTATO'
  | 'LINK'
  | 'OUTRO'
export type WhatsAppMessageStatus = 'PENDENTE' | 'ENVIADA' | 'ENTREGUE' | 'LIDA' | 'ERRO' | 'RECEBIDA'
export type WhatsAppPaymentMethod = 'PIX' | 'CARTAO'
export type WhatsAppPaymentStatus = 'PENDENTE' | 'PAGO' | 'FALHOU' | 'CANCELADO'

export interface WhatsAppInstancePayment {
  id: number
  instanciaId: number
  metodo: WhatsAppPaymentMethod
  status: WhatsAppPaymentStatus
  payerEmail: string
  webhookPaymentUrl?: string | null
  paymentId?: string | null
  sessionId?: string | null
  qrCodeBase64?: string | null
  qrCodeCopyPaste?: string | null
  ticketUrl?: string | null
  checkoutUrl?: string | null
  pagoEm?: string | null
  createdAt: string
  updatedAt: string
}

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
  pagamentos?: WhatsAppInstancePayment[]
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

export interface WhatsAppContactListItem {
  id: number
  telefone: string
  nome?: string | null
  foto?: string | null
  clienteId?: number | null
  Cliente?: WhatsAppLinkedCustomer | null
  _count?: { conversas: number }
  createdAt: string
  updatedAt: string
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
  // Reações recebidas nesta mensagem (JSON serializado: array de { emoji, fromMe, senderId }).
  // Exibidas como um selo abaixo do balão, sem virar um balão próprio.
  reacoes?: string | null
  // Resposta/citação: id externo da mensagem citada e um resumo do conteúdo dela.
  quotedMessageId?: string | null
  quotedConteudo?: string | null
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

export interface WhatsAppWebhookEvent {
  id: number
  tipo: string
  eventId: string
  processado: boolean
  erro?: string | null
  payload: string
  createdAt: string
  processedAt?: string | null
}

export interface PaginatedResponse<T> {
  items: T[]
  nextCursor?: number | null
}

export interface ConversationSaleItem {
  id: number
  uid: string
  data: string
  status: string
  total: number
}

export interface ConversationSaleTool {
  cliente: { id: number; nome: string } | null
  items: ConversationSaleItem[]
}

export interface WhatsAppAgent {
  id: number
  nome: string
  prompt: string
  modelo: string
  ativo: boolean
  horaInicio?: string | null
  horaFim?: string | null
  diasSemana: string
  instanciaIds: number[]
  createdAt: string
  updatedAt: string
}

export interface WhatsAppAgentPayload {
  nome: string
  prompt: string
  modelo?: string
  ativo?: boolean
  horaInicio?: string | null
  horaFim?: string | null
  diasSemana?: string | null
  instanciaIds?: number[]
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

  static async createInstanceAuto(payload: { nome: string }) {
    const { data } = await http.post('/whatsapp/instances/generate', payload)
    return data.data as { instance: WhatsAppInstance; isTrial: boolean; trialDays: number }
  }

  static async updateInstance(id: number, payload: Partial<{ nome: string; instanceId: string; token: string | null; ativo: boolean }>) {
    const { data } = await http.put(`/whatsapp/instances/${id}`, payload)
    return data.data as WhatsAppInstance
  }

  static async removeInstance(id: number) {
    const { data } = await http.delete(`/whatsapp/instances/${id}`)
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

  static async listInstanceWebhookEvents(id: number, params: { take?: number; tipo?: string } = {}) {
    const { data } = await http.get(`/whatsapp/instances/${id}/eventos`, { params })
    return data.data as WhatsAppWebhookEvent[]
  }

  static async instanceAction(id: number, action: 'qrCode' | 'pairingCode' | 'restart' | 'disconnect' | 'status' | 'device' | 'setupWebhooks', payload?: Record<string, unknown>) {
    const { data } = await http.post(`/whatsapp/instances/${id}/${action}`, payload || {})
    return data.data
  }

  static async createPixPayment(id: number) {
    const { data } = await http.post(`/whatsapp/instances/${id}/payments/pix`, {})
    return data.data as WhatsAppInstancePayment
  }

  static async createCardSubscription(id: number) {
    const { data } = await http.post(`/whatsapp/instances/${id}/payments/card-subscription`, {})
    return data.data as WhatsAppInstancePayment
  }

  static async removePayment(instanceId: number, paymentId: number) {
    const { data } = await http.delete(`/whatsapp/instances/${instanceId}/payments/${paymentId}`)
    return data.data as WhatsAppInstancePayment
  }

  static async startConversation(payload: { clienteId: number; instanciaId?: number }) {
    const { data } = await http.post('/whatsapp/conversas/iniciar', payload)
    return data.data as WhatsAppConversation
  }

  static async listConversations(params: { search?: string; status?: WhatsAppConversationStatus; instanciaId?: number; take?: number; cursor?: number } = {}) {
    const { data } = await http.get('/whatsapp/conversas', { params })
    return data.data as PaginatedResponse<WhatsAppConversation>
  }

  static async listMessages(conversaId: number, params: { take?: number; cursor?: number } = {}) {
    const { data } = await http.get(`/whatsapp/conversas/${conversaId}/mensagens`, { params })
    return data.data as PaginatedResponse<WhatsAppMessage>
  }

  // Baixa a mídia descriptografada de uma mensagem (o backend baixa o `.enc` do WhatsApp e
  // decifra). Retorna um object URL pronto para usar em <img src>; lembre de revogar depois.
  static async fetchMessageMedia(messageId: number) {
    const { data } = await http.get(`/whatsapp/messages/${messageId}/media`, { responseType: 'blob' })
    return URL.createObjectURL(data as Blob)
  }

  static async sendMessage(conversaId: number, payload: { tipo?: 'text' | 'image' | 'audio' | 'video' | 'document'; conteudo?: string; mediaUrl?: string; caption?: string; fileName?: string; extension?: string; quotedMessageId?: string }) {
    const { data } = await http.post(`/whatsapp/conversas/${conversaId}/mensagens`, payload)
    return data.data as WhatsAppMessage
  }

  static async updateConversation(conversaId: number, payload: Partial<{ status: WhatsAppConversationStatus; atendenteId: number | null; setor: string | null; fila: string | null; clienteId: number | null }>) {
    const { data } = await http.patch(`/whatsapp/conversas/${conversaId}`, payload)
    return data.data as WhatsAppConversation
  }

  // Apagar chat (conversa + mensagens). Restrito a administradores no backend.
  static async deleteConversation(conversaId: number) {
    const { data } = await http.delete(`/whatsapp/conversas/${conversaId}`)
    return data.data as { id: number }
  }

  static async listContacts(params: { search?: string; take?: number; cursor?: number } = {}) {
    const { data } = await http.get('/whatsapp/contatos', { params })
    return data.data as PaginatedResponse<WhatsAppContactListItem>
  }

  static async updateContact(contatoId: number, payload: Partial<{ nome: string | null; clienteId: number | null }>) {
    const { data } = await http.patch(`/whatsapp/contatos/${contatoId}`, payload)
    return data.data as WhatsAppContactListItem
  }

  // Apaga um contato e todas as suas conversas/mensagens. Restrito a administradores no backend.
  static async deleteContact(contatoId: number) {
    const { data } = await http.delete(`/whatsapp/contatos/${contatoId}`)
    return data.data as { id: number; conversasRemovidas: number }
  }

  // Agentes de autoatendimento (IA). Gerenciados por administradores.
  static async listAgents() {
    const { data } = await http.get('/whatsapp/agentes')
    return data.data as { items: WhatsAppAgent[]; models: string[] }
  }

  static async createAgent(payload: WhatsAppAgentPayload) {
    const { data } = await http.post('/whatsapp/agentes', payload)
    return data.data as WhatsAppAgent
  }

  static async updateAgent(id: number, payload: Partial<WhatsAppAgentPayload>) {
    const { data } = await http.put(`/whatsapp/agentes/${id}`, payload)
    return data.data as WhatsAppAgent
  }

  static async deleteAgent(id: number) {
    const { data } = await http.delete(`/whatsapp/agentes/${id}`)
    return data.data as { id: number }
  }

  static async attendConversation(conversaId: number) {
    const { data } = await http.post(`/whatsapp/conversas/${conversaId}/atender`)
    return data.data as WhatsAppConversation
  }

  static async listConversationSales(conversaId: number, search?: string) {
    const { data } = await http.get(`/whatsapp/conversas/${conversaId}/ferramentas/vendas`, { params: { search } })
    return data.data as ConversationSaleTool
  }

  static async sendConversationSale(conversaId: number, vendaId: number) {
    const { data } = await http.post(`/whatsapp/conversas/${conversaId}/ferramentas/vendas`, { vendaId })
    return data.data as WhatsAppMessage
  }

  static async markAsRead(conversaId: number) {
    const { data } = await http.post(`/whatsapp/conversas/${conversaId}/read`)
    return data.data as WhatsAppConversation
  }
}
