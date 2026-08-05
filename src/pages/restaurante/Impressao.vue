<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import HelpTooltip from './components/HelpTooltip.vue'
import { changePrimaryStation, swapPrintStations } from './printRuleDraft'
import { useSocketEvent } from '@/composables/useSocketEvent'
import {
  RestauranteRepository,
  type RestauranteEstacaoImpressao,
  type RestaurantePontoProducao,
  type RestauranteRegraImpressao,
  type RestauranteTrabalhoImpressao,
} from '@/repositories/restaurante-repository'
import {
  ArrowLeftRight,
  ArrowRight,
  Cable,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Copy,
  ListChecks,
  LoaderCircle,
  MonitorCog,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  Trash2,
  Undo2,
  Wifi,
  WifiOff,
} from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui/uiStore'
import { useRestaurantPrintAgent } from '@/stores/restaurante/useRestaurantPrintAgent'

const toast = useToast()
const uiStore = useUiStore()
const printAgent = useRestaurantPrintAgent()
const { connectors, localReady, printers, qzConnected } = storeToRefs(printAgent)
const canConfigure = computed(() => uiStore.hasRestaurantCapability('IMPRESSAO_CONFIGURAR'))
const tab = ref('estacoes')
const loading = ref(false)
const saving = ref(false)
const stations = ref<RestauranteEstacaoImpressao[]>([])
const points = ref<RestaurantePontoProducao[]>([])
const rules = ref<RestauranteRegraImpressao[]>([])
type PrintDestinationDraft = {
  estacaoId: number | null
  fallbackEstacaoId: number | null
  papel: '58mm' | '80mm'
  vias: number
  imprimirPedidoCompleto: boolean
}
type PrintRuleDraft = PrintDestinationDraft & {
  destinosAdicionais: PrintDestinationDraft[]
  ativa: boolean
  version?: number
}
const ruleDrafts = ref<Record<number, PrintRuleDraft>>({})
const dirtyRuleIds = ref<Set<number>>(new Set())
const savingRuleId = ref<number | null>(null)
const expandedPointId = ref<number | null>(null)
const jobs = ref<RestauranteTrabalhoImpressao[]>([])
const stationModal = ref(false)
const managerModal = ref(false)
const currentStation = ref<RestauranteEstacaoImpressao | null>(null)
const pairingToken = ref('')
const stationForm = ref({ nome: '', ativa: true, version: undefined as number | undefined })
const connectorModal = ref(false)
const connectorSaving = ref(false)
const editingConnectorId = ref<string | null>(null)
const connectorForm = ref({ token: '', printer: '', paper: '80mm' as '58mm' | '80mm', enabled: true })

const activeStations = computed(() => stations.value.filter((item) => item.ativa))
const pendingJobs = computed(() => jobs.value.filter((item) => item.status === 'PENDENTE' || item.status === 'EM_PROCESSAMENTO').length)
const failedJobs = computed(() => jobs.value.filter((item) => item.status === 'FALHOU').length)
const unmatchedConnectors = computed(() => connectors.value.filter(
  (connector) => !connector.stationId || !stations.value.some((station) => station.id === connector.stationId),
))
const statusLabels: Record<RestauranteTrabalhoImpressao['status'], string> = {
  PENDENTE: 'Pendente', EM_PROCESSAMENTO: 'Processando', CONCLUIDO: 'Impresso', FALHOU: 'Falhou', CANCELADO: 'Cancelado',
}

function createRuleDraft(pointId: number): PrintRuleDraft {
  const current = rules.value.find((item) => item.pontoId === pointId)
  return {
    estacaoId: current?.estacaoId ?? activeStations.value[0]?.id ?? null,
    fallbackEstacaoId: current?.fallbackEstacaoId ?? null,
    papel: current?.papel ?? '80mm',
    vias: current?.vias ?? 1,
    imprimirPedidoCompleto: current?.imprimirPedidoCompleto ?? false,
    destinosAdicionais: current?.destinos?.map((destination) => ({
      estacaoId: destination.estacaoId,
      fallbackEstacaoId: destination.fallbackEstacaoId ?? null,
      papel: destination.papel,
      vias: destination.vias,
      imprimirPedidoCompleto: destination.imprimirPedidoCompleto,
    })) ?? [],
    ativa: current?.ativa ?? true,
    version: current?.version,
  }
}

function syncRuleDrafts() {
  const next: Record<number, PrintRuleDraft> = {}
  for (const point of points.value) {
    next[point.id] = dirtyRuleIds.value.has(point.id) && ruleDrafts.value[point.id]
      ? ruleDrafts.value[point.id]
      : createRuleDraft(point.id)
  }
  ruleDrafts.value = next
}

function errorMessage(error: any, fallback: string) {
  return error?.response?.data?.error?.message || error?.message || fallback
}

async function loadData(feedback = false) {
  try {
    loading.value = true
      ;[stations.value, points.value, rules.value, jobs.value] = await Promise.all([
        RestauranteRepository.estacoesImpressao(),
        RestauranteRepository.pontosProducao(),
        RestauranteRepository.regrasImpressao(),
        RestauranteRepository.trabalhosImpressao(),
      ])
    syncRuleDrafts()
    if (feedback) toast.info('Impressão atualizada')
  } catch (error: any) { toast.error(errorMessage(error, 'Não foi possível carregar a impressão.')) }
  finally { loading.value = false }
}

function openStation(item?: RestauranteEstacaoImpressao) {
  currentStation.value = item || null
  pairingToken.value = ''
  stationForm.value = { nome: item?.nome || '', ativa: item?.ativa ?? true, version: item?.version }
  stationModal.value = true
}

