<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import {
  ArrowLeft,
  ArrowRightLeft,
  Ban,
  Camera,
  ChevronDown,
  Clock,
  Headset,
  ImagePlus,
  Inbox,
  Link,
  LoaderCircle,
  Mic,
  Plus,
  Square,
  MessageSquareDashed,
  MessageSquareLock,
  MessageSquarePlus,
  MessageSquareText,
  Receipt,
  Reply,
  Search,
  Send,
  Trash2,
  UserPlus,
  X,
} from 'lucide-vue-next'
import { useSocketEvent } from '@/composables/useSocketEvent'
import { useConfirm } from '@/composables/useConfirm'
import { useUiStore } from '@/stores/ui/uiStore'
import { ClienteRepository } from '@/repositories/cliente-repository'
import { UsuarioRepository } from '@/repositories/usuario-repository'
import AudioMessagePlayer from '@/pages/atendimento/AudioMessagePlayer.vue'
import {
  WhatsAppRepository,
  type ConversationSaleItem,
  type WhatsAppConversation,
  type WhatsAppConversationStatus,
  type WhatsAppInstance,
  type WhatsAppMessage,
} from '@/repositories/whatsapp-repository'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const storeUi = useUiStore()
// Apagar chats é permitido apenas para administradores (nível 4: admin/root).
const isAdmin = computed(() => Boolean(storeUi.permissoes?.admin))

const loading = ref(false)
const sending = ref(false)
const attending = ref(false)
const deleting = ref(false)
const showDetails = ref(false)

const instances = ref<WhatsAppInstance[]>([])
// Caixa de atendimento ativa: null = todas as instâncias; caso contrário, filtra por instância.
const activeInstanceId = ref<number | null>(null)
const newChat = reactive<{
  open: boolean
  mode: 'cliente' | 'contato'
  clienteId: number | null
  contatoId: number | null
  instanciaId: number | null
  starting: boolean
}>({ open: false, mode: 'cliente', clienteId: null, contatoId: null, instanciaId: null, starting: false })

const conversations = ref<WhatsAppConversation[]>([])
const messages = ref<WhatsAppMessage[]>([])
const selectedConversation = ref<WhatsAppConversation | null>(null)
const conversationSearch = ref('')
// Abas de atendimento: Espera (PENDENTE) -> Abertas (ABERTA) -> Finalizadas (FINALIZADA).
// A aba inicial é sempre "Abertas".
const statusFilter = ref<WhatsAppConversationStatus>('ABERTA')
const customerSearch = ref('')
const customerOptions = ref<Array<{ id: number; label: string }>>([])

const messagesScroll = ref<any>(null)

const conversationForm = reactive<{ status: WhatsAppConversationStatus; setor: string }>({ status: 'ABERTA', setor: '' })
// O campo de texto do composer envia apenas texto; mídias vão por fluxos próprios (imagem em modal
// de pré-visualização; áudio/vídeo/documento por link).
const messageForm = reactive<{ conteudo: string }>({ conteudo: '' })

// Mensagem que está sendo respondida (citada). Enquanto definida, mostramos uma prévia acima
// do campo de digitação e enviamos o `quotedMessageId` para a mensagem sair como resposta.
const replyingTo = ref<WhatsAppMessage | null>(null)

function startReply(message: WhatsAppMessage) {
  replyingTo.value = message
}

function cancelReply() {
  replyingTo.value = null
}

// Ferramenta de envio de dados do sistema (venda), acessível pelo menu de anexos (+).
const saleTool = reactive<{ open: boolean; search: string; loading: boolean; sendingId: number | null; items: ConversationSaleItem[] }>({
  open: false,
  search: '',
  loading: false,
  sendingId: null,
  items: [],
})

const canSendMessage = computed(() => {
  if (!selectedConversation.value) return false
  // Só responde quando o atendimento está em curso (ABERTA); em ESPERA é preciso "Atender".
  if (selectedConversation.value.status !== 'ABERTA') return false
  if (selectedConversation.value.Instancia?.status !== 'CONECTADA') return false
  return Boolean(messageForm.conteudo.trim())
})

const totalNaoLidas = computed(() => conversations.value.reduce((total, item) => total + (item.naoLidas || 0), 0))
const hasLinkedClient = computed(() => Boolean(selectedConversation.value?.clienteId || selectedConversation.value?.Cliente))

function openSaleTool() {
  if (!hasLinkedClient.value) {
    toast.warning('Vincule um cliente do sistema à conversa para usar esta ferramenta.')
    return
  }
  saleTool.open = true
  saleTool.search = ''
  saleTool.items = []
  loadSaleToolItems()
}

async function loadSaleToolItems() {
  if (!selectedConversation.value) return
  try {
    saleTool.loading = true
    const response = await WhatsAppRepository.listConversationSales(selectedConversation.value.id, saleTool.search || undefined)
    saleTool.items = response.items
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Não foi possível carregar as vendas do cliente.')
    saleTool.items = []
  } finally {
    saleTool.loading = false
  }
}

async function sendSale(vendaId: number) {
  if (!selectedConversation.value) return
  try {
    saleTool.sendingId = vendaId
    await WhatsAppRepository.sendConversationSale(selectedConversation.value.id, vendaId)
    await Promise.all([loadMessages(), loadConversations()])
    saleTool.open = false
    toast.success('Dados da venda enviados ao cliente.')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Não foi possível enviar os dados da venda.')
  } finally {
    saleTool.sendingId = null
  }
}

function saleStatusLabel(status: string) {
  const labels: Record<string, string> = {
    ORCAMENTO: 'Orçamento',
    FATURADO: 'Faturado',
    ANDAMENTO: 'Em andamento',
    FINALIZADO: 'Finalizado',
    PENDENTE: 'Pendente',
    CANCELADO: 'Cancelado',
  }
  return labels[status] || status
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}
const activeInstance = computed(() => instances.value.find((item) => item.id === activeInstanceId.value) || null)
const showInboxSwitcher = computed(() => instances.value.length > 1)

function instanceStatusDotClass(status?: string | null) {
  if (status === 'CONECTADA') return 'bg-green-500'
  if (status === 'CONECTANDO' || status === 'PENDENTE') return 'bg-amber-500'
  return 'bg-slate-400'
}

function conversationStatusDotClass(status: WhatsAppConversationStatus) {
  if (status === 'ABERTA') return 'bg-green-500'
  if (status === 'PENDENTE') return 'bg-amber-500'
  return 'bg-slate-400'
}

function statusLabel(status: WhatsAppConversationStatus) {
  if (status === 'ABERTA') return 'Em atendimento'
  if (status === 'PENDENTE') return 'Em espera'
  return 'Finalizada'
}

function statusPillClass(status: WhatsAppConversationStatus) {
  if (status === 'ABERTA') return 'bg-green-500/15 text-green-600'
  if (status === 'PENDENTE') return 'bg-amber-500/15 text-amber-600'
  return 'bg-slate-500/15 text-slate-500'
}

function setActiveInstance(id: number | null) {
  if (activeInstanceId.value === id) return
  activeInstanceId.value = id
  loadConversations()
}

function conversationLabel(conversation: WhatsAppConversation) {
  return conversation.Cliente?.nome || conversation.Contato?.nome || conversation.telefone
}

function initials(value: string) {
  return (
    value
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'W'
  )
}

// Imagens do WhatsApp (fotos de perfil em pps.whatsapp.net, mídias em mmg.whatsapp.net)
// podem expirar/vir criptografadas e falhar ao carregar; quando isso acontece caímos de volta
// nas iniciais (avatar) ou no link (mensagem) em vez de mostrar uma imagem quebrada.
const brokenImages = ref<Set<string>>(new Set())

