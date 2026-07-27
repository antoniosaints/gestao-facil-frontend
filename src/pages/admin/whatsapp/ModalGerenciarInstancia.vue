<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/composables/useConfirm'
import {
  WhatsAppRepository,
  type AdminWhatsAppInstance,
  type WhatsAppInstancePayment,
  type WhatsAppWebhookCallback,
  type WhatsAppWebhookEvent,
  type WhatsAppWebhookUrls,
} from '@/repositories/whatsapp-repository'
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  Logs,
  Power,
  QrCode,
  RefreshCw,
  Save,
  Settings2,
  Smartphone,
  Trash2,
  Webhook,
  Wifi,
  WifiOff,
} from 'lucide-vue-next'
import { computed, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useAdminWhatsApp } from './useAdminWhatsApp'

const toast = useToast()
const confirm = useConfirm()
const { modalOpen, selectedInstance, closeManage, triggerRefresh } = useAdminWhatsApp()

const current = ref<AdminWhatsAppInstance | null>(null)
const busy = ref('')
const editForm = reactive({ nome: '', instanceId: '', token: '' })
const atendimentoForm = reactive({ naoPerturbe: false, horaInicio: '', horaFim: '' })
const actionResult = ref('')
const actionSummary = ref('')
const actionTone = ref<'success' | 'warning' | 'danger' | 'info'>('info')
const qrCodeImage = ref('')

const webhookLoaded = ref(false)
const webhookCallbacks = ref<WhatsAppWebhookCallback[]>([])
const webhookUrls = reactive<WhatsAppWebhookUrls>({})
const webhookResults = ref<any[]>([])

const logs = ref<WhatsAppWebhookEvent[]>([])
const logsLoaded = ref(false)
const logsTipo = ref('')

const paymentResult = ref<WhatsAppInstancePayment | null>(null)

const title = computed(() =>
  current.value ? `Gerenciar ${current.value.nome}` : 'Gerenciar instância',
)
const description = computed(() => {
  if (!current.value) return ''
  return `${current.value.Conta.nomeFantasia || current.value.Conta.nome} • ${current.value.Conta.email}`
})

watch(
  [modalOpen, selectedInstance],
  ([open, instance]) => {
    if (!open || !instance) return
    current.value = { ...instance, Conta: { ...instance.Conta } }
    Object.assign(editForm, {
      nome: instance.nome,
      instanceId: instance.instanceId,
      token: '',
    })
    Object.assign(atendimentoForm, {
      naoPerturbe: Boolean(instance.atendimentoNaoPerturbe),
      horaInicio: instance.atendimentoHoraInicio || '',
      horaFim: instance.atendimentoHoraFim || '',
    })
    actionResult.value = ''
    actionSummary.value = ''
    qrCodeImage.value = ''
    webhookLoaded.value = false
    webhookCallbacks.value = []
    webhookResults.value = []
    Object.keys(webhookUrls).forEach((key) => delete webhookUrls[key as keyof WhatsAppWebhookUrls])
    logs.value = []
    logsLoaded.value = false
    logsTipo.value = ''
    paymentResult.value = null
  },
  { immediate: true },
)

function mergeCurrent(data: Partial<AdminWhatsAppInstance>) {
  if (!current.value) return
  current.value = {
    ...current.value,
    ...data,
    Conta: current.value.Conta,
  }
  if (selectedInstance.value?.id === current.value.id) {
    selectedInstance.value = { ...current.value, Conta: { ...current.value.Conta } }
  }
}

function errorMessage(error: any, fallback: string) {
  return error?.response?.data?.message || fallback
}

async function saveIdentity() {
  if (!current.value) return
  if (!editForm.nome.trim() || !editForm.instanceId.trim()) {
    toast.warning('Informe o nome e o Instance ID.')
    return
  }
  try {
    busy.value = 'save'
    const updated = await WhatsAppRepository.updateAdminInstance(current.value.id, {
      nome: editForm.nome,
      instanceId: editForm.instanceId,
      ...(editForm.token.trim() ? { token: editForm.token } : {}),
    })
    mergeCurrent(updated)
    editForm.token = ''
    triggerRefresh()
    toast.success('Instância atualizada.')
  } catch (error: any) {
    toast.error(errorMessage(error, 'Erro ao atualizar a instância.'))
  } finally {
    busy.value = ''
  }
}

