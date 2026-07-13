<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
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
  ArrowLeft,
  Blocks,
  CheckCheck,
  ChevronDown,
  Headset,
  Inbox,
  LoaderCircle,
  MessageSquarePlus,
  MessageSquareText,
  Receipt,
  Search,
  Send,
  UserPlus,
} from 'lucide-vue-next'
import { useSocketEvent } from '@/composables/useSocketEvent'
import { ClienteRepository } from '@/repositories/cliente-repository'
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

const loading = ref(false)
const sending = ref(false)
const attending = ref(false)
const showDetails = ref(false)

const instances = ref<WhatsAppInstance[]>([])
// Caixa de atendimento ativa: null = todas as instâncias; caso contrário, filtra por instância.
const activeInstanceId = ref<number | null>(null)
const newChat = reactive<{
  open: boolean
  search: string
  options: Array<{ id: number; label: string }>
  clienteId: number | null
  instanciaId: number | null
  loading: boolean
  starting: boolean
}>({ open: false, search: '', options: [], clienteId: null, instanciaId: null, loading: false, starting: false })

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
const messageForm = reactive<{ tipo: 'text' | 'image' | 'audio' | 'video' | 'document'; conteudo: string; mediaUrl: string }>({
  tipo: 'text',
  conteudo: '',
  mediaUrl: '',
})

// Ações rápidas (ferramentas) do chat: abre por "/" ou pelo botão de Blocks.
const toolsOpen = ref(false)
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
  if (messageForm.tipo === 'text') return Boolean(messageForm.conteudo.trim())
  return Boolean(messageForm.mediaUrl.trim())
})

const totalNaoLidas = computed(() => conversations.value.reduce((total, item) => total + (item.naoLidas || 0), 0))
const hasLinkedClient = computed(() => Boolean(selectedConversation.value?.clienteId || selectedConversation.value?.Cliente))

// Abre as ferramentas ao digitar "/" no início da mensagem (comando de barra).
watch(
  () => messageForm.conteudo,
  (value) => {
    if (value === '/') {
      messageForm.conteudo = ''
      toolsOpen.value = true
    }
  },
)

function toggleTools() {
  toolsOpen.value = !toolsOpen.value
}

function openSaleTool() {
  toolsOpen.value = false
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

// Fotos de perfil do WhatsApp (pps.whatsapp.net) expiram e passam a retornar erro; quando
// isso acontece caímos de volta nas iniciais em vez de mostrar uma imagem quebrada.
const brokenPhotos = ref<Set<string>>(new Set())

function conversationPhoto(conversation: WhatsAppConversation) {
  const foto = conversation.Contato?.foto
  if (!foto || brokenPhotos.value.has(foto)) return null
  return foto
}

function handlePhotoError(foto?: string | null) {
  if (!foto) return
  const next = new Set(brokenPhotos.value)
  next.add(foto)
  brokenPhotos.value = next
}

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
  newChat.search = ''
  newChat.options = []
  newChat.clienteId = null
  // Já inicia na caixa (instância) ativa quando houver uma selecionada.
  newChat.instanciaId = activeInstanceId.value
  if (!instances.value.length) loadInstances()
}

async function searchNewChatClients() {
  try {
    newChat.loading = true
    newChat.options = await ClienteRepository.select2(newChat.search)
  } catch (error) {
    console.error(error)
    newChat.options = []
  } finally {
    newChat.loading = false
  }
}

async function startConversation(clienteId: number, instanciaId?: number | null) {
  const conversation = await WhatsAppRepository.startConversation({
    clienteId,
    instanciaId: instanciaId || undefined,
  })
  upsertConversation(conversation)
  await openConversation(conversation)
  return conversation
}

