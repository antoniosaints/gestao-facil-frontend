<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSocketEvent } from '@/composables/useSocketEvent'
import {
  RestauranteRepository,
  type RestauranteEstacaoImpressao,
  type RestaurantePontoProducao,
  type RestauranteRegraImpressao,
  type RestauranteTrabalhoImpressao,
} from '@/repositories/restaurante-repository'
import qzTray, { type PaperSize } from '@/utils/qzTray'
import { Cable, Copy, ListChecks, Plus, Printer, RefreshCw, RotateCcw, Settings2, Wifi, WifiOff } from 'lucide-vue-next'

const TOKEN_KEY = 'restaurante:qz:station-token'
const PRINTER_KEY = 'restaurante:qz:printer'
const PAPER_KEY = 'restaurante:qz:paper'
const ENABLED_KEY = 'restaurante:qz:enabled'
const PRINTED_KEY = 'restaurante:qz:printed-jobs'

const toast = useToast()
const tab = ref('estacoes')
const loading = ref(false)
const saving = ref(false)
const processing = ref(false)
const qzConnected = ref(false)
const stations = ref<RestauranteEstacaoImpressao[]>([])
const points = ref<RestaurantePontoProducao[]>([])
const rules = ref<RestauranteRegraImpressao[]>([])
const jobs = ref<RestauranteTrabalhoImpressao[]>([])
const printers = ref<string[]>([])
const stationModal = ref(false)
const currentStation = ref<RestauranteEstacaoImpressao | null>(null)
const pairingToken = ref('')
const stationForm = ref({ nome: '', ativa: true, version: undefined as number | undefined })
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const printer = ref(localStorage.getItem(PRINTER_KEY) || '')
const paper = ref<'58mm' | '80mm'>((localStorage.getItem(PAPER_KEY) as '58mm' | '80mm') || '80mm')
const serviceEnabled = ref(localStorage.getItem(ENABLED_KEY) === 'true')
let pollingTimer: ReturnType<typeof setInterval> | null = null

const activeStations = computed(() => stations.value.filter((item) => item.ativa))
const statusLabels: Record<RestauranteTrabalhoImpressao['status'], string> = {
  PENDENTE: 'Pendente', EM_PROCESSAMENTO: 'Processando', CONCLUIDO: 'Impresso', FALHOU: 'Falhou', CANCELADO: 'Cancelado',
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
    toast.success(currentStation.value ? 'Estação atualizada' : 'Estação criada')
    await loadData()
    if (!pairingToken.value) stationModal.value = false
  } catch (error: any) { toast.error(errorMessage(error, 'Não foi possível salvar a estação.')) }
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

function ruleFor(pointId: number) {
  return rules.value.find((item) => item.pontoId === pointId)
}

async function saveRule(point: RestaurantePontoProducao, patch: Partial<RestauranteRegraImpressao>) {
  const current = ruleFor(point.id)
  const stationId = Number(patch.estacaoId ?? current?.estacaoId ?? activeStations.value[0]?.id)
  if (!stationId) return toast.error('Cadastre uma estação antes de criar a regra.')
  const fallbackValue = patch.fallbackEstacaoId !== undefined ? patch.fallbackEstacaoId : current?.fallbackEstacaoId
  try {
    const saved = await RestauranteRepository.salvarRegraImpressao({
      pontoId: point.id,
      estacaoId: stationId,
      fallbackEstacaoId: fallbackValue ? Number(fallbackValue) : null,
      papel: patch.papel ?? current?.papel ?? '80mm',
      vias: Number(patch.vias ?? current?.vias ?? 1),
      imprimirPedidoCompleto: patch.imprimirPedidoCompleto ?? current?.imprimirPedidoCompleto ?? false,
      ativa: patch.ativa ?? current?.ativa ?? true,
      version: current?.version,
    })
    rules.value = [...rules.value.filter((item) => item.pontoId !== point.id), saved]
    toast.success(`Regra de ${point.nome} salva`)
  } catch (error: any) { toast.error(errorMessage(error, 'Não foi possível salvar a regra.')) }
}