async function saveStation() {
  try {
    saving.value = true
    const saved = await RestauranteRepository.salvarEstacaoImpressao(stationForm.value, currentStation.value?.id)
    pairingToken.value = saved.pairingToken || ''
    toast.success(currentStation.value ? 'Conector atualizado' : 'Conector criado')
    await loadData()
    if (!pairingToken.value) stationModal.value = false
  } catch (error: any) { toast.error(errorMessage(error, 'Não foi possível salvar o conector.')) }
  finally { saving.value = false }
}

async function regenerateToken(item: RestauranteEstacaoImpressao) {
  try {
    pairingToken.value = (await RestauranteRepository.regenerarTokenEstacao(item.id)).pairingToken
    currentStation.value = item
    stationModal.value = true
    toast.success('Token regenerado; o token anterior foi invalidado')
    await loadData()
  } catch (error: any) { toast.error(errorMessage(error, 'Não foi possível regenerar o token.')) }
}

async function copyPairingToken() {
  await navigator.clipboard.writeText(pairingToken.value)
  toast.success('Token copiado')
}

function openConnector(item?: typeof connectors.value[number], pairingTokenValue = '') {
  editingConnectorId.value = item?.localId || null
  connectorForm.value = {
    token: pairingTokenValue || item?.token || '',
    printer: item?.printer || printers.value[0] || '',
    paper: item?.paper || '80mm',
    enabled: item?.enabled ?? true,
  }
  connectorModal.value = true
}

function configurePairingToken() {
  const generatedToken = pairingToken.value
  const localConnector = connectors.value.find((item) => item.stationId === currentStation.value?.id)
  stationModal.value = false
  openConnector(localConnector, generatedToken)
}

async function saveConnector() {
  try {
    connectorSaving.value = true
    await printAgent.saveConnector(connectorForm.value, editingConnectorId.value || undefined)
    connectorModal.value = false
    toast.success(editingConnectorId.value ? 'Conexão local atualizada' : 'Impressora adicionada a este computador')
    await loadData()
  } catch (error: any) {
    toast.error(errorMessage(error, 'Não foi possível salvar a conexão local.'))
  } finally {
    connectorSaving.value = false
  }
}

async function toggleConnector(localConnectorId: string, enabled: boolean) {
  const connector = await printAgent.setConnectorEnabled(localConnectorId, enabled)
  if (enabled && !connector?.enabled) toast.error(connector?.lastError || 'Não foi possível ativar esta impressora.')
  else toast.success(enabled ? 'Impressão ativada neste computador' : 'Impressão pausada neste computador')
  await loadData()
}

function removeConnector(localConnectorId: string) {
  printAgent.removeConnector(localConnectorId)
  toast.success('Conexão removida somente deste computador')
}

function managedLocally(stationId: number) {
  return connectors.value.some((item) => item.stationId === stationId)
}

function localConnectorForStation(stationId: number) {
  return connectors.value.find((item) => item.stationId === stationId)
}

function markRuleDirty(pointId: number) {
  dirtyRuleIds.value = new Set([...dirtyRuleIds.value, pointId])
}

function updateRuleDraft(pointId: number, patch: Partial<PrintRuleDraft>) {
  const current = ruleDrafts.value[pointId] ?? createRuleDraft(pointId)
  ruleDrafts.value[pointId] = { ...current, ...patch }
  markRuleDirty(pointId)
}

function updatePrimaryStation(pointId: number, value: string | number | bigint | Record<string, any> | null) {
  const stationId = Number(value)
  const draft = ruleDrafts.value[pointId] ?? createRuleDraft(pointId)
  const updated = changePrimaryStation(draft, stationId)
  ruleDrafts.value[pointId] = {
    ...updated,
    destinosAdicionais: updated.destinosAdicionais.map((destination) => (
      destination.fallbackEstacaoId === stationId ? { ...destination, fallbackEstacaoId: null } : destination
    )),
  }
  markRuleDirty(pointId)
}

function updateFallbackStation(pointId: number, value: string | number | bigint | Record<string, any> | null) {
  updateRuleDraft(pointId, { fallbackEstacaoId: value === 'SEM' ? null : Number(value) })
}

function swapRuleStations(pointId: number) {
  const draft = ruleDrafts.value[pointId]
  if (!draft?.estacaoId || !draft.fallbackEstacaoId) return
  ruleDrafts.value[pointId] = swapPrintStations(draft)
  markRuleDirty(pointId)
}

function cancelRuleChanges(pointId: number) {
  ruleDrafts.value[pointId] = createRuleDraft(pointId)
  dirtyRuleIds.value = new Set([...dirtyRuleIds.value].filter((id) => id !== pointId))
}

function togglePointConfiguration(pointId: number) {
  expandedPointId.value = expandedPointId.value === pointId ? null : pointId
}

function fallbackStations(pointId: number) {
  const draft = ruleDrafts.value[pointId]
  const primaryIds = new Set([
    draft?.estacaoId,
    ...(draft?.destinosAdicionais.map((destination) => destination.estacaoId) ?? []),
  ].filter(Boolean))
  return activeStations.value.filter((station) => !primaryIds.has(station.id))
}

function availablePrimaryStations(pointId: number, destinationIndex = -1) {
  const draft = ruleDrafts.value[pointId]
  const usedByOthers = new Set([
    ...(destinationIndex === -1 ? [] : [draft?.estacaoId]),
    ...(draft?.destinosAdicionais
      .filter((_, index) => index !== destinationIndex)
      .map((destination) => destination.estacaoId) ?? []),
  ].filter(Boolean))
  return activeStations.value.filter((station) => !usedByOthers.has(station.id))
}

