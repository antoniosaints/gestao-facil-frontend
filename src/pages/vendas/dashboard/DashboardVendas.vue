<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { Card, CardContent } from "@/components/ui/card"
import Calendarpicker from "@/components/formulario/calendarpicker.vue"
import ModalView from "@/components/formulario/ModalView.vue"
import BarChart from "@/components/graficos/BarChart.vue"
import LineChart from "@/components/graficos/LineChart.vue"
import PieChart from "@/components/graficos/PieChart.vue"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useToast } from "vue-toastification"
import { endOfDay, endOfMonth, startOfDay, startOfMonth, subDays, subMonths } from "date-fns"
import { VendaRepository } from "@/repositories/venda-repository"
import { useUiStore } from "@/stores/ui/uiStore"
import { colorTheme } from "@/utils/theme"
import { goBack, goTo } from "@/hooks/links"
import { formatCurrencyBR } from "@/utils/formatters"
import {
  ArrowDownRight, ArrowUpRight, BadgePercent, CalendarRange, CircleDollarSign, Clock3,
  CreditCard, Crown, Download, FileText, Filter, Minus, Package, ReceiptText, RefreshCw,
  ShoppingCart, Tag, TrendingUp, Undo2, UserRound, Users,
} from "lucide-vue-next"

type Metrica = { atual: number; anterior?: number; delta?: number }
type Ranking = { nome: string; valor: number; qtd?: number; quantidade?: number }
interface Painel {
  kpis: {
    faturamento: Metrica
    vendas: Metrica
    ticketMedio: Metrica
    descontos: Metrica
    emAberto: { valor: number; qtd: number }
    orcamento: { valor: number; qtd: number }
    totalVendas: number
  }
  serieDiaria: { labels: string[]; data: number[] }
  porStatus: { labels: string[]; data: number[] }
  porPagamento: { labels: string[]; data: number[] }
  porDiaSemana: { labels: string[]; data: number[] }
  porHora: { labels: string[]; data: number[] }
  topProdutos: Ranking[]
  topClientes: Ranking[]
  topVendedores: Ranking[]
}

const toast = useToast()
const uiStore = useUiStore()
const loading = ref(true)
const openModalFiltros = ref(false)
const filtroPeriodo = ref<[Date, Date]>([startOfMonth(new Date()), endOfMonth(new Date())])
const presetAtivo = ref<string>("month")
const painel = ref<Painel | null>(null)

const presets = [
  { key: "today", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "month", label: "Este mês" },
  { key: "last-month", label: "Mês passado" },
]

const PALETTE = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#EC4899", "#84CC16"]
const PAGAMENTO_LABEL: Record<string, string> = {
  DINHEIRO: "Dinheiro", CARTAO: "Cartão", CREDITO: "Crédito", DEBITO: "Débito",
  PIX: "PIX", BOLETO: "Boleto", TRANSFERENCIA: "Transferência", CHEQUE: "Cheque",
  GATEWAY: "Gateway", OUTRO: "Outro",
}
const STATUS_LABEL: Record<string, string> = {
  ORCAMENTO: "Orçamento", PENDENTE: "Pendente", ANDAMENTO: "Em andamento",
  FINALIZADO: "Finalizado", FATURADO: "Faturado", CANCELADO: "Cancelado", ESTORNADO: "Estornado",
}

function themeColor(name: string, alpha?: number) {
  if (typeof document === "undefined") return "#2563EB"
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!value) return "#2563EB"
  return alpha != null ? `hsl(${value} / ${alpha})` : `hsl(${value})`
}

const primary = computed(() => { void colorTheme.value; return themeColor("--primary") })
const primarySoft = computed(() => { void colorTheme.value; return themeColor("--primary", 0.16) })
const tickColor = computed(() => (colorTheme.value === "dark" ? "#cbd5e1" : "#475569"))
const gridColor = computed(() => (colorTheme.value === "dark" ? "rgba(148,163,184,0.16)" : "rgba(148,163,184,0.22)"))

const moneyTooltip = { callbacks: { label: (ctx: any) => ` ${formatCurrencyBR(ctx.parsed.y ?? ctx.parsed)}` } }