async function connectQz() {
  try {
    await qzTray.connect()
    printers.value = await qzTray.getPrinters()
    qzConnected.value = true
    if (!printer.value && printers.value.length) printer.value = printers.value[0]
    toast.success('QZ Tray conectado')
  } catch (error: any) {
    qzConnected.value = false
    toast.error(errorMessage(error, 'Não foi possível conectar ao QZ Tray.'))
  }
}

function saveLocalConfig() {
  token.value = token.value.trim()
  localStorage.setItem(TOKEN_KEY, token.value)
  localStorage.setItem(PRINTER_KEY, printer.value)
  localStorage.setItem(PAPER_KEY, paper.value)
  localStorage.setItem(ENABLED_KEY, String(serviceEnabled.value))
  toast.success('Configuração local salva')
  if (serviceEnabled.value) void pollJobs()
}

function printedUids() {
  try { return JSON.parse(localStorage.getItem(PRINTED_KEY) || '[]') as string[] }
  catch { return [] }
}

function rememberPrinted(uid: string) {
  localStorage.setItem(PRINTED_KEY, JSON.stringify([uid, ...printedUids().filter((item) => item !== uid)].slice(0, 500)))
}

async function pollJobs() {
  if (!serviceEnabled.value || !qzConnected.value || !token.value || !printer.value || processing.value) return
  processing.value = true
  try {
    await RestauranteRepository.heartbeatEstacao(token.value, { impressoraNome: printer.value, papel: paper.value })
    const pending = await RestauranteRepository.buscarTrabalhosEstacao(token.value)
    for (const job of pending) {
      try {
        if (!printedUids().includes(job.uid)) {
          await qzTray.printRaw(job.conteudo, {
            printer: printer.value,
            paper: job.papel as PaperSize,
            copies: job.vias,
            jobName: `Restaurante ${job.uid}`,
          })
          rememberPrinted(job.uid)
        }
        await RestauranteRepository.confirmarTrabalhoEstacao(token.value, { uid: job.uid, leaseToken: job.leaseToken, success: true })
      } catch (error: any) {
        await RestauranteRepository.confirmarTrabalhoEstacao(token.value, {
          uid: job.uid, leaseToken: job.leaseToken, success: false, error: errorMessage(error, 'Falha local de impressão'),
        }).catch(() => undefined)
      }
    }
    if (pending.length) await loadData()
  } catch (error: any) {
    if (error?.response?.status === 401) serviceEnabled.value = false
    toast.error(errorMessage(error, 'Estação de impressão indisponível.'))
  } finally { processing.value = false }
}

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Nunca'
}

useSocketEvent('restaurante:impressao', () => {
  void loadData()
  void pollJobs()
})