function handleImageError(url?: string | null) {
  if (!url) return
  const next = new Set(brokenImages.value)
  next.add(url)
  brokenImages.value = next
}

function conversationPhoto(conversation: WhatsAppConversation) {
  const foto = conversation.Contato?.foto
  if (!foto || brokenImages.value.has(foto)) return null
  return foto
}

// Imagem aberta em tela cheia (lightbox); null = fechado.
const imagePreview = ref<string | null>(null)
// Cache de mídias recebidas já descriptografadas: id da mensagem -> object URL do blob.
const mediaCache = ref<Record<number, string>>({})

function isSticker(message: WhatsAppMessage) {
  return message.tipo === 'STICKER'
}

// É uma mensagem que deve ser exibida como imagem (imagem ou figurinha / mime-type de imagem)?
function isImageMessage(message: WhatsAppMessage) {
  if (!message.mediaUrl) return false
  return (
    message.tipo === 'IMAGEM' || message.tipo === 'STICKER' || Boolean(message.mediaMimeType?.startsWith('image/'))
  )
}

// URL para exibir a imagem. Mídias enviadas por nós (SAIDA) já têm URL pública direta; mídias
// recebidas (ENTRADA) vêm criptografadas e são descriptografadas pelo backend e servidas como
// blob (mediaCache). Retorna null enquanto o blob não chegou ou se a imagem falhou.
function imageSrc(message: WhatsAppMessage): string | null {
  if (!isImageMessage(message) || brokenImages.value.has(String(message.id))) return null
  if (message.direcao === 'SAIDA') return message.mediaUrl || null
  return mediaCache.value[message.id] || null
}

// Está descriptografando/baixando uma imagem recebida que ainda não chegou nem falhou?
function isImageLoading(message: WhatsAppMessage) {
  return (
    isImageMessage(message) &&
    message.direcao === 'ENTRADA' &&
    !mediaCache.value[message.id] &&
    !brokenImages.value.has(String(message.id))
  )
}

// É uma mensagem de áudio (nota de voz)? Precisa ter mídia associada.
function isAudioMessage(message: WhatsAppMessage) {
  if (!message.mediaUrl) return false
  return message.tipo === 'AUDIO' || Boolean(message.mediaMimeType?.startsWith('audio/'))
}

// URL do áudio para o player. Enviados (SAIDA) têm URL pública direta; recebidos (ENTRADA) vêm
// criptografados e são descriptografados pelo backend e servidos como blob (mediaCache).
// O áudio (enviado ou recebido) é sempre servido via proxy same-origin do backend (mediaCache),
// porque o wavesurfer lê os bytes para desenhar a waveform e o bucket público bloqueia por CORS.
function audioSrc(message: WhatsAppMessage): string | null {
  if (!isAudioMessage(message) || brokenImages.value.has(String(message.id))) return null
  return mediaCache.value[message.id] || null
}

// Está baixando o áudio (que ainda não chegou ao cache nem falhou)?
function isAudioLoading(message: WhatsAppMessage) {
  return (
    isAudioMessage(message) &&
    !mediaCache.value[message.id] &&
    !brokenImages.value.has(String(message.id))
  )
}

// Precisa passar pelo proxy same-origin do backend? Recebidas (ENTRADA) de imagem/áudio precisam
// (descriptografia); enviadas (SAIDA) só o áudio precisa (evitar CORS na waveform — a imagem SAIDA
// carrega direto via <img>, que não sofre CORS).
function needsMediaProxy(message: WhatsAppMessage) {
  if (message.direcao === 'ENTRADA') return isImageMessage(message) || isAudioMessage(message)
  return isAudioMessage(message)
}

// Baixa (proxy/descriptografia no backend) as mídias que precisam de blob same-origin.
async function prefetchMedia(list: WhatsAppMessage[]) {
  for (const message of list) {
    if (!needsMediaProxy(message)) continue
    if (mediaCache.value[message.id] || brokenImages.value.has(String(message.id))) continue
    try {
      const url = await WhatsAppRepository.fetchMessageMedia(message.id)
      mediaCache.value = { ...mediaCache.value, [message.id]: url }
    } catch {
      handleImageError(String(message.id))
    }
  }
}

function openImagePreview(message: WhatsAppMessage) {
  const url = imageSrc(message)
  if (url) imagePreview.value = url
}

onBeforeUnmount(() => {
  Object.values(mediaCache.value).forEach((url) => URL.revokeObjectURL(url))
  if (imageDraft.previewUrl) URL.revokeObjectURL(imageDraft.previewUrl)
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  stopAudioResources()
})