async function confirmNewChat() {
  if (!newChat.clienteId) {
    toast.warning('Selecione um cliente para iniciar a conversa.')
    return
  }
  try {
    newChat.starting = true
    await startConversation(newChat.clienteId, newChat.instanciaId)
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
    await startConversation(clienteId)
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
  toolsOpen.value = false
  await loadMessages()
  if (conversation.naoLidas) await markRead()
}

async function loadMessages() {
  if (!selectedConversation.value) return
  const response = await WhatsAppRepository.listMessages(selectedConversation.value.id, { take: 80 })
  messages.value = response.items
  await scrollToBottom()
}

async function sendText() {
  if (!selectedConversation.value || !canSendMessage.value) return
  try {
    sending.value = true
    await WhatsAppRepository.sendMessage(selectedConversation.value.id, {
      tipo: messageForm.tipo,
      conteudo: messageForm.conteudo || undefined,
      caption: messageForm.tipo !== 'text' ? messageForm.conteudo || undefined : undefined,
      mediaUrl: messageForm.tipo !== 'text' ? messageForm.mediaUrl : undefined,
    })
    Object.assign(messageForm, { conteudo: '', mediaUrl: '' })
    await Promise.all([loadMessages(), loadConversations()])
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao enviar mensagem.')
  } finally {
    sending.value = false
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
  payload: Partial<{ status: WhatsAppConversationStatus; setor: string | null; clienteId: number | null }>,
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

async function linkCustomer(value: string) {
  const id = Number(value)
  if (!id) return
  await updateConversation({ clienteId: id })
  toast.success('Cliente vinculado à conversa.')
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
            <Button :variant="statusFilter === 'PENDENTE' ? 'default' : 'outline'" size="sm" @click="setStatusFilter('PENDENTE')">Espera</Button>
            <Button :variant="statusFilter === 'ABERTA' ? 'default' : 'outline'" size="sm" @click="setStatusFilter('ABERTA')">Abertas</Button>
            <Button :variant="statusFilter === 'FINALIZADA' ? 'default' : 'outline'" size="sm" @click="setStatusFilter('FINALIZADA')">Finalizadas</Button>
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
                @error="handlePhotoError(conversation.Contato?.foto)"
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
            @error="handlePhotoError(selectedConversation.Contato?.foto)"
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
            <Button variant="outline" size="sm" @click="markRead">
              <CheckCheck class="mr-1 h-4 w-4" />
              <span class="hidden sm:inline">Marcar lida</span>
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
              class="flex"
              :class="message.direcao === 'SAIDA' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[78%] rounded-2xl px-4 py-2 shadow-sm"
                :class="message.direcao === 'SAIDA' ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm border bg-background'"
              >
                <div v-if="message.mediaUrl" class="mb-2 rounded-lg border bg-black/5 p-2 text-xs">
                  <a :href="message.mediaUrl" target="_blank" rel="noreferrer" class="underline">{{ mediaLabel(message) }}</a>
                </div>
                <p class="whitespace-pre-wrap text-sm">{{ message.conteudo || mediaLabel(message) }}</p>
                <div class="mt-1 flex justify-end gap-1 text-[10px] opacity-70">
                  <span>{{ formatTime(message.createdAt) }}</span>
                  <span v-if="message.direcao === 'SAIDA'">· {{ message.statusEnvio }}</span>
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
          <div class="mb-2 flex items-center gap-2">
            <!-- Ações rápidas / ferramentas -->
            <div class="relative">
              <div v-if="toolsOpen" class="fixed inset-0 z-10" @click="toolsOpen = false"></div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                class="shrink-0"
                :class="toolsOpen ? 'border-primary text-primary' : ''"
                title="Ferramentas (ou digite /)"
                @click="toggleTools"
              >
                <Blocks class="h-4 w-4" />
              </Button>
              <div
                v-if="toolsOpen"
                class="absolute bottom-full left-0 z-20 mb-2 w-72 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
              >
                <p class="border-b px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Enviar dados do sistema</p>
                <button
                  type="button"
                  class="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="!hasLinkedClient"
                  @click="openSaleTool"
                >
                  <Receipt class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span class="block font-medium">Venda</span>
                    <span class="block text-[11px] text-muted-foreground">Envie o resumo de uma venda do cliente</span>
                  </span>
                </button>
                <p v-if="!hasLinkedClient" class="border-t bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
                  Vincule um cliente do sistema à conversa para usar as ferramentas.
                </p>
              </div>
            </div>

            <select v-model="messageForm.tipo" class="h-9 w-40 rounded-md border bg-background px-3 text-sm">
              <option value="text">Texto</option>
              <option value="image">Imagem</option>
              <option value="audio">Áudio</option>
              <option value="video">Vídeo</option>
              <option value="document">Documento</option>
            </select>
            <Input v-if="messageForm.tipo !== 'text'" v-model="messageForm.mediaUrl" class="flex-1" placeholder="URL pública da mídia" />
          </div>
          <div class="flex items-end gap-2">
            <Textarea
              v-model="messageForm.conteudo"
              class="min-h-[48px]"
              :placeholder="messageForm.tipo === 'text' ? 'Digite a resposta ou / para ferramentas...' : 'Legenda opcional...'"
              @keydown.enter.exact.prevent="sendText"
            />
            <Button type="submit" class="text-white" :disabled="sending || !canSendMessage">
              <LoaderCircle v-if="sending" class="mr-2 h-4 w-4 animate-spin" />
              <Send v-else class="mr-2 h-4 w-4" />
              Enviar
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

    <!-- Nova conversa a partir de um cliente -->
    <Dialog v-model:open="newChat.open">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova conversa</DialogTitle>
          <DialogDescription>Inicie um atendimento a partir de um cliente cadastrado.</DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div class="space-y-1">
            <Label>Cliente</Label>
            <div class="flex gap-2">
              <Input
                v-model="newChat.search"
                placeholder="Buscar cliente por nome"
                @keyup.enter="searchNewChatClients"
              />
              <Button variant="outline" size="icon" :disabled="newChat.loading" @click="searchNewChatClients">
                <LoaderCircle v-if="newChat.loading" class="h-4 w-4 animate-spin" />
                <Search v-else class="h-4 w-4" />
              </Button>
            </div>
            <select
              v-model.number="newChat.clienteId"
              class="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option :value="null">Selecionar cliente...</option>
              <option v-for="cliente in newChat.options" :key="cliente.id" :value="cliente.id">{{ cliente.label }}</option>
            </select>
            <p v-if="!newChat.options.length" class="text-xs text-muted-foreground">
              Busque um cliente pelo nome para listar as opções.
            </p>
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
          <Button class="text-white" :disabled="newChat.starting || !newChat.clienteId" @click="confirmNewChat">
            <LoaderCircle v-if="newChat.starting" class="mr-2 h-4 w-4 animate-spin" />
            <MessageSquarePlus v-else class="mr-2 h-4 w-4" />
            Iniciar conversa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