async function saveAtendimento() {
  if (!current.value) return
  try {
    busy.value = 'atendimento'
    const updated = await WhatsAppRepository.updateAdminAtendimento(current.value.id, {
      naoPerturbe: atendimentoForm.naoPerturbe,
      horaInicio: atendimentoForm.horaInicio || null,
      horaFim: atendimentoForm.horaFim || null,
    })
    mergeCurrent(updated)
    triggerRefresh()
    toast.success('Atendimento da instância atualizado.')
  } catch (error: any) {
    toast.error(errorMessage(error, 'Erro ao atualizar o atendimento.'))
  } finally {
    busy.value = ''
  }
}

function normalizeQrCodeImage(value?: string | null) {
  if (!value) return ''
  const trimmed = value.trim()
  if (trimmed.startsWith('data:image/')) return trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return `data:image/png;base64,${trimmed}`
}

function extractQrCodeImage(payload: any) {
  const values = [
    payload?.qrcode,
    payload?.qrCode,
    payload?.qr_code,
    payload?.qrCodeBase64,
    payload?.data?.qrcode,
    payload?.data?.qrCode,
    payload?.data?.qr_code,
    payload?.data?.qrCodeBase64,
    payload?.result?.qrcode,
    payload?.result?.qrCode,
    payload?.result?.qr_code,
    payload?.result?.qrCodeBase64,
  ]
  return normalizeQrCodeImage(values.find((value) => typeof value === 'string' && value.trim()))
}

async function runAction(action: 'qrCode' | 'restart' | 'disconnect' | 'status' | 'device') {
  if (!current.value) return
  if (action === 'restart' || action === 'disconnect') {
    const confirmed = await confirm.confirm({
      title: action === 'restart' ? 'Reiniciar instância' : 'Desconectar instância',
      message:
        action === 'restart'
          ? `Reiniciar "${current.value.nome}"? A conexão pode ficar indisponível por alguns segundos.`
          : `Desconectar "${current.value.nome}"? Será necessário ler um novo QR Code para reconectar.`,
      confirmText: action === 'restart' ? 'Reiniciar' : 'Desconectar',
      colorButton: 'warning',
    })
    if (!confirmed) return
  }

  try {
    busy.value = action
    qrCodeImage.value = ''
    const result = await WhatsAppRepository.adminInstanceAction(current.value.id, action)
    actionResult.value = JSON.stringify(result, null, 2)
    qrCodeImage.value = action === 'qrCode' ? extractQrCodeImage(result) : ''
    actionTone.value = action === 'disconnect' ? 'warning' : 'success'
    actionSummary.value =
      action === 'qrCode'
        ? 'QR Code gerado para conexão.'
        : action === 'restart'
          ? 'Reinício enviado para a W-API.'
          : action === 'disconnect'
            ? 'Instância desconectada.'
            : action === 'device'
              ? 'Dados do aparelho sincronizados.'
              : 'Status consultado com sucesso.'
    const synced = await WhatsAppRepository.syncAdminInstance(current.value.id)
    mergeCurrent(synced)
    triggerRefresh()
    toast.success(actionSummary.value)
  } catch (error: any) {
    actionTone.value = 'danger'
    actionSummary.value = errorMessage(error, 'Erro ao executar a ação.')
    actionResult.value = actionSummary.value
    toast.error(actionSummary.value)
  } finally {
    busy.value = ''
  }
}

async function refreshInstance() {
  if (!current.value) return
  try {
    busy.value = 'sync'
    const updated = await WhatsAppRepository.syncAdminInstance(current.value.id)
    mergeCurrent(updated)
    triggerRefresh()
    toast.success('Instância sincronizada.')
  } catch (error: any) {
    toast.error(errorMessage(error, 'Erro ao sincronizar a instância.'))
  } finally {
    busy.value = ''
  }
}

async function loadWebhooks() {
  if (!current.value) return
  try {
    busy.value = 'webhooks-load'
    const config = await WhatsAppRepository.getAdminInstanceWebhooks(current.value.id)
    webhookCallbacks.value = config.callbacks
    Object.keys(webhookUrls).forEach((key) => delete webhookUrls[key as keyof WhatsAppWebhookUrls])
    Object.assign(webhookUrls, config.webhookUrls)
    webhookLoaded.value = true
  } catch (error: any) {
    toast.error(errorMessage(error, 'Erro ao carregar os webhooks.'))
  } finally {
    busy.value = ''
  }
}