const lineOptions = computed(() => ({
  responsive: true, maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: { legend: { display: false }, tooltip: moneyTooltip },
  scales: {
    y: { ticks: { color: tickColor.value, callback: (v: number) => "R$ " + Number(v).toLocaleString("pt-BR") }, grid: { color: gridColor.value }, beginAtZero: true },
    x: { ticks: { color: tickColor.value, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }, grid: { display: false } },
  },
}))

const barOptions = computed(() => ({
  responsive: true, maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: { legend: { display: false }, tooltip: moneyTooltip },
  scales: {
    y: { ticks: { color: tickColor.value, callback: (v: number) => "R$ " + Number(v).toLocaleString("pt-BR") }, grid: { color: gridColor.value }, beginAtZero: true },
    x: { ticks: { color: tickColor.value }, grid: { display: false } },
  },
  elements: { bar: { borderRadius: 6 } },
}))

const doughnutOptions = computed(() => ({
  responsive: true, maintainAspectRatio: false, cutout: "62%",
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${formatCurrencyBR(ctx.parsed)}` } } },
}))

const statusOptions = computed(() => ({
  responsive: true, maintainAspectRatio: false, cutout: "62%",
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed} venda(s)` } } },
}))

const serieChart = computed(() => ({
  labels: painel.value?.serieDiaria.labels ?? [],
  datasets: [{
    label: "Faturamento", data: painel.value?.serieDiaria.data ?? [],
    borderColor: primary.value, backgroundColor: primarySoft.value,
    fill: true, tension: 0.35, borderWidth: 2, pointRadius: 2, pointHoverRadius: 5,
  }],
}))

const pagamentoChart = computed(() => ({
  labels: (painel.value?.porPagamento.labels ?? []).map((l) => PAGAMENTO_LABEL[l] ?? l),
  datasets: [{ data: painel.value?.porPagamento.data ?? [], backgroundColor: PALETTE, borderWidth: 0 }],
}))

const statusChart = computed(() => ({
  labels: (painel.value?.porStatus.labels ?? []).map((l) => STATUS_LABEL[l] ?? l),
  datasets: [{ data: painel.value?.porStatus.data ?? [], backgroundColor: PALETTE, borderWidth: 0 }],
}))

const semanaChart = computed(() => ({
  labels: painel.value?.porDiaSemana.labels ?? [],
  datasets: [{ data: painel.value?.porDiaSemana.data ?? [], backgroundColor: primary.value, borderRadius: 6 }],
}))

const horaChart = computed(() => ({
  labels: painel.value?.porHora.labels ?? [],
  datasets: [{ data: painel.value?.porHora.data ?? [], backgroundColor: primarySoft.value, borderColor: primary.value, borderWidth: 1, borderRadius: 4 }],
}))

const temPagamento = computed(() => (painel.value?.porPagamento.data ?? []).some((v) => v > 0))
const temStatus = computed(() => (painel.value?.porStatus.data ?? []).length > 0)

const corMap: Record<string, { chip: string }> = {
  emerald: { chip: "text-emerald-600 bg-emerald-500/10" },
  blue: { chip: "text-blue-600 bg-blue-500/10" },
  violet: { chip: "text-violet-600 bg-violet-500/10" },
  amber: { chip: "text-amber-600 bg-amber-500/10" },
}

const cards = computed(() => {
  const k = painel.value?.kpis
  if (!k) return []
  return [
    { titulo: "Faturamento", valor: formatCurrencyBR(k.faturamento.atual), delta: k.faturamento.delta, comparar: true, detalhe: "vs. período anterior", icone: CircleDollarSign, cor: "emerald" },
    { titulo: "Vendas faturadas", valor: String(k.vendas.atual), delta: k.vendas.delta, comparar: true, detalhe: `${k.totalVendas} venda(s) no total`, icone: ShoppingCart, cor: "blue" },
    { titulo: "Ticket médio", valor: formatCurrencyBR(k.ticketMedio.atual), delta: k.ticketMedio.delta, comparar: true, detalhe: "vs. período anterior", icone: ReceiptText, cor: "violet" },
    { titulo: "Descontos concedidos", valor: formatCurrencyBR(k.descontos.atual), comparar: false, detalhe: "no período selecionado", icone: BadgePercent, cor: "amber" },
  ]
})

