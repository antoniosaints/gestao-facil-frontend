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

export type MetricaAtendimento = { atual: number; anterior: number; delta: number }

export type CicloStatusAtendimento = 'NA_FILA' | 'EM_ANDAMENTO' | 'FINALIZADO'

// Uma linha do relatório = um ciclo de atendimento (fila -> assumido -> finalizado). A mesma
// conversa pode render vários ciclos, já que a thread é reaproveitada a cada retorno do cliente.
export interface LinhaRelatorioAtendimento {
  id: string
  conversaId: number
  contato: string
  telefone: string
  instancia: string | null
  atendenteId: number | null
  atendente: string | null
  status: CicloStatusAtendimento
  entrouFilaEm: string | null
  assumidoEm: string | null
  finalizadoEm: string | null
  // `null` = não medido (o ciclo começou antes do período consultado), não zero.
  esperaMs: number | null
  duracaoMs: number | null
}

export interface ResumoRelatorioAtendimento {
  periodo: { inicio: string; fim: string }
  totais: {
    atendimentos: number
    finalizados: number
    emAndamento: number
    naFila: number
    tempoMedioEsperaMs: number | null
    tempoMedioResolucaoMs: number | null
  }
  porAtendente: {
    atendenteId: number
    nome: string
    finalizados: number
    emAndamento: number
    tempoMedioEsperaMs: number | null
    tempoMedioResolucaoMs: number | null
  }[]
}

export interface PainelAtendimento {
  periodo: { inicio: string; fim: string; anterior: { inicio: string; fim: string } }
  // Estado atual, independente do período selecionado.
  agora: {
    naFila: number
    emAtendimento: number
    finalizadas: number
    naoLidas: number
    esperaMaiorMs: number
  }
  kpis: {
    novasNaFila: MetricaAtendimento
    atendimentosAssumidos: MetricaAtendimento
    atendimentosFinalizados: MetricaAtendimento
    tempoMedioEsperaMs: MetricaAtendimento
    tempoMedioResolucaoMs: MetricaAtendimento
    mensagensRecebidas: MetricaAtendimento
    respostasAtendente: MetricaAtendimento
    respostasIa: MetricaAtendimento
  }
  serieVolume: { labels: string[]; recebidas: number[]; enviadas: number[] }
  distribuicaoStatus: { labels: string[]; data: number[] }
  // `semOrigem` são mensagens anteriores à instrumentação: não dá para saber se vieram do
  // atendente ou do agente de IA, então ficam fora da distribuição.
  distribuicaoOrigem: { labels: string[]; data: number[]; semOrigem: number }
  produtividade: {
    atendenteId: number
    nome: string
    assumidas: number
    finalizadas: number
    mensagens: number
  }[]
  filaAtual: {
    conversaId: number
    contato: string
    telefone: string
    instancia: string | null
    fila: string | null
    setor: string | null
    naoLidas: number
    ultimaMensagem: string | null
    esperandoMs: number | null
  }[]
}

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
  // Controle de atendimento (sem desconectar a API): não perturbe + janela de horário.
  atendimentoNaoPerturbe?: boolean
  atendimentoHoraInicio?: string | null
  atendimentoHoraFim?: string | null
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
  // Quando preenchido, a mensagem foi apagada pelo remetente (revoke); o conteúdo original é
  // mantido e o chat mostra o selo "apagada".
  apagadaEm?: string | null
  // Reações recebidas nesta mensagem (JSON serializado: array de { emoji, fromMe, senderId }).
  // Exibidas como um selo abaixo do balão, sem virar um balão próprio.
  reacoes?: string | null
  // Resposta/citação: id externo da mensagem citada e um resumo do conteúdo dela.
  quotedMessageId?: string | null
  quotedConteudo?: string | null
  // Payload bruto (JSON) do webhook recebido ou do envio. Para mensagens de localização/contato
  // guarda o `msgContent.locationMessage`/`contactMessage` usado para montar o balão personalizado.
  rawPayload?: string | null
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

  // Atualiza o controle de atendimento da instância (não perturbe + janela de horário), sem
  // desconectar a API. Horário no formato "HH:mm"; null/"" limpa a restrição.
  static async updateAtendimento(id: number, payload: { naoPerturbe?: boolean; horaInicio?: string | null; horaFim?: string | null }) {
    const { data } = await http.patch(`/whatsapp/instances/${id}/atendimento`, payload)
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

  static async startConversation(payload: { clienteId?: number; contatoId?: number; phone?: string; nome?: string; instanciaId?: number }) {
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

  // Envia uma localização (pino no mapa). Coordenadas coletadas do navegador (geolocation) ou
  // informadas manualmente. `name` é o título e `address` o endereço completo.
  static async sendLocation(
    conversaId: number,
    payload: { latitude: number | string; longitude: number | string; name: string; address: string; quotedMessageId?: string },
  ) {
    const { data } = await http.post(`/whatsapp/conversas/${conversaId}/mensagens/localizacao`, payload)
    return data.data as WhatsAppMessage
  }

  // Envia um cartão de contato (vCard).
  static async sendContact(
    conversaId: number,
    payload: { contactName: string; contactPhone: string; contactBusinessDescription?: string; quotedMessageId?: string },
  ) {
    const { data } = await http.post(`/whatsapp/conversas/${conversaId}/mensagens/contato`, payload)
    return data.data as WhatsAppMessage
  }

  // Envia uma imagem a partir do dispositivo do usuário (multipart). O backend faz o scale down,
  // salva no storage público (Cloudflare R2) e envia a URL na conversa.
  static async sendImageMessage(conversaId: number, file: File, options: { caption?: string; quotedMessageId?: string } = {}) {
    const form = new FormData()
    form.append('file', file)
    if (options.caption) form.append('caption', options.caption)
    if (options.quotedMessageId) form.append('quotedMessageId', options.quotedMessageId)
    const { data } = await http.post(`/whatsapp/conversas/${conversaId}/mensagens/imagem`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data as WhatsAppMessage
  }

  // Envia um áudio gravado no dispositivo (multipart). O backend transcoda para OGG/Opus (ffmpeg),
  // salva no storage público e envia a URL como nota de voz.
  static async sendAudioMessage(conversaId: number, file: File | Blob, options: { quotedMessageId?: string } = {}) {
    const form = new FormData()
    form.append('file', file, 'audio-gravado.webm')
    if (options.quotedMessageId) form.append('quotedMessageId', options.quotedMessageId)
    const { data } = await http.post(`/whatsapp/conversas/${conversaId}/mensagens/audio`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
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

  // Painel de atendimento. Devolve o payload cru (sem envelope `data`), como os demais painéis.
  static async getPainel(inicio?: string, fim?: string) {
    const { data } = await http.get(`/whatsapp/graficos/painel`, {
      params: { ...(inicio ? { inicio } : {}), ...(fim ? { fim } : {}) },
    })
    return data as PainelAtendimento
  }

  // Resumo do relatório de atendimentos. A tabela em si é carregada pelo DataTable, que fala
  // direto com /whatsapp/relatorios/atendimentos.
  static async getRelatorioResumo(params: { inicio?: string; fim?: string; atendenteId?: number }) {
    const { data } = await http.get(`/whatsapp/relatorios/atendimentos/resumo`, { params })
    return data as ResumoRelatorioAtendimento
  }
}