async function configureWebhooks() {
  if (!current.value) return
  try {
    busy.value = 'webhooks-save'
    const result = await WhatsAppRepository.configureAdminInstanceWebhooks(
      current.value.id,
      webhookUrls,
    )
    webhookResults.value = result.results || []
    mergeCurrent(result.instance)
    triggerRefresh()
    if (result.success) toast.success('Webhooks sincronizados.')
    else toast.warning('Alguns webhooks não foram aceitos pela W-API.')
  } catch (error: any) {
    toast.error(errorMessage(error, 'Erro ao configurar os webhooks.'))
  } finally {
    busy.value = ''
  }
}

async function loadLogs() {
  if (!current.value) return
  try {
    busy.value = 'logs'
    logs.value = await WhatsAppRepository.listAdminInstanceWebhookEvents(current.value.id, {
      take: 50,
      tipo: logsTipo.value || undefined,
    })
    logsLoaded.value = true
  } catch (error: any) {
    toast.error(errorMessage(error, 'Erro ao carregar os logs.'))
  } finally {
    busy.value = ''
  }
}

async function createPayment(method: 'PIX' | 'CARTAO') {
  if (!current.value) return
  try {
    busy.value = `payment-${method}`
    paymentResult.value =
      method === 'PIX'
        ? await WhatsAppRepository.createAdminPixPayment(current.value.id)
        : await WhatsAppRepository.createAdminCardSubscription(current.value.id)
    current.value.pagamentos = [paymentResult.value, ...(current.value.pagamentos || [])]
    triggerRefresh()
    toast.success(method === 'PIX' ? 'PIX gerado.' : 'Checkout de cartão gerado.')
  } catch (error: any) {
    toast.error(errorMessage(error, 'Erro ao gerar o pagamento.'))
  } finally {
    busy.value = ''
  }
}

async function deletePayment(payment: WhatsAppInstancePayment) {
  if (!current.value || payment.status !== 'PENDENTE') return
  const confirmed = await confirm.confirm({
    title: 'Remover pagamento pendente',
    message: 'Deseja remover este pagamento pendente da instância?',
    confirmText: 'Remover',
    colorButton: 'danger',
  })
  if (!confirmed) return
  try {
    busy.value = `payment-delete-${payment.id}`
    await WhatsAppRepository.removeAdminPayment(current.value.id, payment.id)
    current.value.pagamentos = current.value.pagamentos?.filter((item) => item.id !== payment.id)
    if (paymentResult.value?.id === payment.id) paymentResult.value = null
    triggerRefresh()
    toast.success('Pagamento pendente removido.')
  } catch (error: any) {
    toast.error(errorMessage(error, 'Erro ao remover o pagamento.'))
  } finally {
    busy.value = ''
  }
}

async function removeInstance() {
  if (!current.value) return
  const confirmed = await confirm.confirm({
    title: 'Remover instância',
    message: `Remover "${current.value.nome}" do assinante "${current.value.Conta.nome}"? A instância será desativada no ERP.`,
    confirmText: 'Remover instância',
    colorButton: 'danger',
  })
  if (!confirmed) return
  try {
    busy.value = 'remove'
    await WhatsAppRepository.removeAdminInstance(current.value.id)
    triggerRefresh()
    closeManage()
    toast.success('Instância removida.')
  } catch (error: any) {
    toast.error(errorMessage(error, 'Erro ao remover a instância.'))
  } finally {
    busy.value = ''
  }
}

async function copy(value?: string | null) {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    toast.success('Conteúdo copiado.')
  } catch {
    toast.error('Não foi possível copiar automaticamente.')
  }
}

