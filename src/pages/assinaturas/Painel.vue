<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  AlertTriangle,
  CalendarClock,
  ChartPie,
  CircleDollarSign,
  FilePenLineIcon,
  Layers3,
  Package,
  ReceiptText,
  RefreshCcw,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-vue-next'

import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import BarChart from '@/components/graficos/BarChart.vue'
import LineChart from '@/components/graficos/LineChart.vue'
import PieChart from '@/components/graficos/PieChart.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AssinaturaRepository, type AssinaturaDashboardResponse } from '@/repositories/assinatura-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'
import { colorTheme } from '@/utils/theme'
import { getPeriodicidadeLabel } from './shared'

const toast = useToast()
const uiStore = useUiStore()

const loading = ref(true)
const dashboard = ref<AssinaturaDashboardResponse['data'] | null>(null)

const atalhos = [
  { titulo: 'Contratos', link: '/assinaturas/assinaturas', icon: Sparkles },
  { titulo: 'Planos', link: '/assinaturas/planos', icon: Layers3 },
  { titulo: 'Cobranças', link: '/assinaturas/cobrancas', icon: ReceiptText },
  { titulo: 'Comodatos', link: '/assinaturas/comodatos', icon: Package },
]

const PALETTE = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#84CC16']
const STATUS_CONTRATO_CORES = ['#10B981', '#F59E0B', '#EF4444']
const MESES_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// Mesmo mapa de chips do painel de produtos: fundo suave + ícone na cor forte.
const corMap: Record<string, string> = {
  primary: 'text-primary bg-primary/10',
  emerald: 'text-emerald-600 bg-emerald-500/10',
  sky: 'text-sky-600 bg-sky-500/10',
  rose: 'text-rose-600 bg-rose-500/10',
  amber: 'text-amber-600 bg-amber-500/10',
  orange: 'text-orange-600 bg-orange-500/10',
  blue: 'text-blue-600 bg-blue-500/10',
}

function mesLabel(key: string) {
  const [ano, mes] = key.split('-')
  return `${MESES_ABBR[Number(mes) - 1] || mes}/${ano.slice(2)}`
}