function formatTime(value?: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function mediaLabel(message: WhatsAppMessage) {
  const labels: Record<string, string> = {
    IMAGEM: 'Imagem',
    AUDIO: 'Áudio',
    VIDEO: 'Vídeo',
    DOCUMENTO: message.fileName || 'Documento',
  }
  return labels[message.tipo] || 'Mídia'
}

// Reações da mensagem (evento reactionMessage): guardadas como JSON na própria mensagem
// reagida. Exibidas como um selo abaixo do balão, agrupando emojis iguais com contagem.
function messageReactions(message: WhatsAppMessage): Array<{ emoji: string; count: number }> {
  if (!message.reacoes) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(message.reacoes)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  const counts = new Map<string, number>()
  for (const item of parsed) {
    const emoji = (item as { emoji?: unknown })?.emoji
    if (typeof emoji === 'string' && emoji) counts.set(emoji, (counts.get(emoji) || 0) + 1)
  }
  return Array.from(counts, ([emoji, count]) => ({ emoji, count }))
}

// Resumo curto do conteúdo de uma mensagem, para prévias de resposta/citação.
function messageSnippet(message: WhatsAppMessage): string {
  return (message.conteudo && message.conteudo.trim()) || mediaLabel(message)
}

// Dados do trecho citado por uma mensagem (resposta). Tenta resolver a mensagem original já
// carregada (para saber autor e conteúdo atual); se não estiver, usa o resumo salvo.
function quotedPreview(message: WhatsAppMessage): { autor: string; texto: string } | null {
  if (!message.quotedMessageId && !message.quotedConteudo) return null
  const original = messages.value.find((item) => item.externalMessageId === message.quotedMessageId)
  if (original) {
    return {
      autor: original.direcao === 'SAIDA' ? 'Você' : selectedConversation.value?.Contato?.nome || 'Contato',
      texto: messageSnippet(original),
    }
  }
  return { autor: '', texto: message.quotedConteudo || 'Mensagem' }
}

async function scrollToBottom() {
  await nextTick()
  const root: HTMLElement | null = messagesScroll.value?.$el ?? messagesScroll.value ?? null
  const viewport = (root?.querySelector('[data-reka-scroll-area-viewport]') as HTMLElement | null) || root
  if (viewport) viewport.scrollTop = viewport.scrollHeight
}

function setStatusFilter(status: WhatsAppConversationStatus) {
  statusFilter.value = status
  loadConversations()
}

async function loadConversations() {
  try {
    loading.value = true
    const response = await WhatsAppRepository.listConversations({
      search: conversationSearch.value || undefined,
      status: statusFilter.value,
      instanciaId: activeInstanceId.value || undefined,
      take: 80,
    })
    conversations.value = response.items
    if (selectedConversation.value) {
      selectedConversation.value =
        conversations.value.find((item) => item.id === selectedConversation.value?.id) || selectedConversation.value
    }
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar as conversas de atendimento.')
  } finally {
    loading.value = false
  }
}

// Insere no topo (ou atualiza) uma conversa na lista, mantendo a ordenação por recência.
function upsertConversation(conversation: WhatsAppConversation) {
  const index = conversations.value.findIndex((item) => item.id === conversation.id)
  if (index >= 0) {
    conversations.value[index] = { ...conversations.value[index], ...conversation }
    const [moved] = conversations.value.splice(index, 1)
    conversations.value.unshift(moved)
  } else {
    conversations.value.unshift(conversation)
  }
}

async function loadInstances() {
  try {
    instances.value = await WhatsAppRepository.listInstances()
  } catch (error) {
    console.error(error)
    instances.value = []
  }
}

function openNewChat() {
  newChat.open = true
  newChat.mode = 'cliente'
  newChat.clienteId = null
  newChat.contatoId = null
  // Já inicia na caixa (instância) ativa quando houver uma selecionada.
  newChat.instanciaId = activeInstanceId.value
  if (!instances.value.length) loadInstances()
}

// Alterna entre iniciar por cliente do ERP ou por contato do WhatsApp, limpando a seleção.
// O Select2Ajax de cada modo faz a própria busca ao ser montado.
function setNewChatMode(mode: 'cliente' | 'contato') {
  if (newChat.mode === mode) return
  newChat.mode = mode
  newChat.clienteId = null
  newChat.contatoId = null
}

async function startConversation(target: { clienteId?: number; contatoId?: number }, instanciaId?: number | null) {
  const conversation = await WhatsAppRepository.startConversation({
    ...target,
    instanciaId: instanciaId || undefined,
  })
  upsertConversation(conversation)
  await openConversation(conversation)
  return conversation
}

async function confirmNewChat() {
  const target: { clienteId?: number; contatoId?: number } =
    newChat.mode === 'contato'
      ? { contatoId: newChat.contatoId ?? undefined }
      : { clienteId: newChat.clienteId ?? undefined }
  if (!target.clienteId && !target.contatoId) {
    toast.warning(
      newChat.mode === 'contato'
        ? 'Selecione um contato para iniciar a conversa.'
        : 'Selecione um cliente para iniciar a conversa.',
    )
    return
  }
  try {
    newChat.starting = true
    await startConversation(target, newChat.instanciaId)
    newChat.open = false
    toast.success('Conversa iniciada.')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Não foi possível iniciar a conversa.')
  } finally {
    newChat.starting = false
  }
}

// Suporta abrir o atendimento já iniciando a conversa de um cliente (ex.: botão na tela do cliente).
async function startFromClienteQuery() {
  const raw = route.query.cliente
  const clienteId = Number(Array.isArray(raw) ? raw[0] : raw)
  if (!clienteId) return
  // Limpa o parâmetro para não reabrir a conversa a cada refresh/navegação.
  router.replace({ query: { ...route.query, cliente: undefined } })
  try {
    await startConversation({ clienteId })
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Não foi possível iniciar a conversa do cliente.')
  }
}

async function openConversation(conversation: WhatsAppConversation) {
  selectedConversation.value = conversation
  conversationForm.status = conversation.status
  conversationForm.setor = conversation.setor || ''
  customerSearch.value = conversation.Cliente?.nome || ''
  customerOptions.value = []
  showDetails.value = false
  await loadMessages()
  if (conversation.naoLidas) await markRead()
}

async function loadMessages() {
  if (!selectedConversation.value) return
  const response = await WhatsAppRepository.listMessages(selectedConversation.value.id, { take: 80 })
  messages.value = response.items
  await scrollToBottom()
  void prefetchMedia(messages.value)
}

async function sendText() {
  if (!selectedConversation.value || !canSendMessage.value) return
  try {
    sending.value = true
    await WhatsAppRepository.sendMessage(selectedConversation.value.id, {
      tipo: 'text',
      conteudo: messageForm.conteudo,
      quotedMessageId: replyingTo.value?.externalMessageId || undefined,
    })
    messageForm.conteudo = ''
    replyingTo.value = null
    await Promise.all([loadMessages(), loadConversations()])
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao enviar mensagem.')
  } finally {
    sending.value = false
  }
}

// --- Envio de imagem do dispositivo (PC/celular) ---
// Ao anexar, mostramos uma pré-visualização com legenda opcional antes de enviar. O backend faz o
// scale down, salva no storage público e envia a URL na conversa.
const imageInput = ref<HTMLInputElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)
const sendingImage = ref(false)
const imageDraft = reactive<{ open: boolean; file: File | null; previewUrl: string; caption: string }>({
  open: false,
  file: null,
  previewUrl: '',
  caption: '',
})

function pickImage() {
  imageInput.value?.click()
}

function pickCamera() {
  cameraInput.value?.click()
}

function onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // permite reenviar o mesmo arquivo em seguida
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.warning('Selecione um arquivo de imagem.')
    return
  }
  if (imageDraft.previewUrl) URL.revokeObjectURL(imageDraft.previewUrl)
  imageDraft.file = file
  imageDraft.previewUrl = URL.createObjectURL(file)
  imageDraft.caption = ''
  imageDraft.open = true
}

function closeImageDraft() {
  if (imageDraft.previewUrl) URL.revokeObjectURL(imageDraft.previewUrl)
  imageDraft.open = false
  imageDraft.file = null
  imageDraft.previewUrl = ''
  imageDraft.caption = ''
}

async function confirmSendImage() {
  if (!imageDraft.file || !selectedConversation.value) return
  try {
    sendingImage.value = true
    await WhatsAppRepository.sendImageMessage(selectedConversation.value.id, imageDraft.file, {
      caption: imageDraft.caption.trim() || undefined,
      quotedMessageId: replyingTo.value?.externalMessageId || undefined,
    })
    replyingTo.value = null
    closeImageDraft()
    await Promise.all([loadMessages(), loadConversations()])
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Não foi possível enviar a imagem.')
  } finally {
    sendingImage.value = false
  }
}

// --- Envio de áudio/vídeo/documento por URL pública (menu de anexos) ---
const mediaLink = reactive<{ open: boolean; tipo: 'audio' | 'video' | 'document'; url: string; caption: string; sending: boolean }>({
  open: false,
  tipo: 'document',
  url: '',
  caption: '',
  sending: false,
})

function openMediaLink() {
  mediaLink.tipo = 'document'
  mediaLink.url = ''
  mediaLink.caption = ''
  mediaLink.open = true
}

async function sendMediaLink() {
  if (!selectedConversation.value) return
  if (!mediaLink.url.trim()) {
    toast.warning('Informe a URL pública da mídia.')
    return
  }
  try {
    mediaLink.sending = true
    await WhatsAppRepository.sendMessage(selectedConversation.value.id, {
      tipo: mediaLink.tipo,
      mediaUrl: mediaLink.url.trim(),
      caption: mediaLink.caption.trim() || undefined,
      quotedMessageId: replyingTo.value?.externalMessageId || undefined,
    })
    replyingTo.value = null
    mediaLink.open = false
    await Promise.all([loadMessages(), loadConversations()])
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Não foi possível enviar a mídia.')
  } finally {
    mediaLink.sending = false
  }
}

// --- Gravação de áudio (nota de voz) ---
// Grava com o MediaRecorder (preferindo ogg/webm opus), mostra uma pré-escuta antes de enviar; o
// backend transcoda para OGG/Opus (ffmpeg), sobe no storage e envia a URL.
const audioRec = reactive<{ state: 'idle' | 'recording' | 'preview'; seconds: number; sending: boolean }>({
  state: 'idle',
  seconds: 0,
  sending: false,
})
const audioBlob = ref<Blob | null>(null)
const audioUrl = ref('')
let mediaRecorder: MediaRecorder | null = null
let audioStream: MediaStream | null = null
let audioChunks: Blob[] = []
let audioTimer: ReturnType<typeof setInterval> | null = null
let audioMime = ''
let audioCancelled = false

