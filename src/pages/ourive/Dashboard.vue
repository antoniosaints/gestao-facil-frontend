<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { endOfDay, endOfMonth, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns'
import { useToast } from 'vue-toastification'
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  FileText,
  Gem,
  Minus,
  RefreshCw,
  Wrench,
} from 'lucide-vue-next'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import LineChart from '@/components/graficos/LineChart.vue'
import PieChart from '@/components/graficos/PieChart.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { OuriveRepository } from '@/repositories/ourive-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import { colorTheme } from '@/utils/theme'

type Metrica = { atual: number; anterior: number; delta: number }
type Painel = {
  kpis: {
    receita: Metrica
    ordens: Metrica
    liquidoLoja: Metrica
    entregas: { atual: number; prazoMedioDias: number }
    emProducao: number
    aguardandoOrcamento: number
    comissoes: number
    aguardandoMaterial: number
    comprasPendentes: number
    atrasadas: number
    prontasEntrega: number
    valorPendenteOurives: number
  }
  serieReceita: { labels: string[]; data: number[] }
  porStatus: { labels: string[]; data: number[] }
  filaEtapas: Array<{
    id: number
    nome: string
    status: string
    prazoPrevisto?: string | null
    ordem?: { id: number; codigoRastreio: string }
  }>
}

const toast = useToast()
const loading = ref(true)
const loadError = ref('')
const openPeriod = ref(false)
const presetAtivo = ref('month')
const periodo = ref<[Date, Date]>([startOfMonth(new Date()), endOfMonth(new Date())])
const painel = ref<Painel | null>(null)
const emptyPanel = (): Painel => ({
  kpis: {
    receita: { atual: 0, anterior: 0, delta: 0 },
    ordens: { atual: 0, anterior: 0, delta: 0 },
    liquidoLoja: { atual: 0, anterior: 0, delta: 0 },
    entregas: { atual: 0, prazoMedioDias: 0 },
    emProducao: 0,
    aguardandoOrcamento: 0,
    comissoes: 0,
    aguardandoMaterial: 0,
    comprasPendentes: 0,
    atrasadas: 0,
    prontasEntrega: 0,
    valorPendenteOurives: 0,
  },
  serieReceita: { labels: [], data: [] },
  porStatus: { labels: [], data: [] },
  filaEtapas: [],
})
// A API anterior do Ourive retornava `porStatus` como uma lista agrupada. Mantemos
// esta adaptação enquanto todos os ambientes recebem a versão nova do endpoint,
// para que uma resposta antiga nunca interrompa a renderização do painel.
function normalizePanel(data: any): Painel {
  if (data?.kpis && data?.porStatus && !Array.isArray(data.porStatus)) return data as Painel

  const fallback = emptyPanel()
  const grouped = Array.isArray(data?.porStatus) ? data.porStatus : []
  const counts = grouped.reduce((result: Record<string, number>, row: any) => {
    if (row?.status) result[row.status] = Number(row?._count?._all ?? row?.total ?? 0)
    return result
  }, {})
  const total = Object.values(counts).reduce((sum: any, value) => sum + value, 0)

  return {
    ...fallback,
    kpis: {
      ...fallback.kpis,
      ordens: { atual: total as number, anterior: 0, delta: 0 },
      emProducao: Number(counts.PRODUCAO || 0) + Number(counts.REVISAO || 0),
      aguardandoOrcamento: Number(counts.RECEBIDA || 0) + Number(counts.ORCAMENTO || 0),
      comissoes: Number(data?.comissoes || 0),
    },
    porStatus: { labels: Object.keys(counts), data: Object.values(counts) },
    filaEtapas: Array.isArray(data?.filaEtapas) ? data.filaEtapas : [],
  }
}
const presets = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'month', label: 'Este mês' },
  { key: 'last-month', label: 'Mês passado' },
]
const palette = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899']
const statusLabel: Record<string, string> = {
  RECEBIDA: 'Recebida',
  ORCAMENTO: 'Orçamento',
  AGUARDANDO_MATERIAL: 'Aguardando material',
  PRONTA_PRODUCAO: 'Pronta para produção',
  PRODUCAO: 'Em produção',
  FINALIZADA: 'Finalizada',
  REVISAO: 'Revisão',
  PRONTA_ENTREGA: 'Pronta para entrega',
  ENTREGUE: 'Entregue',
  RECUSADA: 'Recusada',
  CANCELADA: 'Cancelada',
}

