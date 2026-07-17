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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
const MESES_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

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
    { label: 'Contratos ativos', value: String(k?.assinaturasAtivas ?? 0), hint: `De ${k?.totalAssinaturas ?? 0} no total`, icon: Sparkles, color: 'text-primary' },
    { label: 'MRR estimado', value: formatCurrencyBR(k?.mrrEstimado ?? 0), hint: 'Receita recorrente mensal', icon: CircleDollarSign, color: 'text-emerald-600' },
    { label: 'Recebido no mês', value: formatCurrencyBR(k?.recebidoMes ?? 0), hint: 'Ciclos pagos no mês atual', icon: Wallet, color: 'text-emerald-600' },
    { label: 'Ticket médio', value: formatCurrencyBR(k?.ticketMedio ?? 0), hint: 'MRR por contrato ativo', icon: TrendingUp, color: 'text-sky-600' },
    { label: 'Inadimplência', value: formatCurrencyBR(k?.inadimplencia ?? 0), hint: 'Cobranças em atraso', icon: AlertTriangle, color: 'text-rose-600' },
    { label: 'Cobranças pendentes', value: String(k?.cobrancasPendentes ?? 0), hint: 'Ciclos aguardando confirmação', icon: ReceiptText, color: 'text-amber-600' },
    { label: 'Cobranças atrasadas', value: String(k?.cobrancasAtrasadas ?? 0), hint: 'Ciclos vencidos sem baixa', icon: CalendarClock, color: 'text-orange-600' },
    { label: 'Comodatos em uso', value: String(k?.comodatosEmUso ?? 0), hint: 'Equipamentos com clientes', icon: Package, color: 'text-blue-600' },
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
  datasets: [{ data: dashboard.value?.contratosPorStatus.data ?? [], backgroundColor: ['#10B981', '#F59E0B', '#EF4444'], borderWidth: 0 }],
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

const doughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: { legend: { display: true, position: 'bottom', labels: { color: tickColor.value, usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}` } } },
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

      <div class="flex flex-wrap gap-2">
        <RouterLink v-for="atalho in atalhos" :key="atalho.titulo" :to="atalho.link">
          <Button variant="outline" class="gap-2">
            <component :is="atalho.icon" class="h-4 w-4" />
            {{ atalho.titulo }}
          </Button>
        </RouterLink>
        <Button variant="outline" class="gap-2" @click="loadDashboard(true)">
          <RefreshCcw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" />
          Atualizar
        </Button>
      </div>
    </div>

    <!-- KPIs -->
    <section v-if="loading" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Skeleton v-for="item in 8" :key="item" class="h-28 rounded-2xl" />
    </section>

    <section v-else class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card v-for="kpi in kpiCards" :key="kpi.label" class="border-border/70 bg-card shadow-sm">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-sm">
            <component :is="kpi.icon" class="h-4 w-4" :class="kpi.color" /> {{ kpi.label }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-semibold text-foreground">{{ kpi.value }}</p>
          <p class="text-xs text-muted-foreground">{{ kpi.hint }}</p>
        </CardContent>
      </Card>
    </section>

    <!-- Gráficos principais -->
    <div class="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
      <Card class="border-border/70 bg-card shadow-sm">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <TrendingUp class="h-5 w-5 text-primary" /> Receita dos últimos 6 meses
          </CardTitle>
          <CardDescription>Comparativo entre o valor recebido (ciclos pagos) e o previsto.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton v-if="loading" class="h-72 w-full rounded-xl" />
          <div v-else-if="temSerie" class="h-72"><LineChart :data="serieChart" :options="lineOptions" /></div>
          <div v-else class="flex h-72 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
            Sem ciclos gerados nos últimos meses.
          </div>
        </CardContent>
      </Card>

      <Card class="border-border/70 bg-card shadow-sm">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <Sparkles class="h-5 w-5 text-primary" /> Contratos por status
          </CardTitle>
          <CardDescription>Distribuição da carteira de contratos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton v-if="loading" class="h-72 w-full rounded-xl" />
          <div v-else-if="temContratos" class="h-72"><PieChart :data="contratosStatusChart" :options="doughnutOptions" /></div>
          <div v-else class="flex h-72 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
            Nenhum contrato cadastrado ainda.
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <Card class="border-border/70 bg-card shadow-sm">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <ReceiptText class="h-5 w-5 text-primary" /> Cobranças por status
          </CardTitle>
          <CardDescription>Situação dos ciclos financeiros gerados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton v-if="loading" class="h-60 w-full rounded-xl" />
          <div v-else-if="temCobrancas" class="h-60"><BarChart :data="cobrancasStatusChart" :options="cobrancasBarOptions" /></div>
          <div v-else class="flex h-60 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
            Nenhuma cobrança gerada ainda.
          </div>
        </CardContent>
      </Card>

      <Card class="border-border/70 bg-card shadow-sm">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <CalendarClock class="h-5 w-5 text-primary" /> Contratos por periodicidade
          </CardTitle>
          <CardDescription>Como a carteira ativa está distribuída no tempo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton v-if="loading" class="h-60 w-full rounded-xl" />
          <div v-else-if="temPeriodicidade" class="h-60"><BarChart :data="periodicidadeChart" :options="countBarOptions" /></div>
          <div v-else class="flex h-60 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
            Nenhum contrato ativo ainda.
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Vencimentos + Top clientes -->
    <div class="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
      <Card class="border-border/70 bg-card shadow-sm">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <CalendarClock class="h-5 w-5 text-primary" /> Próximos vencimentos
          </CardTitle>
          <CardDescription>Contratos priorizados por vencimento para ação rápida da operação.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <template v-if="loading">
            <Skeleton v-for="item in 4" :key="item" class="h-20 rounded-2xl" />
          </template>
          <template v-else>
            <div
              v-for="item in dashboard?.proximosVencimentos || []"
              :key="item.id"
              class="rounded-xl border border-border/70 bg-muted/10 px-4 py-2"
            >
              <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p class="font-medium text-foreground flex items-center gap-1"><FilePenLineIcon class="h-4 w-4 inline-flex" /> {{ item.nomeContrato }}</p>
                  <p class="text-sm text-muted-foreground">{{ item.cliente }} • {{ item.Uid }}</p>
                  <p class="text-xs text-muted-foreground">
                    Próxima cobrança em {{ formatDateToPtBR(item.proximaCobranca) }}
                  </p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="px-2 py-1 text-sm rounded-sm border" :class="item.atrasada ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'">
                    {{ item.atrasada ? 'Atrasada' : 'No radar' }}
                  </span>
                  <span class="px-2 py-1 text-sm rounded-sm border bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {{ formatCurrencyBR(item.valorPrevisto) }}
                  </span>
                  <RouterLink :to="`/assinaturas/assinaturas/${item.id}`">
                    <Button variant="outline" size="sm">Abrir</Button>
                  </RouterLink>
                </div>
              </div>
            </div>
            <div v-if="!dashboard?.proximosVencimentos?.length" class="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum contrato cadastrado ainda neste módulo.
            </div>
          </template>
        </CardContent>
      </Card>

      <Card class="border-border/70 bg-card shadow-sm">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <Users class="h-5 w-5 text-primary" /> Top clientes por receita
          </CardTitle>
          <CardDescription>Clientes que mais contribuem para o MRR.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <template v-if="loading">
            <Skeleton v-for="item in 5" :key="item" class="h-12 rounded-xl" />
          </template>
          <template v-else>
            <div v-for="(cliente, index) in topClientes" :key="cliente.nome + index" class="space-y-1">
              <div class="flex items-center justify-between gap-2 text-sm">
                <span class="flex min-w-0 items-center gap-2 text-foreground">
                  <span class="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">{{ index + 1 }}</span>
                  <span class="truncate">{{ cliente.nome }}</span>
                </span>
                <span class="flex-none font-semibold text-emerald-600 dark:text-emerald-400">{{ formatCurrencyBR(cliente.valor) }}</span>
              </div>
              <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div class="h-full rounded-full bg-primary" :style="{ width: `${Math.max(6, (cliente.valor / maiorValorCliente) * 100)}%` }" />
              </div>
            </div>
            <div v-if="!topClientes.length" class="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Sem receita recorrente para ranquear ainda.
            </div>
          </template>
        </CardContent>
      </Card>
    </div>

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
