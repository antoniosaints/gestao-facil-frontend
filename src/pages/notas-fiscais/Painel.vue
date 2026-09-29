<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { endOfMonth, format, startOfMonth, subDays, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from 'vue-toastification'
import { ArrowDownRight, ArrowUpRight, CalendarRange, CheckCircle2, CircleAlert, FileBarChart2, FileCheck2, Filter, Minus, RefreshCw, TrendingUp } from 'lucide-vue-next'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import LineChart from '@/components/graficos/LineChart.vue'
import PieChart from '@/components/graficos/PieChart.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { NotasFiscaisRepository, type FiscalDashboard } from '@/repositories/notas-fiscais-repository'
import { formatCurrencyBR } from '@/utils/formatters'

const toast = useToast()
const loading = ref(true)
const errorMessage = ref('')
const dashboard = ref<FiscalDashboard | null>(null)
let currentRequest = 0
const filterOpen = ref(false)
const period = ref<[Date, Date]>([startOfMonth(new Date()), endOfMonth(new Date())])
const draftPeriod = ref<Date[] | null>(null)
const activePreset = ref('month')
const presets = [
  { key: 'today', label: 'Hoje' }, { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' }, { key: 'month', label: 'Este mês' },
  { key: 'last-month', label: 'Mês passado' },
]
const statusNames: Record<string, string> = {
  AUTORIZADA: 'Autorizada', HOMOLOGADA: 'Homologada', PENDENTE: 'Pendente',
  PRONTA_PARA_EMISSAO: 'Pronta para emissão', EMITINDO: 'Emitindo',
  EM_PROCESSAMENTO: 'Em processamento', FALHA_REPROCESSAVEL: 'Falha reprocessável',
  REJEITADA: 'Rejeitada', RESULTADO_INCERTO: 'Resultado incerto', EMISSAO_INCERTA: 'Emissão incerta', CANCELADA: 'Cancelada',
}
const statusColors = ['#10B981', '#06B6D4', '#2563EB', '#8B5CF6', '#F59E0B', '#EF4444', '#64748B']
const periodLabel = computed(() => `${period.value[0].toLocaleDateString('pt-BR')} — ${period.value[1].toLocaleDateString('pt-BR')}`)
const statusEntries = computed(() => Object.entries(dashboard.value?.byStatus || {}).filter(([, total]) => total > 0).sort((a, b) => b[1] - a[1]))
const issueCount = computed(() => ['FALHA_REPROCESSAVEL', 'REJEITADA', 'RESULTADO_INCERTO', 'EMISSAO_INCERTA'].reduce((sum, key) => sum + (dashboard.value?.byStatus[key] || 0), 0))
const runningCount = computed(() => ['PENDENTE', 'PRONTA_PARA_EMISSAO', 'EMITINDO', 'EM_PROCESSAMENTO'].reduce((sum, key) => sum + (dashboard.value?.byStatus[key] || 0), 0))
const typeEntries = computed(() => [
  { key: 'NFE', label: 'NF-e', color: 'bg-blue-500', total: dashboard.value?.byType.NFE || 0 },
  { key: 'NFCE', label: 'NFC-e', color: 'bg-violet-500', total: dashboard.value?.byType.NFCE || 0 },
  { key: 'NFSE', label: 'NFS-e', color: 'bg-cyan-500', total: dashboard.value?.byType.NFSE || 0 },
])
const cards = computed(() => {
  if (!dashboard.value) return []
  const { total, authorized, authorizedValue, approvalRate, previous } = dashboard.value.kpis
  return [
    { title: 'Notas registradas', value: String(total), previous: previous.total, current: total, detail: 'documentos no período', icon: FileCheck2, color: 'text-blue-600 bg-blue-500/10' },
    { title: 'Autorizadas', value: String(authorized), previous: previous.authorized, current: authorized, detail: 'documentos autorizados', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-500/10' },
    { title: 'Valor autorizado', value: formatCurrencyBR(authorizedValue), previous: previous.authorizedValue, current: authorizedValue, detail: 'notas autorizadas', icon: FileBarChart2, color: 'text-violet-600 bg-violet-500/10' },
    { title: 'Taxa de autorização', value: `${approvalRate.toFixed(1)}%`, previous: null, current: approvalRate, detail: 'sobre as notas registradas', icon: TrendingUp, color: 'text-cyan-600 bg-cyan-500/10' },
  ]
})
function delta(current: number, previous: number | null) {
  if (previous === null) return null
  if (!previous) return current ? { label: 'Novo', icon: ArrowUpRight, tone: 'bg-emerald-500/10 text-emerald-600' } : { label: '0%', icon: Minus, tone: 'bg-muted text-muted-foreground' }
  const value = Math.round((current - previous) / previous * 100)
  return value > 0 ? { label: `+${value}%`, icon: ArrowUpRight, tone: 'bg-emerald-500/10 text-emerald-600' }
    : value < 0 ? { label: `${value}%`, icon: ArrowDownRight, tone: 'bg-rose-500/10 text-rose-600' }
      : { label: '0%', icon: Minus, tone: 'bg-muted text-muted-foreground' }
}
const lineData = computed(() => ({
  labels: dashboard.value?.series.map((item) => format(new Date(`${item.data}T12:00:00`), 'dd MMM', { locale: ptBR })) || [],
  datasets: [
    { label: 'Registradas', data: dashboard.value?.series.map((item) => item.total) || [], borderColor: '#2563EB', backgroundColor: 'rgba(37, 99, 235, 0.12)', fill: true, tension: 0.35, borderWidth: 2, pointRadius: 2 },
    { label: 'Autorizadas', data: dashboard.value?.series.map((item) => item.autorizadas) || [], borderColor: '#10B981', backgroundColor: 'transparent', tension: 0.35, borderWidth: 2, pointRadius: 2 },
  ],
}))
const lineOptions = { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } } as any
const pieData = computed(() => ({ labels: statusEntries.value.map(([key]) => statusNames[key] || key), datasets: [{ data: statusEntries.value.map(([, total]) => total), backgroundColor: statusColors, borderWidth: 0 }] }))
const pieOptions = { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { display: false } } } as any

async function loadDashboard() {
  const request = ++currentRequest
  loading.value = true
  errorMessage.value = ''
  try {
    const next = await NotasFiscaisRepository.getDashboard(format(period.value[0], 'yyyy-MM-dd'), format(period.value[1], 'yyyy-MM-dd'))
    if (request === currentRequest) dashboard.value = next
  } catch (error: any) {
    if (request === currentRequest) {
      errorMessage.value = error?.response?.data?.error?.message || 'Não foi possível carregar o painel fiscal.'
      toast.error(errorMessage.value)
    }
  } finally { if (request === currentRequest) loading.value = false }
}
function choosePreset(key: string) {
  const now = new Date()
  if (key === 'today') period.value = [now, now]
  else if (key === '7d') period.value = [subDays(now, 6), now]
  else if (key === '30d') period.value = [subDays(now, 29), now]
  else if (key === 'last-month') { const month = subMonths(now, 1); period.value = [startOfMonth(month), endOfMonth(month)] }
  else period.value = [startOfMonth(now), endOfMonth(now)]
  activePreset.value = key
  filterOpen.value = false
  void loadDashboard()
}
function openFilters() { draftPeriod.value = [...period.value]; filterOpen.value = true }
function applyCustom() {
  if (!draftPeriod.value || draftPeriod.value.length !== 2 || draftPeriod.value[0] > draftPeriod.value[1]) return
  const days = (draftPeriod.value[1].getTime() - draftPeriod.value[0].getTime()) / 86_400_000
  if (days > 365) { toast.error('Selecione um período de até 366 dias.'); return }
  period.value = [draftPeriod.value[0], draftPeriod.value[1]]
  activePreset.value = 'custom'
  filterOpen.value = false
  void loadDashboard()
}
onMounted(() => { void loadDashboard() })
</script>

<template>
  <div class="space-y-4 pb-10">
    <header class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold text-foreground"><FileCheck2 class="size-6 text-primary" />Painel de notas fiscais</h1>
        <p class="flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarRange class="size-3.5" />{{ periodLabel }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex flex-wrap items-center rounded-lg border bg-card p-1">
          <button v-for="preset in presets" :key="preset.key" type="button" class="rounded-md px-3 py-1.5 text-xs font-medium transition" :class="activePreset === preset.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'" @click="choosePreset(preset.key)">{{ preset.label }}</button>
        </div>
        <Button variant="outline" size="sm" @click="openFilters"><Filter class="size-4" />Período</Button>
        <Button variant="outline" size="icon" class="size-9" :disabled="loading" aria-label="Atualizar painel" @click="loadDashboard"><RefreshCw class="size-4" :class="{ 'animate-spin': loading }" /></Button>
        <Button as-child class="hidden md:inline-flex"><RouterLink to="/notas-fiscais/relatorio">Ver relatório</RouterLink></Button>
      </div>
    </header>

    <p v-if="errorMessage" role="alert" class="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{{ errorMessage }} <Button variant="link" size="sm" @click="loadDashboard">Tentar novamente</Button></p>
    <section v-if="loading" class="grid grid-cols-2 gap-4 lg:grid-cols-4"><Skeleton v-for="item in 4" :key="item" class="h-[132px] rounded-xl" /></section>
    <section v-else-if="dashboard" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card v-for="card in cards" :key="card.title" class="rounded-xl transition hover:shadow-md"><CardContent class="p-4">
        <div class="flex items-center justify-between gap-1"><span class="rounded-lg p-2" :class="card.color"><component :is="card.icon" class="size-5" /></span><span v-if="delta(card.current, card.previous)" class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold" :class="delta(card.current, card.previous)?.tone"><component :is="delta(card.current, card.previous)?.icon" class="size-3" />{{ delta(card.current, card.previous)?.label }}</span></div>
        <p class="mt-3 text-sm text-muted-foreground">{{ card.title }}</p><p class="text-2xl font-bold tracking-tight">{{ card.value }}</p><p class="mt-0.5 truncate text-xs text-muted-foreground">{{ card.detail }}<span v-if="card.previous !== null"> · vs. anterior</span></p>
      </CardContent></Card>
    </section>

    <section v-if="!loading && dashboard" class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="flex items-center gap-3 rounded-xl border bg-card p-4"><span class="rounded-lg bg-sky-500/10 p-2 text-sky-600"><RefreshCw class="size-5" /></span><div><p class="text-xs text-muted-foreground">Em andamento</p><p class="text-lg font-bold">{{ runningCount }}</p><p class="text-xs text-muted-foreground">aguardando conclusão</p></div></div>
      <div class="flex items-center gap-3 rounded-xl border bg-card p-4"><span class="rounded-lg bg-amber-500/10 p-2 text-amber-600"><CircleAlert class="size-5" /></span><div><p class="text-xs text-muted-foreground">Pedem atenção</p><p class="text-lg font-bold">{{ issueCount }}</p><p class="text-xs text-muted-foreground">falhas e resultados incertos</p></div></div>
      <div class="flex items-center gap-3 rounded-xl border bg-card p-4"><span class="rounded-lg bg-cyan-500/10 p-2 text-cyan-600"><FileCheck2 class="size-5" /></span><div><p class="text-xs text-muted-foreground">Homologadas</p><p class="text-lg font-bold">{{ dashboard.byStatus.HOMOLOGADA || 0 }}</p><p class="text-xs text-muted-foreground">documentos de teste</p></div></div>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div class="rounded-xl border bg-card p-4 xl:col-span-2"><div class="mb-4 flex items-center gap-2"><TrendingUp class="size-5 text-primary" /><h2 class="font-semibold">Evolução das emissões</h2></div><Skeleton v-if="loading" class="h-72 w-full rounded-lg" /><div v-else-if="dashboard?.kpis.total" class="h-72"><LineChart :data="lineData" :options="lineOptions" /></div><div v-else class="flex h-72 items-center justify-center text-sm text-muted-foreground">Sem notas no período</div></div>
      <div class="rounded-xl border bg-card p-4"><div class="mb-4 flex items-center gap-2"><FileBarChart2 class="size-5 text-primary" /><h2 class="font-semibold">Distribuição por status</h2></div><Skeleton v-if="loading" class="h-72 w-full rounded-lg" /><template v-else-if="statusEntries.length"><div class="h-48"><PieChart :data="pieData" :options="pieOptions" /></div><div class="mt-4 grid grid-cols-2 gap-2"><span v-for="([key, total], index) in statusEntries" :key="key" class="flex items-center gap-1.5 text-xs"><i class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: statusColors[index % statusColors.length] }" />{{ statusNames[key] || key }}: {{ total }}</span></div></template><div v-else class="flex h-72 items-center justify-center text-sm text-muted-foreground">Sem dados de status</div></div>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div class="rounded-xl border bg-card p-4 xl:col-span-2"><div class="mb-4 flex items-center justify-between gap-2"><h2 class="flex items-center gap-2 font-semibold"><CircleAlert class="size-5 text-amber-500" />Notas que pedem atenção</h2><RouterLink to="/notas-fiscais/relatorio" class="text-xs font-medium text-primary hover:underline">Ver todas</RouterLink></div><Skeleton v-if="loading" class="h-48 w-full rounded-lg" /><div v-else-if="!dashboard?.attention.length" class="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground"><CheckCircle2 class="size-6 opacity-40" />Nenhuma pendência no período</div><div v-else class="space-y-2"><div v-for="item in dashboard.attention" :key="item.id" class="flex items-center justify-between gap-3 rounded-lg border p-3"><div class="min-w-0"><p class="font-medium">{{ item.tipo === 'NFE' ? 'NF-e' : item.tipo === 'NFCE' ? 'NFC-e' : 'NFS-e' }} #{{ item.id }} · {{ item.cliente }}</p><p class="truncate text-xs text-muted-foreground" :title="item.erroMensagem || ''">{{ statusNames[item.status] || item.status }} · {{ item.erroMensagem || new Date(item.criadoEm).toLocaleDateString('pt-BR') }}</p></div><RouterLink :to="{ path: '/notas-fiscais/relatorio', query: { nota: item.id } }" class="shrink-0 text-xs font-medium text-primary hover:underline">Ver nota</RouterLink></div></div></div>
      <div class="rounded-xl border bg-card p-4"><div class="mb-4 flex items-center gap-2"><FileCheck2 class="size-5 text-primary" /><h2 class="font-semibold">Tipos de nota</h2></div><Skeleton v-if="loading" class="h-48 w-full rounded-lg" /><div v-else class="space-y-5 pt-2"><div v-for="item in typeEntries" :key="item.key" class="space-y-2"><div class="flex justify-between text-sm"><span>{{ item.label }}</span><strong>{{ item.total }}</strong></div><div class="h-2 overflow-hidden rounded-full bg-muted"><div class="h-full rounded-full" :class="item.color" :style="{ width: `${dashboard?.kpis.total ? item.total / dashboard.kpis.total * 100 : 0}%` }" /></div></div></div></div>
    </section>

    <ModalView v-model:open="filterOpen" title="Período personalizado" size="lg"><div class="space-y-4 px-4"><div><label class="mb-2 block text-sm font-medium">Intervalo de datas</label><Calendarpicker v-model="draftPeriod" class="w-full" :range="true" :teleport="true" /><p class="mt-2 text-xs text-muted-foreground">Selecione até 366 dias. Todos os indicadores usam a data de criação da nota.</p></div><div class="flex justify-end gap-2"><Button variant="outline" @click="filterOpen = false">Cancelar</Button><Button :disabled="!draftPeriod || draftPeriod.length !== 2" @click="applyCustom"><Filter class="size-4" />Aplicar</Button></div></div></ModalView>
  </div>
</template>