function addPrintDestination(pointId: number) {
  const draft = ruleDrafts.value[pointId] ?? createRuleDraft(pointId)
  const used = new Set([draft.estacaoId, ...draft.destinosAdicionais.map((destination) => destination.estacaoId)])
  const station = activeStations.value.find((item) => !used.has(item.id))
  if (!station) return toast.info('Todas as impressoras ativas ja foram adicionadas a este ponto.')
  updateRuleDraft(pointId, {
    fallbackEstacaoId: draft.fallbackEstacaoId === station.id ? null : draft.fallbackEstacaoId,
    destinosAdicionais: [...draft.destinosAdicionais.map((destination) => (
      destination.fallbackEstacaoId === station.id ? { ...destination, fallbackEstacaoId: null } : destination
    )), {
      estacaoId: station.id,
      fallbackEstacaoId: null,
      papel: draft.papel,
      vias: 1,
      imprimirPedidoCompleto: false,
    }],
  })
}

function updateAdditionalDestination(pointId: number, index: number, patch: Partial<PrintDestinationDraft>) {
  const draft = ruleDrafts.value[pointId]
  if (!draft) return
  const destinations = [...draft.destinosAdicionais]
  destinations[index] = { ...destinations[index], ...patch }
  updateRuleDraft(pointId, { destinosAdicionais: destinations })
}

function updateAdditionalPrimary(pointId: number, index: number, value: string | number | bigint | Record<string, any> | null) {
  const draft = ruleDrafts.value[pointId]
  const destination = draft?.destinosAdicionais[index]
  if (!destination) return
  const stationId = Number(value)
  const destinations = draft.destinosAdicionais.map((current, currentIndex) => {
    if (currentIndex === index) return changePrimaryStation(current, stationId)
    return current.fallbackEstacaoId === stationId ? { ...current, fallbackEstacaoId: null } : current
  })
  updateRuleDraft(pointId, {
    fallbackEstacaoId: draft.fallbackEstacaoId === stationId ? null : draft.fallbackEstacaoId,
    destinosAdicionais: destinations,
  })
}

function removeAdditionalDestination(pointId: number, index: number) {
  const draft = ruleDrafts.value[pointId]
  if (!draft) return
  updateRuleDraft(pointId, { destinosAdicionais: draft.destinosAdicionais.filter((_, current) => current !== index) })
}

function stationName(stationId?: number | null) {
  return activeStations.value.find((station) => station.id === stationId)?.nome || 'Não selecionada'
}

async function saveRule(point: RestaurantePontoProducao) {
  const draft = ruleDrafts.value[point.id]
  if (!draft?.estacaoId) return toast.error('Selecione o conector principal.')
  if (draft.fallbackEstacaoId === draft.estacaoId) return toast.error('A contingência deve usar outro conector.')
  const allDestinations = [draft, ...draft.destinosAdicionais]
  const primaryIds = allDestinations.map((destination) => destination.estacaoId).filter(Boolean)
  if (new Set(primaryIds).size !== primaryIds.length) return toast.error('Cada impressora deve aparecer apenas uma vez nas saídas simultâneas.')
  if (allDestinations.some((destination) => destination.fallbackEstacaoId && primaryIds.includes(destination.fallbackEstacaoId))) {
    return toast.error('Uma contingência não pode ser uma impressora que já recebe a impressão simultaneamente.')
  }
  try {
    savingRuleId.value = point.id
    const saved = await RestauranteRepository.salvarRegraImpressao({
      pontoId: point.id,
      estacaoId: draft.estacaoId,
      fallbackEstacaoId: draft.fallbackEstacaoId,
      papel: draft.papel,
      vias: Math.min(5, Math.max(1, Number(draft.vias))),
      imprimirPedidoCompleto: draft.imprimirPedidoCompleto,
      destinosAdicionais: draft.destinosAdicionais.map((destination) => ({
        estacaoId: Number(destination.estacaoId),
        fallbackEstacaoId: destination.fallbackEstacaoId,
        papel: destination.papel,
        vias: Math.min(5, Math.max(1, Number(destination.vias))),
        imprimirPedidoCompleto: destination.imprimirPedidoCompleto,
      })),
      ativa: draft.ativa,
      version: draft.version,
    })
    rules.value = [...rules.value.filter((item) => item.pontoId !== point.id), saved]
    ruleDrafts.value[point.id] = createRuleDraft(point.id)
    dirtyRuleIds.value = new Set([...dirtyRuleIds.value].filter((id) => id !== point.id))
    toast.success(`Destino de ${point.nome} salvo`)
    expandedPointId.value = null
  } catch (error: any) {
    toast.error(errorMessage(error, 'Não foi possível salvar o destino.'))
    if (error?.response?.status === 409) {
      const latestRules = await RestauranteRepository.regrasImpressao().catch(() => null)
      if (latestRules) {
        rules.value = latestRules
        ruleDrafts.value[point.id] = { ...draft, version: latestRules.find((item) => item.pontoId === point.id)?.version }
      }
    }
  } finally {
    savingRuleId.value = null
  }
}

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Nunca'
}

useSocketEvent('restaurante:impressao', () => {
  void loadData()
})

onMounted(() => loadData())
</script>