function deltaInfo(delta?: number) {
  const v = Math.round(delta ?? 0)
  if (v > 0) return { label: `+${v}%`, cls: "text-emerald-600 bg-emerald-500/10", icon: ArrowUpRight }
  if (v < 0) return { label: `${v}%`, cls: "text-rose-600 bg-rose-500/10", icon: ArrowDownRight }
  return { label: "0%", cls: "text-muted-foreground bg-muted", icon: Minus }
}

function maxValor(lista: Ranking[]) {
  return Math.max(1, ...lista.map((i) => i.valor))
}

const filtroLabel = computed(() => {
  const [i, f] = filtroPeriodo.value
  return `${i.toLocaleDateString("pt-BR")} — ${f.toLocaleDateString("pt-BR")}`
})

async function carregar() {
  try {
    loading.value = true
    const [inicio, fim] = filtroPeriodo.value
    painel.value = await VendaRepository.painel(inicio.toISOString(), fim.toISOString())
  } catch (error) {
    console.error(error)
    toast.error("Erro ao carregar o painel de vendas")
  } finally {
    loading.value = false
  }
}

function applyPreset(preset: string) {
  presetAtivo.value = preset
  const now = new Date()
  if (preset === "today") filtroPeriodo.value = [startOfDay(now), endOfDay(now)]
  else if (preset === "7d") filtroPeriodo.value = [startOfDay(subDays(now, 6)), endOfDay(now)]
  else if (preset === "30d") filtroPeriodo.value = [startOfDay(subDays(now, 29)), endOfDay(now)]
  else if (preset === "month") filtroPeriodo.value = [startOfMonth(now), endOfMonth(now)]
  else if (preset === "last-month") {
    const lm = subMonths(now, 1)
    filtroPeriodo.value = [startOfMonth(lm), endOfMonth(lm)]
  }
  carregar()
}

function aplicarCustom() {
  presetAtivo.value = "custom"
  openModalFiltros.value = false
  carregar()
}

async function exportarPdf() {
  try {
    const [inicio, fim] = filtroPeriodo.value
    await VendaRepository.gerarRelatorioPDF(inicio.toISOString(), fim.toISOString())
    toast.success("Relatório gerado com sucesso")
  } catch (error) {
    console.error(error)
    toast.error("Erro ao gerar o relatório")
  }
}

onMounted(carregar)
</script>