function pickRecorderMimeType(): string {
  const options = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  return options.find((type) => MediaRecorder.isTypeSupported?.(type)) || ''
}

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function stopAudioResources() {
  if (audioTimer) {
    clearInterval(audioTimer)
    audioTimer = null
  }
  audioStream?.getTracks().forEach((track) => track.stop())
  audioStream = null
  mediaRecorder = null
}

async function startRecording() {
  if (!selectedConversation.value || audioRec.state !== 'idle') return
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    toast.error('Gravação de áudio indisponível neste navegador.')
    return
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioMime = pickRecorderMimeType()
    const recorder = new MediaRecorder(stream, audioMime ? { mimeType: audioMime } : undefined)
    audioChunks = []
    audioCancelled = false
    audioStream = stream
    mediaRecorder = recorder
    recorder.ondataavailable = (event) => {
      if (event.data?.size) audioChunks.push(event.data)
    }
    recorder.onstop = () => finalizeRecording(audioMime || recorder.mimeType || 'audio/webm')
    recorder.start()
    audioRec.seconds = 0
    audioRec.state = 'recording'
    audioTimer = setInterval(() => {
      audioRec.seconds += 1
    }, 1000)
  } catch (error) {
    console.error(error)
    stopAudioResources()
    audioRec.state = 'idle'
    toast.error('Não foi possível acessar o microfone.')
  }
}

function stopRecording() {
  if (mediaRecorder?.state === 'recording') mediaRecorder.stop()
}

function finalizeRecording(mime: string) {
  const cancelled = audioCancelled
  const chunks = audioChunks
  stopAudioResources()
  if (cancelled) {
    audioRec.state = 'idle'
    audioRec.seconds = 0
    return
  }
  if (!chunks.length) {
    audioRec.state = 'idle'
    audioRec.seconds = 0
    toast.warning('Nenhum áudio foi gravado.')
    return
  }
  const blob = new Blob(chunks, { type: mime })
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioBlob.value = blob
  audioUrl.value = URL.createObjectURL(blob)
  audioRec.state = 'preview'
}

// Cancela durante a gravação (aborta) ou descarta a pré-escuta.
function cancelRecording() {
  if (audioRec.state === 'recording') {
    audioCancelled = true
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.stop()
    } else {
      stopAudioResources()
      audioRec.state = 'idle'
      audioRec.seconds = 0
    }
    return
  }
  discardAudio()
}

function discardAudio() {
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioUrl.value = ''
  audioBlob.value = null
  audioRec.state = 'idle'
  audioRec.seconds = 0
}

async function confirmSendAudio() {
  if (!audioBlob.value || !selectedConversation.value) return
  try {
    audioRec.sending = true
    const ext = audioMime.split(';')[0].split('/')[1] || 'webm'
    const file = new File([audioBlob.value], `audio-gravado.${ext}`, { type: audioBlob.value.type })
    await WhatsAppRepository.sendAudioMessage(selectedConversation.value.id, file, {
      quotedMessageId: replyingTo.value?.externalMessageId || undefined,
    })
    replyingTo.value = null
    discardAudio()
    await Promise.all([loadMessages(), loadConversations()])
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Não foi possível enviar o áudio.')
  } finally {
    audioRec.sending = false
  }
}

async function markRead() {
  if (!selectedConversation.value) return
  try {
    const updated = await WhatsAppRepository.markAsRead(selectedConversation.value.id)
    selectedConversation.value = { ...selectedConversation.value, ...updated }
    await loadConversations()
  } catch (error) {
    console.error(error)
  }
}

// Assume o atendimento (ESPERA -> ABERTA), registrando o atendente. Move a aba para "Abertas"
// para o atendente continuar o fluxo no contexto certo.
async function attend() {
  if (!selectedConversation.value) return
  try {
    attending.value = true
    const updated = await WhatsAppRepository.attendConversation(selectedConversation.value.id)
    selectedConversation.value = updated
    conversationForm.status = updated.status
    statusFilter.value = 'ABERTA'
    await loadConversations()
    toast.success('Atendimento assumido.')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Não foi possível assumir o atendimento.')
  } finally {
    attending.value = false
  }
}

async function updateConversation(
  payload: Partial<{ status: WhatsAppConversationStatus; setor: string | null; clienteId: number | null; atendenteId: number | null }>,
) {
  if (!selectedConversation.value) return
  try {
    const updated = await WhatsAppRepository.updateConversation(selectedConversation.value.id, payload)
    selectedConversation.value = updated
    conversationForm.status = updated.status
    conversationForm.setor = updated.setor || ''
    await loadConversations()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao atualizar conversa.')
  }
}

async function loadCustomers() {
  try {
    customerOptions.value = await ClienteRepository.select2(customerSearch.value)
  } catch (error) {
    console.error(error)
    customerOptions.value = []
  }
}

// --- Transferência de atendimento para outro usuário da conta ---
const transferOpen = ref(false)
const transferLoading = ref(false)
const transferSaving = ref(false)
const transferUserId = ref<number | null>(null)
const transferUsers = ref<Array<{ id: number; label: string }>>([])

async function openTransfer() {
  transferUserId.value = null
  transferOpen.value = true
  try {
    transferLoading.value = true
    transferUsers.value = await UsuarioRepository.select2()
  } catch (error) {
    console.error(error)
    toast.error('Não foi possível carregar os usuários para transferência.')
  } finally {
    transferLoading.value = false
  }
}

async function confirmTransfer() {
  if (!selectedConversation.value || !transferUserId.value) return
  const alvo = transferUsers.value.find((user) => user.id === transferUserId.value)
  try {
    transferSaving.value = true
    await updateConversation({ atendenteId: transferUserId.value })
    transferOpen.value = false
    toast.success(`Atendimento transferido${alvo ? ` para ${alvo.label}` : ''}.`)
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Não foi possível transferir o atendimento.')
  } finally {
    transferSaving.value = false
  }
}

async function linkCustomer(value: string) {
  const id = Number(value)
  if (!id) return
  await updateConversation({ clienteId: id })
  toast.success('Cliente vinculado à conversa.')
}

// Remove localmente uma conversa apagada (por esta aba ou por outra, via socket).
function dropConversation(conversaId: number) {
  conversations.value = conversations.value.filter((item) => item.id !== conversaId)
  if (selectedConversation.value?.id === conversaId) {
    selectedConversation.value = null
    messages.value = []
  }
}

async function deleteChat() {
  if (!selectedConversation.value || !isAdmin.value) return
  const confirmed = await useConfirm().confirm({
    title: 'Apagar conversa',
    message: 'Isso remove a conversa e todas as mensagens dela permanentemente. O contato é mantido. Deseja continuar?',
    confirmText: 'Sim, apagar',
    colorButton: 'danger',
  })
  if (!confirmed) return
  const conversaId = selectedConversation.value.id
  try {
    deleting.value = true
    await WhatsAppRepository.deleteConversation(conversaId)
    dropConversation(conversaId)
    toast.success('Conversa apagada.')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Não foi possível apagar a conversa.')
  } finally {
    deleting.value = false
  }
}

useSocketEvent<WhatsAppConversation>('whatsapp:conversa:updated', async (conversation) => {
  const index = conversations.value.findIndex((item) => item.id === conversation.id)
  if (index >= 0) {
    conversations.value[index] = { ...conversations.value[index], ...conversation }
  } else if (!activeInstanceId.value || conversation.instanciaId === activeInstanceId.value) {
    // Só recarrega quando a conversa pertence à caixa (instância) atualmente aberta.
    await loadConversations()
  }

  if (selectedConversation.value?.id === conversation.id) {
    selectedConversation.value = { ...selectedConversation.value, ...conversation }
  }
})

