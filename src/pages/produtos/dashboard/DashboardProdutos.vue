<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { Card, CardContent } from "@/components/ui/card"
import Calendarpicker from "@/components/formulario/calendarpicker.vue"
import ModalView from "@/components/formulario/ModalView.vue"
import LineChart from "@/components/graficos/LineChart.vue"
import PieChart from "@/components/graficos/PieChart.vue"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useToast } from "vue-toastification"
import { endOfDay, endOfMonth, startOfDay, startOfMonth, subDays, subMonths } from "date-fns"
import { ProdutoRepository } from "@/repositories/produto-repository"
import { useUiStore } from "@/stores/ui/uiStore"
import { colorTheme } from "@/utils/theme"
import { goBack, goTo } from "@/hooks/links"
import { formatCurrencyBR } from "@/utils/formatters"
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Box, Boxes, CalendarRange, Coins, CircleDollarSign,
  Filter, HandCoins, Minus, Package, PackageOpen, ReceiptText, RefreshCw, ShoppingBag,
  Tags, TrendingUp, Undo2, Warehouse,
} from "lucide-vue-next"

type Metrica = { atual: number; anterior?: number; delta?: number }
interface Painel {
  kpis: {
    receita: Metrica
    lucro: Metrica
    ticketMedio: Metrica
    itensVendidos: Metrica
    custoReposicoes: { atual: number }
    valorEstoque: { atual: number }
    estoqueBaixo: { atual: number }
    semEstoque: { atual: number }
    totalProdutosBase: number
    totalVariantes: number
    totalCategorias: number
    produtosNoPdv: number
    materiasPrimas: number
  }
  serieReceita: { labels: string[]; data: number[] }
  distribuicaoCategorias: { labels: string[]; data: number[] }
  saudeEstoque: { labels: string[]; data: number[] }
  topReceita: { nome: string; valor: number; quantidade: number }[]
  topLucro: { nome: string; lucro: number }[]
  maisRepostos: { nome: string; quantidade: number }[]
  estoqueCritico: { nome: string; estoque: number; minimo: number }[]
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
const SAUDE_CORES = ["#10B981", "#F59E0B", "#EF4444", "#94A3B8"]

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

const lineOptions = computed(() => ({
  responsive: true, maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: any) => ` ${formatCurrencyBR(c.parsed.y)}` } } },
  scales: {
    y: { ticks: { color: tickColor.value, callback: (v: number) => "R$ " + Number(v).toLocaleString("pt-BR") }, grid: { color: gridColor.value }, beginAtZero: true },
    x: { ticks: { color: tickColor.value, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }, grid: { display: false } },
  },
}))

const doughnutOptions = computed(() => ({
  responsive: true, maintainAspectRatio: false, cutout: "62%",
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: any) => ` ${c.label}: ${c.parsed}` } } },
}))

const serieChart = computed(() => ({
  labels: painel.value?.serieReceita.labels ?? [],
  datasets: [{
    label: "Receita", data: painel.value?.serieReceita.data ?? [],
    borderColor: primary.value, backgroundColor: primarySoft.value,
    fill: true, tension: 0.35, borderWidth: 2, pointRadius: 2, pointHoverRadius: 5,
  }],
}))

const categoriasChart = computed(() => ({
  labels: painel.value?.distribuicaoCategorias.labels ?? [],
  datasets: [{ data: painel.value?.distribuicaoCategorias.data ?? [], backgroundColor: PALETTE, borderWidth: 0 }],
}))

const saudeChart = computed(() => ({
  labels: painel.value?.saudeEstoque.labels ?? [],
  datasets: [{ data: painel.value?.saudeEstoque.data ?? [], backgroundColor: SAUDE_CORES, borderWidth: 0 }],
}))

const temCategorias = computed(() => (painel.value?.distribuicaoCategorias.data ?? []).some((v) => v > 0))
const temSaude = computed(() => (painel.value?.saudeEstoque.data ?? []).some((v) => v > 0))

