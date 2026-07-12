<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  CheckCheck,
  ChevronDown,
  Headset,
  Inbox,
  LoaderCircle,
  MessageSquareText,
  Search,
  Send,
  UserPlus,
} from 'lucide-vue-next'
import { useSocketEvent } from '@/composables/useSocketEvent'
import { ClienteRepository } from '@/repositories/cliente-repository'
import {
  WhatsAppRepository,
  type WhatsAppConversation,
  type WhatsAppConversationStatus,
  type WhatsAppInstance,
  type WhatsAppMessage,
} from '@/repositories/whatsapp-repository'

const toast = useToast()

const loading = ref(false)
const sending = ref(false)
const showDetails = ref(false)

const conversations = ref<WhatsAppConversation[]>([])
const messages = ref<WhatsAppMessage[]>([])
const selectedConversation = ref<WhatsAppConversation | null>(null)
const conversationSearch = ref('')
const statusFilter = ref<WhatsAppConversationStatus | undefined>(undefined)
const customerSearch = ref('')
const customerOptions = ref<Array<{ id: number; label: string }>>([])

const messagesScroll = ref<any>(null)

const conversationForm = reactive<{ status: WhatsAppConversationStatus; setor: string }>({ status: 'ABERTA', setor: '' })
const messageForm = reactive<{ tipo: 'text' | 'image' | 'audio' | 'video' | 'document'; conteudo: string; mediaUrl: string }>({
  tipo: 'text',
  conteudo: '',
  mediaUrl: '',
})

const canSendMessage = computed(() => {
  if (!selectedConversation.value) return false
  if (selectedConversation.value.Instancia?.status !== 'CONECTADA') return false
  if (messageForm.tipo === 'text') return Boolean(messageForm.conteudo.trim())
  return Boolean(messageForm.mediaUrl.trim())
})

const totalNaoLidas = computed(() => conversations.value.reduce((total, item) => total + (item.naoLidas || 0), 0))

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

function statusBadgeClass(status: WhatsAppConversationStatus) {
  if (status === 'ABERTA') return 'border-green-500/30 bg-green-500/10 text-green-600'
  if (status === 'PENDENTE') return 'border-amber-500/30 bg-amber-500/10 text-amber-600'
  return 'border-slate-500/30 bg-slate-500/10 text-slate-500'
}

async function scrollToBottom() {
  await nextTick()
  const root: HTMLElement | null = messagesScroll.value?.$el ?? messagesScroll.value ?? null
  const viewport = (root?.querySelector('[data-reka-scroll-area-viewport]') as HTMLElement | null) || root
  if (viewport) viewport.scrollTop = viewport.scrollHeight
}

function setStatusFilter(status?: WhatsAppConversationStatus) {
  statusFilter.value = status
  loadConversations()
}

async function loadConversations() {
  try {
    loading.value = true
    const response = await WhatsAppRepository.listConversations({
      search: conversationSearch.value || undefined,
      status: statusFilter.value,
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
  if (index >= 0) conversations.value[index] = { ...conversations.value[index], ...conversation }
  else await loadConversations()

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
  if (selectedConversation.value) await loadConversations()
})

onMounted(loadConversations)
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
          </div>
          <div class="relative">
            <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="conversationSearch"
              class="pl-9"
              placeholder="Buscar por nome, telefone ou cliente"
              @keyup.enter="loadConversations"
            />
          </div>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <Button :variant="statusFilter === undefined ? 'default' : 'outline'" size="sm" @click="setStatusFilter(undefined)">Todas</Button>
            <Button :variant="statusFilter === 'ABERTA' ? 'default' : 'outline'" size="sm" @click="setStatusFilter('ABERTA')">Abertas</Button>
            <Button :variant="statusFilter === 'FINALIZADA' ? 'default' : 'outline'" size="sm" @click="setStatusFilter('FINALIZADA')">Finalizadas</Button>
          </div>
        </div>

        <ScrollArea class="flex-1">
          <button
            v-for="conversation in conversations"
            :key="conversation.id"
            type="button"
            class="flex w-full gap-3 border-b p-3 text-left transition hover:bg-muted/60"
            :class="selectedConversation?.id === conversation.id ? 'bg-muted' : ''"
            @click="openConversation(conversation)"
          >
            <div class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
              {{ initials(conversationLabel(conversation)) }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <p class="truncate text-sm font-semibold">{{ conversationLabel(conversation) }}</p>
                <span class="whitespace-nowrap text-[11px] text-muted-foreground">{{ formatTime(conversation.ultimaInteracaoEm) }}</span>
              </div>
              <p class="truncate text-xs text-muted-foreground">{{ conversation.telefone }}</p>
              <p class="mt-1 line-clamp-1 text-xs">{{ conversation.ultimaMensagem || 'Sem mensagens ainda' }}</p>
              <div class="mt-2 flex items-center gap-2">
                <Badge variant="outline" class="text-[10px]" :class="statusBadgeClass(conversation.status)">{{ conversation.status }}</Badge>
                <Badge v-if="conversation.naoLidas" class="bg-green-600 text-white">{{ conversation.naoLidas }}</Badge>
                <span class="truncate text-[11px] text-muted-foreground">{{ conversation.Instancia?.nome }}</span>
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
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
            {{ initials(conversationLabel(selectedConversation)) }}
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="truncate text-sm font-semibold">{{ conversationLabel(selectedConversation) }}</h2>
            <p class="truncate text-xs text-muted-foreground">
              {{ selectedConversation.telefone }} · {{ selectedConversation.Instancia?.nome || 'Instância' }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" @click="markRead">
              <CheckCheck class="mr-1 h-4 w-4" />
              <span class="hidden sm:inline">Marcar lida</span>
            </Button>
            <Button
              v-if="selectedConversation.status !== 'FINALIZADA'"
              variant="outline"
              size="sm"
              @click="updateConversation({ status: 'FINALIZADA' })"
            >
              Finalizar
            </Button>
            <Button v-else variant="outline" size="sm" @click="updateConversation({ status: 'ABERTA' })">Reabrir</Button>
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
              <option value="ABERTA">Aberta</option>
              <option value="PENDENTE">Pendente</option>
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

        <!-- Composer -->
        <form class="border-t bg-background p-3" @submit.prevent="sendText">
          <div class="mb-2 grid gap-2 md:grid-cols-[160px_1fr]">
            <select v-model="messageForm.tipo" class="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="text">Texto</option>
              <option value="image">Imagem</option>
              <option value="audio">Áudio</option>
              <option value="video">Vídeo</option>
              <option value="document">Documento</option>
            </select>
            <Input v-if="messageForm.tipo !== 'text'" v-model="messageForm.mediaUrl" placeholder="URL pública da mídia" />
          </div>
          <div class="flex items-end gap-2">
            <Textarea
              v-model="messageForm.conteudo"
              class="min-h-[48px]"
              :placeholder="messageForm.tipo === 'text' ? 'Digite a resposta...' : 'Legenda opcional...'"
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
      <section v-else class="hidden flex-1 items-center justify-center p-8 text-center text-muted-foreground md:flex">
        <div>
          <Inbox class="mx-auto mb-3 h-10 w-10" />
          <p>Selecione uma conversa para iniciar o atendimento.</p>
        </div>
      </section>
    </div>
  </div>
</template>