const filtroLabel = computed(
  () =>
    `${periodo.value[0].toLocaleDateString('pt-BR')} — ${periodo.value[1].toLocaleDateString('pt-BR')}`,
)
const primary = computed(() => {
  void colorTheme.value
  return typeof document === 'undefined'
    ? '#2563EB'
    : `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '221 83% 53%'})`
})
const gridColor = computed(() =>
  colorTheme.value === 'dark' ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.22)',
)
const tickColor = computed(() => (colorTheme.value === 'dark' ? '#cbd5e1' : '#475569'))
const revenueChart = computed(() => ({
  labels: painel.value?.serieReceita.labels ?? [],
  datasets: [
    {
      label: 'Receita aprovada',
      data: painel.value?.serieReceita.data ?? [],
      borderColor: primary.value,
      backgroundColor: `${primary.value.replace(')', ' / 0.14)')}`,
      fill: true,
      tension: 0.35,
      borderWidth: 2,
      pointRadius: 2,
      pointHoverRadius: 5,
    },
  ],
}))
const lineOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: { label: (context: any) => ` ${formatCurrencyBR(context.parsed.y ?? 0)}` },
    },
  },
  scales: {
    y: {
      ticks: {
        color: tickColor.value,
        callback: (value: number) => `R$ ${Number(value).toLocaleString('pt-BR')}`,
      },
      grid: { color: gridColor.value },
      beginAtZero: true,
    },
    x: {
      ticks: { color: tickColor.value, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
      grid: { display: false },
    },
  },
}))
const statusChart = computed(() => ({
  labels: (painel.value?.porStatus.labels ?? []).map((status) => statusLabel[status] || status),
  datasets: [
    { data: painel.value?.porStatus.data ?? [], backgroundColor: palette, borderWidth: 0 },
  ],
}))
const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: { label: (context: any) => ` ${context.label}: ${context.parsed} ordem(ns)` },
    },
  },
}
const hasStatus = computed(() => (painel.value?.porStatus.data ?? []).some((value) => value > 0))
const cards = computed(() => {
  const kpis = painel.value?.kpis
  if (!kpis) return []
  return [
    {
      title: 'Receita aprovada',
      value: formatCurrencyBR(kpis.receita.atual),
      detail: 'orçamentos aprovados no período',
      delta: kpis.receita.delta,
      icon: CircleDollarSign,
      color: 'text-emerald-600 bg-emerald-500/10',
    },
    {
      title: 'Ordens recebidas',
      value: String(kpis.ordens.atual),
      detail: 'novas entradas no período',
      delta: kpis.ordens.delta,
      icon: ClipboardList,
      color: 'text-blue-600 bg-blue-500/10',
    },
    {
      title: 'Líquido da loja',
      value: formatCurrencyBR(kpis.liquidoLoja.atual),
      detail: 'após custos e repasses',
      delta: kpis.liquidoLoja.delta,
      icon: Gem,
      color: 'text-violet-600 bg-violet-500/10',
    },
    {
      title: 'Entregas',
      value: String(kpis.entregas.atual),
      detail: kpis.entregas.atual
        ? `${kpis.entregas.prazoMedioDias.toFixed(1)} dias em média`
        : 'sem entregas no período',
      icon: CheckCircle2,
      color: 'text-amber-600 bg-amber-500/10',
    },
  ]
})

function deltaInfo(delta: number) {
  const value = Math.round(delta)
  if (value > 0)
    return { label: `+${value}%`, icon: ArrowUpRight, class: 'text-emerald-600 bg-emerald-500/10' }
  if (value < 0)
    return { label: `${value}%`, icon: ArrowDownRight, class: 'text-rose-600 bg-rose-500/10' }
  return { label: '0%', icon: Minus, class: 'text-muted-foreground bg-muted' }
}

