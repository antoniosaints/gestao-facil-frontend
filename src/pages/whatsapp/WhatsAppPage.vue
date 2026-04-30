<template>
  <div class="container mx-auto space-y-5">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <MessageCircle class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Atendimento WhatsApp
        </h1>
        <p class="text-sm text-muted-foreground">
          Central de conversas, instâncias W-API e vínculo com clientes da conta atual.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Badge :variant="connectedInstances ? 'default' : 'outline'" class="gap-1">
          <Wifi class="h-3.5 w-3.5" />
          {{ connectedInstances }} conectada(s)
        </Badge>
        <Button variant="outline" :disabled="loading" @click="refreshAll">
          <RotateCw class="mr-2 h-4 w-4" :class="loading ? 'animate-spin' : ''" />
          Atualizar
        </Button>
      </div>
    </div>

    <Tabs v-model="tab" class="w-full">
      <TabsList class="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="inbox">Inbox</TabsTrigger>
        <TabsTrigger value="instances">Instâncias</TabsTrigger>
      </TabsList>

      <TabsContent value="inbox" class="mt-4">
        <div class="grid min-h-[680px] overflow-hidden rounded-xl border bg-background lg:grid-cols-[360px_1fr]">
          <aside class="border-r bg-body/40">
            <div class="space-y-3 border-b p-3">
              <div class="relative">
                <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input v-model="conversationSearch" class="pl-9" placeholder="Buscar por nome, telefone ou cliente" @keyup.enter="loadConversations" />
              </div>
              <div class="grid grid-cols-3 gap-2 text-xs">
                <Button :variant="statusFilter === undefined ? 'default' : 'outline'" size="sm" @click="setStatusFilter(undefined)">Todas</Button>
                <Button :variant="statusFilter === 'ABERTA' ? 'default' : 'outline'" size="sm" @click="setStatusFilter('ABERTA')">Abertas</Button>
                <Button :variant="statusFilter === 'FINALIZADA' ? 'default' : 'outline'" size="sm" @click="setStatusFilter('FINALIZADA')">Finalizadas</Button>
              </div>
            </div>

            <ScrollArea class="h-[600px]">
              <button
                v-for="conversation in conversations"
                :key="conversation.id"
                type="button"
                class="flex w-full gap-3 border-b p-3 text-left transition hover:bg-muted/60"
                :class="selectedConversation?.id === conversation.id ? 'bg-muted' : ''"
                @click="openConversation(conversation)"
              >
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
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
                    <Badge variant="outline">{{ conversation.status }}</Badge>
                    <Badge v-if="conversation.naoLidas" class="bg-green-600 text-white">{{ conversation.naoLidas }}</Badge>
                    <span class="truncate text-[11px] text-muted-foreground">{{ conversation.Instancia?.nome }}</span>
                  </div>
                </div>
              </button>
              <div v-if="!conversations.length" class="p-8 text-center text-sm text-muted-foreground">
                Nenhuma conversa encontrada.
              </div>
            </ScrollArea>
          </aside>

          <section v-if="selectedConversation" class="flex min-w-0 flex-col">
            <header class="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
              <div class="min-w-0">
                <h2 class="truncate text-lg font-semibold">{{ conversationLabel(selectedConversation) }}</h2>
                <p class="text-sm text-muted-foreground">
                  {{ selectedConversation.telefone }} · {{ selectedConversation.Instancia?.nome || 'Instância' }}
                </p>
                <p v-if="selectedConversation.Cliente" class="text-xs text-green-600">
                  Cliente vinculado: {{ selectedConversation.Cliente.nome }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" @click="markRead">
                  <CheckCheck class="mr-2 h-4 w-4" />
                  Marcar lida
                </Button>
                <Button v-if="selectedConversation.status !== 'FINALIZADA'" variant="outline" size="sm" @click="updateConversation({ status: 'FINALIZADA' })">
                  Finalizar
                </Button>
                <Button v-else variant="outline" size="sm" @click="updateConversation({ status: 'ABERTA' })">
                  Reabrir
                </Button>
              </div>
            </header>

            <div class="grid gap-4 border-b p-4 md:grid-cols-3">
              <div class="space-y-1">
                <Label>Cliente ERP</Label>
                <div class="flex gap-2">
                  <Input v-model="customerSearch" placeholder="Buscar cliente" @keyup.enter="loadCustomers" />
                  <Button variant="outline" @click="loadCustomers"><Search class="h-4 w-4" /></Button>
                </div>
                <select v-if="customerOptions.length" class="h-9 w-full rounded-md border bg-background px-3 text-sm" @change="linkCustomer(($event.target as HTMLSelectElement).value)">
                  <option value="">Selecionar cliente...</option>
                  <option v-for="customer in customerOptions" :key="customer.id" :value="customer.id">{{ customer.label }}</option>
                </select>
              </div>
              <div class="space-y-1">
                <Label>Setor/Fila</Label>
                <Input v-model="conversationForm.setor" placeholder="Ex.: Suporte" @change="updateConversation({ setor: conversationForm.setor || null })" />
              </div>
              <div class="space-y-1">
                <Label>Status</Label>
                <select v-model="conversationForm.status" class="h-9 w-full rounded-md border bg-background px-3 text-sm" @change="updateConversation({ status: conversationForm.status })">
                  <option value="ABERTA">Aberta</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="FINALIZADA">Finalizada</option>
                </select>
              </div>
            </div>

            <ScrollArea ref="messagesScroll" class="flex-1 bg-muted/20 p-4">
              <div class="space-y-3">
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
                      <a :href="message.mediaUrl" target="_blank" rel="noreferrer" class="underline">
                        {{ mediaLabel(message) }}
                      </a>
                    </div>
                    <p class="whitespace-pre-wrap text-sm">{{ message.conteudo || mediaLabel(message) }}</p>
                    <div class="mt-1 flex justify-end gap-1 text-[10px] opacity-70">
                      <span>{{ formatTime(message.createdAt) }}</span>
                      <span v-if="message.direcao === 'SAIDA'">· {{ message.statusEnvio }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

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
                <Textarea v-model="messageForm.conteudo" class="min-h-[48px]" :placeholder="messageForm.tipo === 'text' ? 'Digite a resposta...' : 'Legenda opcional...'" />
                <Button type="submit" class="text-white" :disabled="sending || !canSendMessage">
                  <LoaderIcon v-if="sending" class="mr-2 h-4 w-4 animate-spin" />
                  <Send v-else class="mr-2 h-4 w-4" />
                  Enviar
                </Button>
              </div>
              <p v-if="selectedConversation.Instancia?.status !== 'CONECTADA'" class="mt-2 text-xs text-amber-600">
                A instância está {{ selectedConversation.Instancia?.status?.toLowerCase() }}; o envio fica bloqueado até reconectar.
              </p>
            </form>
          </section>

          <section v-else class="flex items-center justify-center p-8 text-center text-muted-foreground">
            <div>
              <Inbox class="mx-auto mb-3 h-10 w-10" />
              <p>Selecione uma conversa para iniciar o atendimento.</p>
            </div>
          </section>
        </div>
      </TabsContent>

      <TabsContent value="instances" class="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle class="font-normal">Nova instância W-API</CardTitle>
            <CardDescription>O token é salvo no backend e nunca é exibido novamente na interface.</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid gap-3 md:grid-cols-[1fr_1fr_1.2fr_auto]">
              <Input v-model="instanceForm.nome" placeholder="Nome amigável" />
              <Input v-model="instanceForm.instanceId" placeholder="Instance ID" />
              <Input v-model="instanceForm.token" type="password" placeholder="Token W-API" autocomplete="off" />
              <Button class="text-white" :disabled="savingInstance" @click="saveInstance">
                <Plus class="mr-2 h-4 w-4" />
                Cadastrar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div class="grid gap-4 xl:grid-cols-2">
          <Card v-for="instance in instances" :key="instance.id" class="overflow-hidden">
            <CardHeader>
              <div class="flex items-start justify-between gap-3">
                <div>
                  <CardTitle class="font-normal">{{ instance.nome }}</CardTitle>
                  <CardDescription>{{ instance.instanceId }}</CardDescription>
                </div>
                <Badge :variant="instance.status === 'CONECTADA' ? 'default' : 'outline'">{{ instance.status }}</Badge>
              </div>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid gap-3 md:grid-cols-2">
                <div class="rounded-lg border p-3">
                  <p class="text-xs text-muted-foreground">Número conectado</p>
                  <p class="font-medium">{{ instance.numeroConectado || 'Não identificado' }}</p>
                </div>
                <div class="rounded-lg border p-3">
                  <p class="text-xs text-muted-foreground">Última sincronização</p>
                  <p class="font-medium">{{ formatTime(instance.lastSyncAt) || 'Nunca' }}</p>
                </div>
              </div>
              <div v-if="instance.ultimoErro" class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle class="mr-1 inline h-4 w-4" />
                {{ instance.ultimoErro }}
              </div>
              <div class="space-y-3">
                <div class="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" :disabled="isAnyInstanceActionLoading(instance.id)" @click="runInstanceAction(instance, 'qrCode')">
                    <LoaderIcon v-if="isInstanceActionLoading(instance.id, 'qrCode')" class="mr-2 h-4 w-4 animate-spin" />
                    <QrCode v-else class="mr-2 h-4 w-4" />
                    QR Code
                  </Button>
                  <Button variant="outline" size="sm" :disabled="isAnyInstanceActionLoading(instance.id)" @click="runInstanceAction(instance, 'pairingCode')">
                    <LoaderIcon v-if="isInstanceActionLoading(instance.id, 'pairingCode')" class="mr-2 h-4 w-4 animate-spin" />
                    <Link2 v-else class="mr-2 h-4 w-4" />
                    Código
                  </Button>
                  <Button variant="outline" size="sm" :disabled="isAnyInstanceActionLoading(instance.id)" @click="runInstanceAction(instance, 'status')">
                    <LoaderIcon v-if="isInstanceActionLoading(instance.id, 'status')" class="mr-2 h-4 w-4 animate-spin" />
                    <Wifi v-else class="mr-2 h-4 w-4" />
                    Status
                  </Button>
                  <Button variant="outline" size="sm" :disabled="isAnyInstanceActionLoading(instance.id)" @click="runInstanceAction(instance, 'device')">
                    <LoaderIcon v-if="isInstanceActionLoading(instance.id, 'device')" class="mr-2 h-4 w-4 animate-spin" />
                    <Smartphone v-else class="mr-2 h-4 w-4" />
                    Device
                  </Button>
                  <Button variant="outline" size="sm" :disabled="loadingWebhookConfig || isAnyInstanceActionLoading(instance.id)" @click="openWebhookModal(instance)">
                    <LoaderIcon v-if="loadingWebhookConfig && webhookInstance?.id === instance.id" class="mr-2 h-4 w-4 animate-spin" />
                    <Webhook v-else class="mr-2 h-4 w-4" />
                    Webhooks
                  </Button>
                  <Button variant="outline" size="sm" :disabled="isAnyInstanceActionLoading(instance.id)" @click="runInstanceAction(instance, 'restart')">
                    <LoaderIcon v-if="isInstanceActionLoading(instance.id, 'restart')" class="mr-2 h-4 w-4 animate-spin" />
                    <RefreshCw v-else class="mr-2 h-4 w-4" />
                    Reiniciar
                  </Button>
                  <Button variant="outline" size="sm" :disabled="isAnyInstanceActionLoading(instance.id)" @click="runInstanceAction(instance, 'disconnect')">
                    <LoaderIcon v-if="isInstanceActionLoading(instance.id, 'disconnect')" class="mr-2 h-4 w-4 animate-spin" />
                    <WifiOff v-else class="mr-2 h-4 w-4" />
                    Desconectar
                  </Button>
                </div>
                <div v-if="instanceActionResult[instance.id]" class="overflow-hidden rounded-lg border bg-muted/30">
                  <div class="flex items-center justify-between border-b px-3 py-2 text-xs text-muted-foreground">
                    <span>{{ instanceActionSummary[instance.id] || 'Último retorno da W-API' }}</span>
                    <Button variant="ghost" size="sm" class="h-7 px-2" @click="copyToClipboard(instanceActionResult[instance.id], 'Retorno copiado.')">
                      <Copy class="mr-1 h-3.5 w-3.5" />
                      Copiar
                    </Button>
                  </div>
                  <pre class="max-h-72 overflow-auto bg-slate-950 p-3 text-xs text-slate-50">{{ instanceActionResult[instance.id] }}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>

    <Dialog v-model:open="webhookModalOpen">
      <DialogContent class="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Configurar webhooks da W-API</DialogTitle>
          <DialogDescription>
            As URLs abaixo apontam para o backend deste ERP e já carregam o segredo da instância
            {{ webhookInstance?.nome ? `“${webhookInstance.nome}”` : '' }}. Confirme para enviar todas para a W-API.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle class="mr-1 inline h-4 w-4" />
            A URL pública vem de <code>BASE_URL</code> no backend. Se estiver local ou inacessível pela W-API, o recebimento não chegará ao ERP.
          </div>

          <div class="space-y-3">
            <div v-for="callback in webhookCallbacks" :key="callback.key" class="rounded-lg border p-3">
              <div class="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-medium">{{ callback.label }}</p>
                  <p class="text-xs text-muted-foreground">{{ callback.endpoint }}</p>
                </div>
                <Button variant="ghost" size="sm" class="h-8" @click="copyToClipboard(webhookUrls[callback.key] || '', 'URL copiada.')">
                  <Copy class="mr-1 h-3.5 w-3.5" />
                  Copiar
                </Button>
              </div>
              <Input v-model="webhookUrls[callback.key]" class="font-mono text-xs" />
            </div>
          </div>

          <div v-if="webhookSyncResults.length" class="rounded-lg border bg-muted/30 p-3">
            <p class="mb-2 text-sm font-medium">Resultado do último envio</p>
            <div class="space-y-2">
              <div v-for="result in webhookSyncResults" :key="result.key" class="flex items-start gap-2 text-sm">
                <CheckCircle2 v-if="result.ok" class="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <AlertTriangle v-else class="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div class="min-w-0">
                  <p class="font-medium">{{ result.label }}</p>
                  <p class="break-all text-xs text-muted-foreground">
                    {{ result.ok ? 'Configurado na W-API.' : formatWebhookError(result.error) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" :disabled="configuringWebhooks" @click="webhookModalOpen = false">Fechar</Button>
          <Button class="text-white" :disabled="configuringWebhooks || !webhookInstance" @click="confirmWebhooks">
            <LoaderIcon v-if="configuringWebhooks" class="mr-2 h-4 w-4 animate-spin" />
            <Webhook v-else class="mr-2 h-4 w-4" />
            Confirmar e enviar para W-API
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import {
  AlertTriangle,
  CheckCheck,
  CheckCircle2,
  Copy,
  Inbox,
  Link2,
  LoaderIcon,
  MessageCircle,
  Plus,
  QrCode,
  RefreshCw,
  RotateCw,
  Search,
  Send,
  Smartphone,
  Webhook,
  Wifi,
  WifiOff,
} from 'lucide-vue-next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useSocketEvent } from '@/composables/useSocketEvent'
import { ClienteRepository } from '@/repositories/cliente-repository'
import {
  WhatsAppRepository,
  type WhatsAppConversation,
  type WhatsAppConversationStatus,
  type WhatsAppInstance,
  type WhatsAppMessage,
  type WhatsAppWebhookCallback,
  type WhatsAppWebhookSyncResult,
  type WhatsAppWebhookUrls,
} from '@/repositories/whatsapp-repository'

const toast = useToast()
const tab = ref<'inbox' | 'instances'>('inbox')
const loading = ref(false)
const savingInstance = ref(false)
const sending = ref(false)

const instances = ref<WhatsAppInstance[]>([])
const conversations = ref<WhatsAppConversation[]>([])
const messages = ref<WhatsAppMessage[]>([])
const selectedConversation = ref<WhatsAppConversation | null>(null)
const conversationSearch = ref('')
const statusFilter = ref<WhatsAppConversationStatus | undefined>(undefined)
const customerSearch = ref('')
const customerOptions = ref<Array<{ id: number; label: string }>>([])
const instanceActionResult = reactive<Record<number, string>>({})
const instanceActionSummary = reactive<Record<number, string>>({})
const instanceActionLoading = reactive<Record<string, boolean>>({})

const webhookModalOpen = ref(false)
const loadingWebhookConfig = ref(false)
const configuringWebhooks = ref(false)
const webhookInstance = ref<WhatsAppInstance | null>(null)
const webhookCallbacks = ref<WhatsAppWebhookCallback[]>([])
const webhookSyncResults = ref<WhatsAppWebhookSyncResult[]>([])
const webhookUrls = reactive<WhatsAppWebhookUrls>({})

const instanceForm = reactive({ nome: '', instanceId: '', token: '' })
const conversationForm = reactive<{ status: WhatsAppConversationStatus; setor: string }>({ status: 'ABERTA', setor: '' })
const messageForm = reactive<{ tipo: 'text' | 'image' | 'audio' | 'video' | 'document'; conteudo: string; mediaUrl: string }>({
  tipo: 'text',
  conteudo: '',
  mediaUrl: '',
})

const connectedInstances = computed(() => instances.value.filter((instance) => instance.status === 'CONECTADA').length)
const canSendMessage = computed(() => {
  if (!selectedConversation.value) return false
  if (selectedConversation.value.Instancia?.status !== 'CONECTADA') return false
  if (messageForm.tipo === 'text') return Boolean(messageForm.conteudo.trim())
  return Boolean(messageForm.mediaUrl.trim())
})

function setStatusFilter(status?: WhatsAppConversationStatus) {
  statusFilter.value = status
  loadConversations()
}

function conversationLabel(conversation: WhatsAppConversation) {
  return conversation.Cliente?.nome || conversation.Contato?.nome || conversation.telefone
}

function initials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'W'
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

async function loadInstances() {
  instances.value = await WhatsAppRepository.listInstances()
}

async function loadConversations() {
  const response = await WhatsAppRepository.listConversations({
    search: conversationSearch.value || undefined,
    status: statusFilter.value,
    take: 80,
  })
  conversations.value = response.items
  if (selectedConversation.value) {
    selectedConversation.value = conversations.value.find((item) => item.id === selectedConversation.value?.id) || selectedConversation.value
  }
}

async function refreshAll() {
  try {
    loading.value = true
    await Promise.all([loadInstances(), loadConversations()])
  } catch (error) {
    console.error(error)
    toast.error('Erro ao atualizar atendimento WhatsApp.')
  } finally {
    loading.value = false
  }
}

async function openConversation(conversation: WhatsAppConversation) {
  selectedConversation.value = conversation
  conversationForm.status = conversation.status
  conversationForm.setor = conversation.setor || ''
  customerSearch.value = conversation.Cliente?.nome || ''
  await loadMessages()
  if (conversation.naoLidas) await markRead()
}

async function loadMessages() {
  if (!selectedConversation.value) return
  const response = await WhatsAppRepository.listMessages(selectedConversation.value.id, { take: 80 })
  messages.value = response.items
  await nextTick()
}

async function saveInstance() {
  if (!instanceForm.nome.trim() || !instanceForm.instanceId.trim() || !instanceForm.token.trim()) {
    toast.warning('Informe nome, instance ID e token.')
    return
  }

  try {
    savingInstance.value = true
    await WhatsAppRepository.createInstance({ ...instanceForm })
    Object.assign(instanceForm, { nome: '', instanceId: '', token: '' })
    toast.success('Instância cadastrada.')
    await loadInstances()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao cadastrar instância.')
  } finally {
    savingInstance.value = false
  }
}

const actionLabels: Record<string, string> = {
  qrCode: 'QR Code',
  pairingCode: 'Código de pareamento',
  status: 'Status',
  device: 'Device',
  restart: 'Reiniciar',
  disconnect: 'Desconectar',
  setupWebhooks: 'Webhooks',
}

function actionKey(instanceId: number, action: string) {
  return `${instanceId}:${action}`
}

function isInstanceActionLoading(instanceId: number, action: string) {
  return Boolean(instanceActionLoading[actionKey(instanceId, action)])
}

function isAnyInstanceActionLoading(instanceId: number) {
  return Object.keys(instanceActionLoading).some((key) => key.startsWith(`${instanceId}:`) && instanceActionLoading[key])
}

function stringifyResult(value: unknown) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

async function copyToClipboard(value: string, message: string) {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    toast.success(message)
  } catch (error) {
    console.error(error)
    toast.error('Não foi possível copiar automaticamente.')
  }
}

function formatWebhookError(error: unknown) {
  if (!error) return 'Falha ao configurar webhook.'
  if (typeof error === 'string') return error
  return stringifyResult(error)
}

async function openWebhookModal(instance: WhatsAppInstance) {
  try {
    webhookInstance.value = instance
    loadingWebhookConfig.value = true
    webhookSyncResults.value = []
    const config = await WhatsAppRepository.getInstanceWebhooks(instance.id)
    webhookCallbacks.value = config.callbacks
    Object.keys(webhookUrls).forEach((key) => delete webhookUrls[key as keyof WhatsAppWebhookUrls])
    Object.assign(webhookUrls, config.webhookUrls)
    webhookModalOpen.value = true
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao carregar URLs de webhook.')
  } finally {
    loadingWebhookConfig.value = false
  }
}

async function confirmWebhooks() {
  if (!webhookInstance.value) return
  try {
    configuringWebhooks.value = true
    webhookSyncResults.value = []
    const result = await WhatsAppRepository.configureInstanceWebhooks(webhookInstance.value.id, webhookUrls)
    webhookSyncResults.value = result.results || []
    instanceActionResult[webhookInstance.value.id] = stringifyResult(result)
    instanceActionSummary[webhookInstance.value.id] = result.success
      ? 'Webhooks sincronizados com sucesso.'
      : 'Webhooks sincronizados parcialmente; revise os itens abaixo.'
    if (result.success) toast.success('Webhooks enviados para a W-API.')
    else toast.warning('Alguns webhooks não foram aceitos pela W-API.')
    await loadInstances()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao configurar webhooks na W-API.')
  } finally {
    configuringWebhooks.value = false
  }
}

async function runInstanceAction(instance: WhatsAppInstance, action: Parameters<typeof WhatsAppRepository.instanceAction>[1]) {
  const key = actionKey(instance.id, action)
  try {
    instanceActionLoading[key] = true
    instanceActionSummary[instance.id] = `${actionLabels[action] || 'Ação'} em andamento...`
    instanceActionResult[instance.id] = 'Aguardando resposta da W-API...'
    const result = await WhatsAppRepository.instanceAction(instance.id, action)
    instanceActionResult[instance.id] = stringifyResult(result)
    instanceActionSummary[instance.id] = `${actionLabels[action] || 'Ação'} executado com sucesso.`
    toast.success(`${actionLabels[action] || 'Ação'} executado.`)
    await loadInstances()
  } catch (error: any) {
    console.error(error)
    const message = error?.response?.data?.message || 'Erro ao executar ação da instância.'
    instanceActionSummary[instance.id] = `${actionLabels[action] || 'Ação'} falhou.`
    instanceActionResult[instance.id] = message
    toast.error(message)
  } finally {
    instanceActionLoading[key] = false
  }
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

async function updateConversation(payload: Partial<{ status: WhatsAppConversationStatus; setor: string | null; clienteId: number | null }>) {
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
})

useSocketEvent<WhatsAppInstance>('whatsapp:instancia:updated', async () => {
  await loadInstances()
})

onMounted(refreshAll)
</script>