// ---- Cores sensíveis ao tema (mesmo padrão do painel de vendas) ----
function themeColor(name: string, alpha?: number) {
  if (typeof document === 'undefined') return '#2563EB'
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!value) return '#2563EB'
  return alpha != null ? `hsl(${value} / ${alpha})` : `hsl(${value})`
}
const primary = computed(() => {
  void colorTheme.value
  return themeColor('--primary')
})
const primarySoft = computed(() => {
  void colorTheme.value
  return themeColor('--primary', 0.16)
})
const tickColor = computed(() => (colorTheme.value === 'dark' ? '#cbd5e1' : '#475569'))
const gridColor = computed(() => (colorTheme.value === 'dark' ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.22)'))

const STATUS_COBRANCA_LABEL: Record<string, string> = {
  PENDENTE: 'Pendente',
  COBRADO: 'Cobrado',
  PAGO: 'Pago',
  ATRASADO: 'Atrasado',
  CANCELADO: 'Cancelado',
  FALHA: 'Falha',
}

// ---- KPIs ----
const kpiCards = computed(() => {
  const k = dashboard.value?.kpis
  return [
    { label: 'Contratos ativos', value: String(k?.assinaturasAtivas ?? 0), hint: `De ${k?.totalAssinaturas ?? 0} no total`, icon: Sparkles, cor: 'primary' },
    { label: 'MRR estimado', value: formatCurrencyBR(k?.mrrEstimado ?? 0), hint: 'Receita recorrente mensal', icon: CircleDollarSign, cor: 'emerald' },
    { label: 'Recebido no mês', value: formatCurrencyBR(k?.recebidoMes ?? 0), hint: 'Ciclos pagos no mês atual', icon: Wallet, cor: 'emerald' },
    { label: 'Ticket médio', value: formatCurrencyBR(k?.ticketMedio ?? 0), hint: 'MRR por contrato ativo', icon: TrendingUp, cor: 'sky' },
    { label: 'Inadimplência', value: formatCurrencyBR(k?.inadimplencia ?? 0), hint: 'Cobranças em atraso', icon: AlertTriangle, cor: 'rose' },
    { label: 'Cobranças pendentes', value: String(k?.cobrancasPendentes ?? 0), hint: 'Ciclos aguardando confirmação', icon: ReceiptText, cor: 'amber' },
    { label: 'Cobranças atrasadas', value: String(k?.cobrancasAtrasadas ?? 0), hint: 'Ciclos vencidos sem baixa', icon: CalendarClock, cor: 'orange' },
    { label: 'Comodatos em uso', value: String(k?.comodatosEmUso ?? 0), hint: 'Equipamentos com clientes', icon: Package, cor: 'blue' },
  ]
})

// ---- Dados dos gráficos ----
const serieChart = computed(() => {
  const serie = dashboard.value?.serieReceita
  return {
    labels: (serie?.labels ?? []).map(mesLabel),
    datasets: [
      {
        label: 'Recebido',
        data: serie?.recebido ?? [],
        borderColor: primary.value,
        backgroundColor: primarySoft.value,
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      {
        label: 'Previsto',
        data: serie?.previsto ?? [],
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245,158,11,0.12)',
        borderDash: [6, 4],
        fill: false,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  }
})

const contratosStatusChart = computed(() => ({
  labels: dashboard.value?.contratosPorStatus.labels ?? [],
  datasets: [{ data: dashboard.value?.contratosPorStatus.data ?? [], backgroundColor: STATUS_CONTRATO_CORES, borderWidth: 0 }],
}))

const cobrancasStatusChart = computed(() => ({
  labels: (dashboard.value?.cobrancasPorStatus.labels ?? []).map((l) => STATUS_COBRANCA_LABEL[l] ?? l),
  datasets: [{ label: 'Cobranças', data: dashboard.value?.cobrancasPorStatus.data ?? [], backgroundColor: PALETTE, borderWidth: 0 }],
}))

const periodicidadeChart = computed(() => ({
  labels: (dashboard.value?.contratosPorPeriodicidade.labels ?? []).map((l) => getPeriodicidadeLabel(l)),
  datasets: [{ label: 'Contratos', data: dashboard.value?.contratosPorPeriodicidade.data ?? [], backgroundColor: primary.value, borderWidth: 0 }],
}))

const temSerie = computed(() => (dashboard.value?.serieReceita.recebido ?? []).some((v) => v > 0) || (dashboard.value?.serieReceita.previsto ?? []).some((v) => v > 0))
const temContratos = computed(() => (dashboard.value?.contratosPorStatus.data ?? []).some((v) => v > 0))
const temCobrancas = computed(() => (dashboard.value?.cobrancasPorStatus.data ?? []).some((v) => v > 0))
const temPeriodicidade = computed(() => (dashboard.value?.contratosPorPeriodicidade.data ?? []).some((v) => v > 0))
const topClientes = computed(() => dashboard.value?.topClientes ?? [])
const maiorValorCliente = computed(() => Math.max(1, ...topClientes.value.map((c) => c.valor)))

// ---- Opções dos gráficos ----
const moneyTooltip = { callbacks: { label: (ctx: any) => ` ${ctx.dataset.label ? ctx.dataset.label + ': ' : ''}${formatCurrencyBR(ctx.parsed.y ?? ctx.parsed)}` } }

const lineOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: { legend: { display: true, position: 'top', labels: { color: tickColor.value, usePointStyle: true } }, tooltip: moneyTooltip },
  scales: {
    y: { ticks: { color: tickColor.value, callback: (v: number) => 'R$ ' + Number(v).toLocaleString('pt-BR') }, grid: { color: gridColor.value }, beginAtZero: true },
    x: { ticks: { color: tickColor.value }, grid: { display: false } },
  },
}))

const countBarOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.parsed.y} contrato(s)` } } },
  scales: {
    y: { ticks: { color: tickColor.value, precision: 0, stepSize: 1 }, grid: { color: gridColor.value }, beginAtZero: true },
    x: { ticks: { color: tickColor.value }, grid: { display: false } },
  },
  elements: { bar: { borderRadius: 6 } },
}))

const cobrancasBarOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.parsed.y} cobrança(s)` } } },
  scales: {
    y: { ticks: { color: tickColor.value, precision: 0 }, grid: { color: gridColor.value }, beginAtZero: true },
    x: { ticks: { color: tickColor.value }, grid: { display: false } },
  },
  elements: { bar: { borderRadius: 6 } },
}))