onMounted(async () => {
  await loadData()
  if (serviceEnabled.value) await connectQz()
  pollingTimer = setInterval(() => void pollJobs(), 10000)
  void pollJobs()
})
onUnmounted(() => { if (pollingTimer) clearInterval(pollingTimer) })
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight"><Printer class="h-6 w-6 text-primary" />Impressão QZ</h1><p class="text-sm text-muted-foreground">Fila persistente por ponto de produção, com retentativa e estação de contingência.</p></div>
      <Button variant="outline" :disabled="loading" @click="loadData(true)"><RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />Atualizar</Button>
    </header>

    <Tabs v-model="tab">
      <TabsList class="grid w-full max-w-xl grid-cols-3"><TabsTrigger value="estacoes"><Cable class="mr-2 h-4 w-4" />Estações</TabsTrigger><TabsTrigger value="regras"><Settings2 class="mr-2 h-4 w-4" />Regras</TabsTrigger><TabsTrigger value="fila"><ListChecks class="mr-2 h-4 w-4" />Fila</TabsTrigger></TabsList>

      <TabsContent value="estacoes" class="mt-4 space-y-4">
        <Card><CardHeader><CardTitle class="flex items-center gap-2 text-lg"><Cable class="h-5 w-5" />Esta estação</CardTitle></CardHeader><CardContent class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2 md:col-span-2"><Label>Token de pareamento</Label><Input v-model="token" type="password" placeholder="Cole o token exibido ao cadastrar a estação" /></div>
          <div class="space-y-2"><Label>Impressora QZ</Label><Select v-model="printer"><SelectTrigger><SelectValue placeholder="Selecione uma impressora" /></SelectTrigger><SelectContent><SelectItem v-for="item in printers" :key="item" :value="item">{{ item }}</SelectItem></SelectContent></Select></div>
          <div class="space-y-2"><Label>Papel reportado</Label><Select v-model="paper"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="58mm">58 mm</SelectItem><SelectItem value="80mm">80 mm</SelectItem></SelectContent></Select></div>
          <div class="flex items-center justify-between rounded-xl border p-3 md:col-span-2"><div><p class="font-medium">Serviço local ativo</p><p class="text-xs text-muted-foreground">Consulta a fila a cada 10 segundos e também reage aos eventos em tempo real.</p></div><Switch v-model:model-value="serviceEnabled" /></div>
          <div class="flex flex-wrap gap-2 md:col-span-2"><Button variant="outline" @click="connectQz"><Wifi class="mr-2 h-4 w-4" />Conectar QZ</Button><Button :disabled="!token.trim() || !printer" @click="saveLocalConfig">Salvar e iniciar</Button><Badge variant="outline" class="ml-auto"><component :is="qzConnected ? Wifi : WifiOff" class="mr-1 h-3.5 w-3.5" />{{ qzConnected ? 'QZ conectado' : 'QZ desconectado' }}</Badge></div>
        </CardContent></Card>

        <div class="flex items-center justify-between"><h2 class="font-semibold">Estações cadastradas</h2><Button size="sm" @click="openStation()"><Plus class="mr-2 h-4 w-4" />Nova estação</Button></div>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><Card v-for="item in stations" :key="item.id"><CardHeader class="pb-2"><div class="flex items-start justify-between"><CardTitle class="text-base">{{ item.nome }}</CardTitle><Badge :variant="item.online ? 'default' : 'outline'">{{ item.online ? 'Online' : 'Offline' }}</Badge></div></CardHeader><CardContent class="space-y-3 text-sm"><p class="text-muted-foreground">{{ item.impressoraNome || 'Nenhuma impressora reportada' }} · {{ item.papelReportado || 'papel não informado' }}</p><p class="text-xs text-muted-foreground">Último contato: {{ formatDate(item.lastSeenAt) }}</p><div class="flex gap-2"><Button size="sm" variant="outline" @click="openStation(item)"><Settings2 class="mr-2 h-3.5 w-3.5" />Editar</Button><Button size="sm" variant="ghost" @click="regenerateToken(item)"><RotateCcw class="mr-2 h-3.5 w-3.5" />Novo token</Button></div></CardContent></Card><p v-if="!stations.length" class="text-sm text-muted-foreground">Nenhuma estação cadastrada.</p></div>
      </TabsContent>

      <TabsContent value="regras" class="mt-4"><div class="grid gap-4 lg:grid-cols-2"><Card v-for="point in points" :key="point.id"><CardHeader><CardTitle class="text-base">{{ point.nome }}</CardTitle></CardHeader><CardContent class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2"><Label>Estação principal</Label><Select :model-value="String(ruleFor(point.id)?.estacaoId || activeStations[0]?.id || '')" @update:model-value="saveRule(point, { estacaoId: Number($event) })"><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem v-for="item in activeStations" :key="item.id" :value="String(item.id)">{{ item.nome }}</SelectItem></SelectContent></Select></div>
        <div class="space-y-2"><Label>Contingência</Label><Select :model-value="String(ruleFor(point.id)?.fallbackEstacaoId || 'SEM')" @update:model-value="saveRule(point, { fallbackEstacaoId: $event === 'SEM' ? null : Number($event) })"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SEM">Sem fallback</SelectItem><SelectItem v-for="item in activeStations.filter((station) => station.id !== ruleFor(point.id)?.estacaoId)" :key="item.id" :value="String(item.id)">{{ item.nome }}</SelectItem></SelectContent></Select></div>
        <div class="space-y-2"><Label>Papel</Label><Select :model-value="ruleFor(point.id)?.papel || '80mm'" @update:model-value="saveRule(point, { papel: $event as '58mm' | '80mm' })"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="58mm">58 mm</SelectItem><SelectItem value="80mm">80 mm</SelectItem></SelectContent></Select></div>
        <div class="space-y-2"><Label>Vias</Label><Input :model-value="ruleFor(point.id)?.vias || 1" type="number" min="1" max="5" @change="saveRule(point, { vias: Number(($event.target as HTMLInputElement).value) })" /></div>
        <div class="flex items-center justify-between rounded-lg border p-3 sm:col-span-2"><div><p class="text-sm font-medium">Imprimir pedido completo</p><p class="text-xs text-muted-foreground">Inclui itens de todos os pontos neste ticket.</p></div><Switch :model-value="ruleFor(point.id)?.imprimirPedidoCompleto || false" @update:model-value="saveRule(point, { imprimirPedidoCompleto: $event })" /></div>
        <div class="flex items-center justify-between rounded-lg border p-3 sm:col-span-2"><p class="text-sm font-medium">Regra ativa</p><Switch :model-value="ruleFor(point.id)?.ativa ?? false" @update:model-value="saveRule(point, { ativa: $event })" /></div>
      </CardContent></Card><p v-if="!points.length" class="text-sm text-muted-foreground">Cadastre os pontos no KDS antes de configurar a impressão.</p></div></TabsContent>

      <TabsContent value="fila" class="mt-4"><div class="space-y-2"><div v-for="job in jobs" :key="job.id" class="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p class="font-medium">Pedido {{ job.Ticket.Pedido.codigo }} · {{ job.Ponto.nome }}</p><p class="text-xs text-muted-foreground">{{ job.Estacao.nome }} · {{ job.papel }} · {{ job.vias }} via(s) · {{ formatDate(job.createdAt) }}</p><p v-if="job.erro" class="mt-1 text-xs text-destructive">{{ job.erro }}</p></div><Badge variant="outline">{{ statusLabels[job.status] }}</Badge></div><p v-if="!jobs.length" class="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum trabalho de impressão.</p></div></TabsContent>
    </Tabs>

    <Dialog v-model:open="stationModal"><DialogContent><DialogHeader><DialogTitle>{{ currentStation ? 'Editar estação' : 'Nova estação' }}</DialogTitle><DialogDescription>O token só é exibido uma vez. Cole-o no computador que executa o QZ Tray.</DialogDescription></DialogHeader><div v-if="pairingToken" class="space-y-2"><Label>Token de pareamento</Label><div class="flex gap-2"><Input :model-value="pairingToken" readonly /><Button size="icon" variant="outline" @click="copyPairingToken"><Copy class="h-4 w-4" /></Button></div><p class="text-xs text-amber-600">Guarde este token agora; ele não poderá ser consultado novamente.</p></div><div v-else class="space-y-4"><div class="space-y-2"><Label>Nome</Label><Input v-model="stationForm.nome" placeholder="Ex.: Cozinha principal" /></div><div class="flex items-center justify-between rounded-lg border p-3"><p class="text-sm font-medium">Estação ativa</p><Switch v-model:model-value="stationForm.ativa" /></div></div><DialogFooter><Button variant="outline" @click="stationModal = false">Fechar</Button><Button v-if="!pairingToken" :disabled="saving || !stationForm.nome.trim()" @click="saveStation">Salvar</Button></DialogFooter></DialogContent></Dialog>
  </section>
</template>