useSocketEvent<WhatsAppMessage>('whatsapp:mensagem:created', async (message) => {
  if (selectedConversation.value?.id !== message.conversaId) return
  const index = messages.value.findIndex((item) => item.id === message.id)
  if (index >= 0) messages.value[index] = message
  else messages.value.push(message)
  await scrollToBottom()
  void prefetchMedia([message])
})

useSocketEvent<{ id: number }>('whatsapp:conversa:deleted', (payload) => {
  if (payload?.id) dropConversation(payload.id)
})

useSocketEvent<WhatsAppInstance>('whatsapp:instancia:updated', async () => {
  await loadInstances()
  if (selectedConversation.value) await loadConversations()
})

onMounted(async () => {
  await loadConversations()
  await loadInstances()
  await startFromClienteQuery()
})
</script>

<template>
  <div class="m-[-1rem] flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden rounded-lg border bg-background md:m-0 md:h-[calc(100dvh-7rem)]">
    <div class="flex flex-1 overflow-hidden">
      <!-- Lista de conversas -->
      <aside
        class="flex w-full flex-col border-r bg-body/40 md:w-80 lg:w-96"
        :class="selectedConversation ? 'hidden md:flex' : 'flex'"
      >
        <div class="space-y-3 border-b p-3">
          <div class="flex items-center gap-2">
            <Headset class="h-5 w-5 text-primary" :stroke-width="2.5" />
            <h1 class="text-base font-semibold tracking-tight">Atendimento</h1>
            <Badge v-if="totalNaoLidas" class="ml-auto bg-green-600 text-white">{{ totalNaoLidas }}</Badge>
            <Button
              size="sm"
              class="text-white"
              :class="totalNaoLidas ? '' : 'ml-auto'"
              @click="openNewChat"
            >
              <MessageSquarePlus class="mr-1 h-4 w-4" />
              Nova
            </Button>
          </div>
          <!-- Caixas de atendimento (uma por instância) -->
          <div v-if="showInboxSwitcher" class="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
            <button
              type="button"
              class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs transition"
              :class="activeInstanceId === null ? 'border-primary bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'"
              @click="setActiveInstance(null)"
            >
              <Inbox class="h-3.5 w-3.5" />
              Todas
            </button>
            <button
              v-for="instance in instances"
              :key="instance.id"
              type="button"
              class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs transition"
              :class="activeInstanceId === instance.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'"
              :title="instance.nome"
              @click="setActiveInstance(instance.id)"
            >
              <span class="h-2 w-2 rounded-full" :class="instanceStatusDotClass(instance.status)"></span>
              <span class="max-w-[120px] truncate">{{ instance.nome }}</span>
            </button>
          </div>

          <div class="relative">
            <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="conversationSearch"
              class="pl-9"
              :placeholder="activeInstance ? `Buscar em ${activeInstance.nome}` : 'Buscar por nome, telefone ou cliente'"
              @keyup.enter="loadConversations"
            />
          </div>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <Button :variant="statusFilter === 'PENDENTE' ? 'default' : 'outline'" size="sm" @click="setStatusFilter('PENDENTE')">
              <Clock class="mr-1 h-3.5 w-3.5" />
              Espera
            </Button>
            <Button :variant="statusFilter === 'ABERTA' ? 'default' : 'outline'" size="sm" @click="setStatusFilter('ABERTA')">
              <MessageSquareDashed class="mr-1 h-3.5 w-3.5" />
              Abertas
            </Button>
            <Button :variant="statusFilter === 'FINALIZADA' ? 'default' : 'outline'" size="sm" @click="setStatusFilter('FINALIZADA')">
              <MessageSquareLock class="mr-1 h-3.5 w-3.5" />
              Finalizadas
            </Button>
          </div>
        </div>

        <ScrollArea class="flex-1">
          <button
            v-for="conversation in conversations"
            :key="conversation.id"
            type="button"
            class="flex w-full items-center gap-2.5 border-b px-3 py-2 text-left transition hover:bg-muted/60"
            :class="selectedConversation?.id === conversation.id ? 'bg-muted' : ''"
            @click="openConversation(conversation)"
          >
            <div class="relative h-9 w-9 shrink-0">
              <img
                v-if="conversationPhoto(conversation)"
                :src="conversationPhoto(conversation) as string"
                :alt="conversationLabel(conversation)"
                class="h-9 w-9 rounded-full object-cover"
                referrerpolicy="no-referrer"
                @error="handleImageError(conversation.Contato?.foto)"
              />
              <div
                v-else
                class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >
                {{ initials(conversationLabel(conversation)) }}
              </div>
              <span
                class="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background"
                :class="conversationStatusDotClass(conversation.status)"
                :title="conversation.status"
              ></span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <p class="truncate text-sm font-medium">{{ conversationLabel(conversation) }}</p>
                <span class="whitespace-nowrap text-[10px] text-muted-foreground">{{ formatTime(conversation.ultimaInteracaoEm) }}</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <p class="truncate text-xs text-muted-foreground">
                  <span v-if="activeInstanceId === null && showInboxSwitcher" class="text-primary/70">{{ conversation.Instancia?.nome }} · </span>
                  {{ conversation.ultimaMensagem || conversation.telefone }}
                </p>
                <Badge
                  v-if="conversation.naoLidas"
                  class="h-4 min-w-[16px] shrink-0 justify-center rounded-full bg-green-600 px-1 text-[10px] text-white"
                >
                  {{ conversation.naoLidas }}
                </Badge>
              </div>
            </div>
          </button>

          <div v-if="loading && !conversations.length" class="flex items-center justify-center p-8 text-sm text-muted-foreground">
            <LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Carregando conversas...
          </div>
          <div v-else-if="!conversations.length" class="p-8 text-center text-sm text-muted-foreground">
            Nenhuma conversa encontrada.
          </div>
        </ScrollArea>
      </aside>

      <!-- Painel da conversa -->
      <section v-if="selectedConversation" class="flex min-w-0 flex-1 flex-col">
        <header class="flex items-center gap-3 border-b p-3">
          <Button variant="ghost" size="icon" class="md:hidden" @click="selectedConversation = null">
            <ArrowLeft class="h-5 w-5" />
          </Button>
          <img
            v-if="conversationPhoto(selectedConversation)"
            :src="conversationPhoto(selectedConversation) as string"
            :alt="conversationLabel(selectedConversation)"
            class="h-10 w-10 shrink-0 rounded-full object-cover"
            referrerpolicy="no-referrer"
            @error="handleImageError(selectedConversation.Contato?.foto)"
          />
          <div
            v-else
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary"
          >
            {{ initials(conversationLabel(selectedConversation)) }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h2 class="truncate text-sm font-semibold">{{ conversationLabel(selectedConversation) }}</h2>
              <span class="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium" :class="statusPillClass(selectedConversation.status)">
                {{ statusLabel(selectedConversation.status) }}
              </span>
            </div>
            <p class="truncate text-xs text-muted-foreground">
              {{ selectedConversation.telefone }} · {{ selectedConversation.Instancia?.nome || 'Instância' }}
              <template v-if="selectedConversation.Atendente"> · Atendente: {{ selectedConversation.Atendente.nome }}</template>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Button
              v-if="selectedConversation.status === 'PENDENTE'"
              size="sm"
              class="text-white"
              :disabled="attending"
              @click="attend"
            >
              <LoaderCircle v-if="attending" class="mr-1 h-4 w-4 animate-spin" />
              <Headset v-else class="mr-1 h-4 w-4" />
              Atender
            </Button>
            <Button
              v-if="selectedConversation.status === 'ABERTA'"
              variant="outline"
              size="sm"
              title="Transferir atendimento para outro usuário"
              @click="openTransfer"
            >
              <ArrowRightLeft class="mr-1 h-4 w-4" />
              <span class="hidden sm:inline">Transferir</span>
            </Button>
            <Button
              v-if="selectedConversation.status === 'ABERTA'"
              variant="outline"
              size="sm"
              @click="updateConversation({ status: 'FINALIZADA' })"
            >
              Finalizar
            </Button>
            <Button
              v-else-if="selectedConversation.status === 'FINALIZADA'"
              variant="outline"
              size="sm"
              @click="updateConversation({ status: 'ABERTA' })"
            >
              Reabrir
            </Button>
            <Button
              v-if="isAdmin"
              variant="ghost"
              size="icon"
              class="text-destructive hover:text-destructive"
              title="Apagar conversa"
              :disabled="deleting"
              @click="deleteChat"
            >
              <LoaderCircle v-if="deleting" class="h-4 w-4 animate-spin" />
              <Trash2 v-else class="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" @click="showDetails = !showDetails">
              <ChevronDown class="h-4 w-4 transition" :class="showDetails ? 'rotate-180' : ''" />
            </Button>
          </div>
        </header>

        <!-- Detalhes / vínculo -->
        <div v-if="showDetails" class="grid gap-4 border-b bg-muted/20 p-4 md:grid-cols-3">
          <div class="space-y-1">
            <Label>Cliente ERP</Label>
            <div class="flex gap-2">
              <Input v-model="customerSearch" placeholder="Buscar cliente" @keyup.enter="loadCustomers" />
              <Button variant="outline" size="icon" @click="loadCustomers"><Search class="h-4 w-4" /></Button>
            </div>
            <select
              v-if="customerOptions.length"
              class="h-9 w-full rounded-md border bg-background px-3 text-sm"
              @change="linkCustomer(($event.target as HTMLSelectElement).value)"
            >
              <option value="">Selecionar cliente...</option>
              <option v-for="customer in customerOptions" :key="customer.id" :value="customer.id">{{ customer.label }}</option>
            </select>
            <p v-if="selectedConversation.Cliente" class="flex items-center gap-1 text-xs text-green-600">
              <UserPlus class="h-3.5 w-3.5" /> Vinculado: {{ selectedConversation.Cliente.nome }}
            </p>
          </div>
          <div class="space-y-1">
            <Label>Setor/Fila</Label>
            <Input
              v-model="conversationForm.setor"
              placeholder="Ex.: Suporte"
              @change="updateConversation({ setor: conversationForm.setor || null })"
            />
          </div>
          <div class="space-y-1">
            <Label>Status</Label>
            <select
              v-model="conversationForm.status"
              class="h-9 w-full rounded-md border bg-background px-3 text-sm"
              @change="updateConversation({ status: conversationForm.status })"
            >
              <option value="PENDENTE">Em espera</option>
              <option value="ABERTA">Em atendimento</option>
              <option value="FINALIZADA">Finalizada</option>
            </select>
          </div>
        </div>

        <!-- Thread -->
        <ScrollArea ref="messagesScroll" class="flex-1 bg-muted/20 p-4">
          <div class="mx-auto max-w-3xl space-y-3">
            <div
              v-for="message in messages"
              :key="message.id"
              class="group flex items-center gap-1"
              :class="message.direcao === 'SAIDA' ? 'justify-end' : 'justify-start'"
            >
              <!-- Botão de responder: aparece ao passar o mouse; do lado interno do balão. -->
              <button
                type="button"
                class="shrink-0 rounded-full p-1.5 text-muted-foreground opacity-0 transition hover:bg-muted focus:opacity-100 group-hover:opacity-100"
                :class="message.direcao === 'SAIDA' ? '' : 'order-last'"
                title="Responder"
                @click="startReply(message)"
              >
                <Reply class="h-4 w-4" />
              </button>
              <div
                class="flex max-w-[78%] flex-col"
                :class="message.direcao === 'SAIDA' ? 'items-end' : 'items-start'"
              >
              <div
                class="rounded-2xl px-4 py-2 shadow-sm"
                :class="message.direcao === 'SAIDA' ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm border bg-background'"
              >
                <!-- Trecho citado (quando a mensagem é uma resposta a outra). -->
                <div
                  v-if="quotedPreview(message)"
                  class="mb-1.5 rounded-md border-l-2 px-2 py-1 text-xs"
                  :class="message.direcao === 'SAIDA' ? 'border-white/60 bg-white/15' : 'border-primary bg-muted'"
                >
                  <p v-if="quotedPreview(message)?.autor" class="font-medium opacity-90">{{ quotedPreview(message)?.autor }}</p>
                  <p class="line-clamp-2 opacity-80">{{ quotedPreview(message)?.texto }}</p>
                </div>
                <template v-if="message.mediaUrl">
                  <!-- Áudio (nota de voz): reprodutor com waveform. -->
                  <AudioMessagePlayer
                    v-if="isAudioMessage(message) && audioSrc(message)"
                    class="mb-1"
                    :src="audioSrc(message) as string"
                    :mine="message.direcao === 'SAIDA'"
                  />
                  <!-- Áudio recebido ainda sendo baixado/descriptografado. -->
                  <div
                    v-else-if="isAudioLoading(message)"
                    class="mb-2 flex h-9 w-52 items-center justify-center rounded-full border bg-black/5 text-xs text-muted-foreground"
                  >
                    <LoaderCircle class="mr-1.5 h-4 w-4 animate-spin" /> Carregando áudio...
                  </div>
                  <!-- Imagem/figurinha: preview clicável (abre em tela cheia). Figurinhas
                       menores; imagens com largura limitada para não quebrar o layout. -->
                  <img
                    v-else-if="imageSrc(message)"
                    :src="imageSrc(message) as string"
                    :alt="mediaLabel(message)"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                    class="mb-2 cursor-zoom-in rounded-lg"
                    :class="isSticker(message) ? 'h-28 w-28 object-contain' : 'max-h-72 w-auto max-w-full object-cover'"
                    @click="openImagePreview(message)"
                    @error="handleImageError(String(message.id))"
                  />
                  <!-- Imagem recebida ainda sendo baixada/descriptografada. -->
                  <div
                    v-else-if="isImageLoading(message)"
                    class="mb-2 flex h-28 w-40 items-center justify-center rounded-lg border bg-black/5 text-xs text-muted-foreground"
                  >
                    <LoaderCircle class="mr-1.5 h-4 w-4 animate-spin" /> Carregando imagem...
                  </div>
                  <!-- Demais mídias (ou imagem que falhou ao carregar): link para abrir. -->
                  <div v-else class="mb-2 rounded-lg border bg-black/5 p-2 text-xs">
                    <a :href="message.mediaUrl" target="_blank" rel="noreferrer" class="underline">{{ mediaLabel(message) }}</a>
                  </div>
                </template>
                <p v-if="message.conteudo || !message.mediaUrl" class="whitespace-pre-wrap text-sm" :class="{ 'italic opacity-70': message.apagadaEm }">{{ message.conteudo || mediaLabel(message) }}</p>
                <div class="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                  <span
                    v-if="message.apagadaEm"
                    class="inline-flex items-center gap-1 rounded-full bg-black/10 px-1.5 py-0.5 font-medium dark:bg-white/15"
                  >
                    <Ban class="h-2.5 w-2.5" /> apagada
                  </span>
                  <span>{{ formatTime(message.createdAt) }}</span>
                  <span v-if="message.direcao === 'SAIDA'">· {{ message.statusEnvio }}</span>
                </div>
              </div>
              <!-- Reações: selo abaixo do balão, sobrepondo levemente a borda (estilo WhatsApp). -->
              <div
                v-if="messageReactions(message).length"
                class="-mt-2 z-10 flex items-center gap-1 rounded-full border bg-background px-1.5 py-0.5 text-xs leading-none shadow-sm"
              >
                <span v-for="reaction in messageReactions(message)" :key="reaction.emoji" class="flex items-center gap-0.5">
                  <span>{{ reaction.emoji }}</span>
                  <span v-if="reaction.count > 1" class="text-[10px] text-muted-foreground">{{ reaction.count }}</span>
                </span>
              </div>
              </div>
            </div>

            <div v-if="!messages.length" class="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground">
              <MessageSquareText class="mb-2 h-8 w-8" />
              Nenhuma mensagem nesta conversa ainda.
            </div>
          </div>
        </ScrollArea>

        <!-- Em espera: precisa assumir o atendimento antes de responder -->
        <div v-if="selectedConversation.status === 'PENDENTE'" class="flex items-center justify-between gap-3 border-t bg-amber-500/10 p-3">
          <p class="text-xs text-amber-700 dark:text-amber-400">
            Conversa em espera. Assuma o atendimento para responder e registrar quem está atendendo.
          </p>
          <Button size="sm" class="shrink-0 text-white" :disabled="attending" @click="attend">
            <LoaderCircle v-if="attending" class="mr-1 h-4 w-4 animate-spin" />
            <Headset v-else class="mr-1 h-4 w-4" />
            Atender
          </Button>
        </div>

        <!-- Finalizada: precisa reabrir para responder -->
        <div v-else-if="selectedConversation.status === 'FINALIZADA'" class="flex items-center justify-between gap-3 border-t bg-muted/40 p-3">
          <p class="text-xs text-muted-foreground">Atendimento finalizado. Reabra para voltar a responder.</p>
          <Button variant="outline" size="sm" class="shrink-0" @click="updateConversation({ status: 'ABERTA' })">Reabrir</Button>
        </div>

        <!-- Composer (apenas em atendimento) -->
        <form v-else class="border-t bg-background p-3" @submit.prevent="sendText">
          <!-- Prévia da mensagem sendo respondida (citada). -->
          <div v-if="replyingTo" class="mb-2 flex items-start gap-2 rounded-md border-l-2 border-primary bg-muted/60 px-3 py-2">
            <div class="min-w-0 flex-1">
              <p class="flex items-center gap-1 text-xs font-medium text-primary">
                <Reply class="h-3.5 w-3.5" />
                Respondendo {{ replyingTo.direcao === 'SAIDA' ? 'você mesmo' : (selectedConversation.Contato?.nome || 'contato') }}
              </p>
              <p class="line-clamp-2 text-xs text-muted-foreground">{{ messageSnippet(replyingTo) }}</p>
            </div>
            <button type="button" class="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted" title="Cancelar resposta" @click="cancelReply">
              <X class="h-4 w-4" />
            </button>
          </div>
          <!-- Inputs de arquivo ocultos (galeria e câmera). -->
          <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="onImageSelected" />
          <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onImageSelected" />

          <!-- Gravando áudio -->
          <div v-if="audioRec.state === 'recording'" class="flex items-center gap-3">
            <Button type="button" variant="ghost" size="icon" class="h-10 w-10 shrink-0 rounded-full text-destructive" title="Cancelar" @click="cancelRecording">
              <Trash2 class="h-5 w-5" />
            </Button>
            <div class="flex flex-1 items-center gap-2 text-sm">
              <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500"></span>
              <span class="text-muted-foreground">Gravando</span>
              <span class="font-mono tabular-nums">{{ formatSeconds(audioRec.seconds) }}</span>
            </div>
            <Button type="button" size="icon" class="h-10 w-10 shrink-0 rounded-full text-white" title="Parar gravação" @click="stopRecording">
              <Square class="h-4 w-4" />
            </Button>
          </div>

          <!-- Pré-escuta do áudio gravado -->
          <div v-else-if="audioRec.state === 'preview'" class="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" class="h-10 w-10 shrink-0 rounded-full text-destructive" title="Descartar" :disabled="audioRec.sending" @click="discardAudio">
              <Trash2 class="h-5 w-5" />
            </Button>
            <audio :src="audioUrl" controls class="h-10 flex-1"></audio>
            <Button type="button" size="icon" class="h-10 w-10 shrink-0 rounded-full text-white" title="Enviar áudio" :disabled="audioRec.sending" @click="confirmSendAudio">
              <LoaderCircle v-if="audioRec.sending" class="h-4 w-4 animate-spin" />
              <Send v-else class="h-4 w-4" />
            </Button>
          </div>

          <!-- Barra normal -->
          <div v-else class="flex items-end gap-2">
            <!-- Menu de anexos (+) -->
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="h-10 w-10 shrink-0 rounded-full text-muted-foreground"
                  title="Anexar"
                >
                  <Plus class="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" class="w-52">
                <DropdownMenuItem @click="pickImage">
                  <ImagePlus class="mr-2 h-4 w-4 text-violet-500" /> Fotos
                </DropdownMenuItem>
                <DropdownMenuItem @click="pickCamera">
                  <Camera class="mr-2 h-4 w-4 text-rose-500" /> Câmera
                </DropdownMenuItem>
                <DropdownMenuItem @click="openMediaLink">
                  <Link class="mr-2 h-4 w-4 text-sky-500" /> Mídia por link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem :disabled="!hasLinkedClient" @click="openSaleTool">
                  <Receipt class="mr-2 h-4 w-4 text-emerald-500" /> Venda
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <!-- Campo de texto -->
            <Textarea
              v-model="messageForm.conteudo"
              class="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl px-4 py-2.5"
              placeholder="Digite uma mensagem"
              rows="1"
              @keydown.enter.exact.prevent="sendText"
            />

            <!-- Enviar (com texto) ou Gravar áudio (sem texto) -->
            <Button
              v-if="messageForm.conteudo.trim()"
              type="submit"
              size="icon"
              class="h-10 w-10 shrink-0 rounded-full text-white"
              :disabled="sending || !canSendMessage"
              title="Enviar"
            >
              <LoaderCircle v-if="sending" class="h-4 w-4 animate-spin" />
              <Send v-else class="h-4 w-4" />
            </Button>
            <Button
              v-else
              type="button"
              size="icon"
              class="h-10 w-10 shrink-0 rounded-full text-white"
              :disabled="selectedConversation.Instancia?.status !== 'CONECTADA'"
              title="Gravar áudio"
              @click="startRecording"
            >
              <Mic class="h-5 w-5" />
            </Button>
          </div>
          <p v-if="selectedConversation.Instancia?.status !== 'CONECTADA'" class="mt-2 text-xs text-amber-600">
            A instância está {{ selectedConversation.Instancia?.status?.toLowerCase() }}; o envio fica bloqueado até reconectar.
          </p>
        </form>
      </section>

      <!-- Estado vazio -->
      <section v-else class="hidden flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground md:flex">
        <Inbox class="mb-3 h-10 w-10" />
        <p>Selecione uma conversa ou inicie um novo atendimento.</p>
        <Button class="mt-4 text-white" @click="openNewChat">
          <MessageSquarePlus class="mr-2 h-4 w-4" />
          Nova conversa
        </Button>
      </section>
    </div>

    <!-- Ferramenta: enviar dados de venda do cliente -->
    <Dialog v-model:open="saleTool.open">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar dados de venda</DialogTitle>
          <DialogDescription>
            Selecione uma venda de <strong>{{ selectedConversation?.Cliente?.nome || 'cliente' }}</strong> para enviar o resumo no chat.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-3">
          <div class="flex gap-2">
            <Input v-model="saleTool.search" placeholder="Buscar por código (ex.: VEN_001)" @keyup.enter="loadSaleToolItems" />
            <Button variant="outline" size="icon" :disabled="saleTool.loading" @click="loadSaleToolItems">
              <LoaderCircle v-if="saleTool.loading" class="h-4 w-4 animate-spin" />
              <Search v-else class="h-4 w-4" />
            </Button>
          </div>

          <div class="max-h-[50vh] space-y-2 overflow-y-auto">
            <div
              v-for="venda in saleTool.items"
              :key="venda.id"
              class="flex items-center justify-between gap-3 rounded-md border p-3"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <p class="truncate text-sm font-semibold">{{ venda.uid }}</p>
                  <span class="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{{ saleStatusLabel(venda.status) }}</span>
                </div>
                <p class="text-xs text-muted-foreground">
                  {{ formatTime(venda.data) }} · {{ formatMoney(venda.total) }}
                </p>
              </div>
              <Button size="sm" class="shrink-0 text-white" :disabled="saleTool.sendingId !== null" @click="sendSale(venda.id)">
                <LoaderCircle v-if="saleTool.sendingId === venda.id" class="mr-1 h-4 w-4 animate-spin" />
                <Send v-else class="mr-1 h-4 w-4" />
                Enviar
              </Button>
            </div>

            <div v-if="saleTool.loading && !saleTool.items.length" class="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Carregando vendas...
            </div>
            <div v-else-if="!saleTool.items.length" class="py-8 text-center text-sm text-muted-foreground">
              Nenhuma venda encontrada para este cliente.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="saleTool.open = false">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Pré-visualização da imagem antes de enviar (com legenda opcional) -->
    <Dialog v-model:open="imageDraft.open" @update:open="(v) => { if (!v) closeImageDraft() }">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar imagem</DialogTitle>
          <DialogDescription>Confira a imagem e adicione uma legenda opcional antes de enviar.</DialogDescription>
        </DialogHeader>

        <div class="space-y-3">
          <div class="flex max-h-[50vh] items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
            <img v-if="imageDraft.previewUrl" :src="imageDraft.previewUrl" alt="Pré-visualização" class="max-h-[50vh] w-auto object-contain" />
          </div>
          <Input
            v-model="imageDraft.caption"
            placeholder="Legenda (opcional)"
            :disabled="sendingImage"
            @keyup.enter="confirmSendImage"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" :disabled="sendingImage" @click="closeImageDraft">Cancelar</Button>
          <Button class="text-white" :disabled="sendingImage" @click="confirmSendImage">
            <LoaderCircle v-if="sendingImage" class="mr-2 h-4 w-4 animate-spin" />
            <Send v-else class="mr-2 h-4 w-4" />
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Enviar áudio/vídeo/documento por URL pública -->
    <Dialog v-model:open="mediaLink.open">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar mídia por link</DialogTitle>
          <DialogDescription>Informe a URL pública de um áudio, vídeo ou documento.</DialogDescription>
        </DialogHeader>

        <div class="space-y-3">
          <div class="space-y-1">
            <Label class="text-xs">Tipo</Label>
            <select v-model="mediaLink.tipo" class="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="document">Documento</option>
              <option value="audio">Áudio</option>
              <option value="video">Vídeo</option>
            </select>
          </div>
          <div class="space-y-1">
            <Label class="text-xs">URL pública</Label>
            <Input v-model="mediaLink.url" placeholder="https://..." :disabled="mediaLink.sending" />
          </div>
          <div class="space-y-1">
            <Label class="text-xs">Legenda (opcional)</Label>
            <Input v-model="mediaLink.caption" :disabled="mediaLink.sending" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" :disabled="mediaLink.sending" @click="mediaLink.open = false">Cancelar</Button>
          <Button class="text-white" :disabled="mediaLink.sending || !mediaLink.url.trim()" @click="sendMediaLink">
            <LoaderCircle v-if="mediaLink.sending" class="mr-2 h-4 w-4 animate-spin" />
            <Send v-else class="mr-2 h-4 w-4" />
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Nova conversa: a partir de um cliente do ERP ou de um contato do WhatsApp -->
    <Dialog v-model:open="newChat.open">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova conversa</DialogTitle>
          <DialogDescription>Inicie um atendimento a partir de um cliente cadastrado ou de um contato do WhatsApp.</DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              class="rounded-md px-3 py-1.5 text-sm font-medium transition"
              :class="newChat.mode === 'cliente' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'"
              @click="setNewChatMode('cliente')"
            >
              Cliente
            </button>
            <button
              type="button"
              class="rounded-md px-3 py-1.5 text-sm font-medium transition"
              :class="newChat.mode === 'contato' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'"
              @click="setNewChatMode('contato')"
            >
              Contato
            </button>
          </div>

          <div class="space-y-1">
            <Label>{{ newChat.mode === 'contato' ? 'Contato' : 'Cliente' }}</Label>
            <Select2Ajax
              v-if="newChat.mode === 'contato'"
              v-model="newChat.contatoId"
              url="/whatsapp/contatos/select2"
              placeholder="Selecionar contato..."
            />
            <Select2Ajax
              v-else
              v-model="newChat.clienteId"
              url="/clientes/select2"
              placeholder="Selecionar cliente..."
            />
          </div>

          <div v-if="instances.length > 1" class="space-y-1">
            <Label>Instância</Label>
            <select
              v-model.number="newChat.instanciaId"
              class="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option :value="null">Automática (instância conectada)</option>
              <option v-for="instance in instances" :key="instance.id" :value="instance.id">
                {{ instance.nome }} · {{ instance.status }}
              </option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="newChat.open = false">Cancelar</Button>
          <Button
            class="text-white"
            :disabled="newChat.starting || (newChat.mode === 'contato' ? !newChat.contatoId : !newChat.clienteId)"
            @click="confirmNewChat"
          >
            <LoaderCircle v-if="newChat.starting" class="mr-2 h-4 w-4 animate-spin" />
            <MessageSquarePlus v-else class="mr-2 h-4 w-4" />
            Iniciar conversa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Transferir atendimento para outro usuário da conta -->
    <Dialog v-model:open="transferOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir atendimento</DialogTitle>
          <DialogDescription>Escolha o usuário que passará a ser responsável por esta conversa.</DialogDescription>
        </DialogHeader>

        <div class="space-y-2">
          <Label>Usuário responsável</Label>
          <div v-if="transferLoading" class="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle class="h-4 w-4 animate-spin" /> Carregando usuários...
          </div>
          <select
            v-else
            v-model.number="transferUserId"
            class="h-9 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option :value="null">Selecionar usuário...</option>
            <option v-for="user in transferUsers" :key="user.id" :value="user.id">{{ user.label }}</option>
          </select>
          <p v-if="selectedConversation?.Atendente" class="text-xs text-muted-foreground">
            Atendente atual: {{ selectedConversation.Atendente.nome }}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="transferOpen = false">Cancelar</Button>
          <Button class="text-white" :disabled="transferSaving || !transferUserId" @click="confirmTransfer">
            <LoaderCircle v-if="transferSaving" class="mr-2 h-4 w-4 animate-spin" />
            <ArrowRightLeft v-else class="mr-2 h-4 w-4" />
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Lightbox: imagem/figurinha ampliada. Clique em qualquer lugar fecha. -->
    <div
      v-if="imagePreview"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      @click="imagePreview = null"
    >
      <button
        type="button"
        class="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
        aria-label="Fechar"
        @click.stop="imagePreview = null"
      >
        <X class="h-5 w-5" />
      </button>
      <img
        :src="imagePreview"
        alt="Pré-visualização"
        referrerpolicy="no-referrer"
        class="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
        @click.stop
      />
    </div>
  </div>
</template>