// A legenda nativa fica desligada: o padrão do painel de produtos desenha os chips
// abaixo do gráfico, com mais contraste e sem roubar altura da rosca.
const doughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}` } } },
}))

async function loadDashboard(showFeedback = false) {
  try {
    loading.value = true
    const response = await AssinaturaRepository.dashboard()
    dashboard.value = response.data

    if (showFeedback) {
      toast.success('Painel de contratos atualizado.')
    }
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar o painel de contratos.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <div class="space-y-4 pb-20 md:pb-0">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ChartPie class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Painel de contratos
        </h2>
        <p class="text-sm text-muted-foreground">
          Visão executiva da receita recorrente, cobranças, vencimentos e comodatos do ERP.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <RouterLink v-for="atalho in atalhos" :key="atalho.titulo" :to="atalho.link">
          <Button variant="outline" size="sm" class="gap-2">
            <component :is="atalho.icon" class="h-4 w-4" />
            {{ atalho.titulo }}
          </Button>
        </RouterLink>
        <Button variant="outline" size="icon" class="h-9 w-9" v-tooltip="'Atualizar'" :disabled="loading"
          @click="loadDashboard(true)">
          <RefreshCcw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
      </div>
    </div>

    <!-- KPIs -->
    <section v-if="loading" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Skeleton v-for="item in 8" :key="item" class="h-[132px] rounded-xl" />
    </section>

    <section v-else class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card v-for="kpi in kpiCards" :key="kpi.label" class="rounded-xl transition hover:shadow-md">
        <CardContent class="p-4">
          <div class="rounded-lg p-2 w-fit" :class="corMap[kpi.cor]">
            <component :is="kpi.icon" class="h-5 w-5" />
          </div>
          <p class="mt-3 text-sm text-muted-foreground">{{ kpi.label }}</p>
          <p class="text-2xl font-bold tracking-tight text-foreground">{{ kpi.value }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground truncate">{{ kpi.hint }}</p>
        </CardContent>
      </Card>
    </section>

    <!-- Gráficos principais -->
    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div class="rounded-xl border border-border bg-card p-4 xl:col-span-2">
        <div class="mb-4 flex items-center gap-2">
          <TrendingUp class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Receita dos últimos 6 meses</h3>
        </div>
        <Skeleton v-if="loading" class="h-72 w-full rounded-lg" />
        <div v-else-if="temSerie" class="h-72"><LineChart :data="serieChart" :options="lineOptions" /></div>
        <div v-else class="flex h-72 items-center justify-center text-sm text-muted-foreground">
          Sem ciclos gerados nos últimos meses.
        </div>
      </div>

      <div class="rounded-xl border border-border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <Sparkles class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Contratos por status</h3>
        </div>
        <Skeleton v-if="loading" class="h-72 w-full rounded-lg" />
        <div v-else-if="temContratos" class="h-56"><PieChart :data="contratosStatusChart" :options="doughnutOptions" /></div>
        <div v-else class="flex h-56 items-center justify-center text-sm text-muted-foreground">
          Nenhum contrato cadastrado ainda.
        </div>
        <div v-if="!loading && temContratos" class="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <span v-for="(label, i) in contratosStatusChart.labels" :key="label" class="flex items-center gap-1.5 text-xs">
            <i class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: STATUS_CONTRATO_CORES[i % STATUS_CONTRATO_CORES.length] }" />
            {{ label }}: {{ dashboard?.contratosPorStatus.data[i] ?? 0 }}
          </span>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div class="rounded-xl border border-border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <ReceiptText class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Cobranças por status</h3>
        </div>
        <Skeleton v-if="loading" class="h-60 w-full rounded-lg" />
        <div v-else-if="temCobrancas" class="h-60"><BarChart :data="cobrancasStatusChart" :options="cobrancasBarOptions" /></div>
        <div v-else class="flex h-60 items-center justify-center text-sm text-muted-foreground">
          Nenhuma cobrança gerada ainda.
        </div>
      </div>

      <div class="rounded-xl border border-border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <CalendarClock class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Contratos por periodicidade</h3>
        </div>
        <Skeleton v-if="loading" class="h-60 w-full rounded-lg" />
        <div v-else-if="temPeriodicidade" class="h-60"><BarChart :data="periodicidadeChart" :options="countBarOptions" /></div>
        <div v-else class="flex h-60 items-center justify-center text-sm text-muted-foreground">
          Nenhum contrato ativo ainda.
        </div>
      </div>
    </section>

    <!-- Vencimentos + Top clientes -->
    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div class="rounded-xl border border-border bg-card p-4 xl:col-span-2">
        <div class="mb-4 flex items-center gap-2">
          <CalendarClock class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Próximos vencimentos</h3>
        </div>
        <template v-if="loading">
          <div class="space-y-3">
            <Skeleton v-for="item in 4" :key="item" class="h-20 rounded-lg" />
          </div>
        </template>
        <template v-else>
          <div v-if="!dashboard?.proximosVencimentos?.length" class="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Nenhum contrato cadastrado ainda neste módulo.
          </div>
          <ul v-else class="space-y-3">
            <li
              v-for="item in dashboard.proximosVencimentos"
              :key="item.id"
              class="rounded-lg border border-border bg-muted/20 px-4 py-3"
            >
              <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div class="min-w-0">
                  <p class="flex items-center gap-1.5 font-medium text-foreground">
                    <FilePenLineIcon class="h-4 w-4 shrink-0" />
                    <span class="truncate">{{ item.nomeContrato }}</span>
                  </p>
                  <p class="truncate text-sm text-muted-foreground">{{ item.cliente }} • {{ item.Uid }}</p>
                  <p class="text-xs text-muted-foreground">
                    Próxima cobrança em {{ formatDateToPtBR(item.proximaCobranca) }}
                  </p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                    :class="item.atrasada ? 'text-rose-600 bg-rose-500/10' : 'text-blue-600 bg-blue-500/10'">
                    {{ item.atrasada ? 'Atrasada' : 'No radar' }}
                  </span>
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-emerald-600 bg-emerald-500/10">
                    {{ formatCurrencyBR(item.valorPrevisto) }}
                  </span>
                  <RouterLink :to="`/assinaturas/assinaturas/${item.id}`">
                    <Button variant="outline" size="sm">Abrir</Button>
                  </RouterLink>
                </div>
              </div>
            </li>
          </ul>
        </template>
      </div>

      <div class="rounded-xl border border-border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <Users class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Top clientes por receita</h3>
        </div>
        <template v-if="loading">
          <div class="space-y-3">
            <Skeleton v-for="item in 5" :key="item" class="h-12 rounded-lg" />
          </div>
        </template>
        <template v-else>
          <div v-if="!topClientes.length" class="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Sem receita recorrente para ranquear ainda.
          </div>
          <ul v-else class="space-y-3">
            <li v-for="(cliente, index) in topClientes" :key="cliente.nome + index" class="space-y-1">
              <div class="flex items-center justify-between gap-2 text-sm">
                <span class="flex min-w-0 items-center gap-2">
                  <span class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{{ index + 1 }}</span>
                  <span class="truncate font-medium">{{ cliente.nome }}</span>
                </span>
                <span class="shrink-0 font-semibold text-emerald-600 dark:text-emerald-400">{{ formatCurrencyBR(cliente.valor) }}</span>
              </div>
              <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div class="h-full rounded-full bg-primary" :style="{ width: `${Math.max(6, (cliente.valor / maiorValorCliente) * 100)}%` }" />
              </div>
            </li>
          </ul>
        </template>
      </div>
    </section>

    <MobileBottomBar v-if="uiStore.isMobile">
      <RouterLink to="/assinaturas/assinaturas" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300">
        <Sparkles class="h-5 w-5" />
        <span class="text-xs">Contratos</span>
      </RouterLink>
      <RouterLink to="/assinaturas/planos" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300">
        <Layers3 class="h-5 w-5" />
        <span class="text-xs">Planos</span>
      </RouterLink>
      <RouterLink to="/assinaturas/cobrancas" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300">
        <ReceiptText class="h-5 w-5" />
        <span class="text-xs">Cobranças</span>
      </RouterLink>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="loadDashboard(true)">
        <RefreshCcw class="h-5 w-5" />
        <span class="text-xs">Atualizar</span>
      </button>
    </MobileBottomBar>
  </div>
</template>