const corMap: Record<string, string> = {
  emerald: "text-emerald-600 bg-emerald-500/10",
  blue: "text-blue-600 bg-blue-500/10",
  violet: "text-violet-600 bg-violet-500/10",
  sky: "text-sky-600 bg-sky-500/10",
}

const cards = computed(() => {
  const k = painel.value?.kpis
  if (!k) return []
  return [
    { titulo: "Receita vendida", valor: formatCurrencyBR(k.receita.atual), delta: k.receita.delta, comparar: true, detalhe: "vs. período anterior", icone: CircleDollarSign, cor: "emerald" },
    { titulo: "Lucro realizado", valor: formatCurrencyBR(k.lucro.atual), delta: k.lucro.delta, comparar: true, detalhe: "receita menos custo", icone: TrendingUp, cor: "blue" },
    { titulo: "Ticket médio", valor: formatCurrencyBR(k.ticketMedio.atual), delta: k.ticketMedio.delta, comparar: true, detalhe: "vs. período anterior", icone: ReceiptText, cor: "violet" },
    { titulo: "Itens vendidos", valor: String(k.itensVendidos.atual), delta: k.itensVendidos.delta, comparar: true, detalhe: "unidades no período", icone: ShoppingBag, cor: "sky" },
  ]
})

function deltaInfo(delta?: number) {
  const v = Math.round(delta ?? 0)
  if (v > 0) return { label: `+${v}%`, cls: "text-emerald-600 bg-emerald-500/10", icon: ArrowUpRight }
  if (v < 0) return { label: `${v}%`, cls: "text-rose-600 bg-rose-500/10", icon: ArrowDownRight }
  return { label: "0%", cls: "text-muted-foreground bg-muted", icon: Minus }
}

function maxValor<T extends Record<string, any>>(lista: T[], campo: keyof T) {
  return Math.max(1, ...lista.map((i) => Number(i[campo]) || 0))
}

const filtroLabel = computed(() => {
  const [i, f] = filtroPeriodo.value
  return `${i.toLocaleDateString("pt-BR")} — ${f.toLocaleDateString("pt-BR")}`
})