<template>
  <div class="space-y-4 pb-24 md:pb-4">
    <!-- Cabeçalho -->
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <TrendingUp class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Painel de vendas
        </h2>
        <p class="text-sm text-muted-foreground flex items-center gap-1.5">
          <CalendarRange class="h-3.5 w-3.5" /> {{ filtroLabel }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex flex-wrap items-center rounded-lg border border-border bg-card p-1">
          <button v-for="p in presets" :key="p.key" type="button" @click="applyPreset(p.key)"
            class="rounded-md px-3 py-1.5 text-xs font-medium transition"
            :class="presetAtivo === p.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'">
            {{ p.label }}
          </button>
        </div>
        <Button variant="outline" size="sm" @click="openModalFiltros = true">
          <Filter class="h-4 w-4" /> Período
        </Button>
        <Button variant="outline" size="sm" @click="exportarPdf">
          <Download class="h-4 w-4" /> PDF
        </Button>
        <Button variant="outline" size="icon" class="h-9 w-9" :disabled="loading" @click="carregar">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
      </div>
    </div>

    <!-- KPIs principais -->
    <section v-if="loading" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Skeleton v-for="i in 4" :key="i" class="h-[132px] rounded-xl" />
    </section>
    <section v-else class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card v-for="(kpi, i) in cards" :key="i" class="rounded-xl transition hover:shadow-md">
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div class="rounded-lg p-2" :class="corMap[kpi.cor].chip">
              <component :is="kpi.icone" class="h-5 w-5" />
            </div>
            <span v-if="kpi.comparar" class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
              :class="deltaInfo(kpi.delta).cls">
              <component :is="deltaInfo(kpi.delta).icon" class="h-3 w-3" />
              {{ deltaInfo(kpi.delta).label }}
            </span>
          </div>
          <p class="mt-3 text-sm text-muted-foreground">{{ kpi.titulo }}</p>
          <p class="text-2xl font-bold tracking-tight text-foreground">{{ kpi.valor }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground truncate">{{ kpi.detalhe }}</p>
        </CardContent>
      </Card>
    </section>

    <!-- Faixa secundária -->
    <section v-if="!loading && painel" class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div class="rounded-lg bg-sky-500/10 p-2 text-sky-600"><Clock3 class="h-5 w-5" /></div>
        <div>
          <p class="text-xs text-muted-foreground">Em aberto</p>
          <p class="text-lg font-bold">{{ formatCurrencyBR(painel.kpis.emAberto.valor) }}</p>
          <p class="text-xs text-muted-foreground">{{ painel.kpis.emAberto.qtd }} venda(s) aguardando</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div class="rounded-lg bg-rose-500/10 p-2 text-rose-600"><FileText class="h-5 w-5" /></div>
        <div>
          <p class="text-xs text-muted-foreground">Orçamentos</p>
          <p class="text-lg font-bold">{{ formatCurrencyBR(painel.kpis.orcamento.valor) }}</p>
          <p class="text-xs text-muted-foreground">{{ painel.kpis.orcamento.qtd }} orçamento(s) ativos</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div class="rounded-lg bg-emerald-500/10 p-2 text-emerald-600"><ShoppingCart class="h-5 w-5" /></div>
        <div>
          <p class="text-xs text-muted-foreground">Total de vendas</p>
          <p class="text-lg font-bold">{{ painel.kpis.totalVendas }}</p>
          <p class="text-xs text-muted-foreground">registros no período</p>
        </div>
      </div>
    </section>

    <!-- Curva + pagamento -->
    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div class="rounded-xl border border-border bg-card p-4 xl:col-span-2">
        <div class="mb-4 flex items-center gap-2">
          <TrendingUp class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Curva de faturamento</h3>
        </div>
        <Skeleton v-if="loading" class="h-72 w-full rounded-lg" />
        <div v-else class="h-72"><LineChart :data="serieChart" :options="lineOptions" /></div>
      </div>
      <div class="rounded-xl border border-border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <CreditCard class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Formas de pagamento</h3>
        </div>
        <Skeleton v-if="loading" class="h-72 w-full rounded-lg" />
        <div v-else-if="temPagamento" class="h-56"><PieChart :data="pagamentoChart" :options="doughnutOptions" /></div>
        <div v-else class="flex h-56 items-center justify-center text-sm text-muted-foreground">Sem pagamentos no período</div>
        <div v-if="!loading && temPagamento" class="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <span v-for="(label, i) in pagamentoChart.labels" :key="label" class="flex items-center gap-1.5 text-xs">
            <i class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: PALETTE[i % PALETTE.length] }" />
            {{ label }}
          </span>
        </div>
      </div>
    </section>

    <!-- Dia da semana + hora + status -->
    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div class="rounded-xl border border-border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <CalendarRange class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Por dia da semana</h3>
        </div>
        <Skeleton v-if="loading" class="h-60 w-full rounded-lg" />
        <div v-else class="h-60"><BarChart :data="semanaChart" :options="barOptions" /></div>
      </div>
      <div class="rounded-xl border border-border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <Clock3 class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Por horário</h3>
        </div>
        <Skeleton v-if="loading" class="h-60 w-full rounded-lg" />
        <div v-else class="h-60"><BarChart :data="horaChart" :options="barOptions" /></div>
      </div>
      <div class="rounded-xl border border-border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <FileText class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Vendas por status</h3>
        </div>
        <Skeleton v-if="loading" class="h-60 w-full rounded-lg" />
        <div v-else-if="temStatus" class="h-44"><PieChart :data="statusChart" :options="statusOptions" /></div>
        <div v-else class="flex h-44 items-center justify-center text-sm text-muted-foreground">Sem vendas no período</div>
        <div v-if="!loading && temStatus" class="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <span v-for="(label, i) in statusChart.labels" :key="label" class="flex items-center gap-1.5 text-xs">
            <i class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: PALETTE[i % PALETTE.length] }" />
            {{ label }}
          </span>
        </div>
      </div>
    </section>

    <!-- Rankings -->
    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <!-- Top produtos -->
      <div class="rounded-xl border border-border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <Package class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Top produtos</h3>
        </div>
        <Skeleton v-if="loading" class="h-64 w-full rounded-lg" />
        <template v-else>
          <div v-if="!painel?.topProdutos.length" class="flex h-40 items-center justify-center text-sm text-muted-foreground">Sem itens vendidos</div>
          <ul v-else class="space-y-3">
            <li v-for="(item, i) in painel.topProdutos" :key="i" class="space-y-1">
              <div class="flex items-center justify-between gap-2 text-sm">
                <span class="flex min-w-0 items-center gap-2">
                  <span class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{{ i + 1 }}</span>
                  <span class="truncate font-medium">{{ item.nome }}</span>
                </span>
                <span class="shrink-0 font-semibold">{{ formatCurrencyBR(item.valor) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div class="h-full rounded-full bg-primary" :style="{ width: `${(item.valor / maxValor(painel.topProdutos)) * 100}%` }" />
                </div>
                <span class="shrink-0 text-xs text-muted-foreground">{{ item.quantidade }} un</span>
              </div>
            </li>
          </ul>
        </template>
      </div>

      <!-- Top clientes -->
      <div class="rounded-xl border border-border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <Users class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Top clientes</h3>
        </div>
        <Skeleton v-if="loading" class="h-64 w-full rounded-lg" />
        <template v-else>
          <div v-if="!painel?.topClientes.length" class="flex h-40 items-center justify-center text-sm text-muted-foreground">Sem clientes no período</div>
          <ul v-else class="space-y-3">
            <li v-for="(item, i) in painel.topClientes" :key="i" class="flex items-center gap-3">
              <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Crown v-if="i === 0" class="h-4 w-4" />
                <UserRound v-else class="h-4 w-4" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ item.nome }}</p>
                <p class="text-xs text-muted-foreground">{{ item.qtd }} compra(s)</p>
              </div>
              <span class="shrink-0 text-sm font-semibold">{{ formatCurrencyBR(item.valor) }}</span>
            </li>
          </ul>
        </template>
      </div>

      <!-- Top vendedores -->
      <div class="rounded-xl border border-border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <Tag class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Top vendedores</h3>
        </div>
        <Skeleton v-if="loading" class="h-64 w-full rounded-lg" />
        <template v-else>
          <div v-if="!painel?.topVendedores.length" class="flex h-40 items-center justify-center text-center text-sm text-muted-foreground">
            Nenhuma venda com vendedor vinculado
          </div>
          <ul v-else class="space-y-3">
            <li v-for="(item, i) in painel.topVendedores" :key="i" class="flex items-center gap-3">
              <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">{{ i + 1 }}</span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ item.nome }}</p>
                <p class="text-xs text-muted-foreground">{{ item.qtd }} venda(s)</p>
              </div>
              <span class="shrink-0 text-sm font-semibold">{{ formatCurrencyBR(item.valor) }}</span>
            </li>
          </ul>
        </template>
      </div>
    </section>

    <!-- Modal de período personalizado -->
    <ModalView v-model:open="openModalFiltros" title="Período personalizado" size="lg">
      <div class="grid gap-4 p-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">Atalhos rápidos</label>
          <div class="flex flex-wrap gap-2">
            <Button v-for="p in presets" :key="p.key" type="button" variant="outline" size="sm"
              @click="applyPreset(p.key); openModalFiltros = false">{{ p.label }}</Button>
          </div>
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">Intervalo de datas</label>
          <Calendarpicker class="w-full" :range="true" v-model="filtroPeriodo" />
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="openModalFiltros = false">Cancelar</Button>
          <Button @click="aplicarCustom">
            <Filter class="h-4 w-4" /> Aplicar
          </Button>
        </div>
      </div>
    </ModalView>

    <!-- Navegação mobile -->
    <nav v-if="uiStore.isMobile"
      class="fixed bottom-0 left-0 w-full bg-card border-t border-border flex justify-around pt-4 h-20 shadow-lg z-20">
      <button type="button" @click="goTo('/vendas')"
        class="flex flex-col items-center text-gray-700 dark:text-gray-300 hover:text-primary transition">
        <Tag />
        <span class="text-xs">Vendas</span>
      </button>
      <button type="button" @click="goBack"
        class="flex flex-col items-center text-gray-700 dark:text-gray-300 hover:text-primary transition">
        <Undo2 />
        <span class="text-xs">Voltar</span>
      </button>
    </nav>
  </div>
</template>