function applyPreset(key: string) {
  presetAtivo.value = key
  const now = new Date()
  if (key === 'today') periodo.value = [startOfDay(now), endOfDay(now)]
  else if (key === '7d') periodo.value = [startOfDay(subDays(now, 6)), endOfDay(now)]
  else if (key === '30d') periodo.value = [startOfDay(subDays(now, 29)), endOfDay(now)]
  else if (key === 'month') periodo.value = [startOfMonth(now), endOfMonth(now)]
  else {
    const previous = subMonths(now, 1)
    periodo.value = [startOfMonth(previous), endOfMonth(previous)]
  }
  void load()
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const response = await OuriveRepository.painel(
      periodo.value[0].toISOString(),
      periodo.value[1].toISOString(),
    )
    painel.value = normalizePanel(response)
  } catch (error: any) {
    painel.value = emptyPanel()
    loadError.value =
      error?.code === 'ECONNABORTED'
        ? 'A consulta demorou mais do que o esperado. Tente atualizar o painel.'
        : 'Não foi possível buscar os dados do painel. Tente atualizar.'
    toast.error(loadError.value)
  } finally {
    loading.value = false
  }
}

function applyCustomPeriod() {
  presetAtivo.value = 'custom'
  openPeriod.value = false
  void load()
}
function applyPresetAndClose(key: string) {
  applyPreset(key)
  openPeriod.value = false
}
function stageLabel(status: string) {
  return (
    (
      {
        PENDENTE: 'Pendente',
        EM_EXECUCAO: 'Em execução',
        AGUARDANDO_REVISAO: 'Aguardando revisão',
        REPROVADA: 'Reprovada',
      } as Record<string, string>
    )[status] || status
  )
}
onMounted(load)
</script>