function openExternal(url?: string | null) {
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

function prettyJson(value?: string | null) {
  if (!value) return ''
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}
</script>

<template>
  <ModalView
    v-model:open="modalOpen"
    :title="title"
    :description="description"
    :icon="Settings2"
    size="5xl"
  >
    <div v-if="current" class="space-y-4 px-2 md:px-4">
      <section class="grid gap-3 rounded-xl border bg-muted/20 p-4 md:grid-cols-[1fr_auto]">
        <div class="flex min-w-0 items-start gap-3">
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
          >
            <Smartphone class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <p class="font-semibold">{{ current.nome }}</p>
              <Badge :variant="current.status === 'CONECTADA' ? 'default' : 'outline'">
                {{ current.status }}
              </Badge>
            </div>
            <p class="truncate text-xs text-muted-foreground">{{ current.instanceId }}</p>
            <p class="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 class="h-3.5 w-3.5" />
              {{ current.Conta.nomeFantasia || current.Conta.nome }} (#{{ current.Conta.id }})
            </p>
          </div>
        </div>
        <Button variant="outline" :disabled="Boolean(busy)" @click="refreshInstance">
          <Loader2 v-if="busy === 'sync'" class="mr-2 h-4 w-4 animate-spin" />
          <RefreshCw v-else class="mr-2 h-4 w-4" />
          Sincronizar
        </Button>
      </section>

      <section class="rounded-xl border p-4">
        <div class="mb-3 flex items-center gap-2">
          <Wifi class="h-4 w-4 text-primary" />
          <h3 class="text-sm font-semibold">Conexão e diagnóstico</h3>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button
            v-if="current.status !== 'CONECTADA'"
            size="sm"
            class="text-white"
            :disabled="Boolean(busy)"
            @click="runAction('qrCode')"
          >
            <Loader2 v-if="busy === 'qrCode'" class="mr-2 h-4 w-4 animate-spin" />
            <QrCode v-else class="mr-2 h-4 w-4" />
            Conectar
          </Button>
          <Button
            size="sm"
            variant="outline"
            :disabled="Boolean(busy)"
            @click="runAction('status')"
          >
            <Activity class="mr-2 h-4 w-4" /> Status
          </Button>
          <Button
            size="sm"
            variant="outline"
            :disabled="Boolean(busy)"
            @click="runAction('device')"
          >
            <Smartphone class="mr-2 h-4 w-4" /> Aparelho
          </Button>
          <Button
            size="sm"
            variant="outline"
            :disabled="Boolean(busy)"
            @click="runAction('restart')"
          >
            <RefreshCw class="mr-2 h-4 w-4" /> Reiniciar
          </Button>
          <Button
            v-if="current.status === 'CONECTADA'"
            size="sm"
            variant="outline"
            class="text-amber-600"
            :disabled="Boolean(busy)"
            @click="runAction('disconnect')"
          >
            <WifiOff class="mr-2 h-4 w-4" /> Desconectar
          </Button>
        </div>

        <div
          v-if="actionSummary"
          class="mt-3 rounded-lg border p-3"
          :class="{
            'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20': actionTone === 'success',
            'border-amber-200 bg-amber-50/60 dark:bg-amber-950/20': actionTone === 'warning',
            'border-red-200 bg-red-50/60 dark:bg-red-950/20': actionTone === 'danger',
          }"
        >
          <div class="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 v-if="actionTone === 'success'" class="h-4 w-4 text-emerald-600" />
            <AlertTriangle v-else class="h-4 w-4 text-amber-600" />
            {{ actionSummary }}
          </div>
          <div v-if="qrCodeImage" class="mt-3 grid gap-3 md:grid-cols-[180px_1fr]">
            <div class="flex h-[180px] items-center justify-center rounded-lg border bg-white p-2">
              <img :src="qrCodeImage" alt="QR Code da instância" class="max-h-full max-w-full" />
            </div>
            <div class="flex flex-col justify-center gap-2 text-sm">
              <p>Leia o QR Code no WhatsApp em aparelhos conectados.</p>
              <Button variant="outline" size="sm" class="w-fit" @click="copy(qrCodeImage)">
                <Copy class="mr-2 h-4 w-4" /> Copiar
              </Button>
            </div>
          </div>
          <details v-if="actionResult" class="mt-3">
            <summary class="cursor-pointer text-xs font-medium text-muted-foreground">
              Ver retorno técnico
            </summary>
            <Textarea
              :model-value="actionResult"
              readonly
              class="mt-2 min-h-32 font-mono text-xs"
            />
          </details>
        </div>
      </section>

      <div class="grid gap-4 lg:grid-cols-2">
        <section class="rounded-xl border p-4">
          <h3 class="mb-3 text-sm font-semibold">Identificação e credenciais</h3>
          <div class="space-y-3">
            <div class="space-y-1.5">
              <Label>Nome</Label>
              <Input v-model="editForm.nome" />
            </div>
            <div class="space-y-1.5">
              <Label>Instance ID</Label>
              <Input v-model="editForm.instanceId" />
            </div>
            <div class="space-y-1.5">
              <Label>Novo token</Label>
              <Input
                v-model="editForm.token"
                type="password"
                placeholder="Deixe vazio para manter o atual"
              />
            </div>
            <Button size="sm" class="text-white" :disabled="Boolean(busy)" @click="saveIdentity">
              <Loader2 v-if="busy === 'save'" class="mr-2 h-4 w-4 animate-spin" />
              <Save v-else class="mr-2 h-4 w-4" />
              Salvar identificação
            </Button>
          </div>
        </section>

        <section class="rounded-xl border p-4">
          <h3 class="mb-3 text-sm font-semibold">Controle de atendimento</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
              <div>
                <p class="text-sm font-medium">Não perturbe</p>
                <p class="text-xs text-muted-foreground">
                  Pausa o recebimento sem desconectar a API.
                </p>
              </div>
              <Switch v-model="atendimentoForm.naoPerturbe" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="space-y-1.5">
                <Label>Início</Label>
                <Input v-model="atendimentoForm.horaInicio" type="time" />
              </div>
              <div class="space-y-1.5">
                <Label>Fim</Label>
                <Input v-model="atendimentoForm.horaFim" type="time" />
              </div>
            </div>
            <Button size="sm" class="text-white" :disabled="Boolean(busy)" @click="saveAtendimento">
              <Power class="mr-2 h-4 w-4" />
              Salvar atendimento
            </Button>
          </div>
        </section>
      </div>

      <section class="rounded-xl border p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 class="flex items-center gap-2 text-sm font-semibold">
              <Webhook class="h-4 w-4" /> Webhooks
            </h3>
            <p class="text-xs text-muted-foreground">
              Revise e sincronize os callbacks da instância.
            </p>
          </div>
          <Button size="sm" variant="outline" :disabled="Boolean(busy)" @click="loadWebhooks">
            <Loader2 v-if="busy === 'webhooks-load'" class="mr-2 h-4 w-4 animate-spin" />
            {{ webhookLoaded ? 'Recarregar' : 'Carregar webhooks' }}
          </Button>
        </div>
        <div v-if="webhookLoaded" class="mt-3 space-y-2">
          <div
            v-for="callback in webhookCallbacks"
            :key="callback.key"
            class="grid gap-1.5 md:grid-cols-[150px_1fr] md:items-center"
          >
            <Label class="text-xs">{{ callback.label }}</Label>
            <Input v-model="webhookUrls[callback.key]" class="font-mono text-xs" />
          </div>
          <Button
            size="sm"
            class="mt-2 text-white"
            :disabled="Boolean(busy)"
            @click="configureWebhooks"
          >
            <Loader2 v-if="busy === 'webhooks-save'" class="mr-2 h-4 w-4 animate-spin" />
            <Webhook v-else class="mr-2 h-4 w-4" />
            Sincronizar webhooks
          </Button>
          <div v-if="webhookResults.length" class="grid gap-1 text-xs">
            <div v-for="result in webhookResults" :key="result.key" class="flex items-center gap-2">
              <CheckCircle2
                v-if="result.ok || result.skipped"
                class="h-3.5 w-3.5 text-emerald-600"
              />
              <AlertTriangle v-else class="h-3.5 w-3.5 text-red-600" />
              {{ result.label }}
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-xl border p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 class="flex items-center gap-2 text-sm font-semibold">
              <Logs class="h-4 w-4" /> Logs de webhook
            </h3>
            <p class="text-xs text-muted-foreground">Últimos eventos recebidos e processados.</p>
          </div>
          <div class="flex gap-2">
            <select v-model="logsTipo" class="h-9 rounded-md border bg-background px-2 text-sm">
              <option value="">Todos</option>
              <option value="received">Recebidos</option>
              <option value="delivery">Enviados</option>
              <option value="status">Status</option>
              <option value="connected">Conectado</option>
              <option value="disconnected">Desconectado</option>
            </select>
            <Button size="sm" variant="outline" :disabled="Boolean(busy)" @click="loadLogs">
              <Loader2 v-if="busy === 'logs'" class="mr-2 h-4 w-4 animate-spin" />
              Carregar
            </Button>
          </div>
        </div>
        <div v-if="logsLoaded" class="mt-3 max-h-72 space-y-2 overflow-auto">
          <p
            v-if="!logs.length"
            class="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground"
          >
            Nenhum evento encontrado.
          </p>
          <details v-for="event in logs" :key="event.id" class="rounded-lg border p-3">
            <summary class="cursor-pointer text-sm">
              <span class="font-medium">{{ event.tipo }}</span>
              <span class="ml-2 text-xs text-muted-foreground">{{
                new Date(event.createdAt).toLocaleString('pt-BR')
              }}</span>
              <Badge class="ml-2" :variant="event.processado ? 'default' : 'destructive'">{{
                event.processado ? 'Processado' : 'Falhou'
              }}</Badge>
            </summary>
            <p v-if="event.erro" class="mt-2 text-xs text-red-600">{{ event.erro }}</p>
            <Textarea
              :model-value="prettyJson(event.payload)"
              readonly
              class="mt-2 min-h-32 font-mono text-xs"
            />
          </details>
        </div>
      </section>

      <section class="rounded-xl border p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 class="flex items-center gap-2 text-sm font-semibold">
              <CreditCard class="h-4 w-4" /> Pagamentos
            </h3>
            <p class="text-xs text-muted-foreground">
              Cobranças e assinatura desta instância W-API.
            </p>
          </div>
          <div class="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              :disabled="Boolean(busy)"
              @click="createPayment('PIX')"
              >Gerar PIX</Button
            >
            <Button
              size="sm"
              variant="outline"
              :disabled="Boolean(busy)"
              @click="createPayment('CARTAO')"
              >Gerar cartão</Button
            >
          </div>
        </div>
        <div v-if="paymentResult" class="mt-3 rounded-lg border bg-muted/20 p-3">
          <div class="flex items-center justify-between gap-2 text-sm">
            <span class="font-medium">{{ paymentResult.metodo }} gerado</span>
            <Badge variant="outline">{{ paymentResult.status }}</Badge>
          </div>
          <div v-if="paymentResult.qrCodeBase64" class="mt-3 flex justify-center">
            <img
              :src="normalizeQrCodeImage(paymentResult.qrCodeBase64)"
              alt="QR Code PIX"
              class="h-48 w-48 rounded-lg border bg-white p-2"
            />
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <Button
              v-if="paymentResult.qrCodeCopyPaste"
              size="sm"
              variant="outline"
              @click="copy(paymentResult.qrCodeCopyPaste)"
            >
              <Copy class="mr-2 h-4 w-4" /> Copiar PIX
            </Button>
            <Button
              v-if="paymentResult.ticketUrl || paymentResult.checkoutUrl"
              size="sm"
              variant="outline"
              @click="openExternal(paymentResult.ticketUrl || paymentResult.checkoutUrl)"
            >
              Abrir pagamento
            </Button>
          </div>
        </div>
        <div class="mt-3 space-y-2">
          <p v-if="!current.pagamentos?.length" class="text-sm text-muted-foreground">
            Nenhum pagamento registrado.
          </p>
          <div
            v-for="payment in current.pagamentos"
            :key="payment.id"
            class="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
          >
            <div>
              <p class="font-medium">{{ payment.metodo }} • {{ payment.status }}</p>
              <p class="text-xs text-muted-foreground">
                {{ new Date(payment.createdAt).toLocaleString('pt-BR') }}
              </p>
            </div>
            <Button
              v-if="payment.status === 'PENDENTE'"
              size="icon"
              variant="ghost"
              class="h-8 w-8 text-red-600"
              @click="deletePayment(payment)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section
        class="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-900 dark:bg-red-950/20 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h3 class="text-sm font-semibold text-red-700 dark:text-red-300">Remover instância</h3>
          <p class="text-xs text-red-600/80 dark:text-red-300/80">
            Desativa a instância no ERP e remove suas credenciais locais.
          </p>
        </div>
        <Button variant="destructive" size="sm" :disabled="Boolean(busy)" @click="removeInstance">
          <Trash2 class="mr-2 h-4 w-4" />
          Remover
        </Button>
      </section>
    </div>
  </ModalView>
</template>
