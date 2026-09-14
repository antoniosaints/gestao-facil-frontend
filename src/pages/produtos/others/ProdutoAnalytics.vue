<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import {
  BarChart3,
  CircleDollarSign,
  FileDown,
  Package,
  ReceiptText,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Warehouse,
} from 'lucide-vue-next'
import { ProdutoRepository, type ProdutoAnalytics } from '@/repositories/produto-repository'
import type { ProdutoVariante } from '@/types/schemas'
import { formatCurrencyBR } from '@/utils/formatters'
import { useChartTheme } from '@/composables/useChartTheme'
import BarChart from '@/components/graficos/BarChart.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const props = defineProps<{ produtoId: number; variantes: ProdutoVariante[] }>()

const toast = useToast()
const { gridColor, tickColor } = useChartTheme()
const analytics = ref<ProdutoAnalytics | null>(null)
const loading = ref(false)
const exporting = ref(false)
const selectedYear = ref(String(new Date().getFullYear()))
const selectedMonth = ref('todos')
const selectedVariantId = ref('todas')

const months = [
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
]

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 })
const formatNumber = (value: number) => numberFormatter.format(value || 0)
const formatPercent = (value: number) =>
  `${Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

const financialChartData = computed(() => ({
  labels: analytics.value?.mensal.map((item) => item.mes) ?? [],
  datasets: [
    {
      label: 'Faturamento',
      data: analytics.value?.mensal.map((item) => item.faturamento) ?? [],
      backgroundColor: '#2563eb',
      yAxisID: 'yFinanceiro',
    },
    {
      label: 'Lucro líquido',
      data: analytics.value?.mensal.map((item) => item.lucroLiquido) ?? [],
      backgroundColor: '#10b981',
      yAxisID: 'yFinanceiro',
    },
    {
      label: 'Markup',
      data: analytics.value?.mensal.map((item) => item.markup) ?? [],
      type: 'line',
      borderColor: '#f59e0b',
      backgroundColor: '#f59e0b',
      pointBackgroundColor: '#f59e0b',
      pointRadius: 3,
      pointHoverRadius: 5,
      tension: 0.28,
      yAxisID: 'yMarkup',
    },
  ],
}))

const financialChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      display: true,
      labels: { color: tickColor.value, usePointStyle: true, boxWidth: 8 },
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          if (context.dataset.yAxisID === 'yMarkup')
            return ` ${context.dataset.label}: ${formatPercent(context.parsed.y)}`
          return ` ${context.dataset.label}: ${formatCurrencyBR(context.parsed.y)}`
        },
      },
    },
  },
  scales: {
    x: { ticks: { color: tickColor.value }, grid: { display: false } },
    yFinanceiro: {
      type: 'linear',
      position: 'left',
      ticks: {
        color: tickColor.value,
        callback: (value: number) => `R$ ${Number(value).toLocaleString('pt-BR')}`,
      },
      title: { display: true, text: 'Valores em reais', color: tickColor.value },
      grid: { color: gridColor.value },
    },
    yMarkup: {
      type: 'linear',
      position: 'right',
      offset: true,
      ticks: { color: tickColor.value, callback: (value: number) => `${value}%` },
      title: { display: true, text: 'Markup', color: tickColor.value },
      grid: { drawOnChartArea: false },
    },
  },
  elements: { bar: { borderRadius: 6 } },
}))

const outputChartData = computed(() => ({
  labels: analytics.value?.mensal.map((item) => item.mes) ?? [],
  datasets: [
    { label: 'Vendas', data: analytics.value?.mensal.map((item) => item.unidadesVendas) ?? [], backgroundColor: '#2563eb', stack: 'saidas' },
    { label: 'OS', data: analytics.value?.mensal.map((item) => item.unidadesOrdensServico) ?? [], backgroundColor: '#8b5cf6', stack: 'saidas' },
    ...(analytics.value?.moduloOuriveAtivo
      ? [{ label: 'Ourive', data: analytics.value.mensal.map((item) => item.unidadesOrdensOurive ?? 0), backgroundColor: '#ec4899', stack: 'saidas' }]
      : []),
    { label: 'Outras baixas', data: analytics.value?.mensal.map((item) => item.unidadesOutrasSaidas) ?? [], backgroundColor: '#64748b', stack: 'saidas' },
  ],
}))

const outputChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: true, labels: { color: tickColor.value, usePointStyle: true, boxWidth: 8 } },
    tooltip: {
      callbacks: {
        label: (context: any) => ` ${context.dataset.label}: ${formatNumber(context.parsed.y)} unidade(s)`,
      },
    },
  },
  scales: {
    x: { stacked: true, ticks: { color: tickColor.value }, grid: { display: false } },
    y: {
      stacked: true,
      beginAtZero: true,
      ticks: { color: tickColor.value, precision: 0 },
      title: { display: true, text: 'Unidades em saída', color: tickColor.value },
      grid: { color: gridColor.value },
    },
  },
  elements: { bar: { borderRadius: 4 } },
}))

async function loadAnalytics() {
  if (!props.produtoId) return

  try {
    loading.value = true
    analytics.value = await ProdutoRepository.getAnalytics(
      props.produtoId,
      Number(selectedYear.value),
      selectedVariantId.value === 'todas' ? undefined : Number(selectedVariantId.value),
      selectedMonth.value === 'todos' ? undefined : Number(selectedMonth.value),
    )
    selectedYear.value = String(analytics.value.ano)
    selectedMonth.value = analytics.value.mes ? String(analytics.value.mes) : 'todos'
  } catch (error) {
    console.error(error)
    toast.error('Não foi possível carregar os analytics deste produto.')
  } finally {
    loading.value = false
  }
}

watch([selectedYear, selectedMonth, selectedVariantId], ([year, month, variantId], [previousYear, previousMonth, previousVariantId]) => {
  if ((year !== previousYear || month !== previousMonth || variantId !== previousVariantId) && analytics.value) loadAnalytics()
})

async function exportPdf() {
  if (!props.produtoId) return

  try {
    exporting.value = true
    await ProdutoRepository.exportAnalyticsPdf(
      props.produtoId,
      Number(selectedYear.value),
      selectedVariantId.value === 'todas' ? undefined : Number(selectedVariantId.value),
      selectedMonth.value === 'todos' ? undefined : Number(selectedMonth.value),
    )
  } catch (error) {
    console.error(error)
    toast.error('Não foi possível exportar o PDF dos analytics.')
  } finally {
    exporting.value = false
  }
}

onMounted(loadAnalytics)
</script>

<template>
  <div class="relative space-y-4" :aria-busy="loading">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-lg font-semibold text-foreground">
          <BarChart3 class="h-5 w-5 text-primary" />
          Analytics do produto
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Resultado operacional de todas as saídas concluídas, por produto ou variante.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Select v-model="selectedVariantId" :disabled="loading">
          <SelectTrigger class="w-48"><SelectValue placeholder="Variante" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as variantes</SelectItem>
            <SelectItem
              v-for="variante in variantes.filter((item) => item.id)"
              :key="variante.id"
              :value="String(variante.id)"
            >
              {{ variante.nomeVariante || variante.nome || `Variante #${variante.id}` }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="selectedYear" :disabled="loading">
          <SelectTrigger class="w-28"><SelectValue placeholder="Ano" /></SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="year in analytics?.anosDisponiveis ?? [Number(selectedYear)]"
              :key="year"
              :value="String(year)"
            >
              {{ year }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="selectedMonth" :disabled="loading">
          <SelectTrigger class="w-36"><SelectValue placeholder="Mês" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os meses</SelectItem>
            <SelectItem v-for="month in months" :key="month.value" :value="month.value">
              {{ month.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          :disabled="loading || exporting || !analytics"
          title="Exportar analytics em PDF"
          @click="exportPdf"
        >
          <FileDown class="mr-2 h-4 w-4" :class="{ 'animate-pulse': exporting }" />
          {{ exporting ? 'Exportando...' : 'Exportar PDF' }}
        </Button>
        <Button
          variant="outline"
          size="icon"
          :disabled="loading"
          title="Atualizar analytics"
          @click="loadAnalytics"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          <span class="sr-only">Atualizar analytics</span>
        </Button>
      </div>
    </div>

    <template v-if="analytics">
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card class="border-border"
          ><CardContent class="p-4"
            ><div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Faturamento</span
              ><CircleDollarSign class="h-4 w-4 text-primary" />
            </div>
            <p class="mt-2 text-xl font-semibold">
              {{ formatCurrencyBR(analytics.kpis.faturamento) }}
            </p></CardContent
          ></Card
        >
        <Card class="border-border"
          ><CardContent class="p-4"
            ><div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Lucro líquido</span
              ><TrendingUp class="h-4 w-4 text-emerald-500" />
            </div>
            <p
              class="mt-2 text-xl font-semibold"
              :class="
                analytics.kpis.lucroLiquido < 0
                  ? 'text-destructive'
                  : 'text-emerald-600 dark:text-emerald-400'
              "
            >
              {{ formatCurrencyBR(analytics.kpis.lucroLiquido) }}
            </p></CardContent
          ></Card
        >
        <Card class="border-border"
          ><CardContent class="p-4"
            ><div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Markup</span
              ><TrendingUp class="h-4 w-4 text-amber-500" />
            </div>
            <p class="mt-2 text-xl font-semibold">
              {{ formatPercent(analytics.kpis.markup) }}
            </p></CardContent
          ></Card
        >
        <Card class="border-border"
          ><CardContent class="p-4"
            ><div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Vendas</span
              ><ShoppingCart class="h-4 w-4 text-primary" />
            </div>
            <p class="mt-2 text-xl font-semibold">{{ formatNumber(analytics.kpis.vendas) }}</p>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ formatNumber(analytics.kpis.unidadesSaidas) }} unidade(s) em saída
              <template v-if="analytics.kpis.unidadesOutrasSaidas">
                • {{ formatNumber(analytics.kpis.unidadesOutrasSaidas) }} outra(s)
              </template>
            </p></CardContent
          ></Card
        >
        <Card class="border-border"
          ><CardContent class="p-4"
            ><div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Ticket médio</span
              ><ReceiptText class="h-4 w-4 text-primary" />
            </div>
            <p class="mt-2 text-xl font-semibold">
              {{ formatCurrencyBR(analytics.kpis.ticketMedio) }}
            </p></CardContent
          ></Card
        >
        <Card class="border-border"
          ><CardContent class="p-4"
            ><div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Ordens de serviço</span
              ><Package class="h-4 w-4 text-violet-500" />
            </div>
            <p class="mt-2 text-xl font-semibold">
              {{ formatNumber(analytics.kpis.ordensServico) }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">Saídas por OS normal</p></CardContent
          ></Card
        >
        <Card v-if="analytics.moduloOuriveAtivo" class="border-border"
          ><CardContent class="p-4"
            ><div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Ordens do ourive</span
              ><Package class="h-4 w-4 text-pink-500" />
            </div>
            <p class="mt-2 text-xl font-semibold">
              {{ formatNumber(analytics.kpis.ordensOurive as number) }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              Materiais baixados na produção
            </p></CardContent
          ></Card
        >
        <Card class="border-border"
          ><CardContent class="p-4"
            ><div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Custo médio aplicado</span
              ><Package class="h-4 w-4 text-primary" />
            </div>
            <p class="mt-2 text-xl font-semibold">
              {{ formatCurrencyBR(analytics.kpis.custoMedioAplicado) }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              Reposição média: {{ formatCurrencyBR(analytics.kpis.custoMedioReposicao) }}
            </p></CardContent
          ></Card
        >
      </div>

      <p v-if="analytics.mes" class="text-xs text-muted-foreground">
        KPIs filtrados para {{ months[analytics.mes - 1]?.label }}. Os gráficos abaixo permanecem
        anuais para facilitar a comparação entre os meses.
      </p>
      <div class="grid gap-3 lg:grid-cols-2">
        <Card class="border-border">
          <CardHeader class="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Resultado financeiro por mês</CardTitle>
              <CardDescription class="mt-1"
                >Barras com faturamento e lucro líquido (eixo em reais); linha com markup (eixo em
                percentual).</CardDescription
              >
            </div>
            <span class="shrink-0 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{{
              analytics.ano
            }}</span>
          </CardHeader>
          <CardContent>
            <div class="h-60">
              <BarChart :data="financialChartData" :options="financialChartOptions" />
            </div>
          </CardContent>
        </Card>

        <Card class="border-border">
          <CardHeader>
            <CardTitle>Saídas por origem</CardTitle>
            <CardDescription class="mt-1"
              >Quantidade de unidades baixadas em vendas, ordens de serviço,
              <template v-if="analytics.moduloOuriveAtivo"> produção do ourive,</template>
              e outras saídas.</CardDescription
            >
          </CardHeader>
          <CardContent>
            <div class="h-60"><BarChart :data="outputChartData" :options="outputChartOptions" /></div>
          </CardContent>
        </Card>
      </div>
    </template>

    <div
      v-else-if="!loading"
      class="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground"
    >
      Analytics indisponível para este produto.
    </div>

    <div
      v-if="loading"
      class="absolute inset-0 z-20 flex min-h-80 items-center justify-center rounded-xl bg-background/90 backdrop-blur-[1px]"
      role="status"
    >
      <img src="/images/infinite-spinner.svg" alt="" class="h-14 w-28 object-contain" />
      <span class="sr-only">Carregando analytics do produto</span>
    </div>
  </div>
</template>