<template>
  <section class="space-y-4 pb-6">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Gem class="h-6 w-6 text-primary" :stroke-width="2.5" />Painel de ourivesaria
        </h2>
        <p class="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarRange class="h-3.5 w-3.5" />{{ filtroLabel }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex flex-wrap rounded-lg border border-border bg-card p-1">
          <button
            v-for="preset in presets"
            :key="preset.key"
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-medium transition"
            :class="
              presetAtivo === preset.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            "
            @click="applyPreset(preset.key)"
          >
            {{ preset.label }}
          </button>
        </div>
        <Button variant="outline" size="sm" @click="openPeriod = true"
          ><CalendarRange class="h-4 w-4" />Período</Button
        ><Button variant="outline" size="icon" class="h-9 w-9" :disabled="loading" @click="load"
          ><RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }"
        /></Button>
      </div>
    </div>

    <div
      v-if="loadError"
      class="flex flex-col justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm sm:flex-row sm:items-center"
    >
      <span class="text-muted-foreground">{{ loadError }}</span
      ><Button variant="outline" size="sm" @click="load"
        ><RefreshCw class="mr-2 h-4 w-4" />Tentar novamente</Button
      >
    </div>

    <section v-if="loading" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Skeleton v-for="index in 4" :key="index" class="h-[132px] rounded-xl" />
    </section>
    <section v-else class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card v-for="card in cards" :key="card.title" class="rounded-xl transition hover:shadow-md"
        ><CardContent class="p-4"
          ><div class="flex items-center justify-between">
            <div class="rounded-lg p-2" :class="card.color">
              <component :is="card.icon" class="h-5 w-5" />
            </div>
            <span
              v-if="card.delta !== undefined"
              class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
              :class="deltaInfo(card.delta).class"
              ><component :is="deltaInfo(card.delta).icon" class="h-3 w-3" />{{
                deltaInfo(card.delta).label
              }}</span
            >
          </div>
          <p class="mt-3 text-sm text-muted-foreground">{{ card.title }}</p>
          <p class="text-2xl font-bold tracking-tight text-foreground">{{ card.value }}</p>
          <p class="mt-0.5 truncate text-xs text-muted-foreground">
            {{ card.detail }}
          </p></CardContent
        ></Card
      >
    </section>

    <section v-if="!loading && painel" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <div class="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div class="rounded-lg bg-amber-500/10 p-2 text-amber-600"><Clock3 class="h-5 w-5" /></div>
        <div>
          <p class="text-xs text-muted-foreground">Aguardando orçamento</p>
          <p class="text-lg font-bold">{{ painel.kpis.aguardandoOrcamento }}</p>
          <p class="text-xs text-muted-foreground">ordens em atendimento</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div class="rounded-lg bg-blue-500/10 p-2 text-blue-600"><Wrench class="h-5 w-5" /></div>
        <div>
          <p class="text-xs text-muted-foreground">Em produção ou revisão</p>
          <p class="text-lg font-bold">{{ painel.kpis.emProducao }}</p>
          <p class="text-xs text-muted-foreground">ordens em andamento</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div class="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
          <CircleDollarSign class="h-5 w-5" />
        </div>
        <div>
          <p class="text-xs text-muted-foreground">Pendente para ourives</p>
          <p class="text-lg font-bold">{{ formatCurrencyBR(painel.kpis.valorPendenteOurives) }}</p>
          <p class="text-xs text-muted-foreground">repasses consolidados</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div class="rounded-lg bg-orange-500/10 p-2 text-orange-600">
          <Clock3 class="h-5 w-5" />
        </div>
        <div>
          <p class="text-xs text-muted-foreground">Aguardando material</p>
          <p class="text-lg font-bold">{{ painel.kpis.aguardandoMaterial }}</p>
          <p class="text-xs text-muted-foreground">{{ painel.kpis.comprasPendentes }} compra(s)</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div class="rounded-lg bg-rose-500/10 p-2 text-rose-600"><Clock3 class="h-5 w-5" /></div>
        <div>
          <p class="text-xs text-muted-foreground">Atrasadas</p>
          <p class="text-lg font-bold">{{ painel.kpis.atrasadas }}</p>
          <p class="text-xs text-muted-foreground">prazo vencido</p>
        </div>
      </div>
    </section>

    <section class="grid gap-4 xl:grid-cols-3">
      <div class="rounded-xl border border-border bg-card p-4 xl:col-span-2">
        <div class="mb-4 flex items-center gap-2">
          <CircleDollarSign class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Receita aprovada</h3>
        </div>
        <Skeleton v-if="loading" class="h-72 w-full rounded-lg" />
        <div v-else class="h-72"><LineChart :data="revenueChart" :options="lineOptions" /></div>
      </div>
      <div class="rounded-xl border border-border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <FileText class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Ordens por status</h3>
        </div>
        <Skeleton v-if="loading" class="h-72 w-full rounded-lg" /><template v-else-if="hasStatus"
          ><div class="h-52"><PieChart :data="statusChart" :options="pieOptions" /></div>
          <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            <span
              v-for="(label, index) in statusChart.labels"
              :key="label"
              class="flex items-center gap-1.5 text-xs"
              ><i
                class="h-2.5 w-2.5 rounded-full"
                :style="{ backgroundColor: palette[index % palette.length] }"
              />{{ label }}</span
            >
          </div></template
        >
        <div v-else class="flex h-56 items-center justify-center text-sm text-muted-foreground">
          Sem ordens no período
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-border bg-card p-4">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <Wrench class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Fila de produção</h3>
        </div>
        <Button variant="outline" size="sm" as-child
          ><RouterLink :to="{ name: 'ourive-producao' }">Ver produção</RouterLink></Button
        >
      </div>
      <Skeleton v-if="loading" class="h-44 w-full rounded-lg" />
      <div v-else-if="painel?.filaEtapas.length" class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <RouterLink
          v-for="stage in painel.filaEtapas"
          :key="stage.id"
          :to="{ name: 'ourive-ordem', params: { id: stage.ordem?.id } }"
          class="rounded-lg border p-3 transition hover:border-primary/60 hover:bg-muted/50"
          ><div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-medium">{{ stage.nome }}</p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ stage.ordem?.codigoRastreio || 'Ordem' }}
              </p>
            </div>
            <span class="shrink-0 rounded-full bg-muted px-2 py-1 text-xs">{{
              stageLabel(stage.status)
            }}</span>
          </div>
          <p class="mt-3 text-xs text-muted-foreground">
            {{
              stage.prazoPrevisto
                ? `Prazo: ${new Date(stage.prazoPrevisto).toLocaleDateString('pt-BR')}`
                : 'Sem prazo definido'
            }}
          </p></RouterLink
        >
      </div>
      <div
        v-else
        class="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground"
      >
        <CheckCircle2 class="h-8 w-8 text-emerald-500" />Nenhuma etapa pendente na fila.
      </div>
    </section>

    <ModalView v-model:open="openPeriod" title="Período personalizado" size="lg"
      ><div class="grid gap-4 p-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">Atalhos rápidos</label>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="preset in presets"
              :key="preset.key"
              type="button"
              variant="outline"
              size="sm"
              @click="applyPresetAndClose(preset.key)"
              >{{ preset.label }}</Button
            >
          </div>
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">Intervalo de datas</label
          ><Calendarpicker v-model="periodo" class="w-full" :range="true" />
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="openPeriod = false">Cancelar</Button
          ><Button @click="applyCustomPeriod">Aplicar</Button>
        </div>
      </div></ModalView
    >
  </section>
</template>