<template>
  <section class="mx-auto space-y-5">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Printer class="h-6 w-6 text-primary" />Impressão Automática
        </h1>
        <p class="text-sm text-muted-foreground">Conecte este navegador ao QZ Tray e escolha para onde cada pedido será
          enviado.</p>
      </div>
      <Button variant="outline" :disabled="loading" @click="loadData(true)">
        <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />Atualizar
      </Button>
    </header>

    <Alert>
      <CircleAlert class="h-4 w-4" />
      <AlertTitle>Antes de começar</AlertTitle>
      <AlertDescription>O QZ Tray e o GestaoFácil precisam permanecer abertos neste computador, mas você pode navegar
        por qualquer tela do sistema. Não é necessário deixar esta página aberta.</AlertDescription>
    </Alert>

    <div class="grid gap-3 sm:grid-cols-3">
      <div class="flex items-center gap-3 rounded-xl border bg-card p-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg"
          :class="localReady ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'">
          <component :is="localReady ? CheckCircle2 : MonitorCog" class="h-5 w-5" />
        </div>
        <div>
          <p class="text-xs text-muted-foreground">Agente deste navegador</p>
          <p class="text-sm font-medium">{{ localReady ? 'Ativo em todo o sistema' : 'Configuração incompleta' }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-xl border bg-card p-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Cable class="h-5 w-5" />
        </div>
        <div>
          <p class="text-xs text-muted-foreground">Conectados agora</p>
          <p class="text-sm font-medium tabular-nums">{{stations.filter((item) => item.online).length}} de {{
            stations.length }} cadastrados</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-xl border bg-card p-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg"
          :class="failedJobs ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600'">
          <ListChecks class="h-5 w-5" />
        </div>
        <div>
          <p class="text-xs text-muted-foreground">Fila de impressão</p>
          <p class="text-sm font-medium tabular-nums">{{ pendingJobs }} aguardando<span v-if="failedJobs"> · {{
            failedJobs }} com falha</span></p>
        </div>
      </div>
    </div>

    <Tabs v-model="tab">
      <TabsList class="grid h-auto w-full rounded-md grid-cols-1 gap-1 p-1 sm:grid-cols-3">
        <TabsTrigger value="estacoes">
          <MonitorCog class="mr-2 h-4 w-4 inline-flex" />1. Computador e impressoras
        </TabsTrigger>
        <TabsTrigger value="regras">
          <Settings2 class="mr-2 h-4 w-4 inline-flex" />2. Destinos dos pedidos
        </TabsTrigger>
        <TabsTrigger value="fila">
          <ListChecks class="mr-2 h-4 w-4 inline-flex" />Histórico e falhas
        </TabsTrigger>
      </TabsList>

      <TabsContent value="estacoes" class="mt-4 space-y-4">
        <Card>
          <CardHeader class="p-4 pb-3">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle class="flex items-center gap-2 text-lg">
                  <Printer class="h-5 w-5 text-primary" />Impressoras e conectores
                </CardTitle>
                <p class="mt-1 text-sm text-muted-foreground">Visão rápida das impressoras vinculadas aos conectores
                  deste ambiente.</p>
              </div>
              <div class="flex flex-wrap gap-2"><Button size="sm" variant="outline" @click="printAgent.connectQz()">
                  <component :is="qzConnected ? Wifi : WifiOff" class="mr-2 h-4 w-4" />{{ qzConnected ? 'QZ conectado' :
                    'Conectar QZ' }}
                </Button><Button size="sm" @click="managerModal = true">
                  <Settings2 class="mr-2 h-4 w-4" />Gerenciar impressoras
                </Button></div>
            </div>
          </CardHeader>
          <CardContent class="px-4 pb-4">
            <div v-if="stations.length" class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <div v-for="item in stations" :key="item.id" class="rounded-xl border bg-muted/20 p-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="truncate text-sm font-semibold">{{ item.nome }}</p>
                      <CheckCircle2 v-if="managedLocally(item.id)" class="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    </div>
                    <p class="mt-1 truncate text-xs text-muted-foreground">{{ localConnectorForStation(item.id)?.printer
                      || item.impressoraNome || 'Sem impressora vinculada' }}</p>
                  </div><span class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    :class="item.online ? 'bg-emerald-500' : 'bg-muted-foreground/30'" />
                </div>
                <div class="mt-2 flex flex-wrap gap-1">
                  <Badge variant="outline" class="text-[10px]">{{ item.ativa ? 'Ativo' : 'Desativado' }}</Badge>
                  <Badge variant="outline" class="text-[10px]">{{ item.online ? 'Conectado' : 'Sem conexão' }}</Badge>
                  <Badge v-if="localConnectorForStation(item.id)"
                    :variant="localConnectorForStation(item.id)?.enabled ? 'secondary' : 'outline'" class="text-[10px]">
                    {{ localConnectorForStation(item.id)?.enabled ? 'Imprimindo' : 'Pausado' }}</Badge>
                </div>
              </div>
            </div>
            <div v-else class="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhum
              conector cadastrado. Use “Gerenciar impressoras” para começar.</div>
          </CardContent>
        </Card>

      </TabsContent>

      <TabsContent value="regras" class="mt-4 space-y-3">
        <div
          class="flex flex-col gap-2 rounded-xl border bg-muted/20 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-2">
            <Settings2 class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p class="text-sm font-medium">Destinos por ponto produtor</p>
              <p class="text-xs text-muted-foreground">Cada ticket do KDS pode imprimir ao mesmo tempo na cozinha,
                balcão e demais locais.</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Badge variant="outline">{{ points.length }} ponto(s)</Badge>
            <HelpTooltip
              text="Saídas simultâneas sempre recebem uma cópia. A contingência pertence a uma saída e só a substitui quando aquela impressora falha." />
          </div>
        </div>

        <div v-if="!activeStations.length" class="rounded-xl border border-dashed p-8 text-center">
          <Cable class="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p class="font-medium">Nenhum conector ativo</p>
          <p class="mt-1 text-sm text-muted-foreground">Crie ou ative um conector QZ na primeira aba antes de configurar
            os destinos.</p>
        </div>

        <div v-else class="space-y-2">
          <Card v-for="point in points" :key="point.id" class="overflow-hidden"
            :class="{ 'border-amber-500/50': dirtyRuleIds.has(point.id) }">
            <CardHeader class="p-3">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex min-w-0 items-start gap-3">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Printer class="h-4 w-4" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <CardTitle class="text-sm">{{ point.nome }}</CardTitle>
                      <Badge :variant="ruleDrafts[point.id]?.ativa ? 'secondary' : 'outline'" class="text-[10px]">{{
                        ruleDrafts[point.id]?.ativa ? 'Ativo' : 'Pausado' }}</Badge>
                      <Badge v-if="dirtyRuleIds.has(point.id)" variant="outline"
                        class="border-amber-500/50 text-[10px] text-amber-700 dark:text-amber-300">Não salvo</Badge>
                    </div>
                    <div v-if="ruleDrafts[point.id]" class="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                      <Badge variant="outline" class="text-[10px]">{{ 1 + ruleDrafts[point.id].destinosAdicionais.length
                      }} saída(s)</Badge><span
                        class="max-w-44 truncate rounded-md bg-primary/10 px-2 py-1 font-medium text-primary">{{
                          stationName(ruleDrafts[point.id].estacaoId) }}</span><span class="text-muted-foreground">· {{
                          ruleDrafts[point.id].papel }} · {{ ruleDrafts[point.id].vias }} via(s) · {{
                          ruleDrafts[point.id].imprimirPedidoCompleto ? 'Pedido completo' : 'Itens do ponto' }}</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="ghost" class="shrink-0 justify-between lg:justify-center"
                  @click="togglePointConfiguration(point.id)">
                  <Settings2 class="mr-2 h-4 w-4" />{{ expandedPointId === point.id ? 'Fechar' : 'Configurar' }}
                  <ChevronDown class="ml-2 h-4 w-4 transition-transform"
                    :class="{ 'rotate-180': expandedPointId === point.id }" />
                </Button>
              </div>
            </CardHeader>

            <CardContent v-if="ruleDrafts[point.id] && expandedPointId === point.id"
              class="space-y-3 border-t bg-muted/10 p-3">
              <div class="grid items-end gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                <div class="space-y-1.5"><Label :for="`primary-${point.id}`">Primeira saída</Label><Select
                    :disabled="!canConfigure" :model-value="String(ruleDrafts[point.id].estacaoId || '')"
                    @update:model-value="updatePrimaryStation(point.id, $event)">
                    <SelectTrigger :id="`primary-${point.id}`" class="bg-background">
                      <SelectValue placeholder="Selecione a impressora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="item in availablePrimaryStations(point.id)" :key="item.id"
                        :value="String(item.id)">{{ item.nome }}{{ item.online ? ' · conectado' : ' · sem conexão' }}
                      </SelectItem>
                    </SelectContent>
                  </Select></div>
                <div class="flex h-10 items-center justify-center"><Button v-if="ruleDrafts[point.id].fallbackEstacaoId"
                    type="button" size="sm" variant="outline" :disabled="!canConfigure"
                    @click="swapRuleStations(point.id)">
                    <ArrowLeftRight class="mr-2 h-3.5 w-3.5" />Inverter
                  </Button>
                  <ArrowRight v-else class="h-4 w-4 rotate-90 text-muted-foreground md:rotate-0" />
                </div>
                <div class="space-y-1.5">
                  <div class="flex items-center gap-1"><Label :for="`fallback-${point.id}`">Contingência</Label>
                    <HelpTooltip
                      text="Opcional. Só recebe o ticket se o conector principal falhar após as tentativas automáticas." />
                  </div><Select :disabled="!canConfigure"
                    :model-value="String(ruleDrafts[point.id].fallbackEstacaoId || 'SEM')"
                    @update:model-value="updateFallbackStation(point.id, $event)">
                    <SelectTrigger :id="`fallback-${point.id}`" class="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEM">Sem contingência</SelectItem>
                      <SelectItem v-for="item in fallbackStations(point.id)" :key="item.id" :value="String(item.id)">{{
                        item.nome }}{{ item.online ? ' · conectado' : ' · sem conexão' }}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-[130px_100px_minmax(0,1fr)_minmax(0,1fr)]">
                <div class="space-y-1.5"><Label :for="`paper-${point.id}`">Papel</Label><Select
                    :disabled="!canConfigure" :model-value="ruleDrafts[point.id].papel"
                    @update:model-value="updateRuleDraft(point.id, { papel: $event as '58mm' | '80mm' })">
                    <SelectTrigger :id="`paper-${point.id}`">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58mm">58 mm</SelectItem>
                      <SelectItem value="80mm">80 mm</SelectItem>
                    </SelectContent>
                  </Select></div>
                <div class="space-y-1.5"><Label :for="`copies-${point.id}`">Vias</Label><Input
                    :id="`copies-${point.id}`" :disabled="!canConfigure" :model-value="ruleDrafts[point.id].vias"
                    type="number" min="1" max="5"
                    @update:model-value="updateRuleDraft(point.id, { vias: Number($event) })" /></div>
                <div class="flex min-h-10 items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2">
                  <div>
                    <p class="text-sm font-medium">Pedido completo</p>
                    <p class="text-[11px] text-muted-foreground">Inclui itens dos outros pontos.</p>
                  </div>
                  <Switch :disabled="!canConfigure" :model-value="ruleDrafts[point.id].imprimirPedidoCompleto"
                    @update:model-value="updateRuleDraft(point.id, { imprimirPedidoCompleto: $event })" />
                </div>
                <div class="flex min-h-10 items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2">
                  <div>
                    <p class="text-sm font-medium">Destino ativo</p>
                    <p class="text-[11px] text-muted-foreground">Permite novas impressões.</p>
                  </div>
                  <Switch :disabled="!canConfigure" :model-value="ruleDrafts[point.id].ativa"
                    @update:model-value="updateRuleDraft(point.id, { ativa: $event })" />
                </div>
              </div>

              <div class="space-y-2 rounded-xl border bg-background p-3">
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div class="flex items-center gap-1">
                      <p class="text-sm font-medium">Outras saídas simultâneas</p>
                      <HelpTooltip compact
                        text="Use para imprimir o mesmo ticket também no balcão, expedição ou outro local. Esses locais não aparecem no KDS porque não produzem o item." />
                    </div>
                    <p class="text-xs text-muted-foreground">Cada linha abaixo gera uma impressão independente junto com
                      a primeira saída.</p>
                  </div>
                  <Button v-if="canConfigure" type="button" size="sm" variant="outline"
                    :disabled="activeStations.length <= 1 + ruleDrafts[point.id].destinosAdicionais.length"
                    @click="addPrintDestination(point.id)">
                    <Plus class="mr-2 h-3.5 w-3.5" />Adicionar impressora
                  </Button>
                </div>
                <div v-for="(destination, index) in ruleDrafts[point.id].destinosAdicionais"
                  :key="`${point.id}-${index}`"
                  class="grid items-end gap-3 rounded-lg border bg-muted/10 p-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_minmax(190px,1.2fr)_90px_72px_minmax(170px,1fr)_40px]">
                  <div class="grid gap-1">
                    <div class="flex h-5 items-center"><Label
                        :for="`extra-station-${point.id}-${index}`">Impressora</Label></div><Select
                      :disabled="!canConfigure" :model-value="String(destination.estacaoId || '')"
                      @update:model-value="updateAdditionalPrimary(point.id, index, $event)">
                      <SelectTrigger :id="`extra-station-${point.id}-${index}`" class="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="item in availablePrimaryStations(point.id, index)" :key="item.id"
                          :value="String(item.id)">{{ item.nome }}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="grid gap-1">
                    <div class="flex h-5 items-center gap-1"><Label
                        :for="`extra-fallback-${point.id}-${index}`">Contingência</Label>
                      <HelpTooltip compact text="Só recebe esta cópia se a impressora desta linha falhar." />
                    </div><Select :disabled="!canConfigure"
                      :model-value="String(destination.fallbackEstacaoId || 'SEM')"
                      @update:model-value="updateAdditionalDestination(point.id, index, { fallbackEstacaoId: $event === 'SEM' ? null : Number($event) })">
                      <SelectTrigger :id="`extra-fallback-${point.id}-${index}`" class="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SEM">Sem contingência</SelectItem>
                        <SelectItem v-for="item in fallbackStations(point.id)" :key="item.id" :value="String(item.id)">
                          {{ item.nome }}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="grid gap-1">
                    <div class="flex h-5 items-center"><Label :for="`extra-paper-${point.id}-${index}`">Papel</Label>
                    </div><Select :disabled="!canConfigure" :model-value="destination.papel"
                      @update:model-value="updateAdditionalDestination(point.id, index, { papel: $event as '58mm' | '80mm' })">
                      <SelectTrigger :id="`extra-paper-${point.id}-${index}`" class="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="58mm">58 mm</SelectItem>
                        <SelectItem value="80mm">80 mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="grid gap-1">
                    <div class="flex h-5 items-center"><Label :for="`extra-copies-${point.id}-${index}`">Vias</Label>
                    </div><Input :id="`extra-copies-${point.id}-${index}`" class="w-full" :disabled="!canConfigure"
                      :model-value="destination.vias" type="number" min="1" max="5"
                      @update:model-value="updateAdditionalDestination(point.id, index, { vias: Number($event) })" />
                  </div>
                  <div class="flex h-10 items-center justify-between gap-3 rounded-md border bg-background px-3">
                    <div class="min-w-0">
                      <p class="text-xs font-medium">Pedido completo</p>
                      <p class="truncate text-[10px] text-muted-foreground">Ou só itens do ponto</p>
                    </div>
                    <Switch class="shrink-0" :disabled="!canConfigure" :model-value="destination.imprimirPedidoCompleto"
                      @update:model-value="updateAdditionalDestination(point.id, index, { imprimirPedidoCompleto: $event })" />
                  </div>
                  <div class="flex h-10 items-center justify-center"><Button type="button" size="icon" variant="ghost"
                      :disabled="!canConfigure" aria-label="Remover saída"
                      @click="removeAdditionalDestination(point.id, index)">
                      <Trash2 class="h-4 w-4" />
                    </Button></div>
                </div>
                <p v-if="!ruleDrafts[point.id].destinosAdicionais.length"
                  class="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">Somente a primeira
                  saída está configurada. Adicione outra impressora para enviar também ao balcão ou a outro local.</p>
              </div>

              <div v-if="canConfigure" class="flex flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-end">
                <Button size="sm" variant="ghost" :disabled="!dirtyRuleIds.has(point.id) || savingRuleId === point.id"
                  @click="cancelRuleChanges(point.id)">
                  <Undo2 class="mr-2 h-4 w-4" />Descartar
                </Button><Button size="sm"
                  :disabled="!dirtyRuleIds.has(point.id) || !ruleDrafts[point.id].estacaoId || savingRuleId === point.id"
                  @click="saveRule(point)">
                  <LoaderCircle v-if="savingRuleId === point.id" class="mr-2 h-4 w-4 animate-spin" />
                  <Save v-else class="mr-2 h-4 w-4" />Salvar destino
                </Button>
              </div>
            </CardContent>
          </Card>
          <p v-if="!points.length"
            class="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Cadastre os pontos de
            produção no KDS antes de configurar os destinos de impressão.</p>
        </div>
      </TabsContent>

      <TabsContent value="fila" class="mt-4 space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="font-semibold">Histórico de impressão</h2>
            <p class="text-sm text-muted-foreground">Acompanhe tickets aguardando, impressos ou com falha.</p>
          </div>
          <HelpTooltip
            text="Falhas ficam registradas para diagnóstico. A fila tenta novamente conforme a política do servidor e evita imprimir duas vezes o mesmo ticket neste computador." />
        </div>
        <div class="space-y-2">
          <div v-for="job in jobs" :key="job.id"
            class="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="font-medium">Pedido {{ job.Ticket.Pedido.codigo }}</p>
                <Badge variant="secondary">{{ job.Ponto.nome }}</Badge>
              </div>
              <p class="mt-1 text-xs text-muted-foreground">{{ job.Estacao.nome }} · papel {{ job.papel }} · {{ job.vias
              }} via(s) · {{ formatDate(job.createdAt) }}</p>
              <p v-if="job.erro" class="mt-2 rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">{{
                job.erro }}</p>
            </div>
            <Badge
              :variant="job.status === 'CONCLUIDO' ? 'default' : job.status === 'FALHOU' ? 'destructive' : 'outline'">{{
                statusLabels[job.status] }}</Badge>
          </div>
          <p v-if="!jobs.length" class="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhuma impressão registrada ainda.</p>
        </div>
      </TabsContent>
    </Tabs>

    <Dialog v-model:open="managerModal">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Gerenciar impressoras e conectores</DialogTitle>
          <DialogDescription>Cadastre o conector e vincule sua impressora no mesmo lugar. Um computador pode controlar
            várias impressoras pelo mesmo QZ Tray.</DialogDescription>
        </DialogHeader>

        <div class="grid gap-2 rounded-xl border bg-muted/30 p-3 text-xs sm:grid-cols-3">
          <p><strong>Ativo:</strong> disponível nos destinos.</p>
          <p><strong>Conectado:</strong> contato nos últimos 30 segundos.</p>
          <p><strong>Imprimindo:</strong> habilitado neste computador.</p>
        </div>

        <div class="flex flex-wrap gap-2"><Button size="sm" variant="outline" @click="printAgent.connectQz()">
            <RefreshCw class="mr-2 h-4 w-4" />{{ qzConnected ? `${printers.length} impressora(s) encontradas` :
              'Conectar QZ Tray' }}
          </Button><Button size="sm" variant="outline" :disabled="!qzConnected" @click="openConnector()">
            <Plus class="mr-2 h-4 w-4" />Vincular por token
          </Button><Button v-if="canConfigure" size="sm" @click="openStation()">
            <Plus class="mr-2 h-4 w-4" />Novo conector
          </Button></div>

        <div class="space-y-2">
          <div v-for="item in stations" :key="item.id" class="rounded-xl border p-3">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="font-semibold">{{ item.nome }}</p>
                  <Badge variant="outline" class="text-[10px]">{{ item.ativa ? 'Ativo' : 'Desativado' }}</Badge>
                  <Badge variant="outline" class="text-[10px]">{{ item.online ? 'Conectado' : 'Sem conexão' }}</Badge>
                  <Badge v-if="localConnectorForStation(item.id)"
                    :variant="localConnectorForStation(item.id)?.enabled ? 'secondary' : 'outline'" class="text-[10px]">
                    {{ localConnectorForStation(item.id)?.enabled ? 'Imprimindo' : 'Pausado' }}</Badge>
                </div>
                <p class="mt-1 text-sm">
                  {{ (localConnectorForStation(item.id)?.printer || item.impressoraNome || 'Nenhuma impressora vinculada neste computador') }}
                </p>
                <p class="mt-1 text-xs text-muted-foreground">Papel {{ localConnectorForStation(item.id)?.paper ||
                  item.papelReportado || 'não informado' }} · Último contato: {{
                    formatDate(localConnectorForStation(item.id)?.lastActivityAt || item.lastSeenAt) }}</p>
                <p v-if="localConnectorForStation(item.id)?.lastError"
                  class="mt-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{{
                    localConnectorForStation(item.id)?.lastError }}</p>
              </div>
              <Switch v-if="localConnectorForStation(item.id)" :model-value="localConnectorForStation(item.id)?.enabled"
                :aria-label="`Ativar ${item.nome}`"
                @update:model-value="toggleConnector(String(localConnectorForStation(item.id)?.localId), $event)" />
            </div>
            <div class="mt-3 flex flex-wrap gap-2 border-t pt-3"><Button v-if="localConnectorForStation(item.id)"
                size="sm" variant="outline" @click="openConnector(localConnectorForStation(item.id))">
                <Pencil class="mr-2 h-3.5 w-3.5" />Impressora
              </Button><Button v-else size="sm" variant="outline" :disabled="!qzConnected" @click="openConnector()">
                <Printer class="mr-2 h-3.5 w-3.5" />Vincular neste PC
              </Button><Button v-if="canConfigure" size="sm" variant="ghost" @click="openStation(item)">
                <Settings2 class="mr-2 h-3.5 w-3.5" />Cadastro
              </Button><Button v-if="canConfigure" size="sm" variant="ghost" @click="regenerateToken(item)">
                <RotateCcw class="mr-2 h-3.5 w-3.5" />Trocar token
              </Button><Button v-if="localConnectorForStation(item.id)" size="sm" variant="ghost"
                @click="removeConnector(String(localConnectorForStation(item.id)?.localId))">
                <Trash2 class="mr-2 h-3.5 w-3.5" />Desvincular deste PC
              </Button></div>
          </div>
          <div v-for="item in unmatchedConnectors" :key="item.localId"
            class="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold">Conexão aguardando identificação</p>
                <p class="mt-1 text-sm">{{ item.printer }}</p>
                <p class="mt-1 text-xs text-muted-foreground">Edite o token para concluir o vínculo com o cadastro.</p>
              </div>
              <Switch :model-value="item.enabled" @update:model-value="toggleConnector(item.localId, $event)" />
            </div>
            <div class="mt-3 flex gap-2"><Button size="sm" variant="outline" @click="openConnector(item)">
                <Pencil class="mr-2 h-3.5 w-3.5" />Editar
              </Button><Button size="sm" variant="ghost" @click="removeConnector(item.localId)">
                <Trash2 class="mr-2 h-3.5 w-3.5" />Remover
              </Button></div>
          </div>
          <p v-if="!stations.length && !unmatchedConnectors.length"
            class="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhuma impressora
            configurada.</p>
        </div>

        <DialogFooter><Button variant="outline" @click="managerModal = false">Fechar</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="stationModal">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ currentStation ? 'Editar conector cadastrado' : 'Novo conector cadastrado' }}</DialogTitle>
          <DialogDescription>Crie um conector para representar uma impressora. Depois use o token para adicionar essa
            impressora a qualquer computador com QZ Tray.</DialogDescription>
        </DialogHeader>
        <div v-if="pairingToken" class="space-y-3">
          <div class="space-y-2"><Label>Token desta impressora</Label>
            <div class="flex gap-2"><Input :model-value="pairingToken" readonly /><Button size="icon" variant="outline"
                @click="copyPairingToken">
                <Copy class="h-4 w-4" />
              </Button></div>
            <p class="text-xs text-amber-600">O token só aparece agora. Adicione-o a este computador ou copie para
              configurar em outro.</p>
          </div><Button v-if="qzConnected" class="w-full" @click="configurePairingToken">
            <Printer class="mr-2 h-4 w-4" />Adicionar esta impressora ao computador
          </Button>
        </div>
        <div v-else class="space-y-4">
          <div class="space-y-2"><Label>Nome para identificação</Label><Input v-model="stationForm.nome"
              placeholder="Ex.: Impressora da cozinha" /></div>
          <div class="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p class="text-sm font-medium">Cadastro ativo</p>
              <p class="text-xs text-muted-foreground">Permite usar este conector nos destinos dos pedidos.</p>
            </div>
            <Switch v-model:model-value="stationForm.ativa" />
          </div>
        </div>
        <DialogFooter><Button variant="outline" @click="stationModal = false">Fechar</Button><Button
            v-if="!pairingToken" :disabled="saving || !stationForm.nome.trim()" @click="saveStation">Salvar e gerar
            token</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="connectorModal">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {{ (editingConnectorId ? 'Editar impressora deste computador' : 'Adicionar impressora a este computador') }}
          </DialogTitle>
          <DialogDescription>Associe um token de conector a uma impressora instalada. Repita este processo para
            controlar outras impressoras no mesmo PC.</DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div class="space-y-2"><Label>Token do conector cadastrado</Label><Input v-model="connectorForm.token"
              type="password" placeholder="Cole o token gerado para esta impressora" />
            <p class="text-xs text-muted-foreground">Cada token só pode aparecer uma vez nesta lista.</p>
          </div>
          <div class="space-y-2"><Label>Impressora instalada</Label><Select v-model="connectorForm.printer">
              <SelectTrigger>
                <SelectValue placeholder="Selecione a impressora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="item in printers" :key="item" :value="item">{{ item }}</SelectItem>
              </SelectContent>
            </Select></div>
          <div class="space-y-2"><Label>Largura do papel</Label><Select v-model="connectorForm.paper">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="58mm">58 mm</SelectItem>
                <SelectItem value="80mm">80 mm</SelectItem>
              </SelectContent>
            </Select></div>
          <div class="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p class="text-sm font-medium">Imprimir neste computador</p>
              <p class="text-xs text-muted-foreground">Envia contato automático e busca os pedidos deste conector.</p>
            </div>
            <Switch v-model:model-value="connectorForm.enabled" />
          </div>
        </div>
        <DialogFooter><Button variant="outline" @click="connectorModal = false">Cancelar</Button><Button
            :disabled="connectorSaving || !connectorForm.token.trim() || !connectorForm.printer" @click="saveConnector">
            <LoaderCircle v-if="connectorSaving" class="mr-2 h-4 w-4 animate-spin" />
            <Save v-else class="mr-2 h-4 w-4" />Salvar conexão
          </Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>