async function carregar() {
  try {
    loading.value = true
    const [inicio, fim] = filtroPeriodo.value
    painel.value = await ProdutoRepository.getPainel(inicio.toISOString(), fim.toISOString())
  } catch (error) {
    console.error(error)
    toast.error("Erro ao carregar o painel de produtos")
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

onMounted(carregar)
</script>

<template>
  <div class="space-y-4 pb-24 md:pb-4">
    <!-- Cabeçalho -->
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Package class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Painel de produtos
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
        <Button variant="outline" size="icon" class="h-9 w-9" v-tooltip="'Atualizar'" :disabled="loading" @click="carregar">
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
            <div class="rounded-lg p-2" :class="corMap[kpi.cor]">
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

    <!-- Faixa secundária (catálogo / estoque) -->
    <section v-if="!loading && painel" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div class="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div class="rounded-lg bg-emerald-500/10 p-2 text-emerald-600"><Warehouse class="h-5 w-5" /></div>
        <div class="min-w-0">
          <p class="text-xs text-muted-foreground">Valor em estoque</p>
          <p class="text-lg font-bold truncate">{{ formatCurrencyBR(painel.kpis.valorEstoque.atual) }}</p>
          <p class="text-xs text-muted-foreground">custo estimado</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div class="rounded-lg bg-amber-500/10 p-2 text-amber-600"><AlertTriangle class="h-5 w-5" /></div>
        <div class="min-w-0">
          <p class="text-xs text-muted-foreground">Alertas de estoque</p>
          <p class="text-lg font-bold">{{ painel.kpis.estoqueBaixo.atual + painel.kpis.semEstoque.atual }}</p>
          <p class="text-xs text-muted-foreground">{{ painel.kpis.estoqueBaixo.atual }} baixo · {{ painel.kpis.semEstoque.atual }} sem estoque</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div class="rounded-lg bg-blue-500/10 p-2 text-blue-600"><Boxes class="h-5 w-5" /></div>
        <div class="min-w-0">
          <p class="text-xs text-muted-foreground">Catálogo</p>
          <p class="text-lg font-bold">{{ painel.kpis.totalProdutosBase }} <span class="text-xs font-normal text-muted-foreground">base</span></p>
          <p class="text-xs text-muted-foreground">{{ painel.kpis.totalVariantes }} variantes · {{ painel.kpis.totalCategorias }} categorias</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div class="rounded-lg bg-indigo-500/10 p-2 text-indigo-600"><HandCoins class="h-5 w-5" /></div>
        <div class="min-w-0">
          <p class="text-xs text-muted-foreground">Custo de reposições</p>
          <p class="text-lg font-bold truncate">{{ formatCurrencyBR(painel.kpis.custoReposicoes.atual) }}</p>
          <p class="text-xs text-muted-foreground">entradas concluídas</p>
        </div>
      </div>
    </section>

    <!-- Curva de receita + categorias -->
    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div class="rounded-xl border border-border bg-card p-4 xl:col-span-2">
        <div class="mb-4 flex items-center gap-2">
          <TrendingUp class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Curva de receita</h3>
        </div>
        <Skeleton v-if="loading" class="h-72 w-full rounded-lg" />
        <div v-else class="h-72"><LineChart :data="serieChart" :options="lineOptions" /></div>
      </div>
      <div class="rounded-xl border border-border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <Tags class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Catálogo por categoria</h3>
        </div>
        <Skeleton v-if="loading" class="h-72 w-full rounded-lg" />
        <div v-else-if="temCategorias" class="h-56"><PieChart :data="categoriasChart" :options="doughnutOptions" /></div>
        <div v-else class="flex h-56 items-center justify-center text-sm text-muted-foreground">Sem categorias cadastradas</div>
        <div v-if="!loading && temCategorias" class="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <span v-for="(label, i) in categoriasChart.labels" :key="label" class="flex items-center gap-1.5 text-xs">
            <i class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: PALETTE[i % PALETTE.length] }" />
            {{ label }}
          </span>
        </div>
      </div>
    </section>

    <!-- Saúde do estoque + estoque crítico + mais repostos -->
    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div class="rounded-xl border border-border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <PackageOpen class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Saúde do estoque</h3>
        </div>
        <Skeleton v-if="loading" class="h-60 w-full rounded-lg" />
        <template v-else-if="temSaude">
          <div class="h-44"><PieChart :data="saudeChart" :options="doughnutOptions" /></div>
          <div class="mt-3 grid grid-cols-2 gap-1">
            <span v-for="(label, i) in saudeChart.labels" :key="label" class="flex items-center gap-1.5 text-xs">
              <i class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: SAUDE_CORES[i % SAUDE_CORES.length] }" />
              {{ label }}: {{ painel?.saudeEstoque.data[i] ?? 0 }}
            </span>
          </div>
        </template>
        <div v-else class="flex h-60 items-center justify-center text-sm text-muted-foreground">Sem produtos cadastrados</div>
      </div>

      <div class="rounded-xl border border-border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <AlertTriangle class="h-5 w-5 text-amber-500" />
          <h3 class="font-semibold">Estoque crítico</h3>
        </div>
        <Skeleton v-if="loading" class="h-60 w-full rounded-lg" />
        <template v-else>
          <div v-if="!painel?.estoqueCritico.length" class="flex h-52 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <PackageOpen class="h-8 w-8 opacity-40" /> Estoque saudável
          </div>
          <ul v-else class="space-y-2.5">
            <li v-for="(item, i) in painel.estoqueCritico" :key="i" class="flex items-center justify-between gap-2">
              <span class="flex min-w-0 items-center gap-2">
                <span class="h-2 w-2 shrink-0 rounded-full" :class="item.estoque <= 0 ? 'bg-red-500' : 'bg-amber-500'" />
                <span class="truncate text-sm">{{ item.nome }}</span>
              </span>
              <span class="shrink-0 text-xs font-semibold"
                :class="item.estoque <= 0 ? 'text-red-600' : 'text-amber-600'">
                {{ item.estoque }} / mín {{ item.minimo }}
              </span>
            </li>
          </ul>
        </template>
      </div>

      <div class="rounded-xl border border-border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <RefreshCw class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Mais repostos</h3>
        </div>
        <Skeleton v-if="loading" class="h-60 w-full rounded-lg" />
        <template v-else>
          <div v-if="!painel?.maisRepostos.length" class="flex h-52 items-center justify-center text-sm text-muted-foreground">Sem reposições no período</div>
          <ul v-else class="space-y-3">
            <li v-for="(item, i) in painel.maisRepostos" :key="i" class="space-y-1">
              <div class="flex items-center justify-between gap-2 text-sm">
                <span class="truncate">{{ item.nome }}</span>
                <span class="shrink-0 font-semibold">{{ item.quantidade }} un</span>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-muted">
                <div class="h-full rounded-full bg-primary" :style="{ width: `${(item.quantidade / maxValor(painel.maisRepostos, 'quantidade')) * 100}%` }" />
              </div>
            </li>
          </ul>
        </template>
      </div>
    </section>

    <!-- Rankings receita / lucro -->
    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div class="rounded-xl border border-border bg-card p-4 xl:col-span-2">
        <div class="mb-4 flex items-center gap-2">
          <Package class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Top produtos por receita</h3>
        </div>
        <Skeleton v-if="loading" class="h-64 w-full rounded-lg" />
        <template v-else>
          <div v-if="!painel?.topReceita.length" class="flex h-40 items-center justify-center text-sm text-muted-foreground">Sem vendas no período</div>
          <ul v-else class="space-y-3">
            <li v-for="(item, i) in painel.topReceita" :key="i" class="space-y-1">
              <div class="flex items-center justify-between gap-2 text-sm">
                <span class="flex min-w-0 items-center gap-2">
                  <span class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{{ i + 1 }}</span>
                  <span class="truncate font-medium">{{ item.nome }}</span>
                </span>
                <span class="shrink-0 font-semibold">{{ formatCurrencyBR(item.valor) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div class="h-full rounded-full bg-primary" :style="{ width: `${(item.valor / maxValor(painel.topReceita, 'valor')) * 100}%` }" />
                </div>
                <span class="shrink-0 text-xs text-muted-foreground">{{ item.quantidade }} un</span>
              </div>
            </li>
          </ul>
        </template>
      </div>

      <div class="rounded-xl border border-border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <Coins class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Maior lucro</h3>
        </div>
        <Skeleton v-if="loading" class="h-64 w-full rounded-lg" />
        <template v-else>
          <div v-if="!painel?.topLucro.length" class="flex h-40 items-center justify-center text-sm text-muted-foreground">Sem dados de lucro</div>
          <ul v-else class="space-y-3">
            <li v-for="(item, i) in painel.topLucro" :key="i" class="flex items-center gap-3">
              <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">{{ i + 1 }}</span>
              <p class="min-w-0 flex-1 truncate text-sm font-medium">{{ item.nome }}</p>
              <span class="shrink-0 text-sm font-semibold" :class="item.lucro < 0 ? 'text-rose-600' : 'text-emerald-600'">
                {{ formatCurrencyBR(item.lucro) }}
              </span>
            </li>
          </ul>
        </template>
      </div>
    </section>

    <!-- Modal de período -->
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
      <button type="button" @click="goTo('/produtos')"
        class="flex flex-col items-center text-gray-700 dark:text-gray-300 hover:text-primary transition">
        <Box />
        <span class="text-xs">Produtos</span>
      </button>
      <button type="button" @click="goBack"
        class="flex flex-col items-center text-gray-700 dark:text-gray-300 hover:text-primary transition">
        <Undo2 />
        <span class="text-xs">Voltar</span>
      </button>
    </nav>
  </div>
</template>
