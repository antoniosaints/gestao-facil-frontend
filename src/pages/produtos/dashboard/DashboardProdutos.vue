<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Box, Boxes, CalendarPlus, Coins, Factory, Filter, HandCoins, Package, PackageOpen, ReceiptText, RefreshCw, Tags, TrendingUp, Undo2, Warehouse } from "lucide-vue-next"

import Calendarpicker from "@/components/formulario/calendarpicker.vue"
import ModalView from "@/components/formulario/ModalView.vue"
import { optionsChartBarDefault, optionsChartBarStack, optionsChartLine, optionsChartPie } from "@/composables/useChartOptions"
import BarChart from "@/components/graficos/BarChart.vue"
import LineChart from "@/components/graficos/LineChart.vue"
import PieChart from "@/components/graficos/PieChart.vue"
import { useToast } from "vue-toastification"
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns"
import { ProdutoRepository } from "@/repositories/produto-repository"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrencyBR } from "@/utils/formatters"
import { goBack, goTo } from "@/hooks/links"
import { useUiStore } from "@/stores/ui/uiStore"

const toast = useToast()
const uiStore = useUiStore()
const loading = ref(true)
const openModalFiltros = ref(false)
const filtroPeriodo = ref([startOfMonth(new Date()), endOfMonth(new Date())])
const indicadores = ref<any[]>([])
const fluxoEstoqueChart: any = ref({ labels: [], datasets: [] })
const ticketMedioChart: any = ref({ labels: [], datasets: [] })
const reposicoesMensaisChart: any = ref({ labels: [], datasets: [] })
const categoriasChart: any = ref({ labels: [], datasets: [] })
const saudeEstoqueChart: any = ref({ labels: [], datasets: [] })
const maisRepostosChart: any = ref({ labels: [], datasets: [] })
const menosSaidasChart: any = ref({ labels: [], datasets: [] })
const giroEstoqueChart: any = ref({ labels: [], datasets: [] })
const margemMediaChart: any = ref({ labels: [], datasets: [] })

function getPeriodoSelecionado() {
  const inicio = filtroPeriodo.value === null
    ? startOfMonth(new Date()).toISOString()
    : filtroPeriodo.value[0].toISOString()
  const fim = filtroPeriodo.value === null
    ? endOfMonth(new Date()).toISOString()
    : filtroPeriodo.value[1].toISOString()

  return { inicio, fim }
}

function applyPreset(preset: 'today' | 'current-month') {
  if (preset === 'today') {
    filtroPeriodo.value = [startOfDay(new Date()), endOfDay(new Date())]
  }

  if (preset === 'current-month') {
    filtroPeriodo.value = [startOfMonth(new Date()), endOfMonth(new Date())]
  }
}

const filtrosAtivos = computed(() => {
  const { inicio, fim } = getPeriodoSelecionado()
  return [`Período: ${new Date(inicio).toLocaleDateString('pt-BR')} até ${new Date(fim).toLocaleDateString('pt-BR')}`]
})

function montarIndicadores(data: any) {
  indicadores.value = [
    {
      titulo: 'Produtos base',
      valor: `${data.totalProdutosBase || 0}`,
      detalhe: `${data.totalVariantes || 0} variantes cadastradas`,
      icone: Boxes,
      colorClass: 'text-blue-600 bg-blue-500/10',
    },
    {
      titulo: 'Categorias',
      valor: `${data.totalCategorias || 0}`,
      detalhe: `${data.produtosNoPdv || 0} variantes visíveis no PDV`,
      icone: Tags,
      colorClass: 'text-violet-600 bg-violet-500/10',
    },
    {
      titulo: 'Estoque baixo',
      valor: `${data.estoqueBaixo || 0}`,
      detalhe: `${data.produtosSemEstoque || 0} sem estoque e ${data.controlaEstoque || 0} controladas`,
      icone: AlertTriangle,
      colorClass: 'text-amber-600 bg-amber-500/10',
    },
    {
      titulo: 'Valor em estoque',
      valor: formatCurrencyBR(Number(data.valorEstoque || 0)),
      detalhe: `${data.controlaEstoque || 0} variantes controladas`,
      icone: Warehouse,
      colorClass: 'text-emerald-600 bg-emerald-500/10',
    },
    {
      titulo: 'Ticket médio',
      valor: formatCurrencyBR(Number(data.ticketMedioGeral || 0)),
      detalhe: 'Média das vendas faturadas no período',
      icone: ReceiptText,
      colorClass: 'text-sky-600 bg-sky-500/10',
    },
    {
      titulo: 'Lucro realizado',
      valor: formatCurrencyBR(Number(data.lucroMensal || 0)),
      detalhe: 'Receita vendida menos custo estimado',
      icone: TrendingUp,
      colorClass: 'text-green-600 bg-green-500/10',
    },
    {
      titulo: 'Reposições',
      valor: formatCurrencyBR(Number(data.custoReposicoes || 0)),
      detalhe: 'Custo acumulado de entradas concluídas',
      icone: HandCoins,
      colorClass: 'text-indigo-600 bg-indigo-500/10',
    },
    {
      titulo: 'Matérias-primas',
      valor: `${data.materiasPrimas || 0}`,
      detalhe: 'Itens marcados para produção local/insumo',
      icone: Factory,
      colorClass: 'text-rose-600 bg-rose-500/10',
    },
  ]
}

function getPieLegend(chart: any) {
  const dataset = chart?.datasets?.[0]
  const colors = Array.isArray(dataset?.backgroundColor) ? dataset.backgroundColor : []
  const values = Array.isArray(dataset?.data) ? dataset.data : []
  const labels = Array.isArray(chart?.labels) ? chart.labels : []

  return labels.map((label: string, index: number) => ({
    label,
    value: values[index] ?? 0,
    color: colors[index] ?? '#94A3B8',
  }))
}

async function getDataDashboard(showFeedback = false) {
  try {
    loading.value = true
    const { inicio, fim } = getPeriodoSelecionado()

    const [
      resumo,
      fluxoEstoque,
      ticket,
      reposicoes,
      categorias,
      saudeEstoque,
      maisRepostos,
      menosSaidas,
      giroEstoque,
      margemMedia,
    ] = await Promise.all([
      ProdutoRepository.getResumoGeral(inicio, fim),
      ProdutoRepository.getFluxoEstoqueMensal(inicio, fim),
      ProdutoRepository.getTicketMedioMensal(inicio, fim),
      ProdutoRepository.getReposicoesMensais(inicio, fim),
      ProdutoRepository.getDistribuicaoCategorias(),
      ProdutoRepository.getSaudeEstoque(),
      ProdutoRepository.getProdutosMaisSaidas(inicio, fim),
      ProdutoRepository.getProdutosMenosSaidas(inicio, fim),
      ProdutoRepository.getGiroEstoqueProdutos(inicio, fim),
      ProdutoRepository.getMargemContribuicao(inicio, fim),
    ])

    montarIndicadores(resumo)
    fluxoEstoqueChart.value = { labels: [...fluxoEstoque.labels], datasets: [...fluxoEstoque.datasets] }
    ticketMedioChart.value = { labels: [...ticket.labels], datasets: [...ticket.datasets] }
    reposicoesMensaisChart.value = { labels: [...reposicoes.labels], datasets: [...reposicoes.datasets] }
    categoriasChart.value = { labels: [...categorias.labels], datasets: [...categorias.datasets] }
    saudeEstoqueChart.value = { labels: [...saudeEstoque.labels], datasets: [...saudeEstoque.datasets] }
    maisRepostosChart.value = { labels: [...maisRepostos.labels], datasets: [...maisRepostos.datasets] }
    menosSaidasChart.value = { labels: [...menosSaidas.labels], datasets: [...menosSaidas.datasets] }
    giroEstoqueChart.value = { labels: [...giroEstoque.labels], datasets: [...giroEstoque.datasets] }
    margemMediaChart.value = { labels: [...margemMedia.labels], datasets: [...margemMedia.datasets] }

    if (showFeedback) {
      toast.info('Painel de produtos atualizado!')
    }
  } catch (error) {
    console.error(error)
    toast.warning('Erro ao buscar os dados do dashboard de produtos.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getDataDashboard()
})
</script>

<template>
  <div class="space-y-4">
    <div>
      <div class="flex flex-col md:flex-row gap-2 justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          </h2>
          <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Package class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
            Painel de produtos
          </h2>
          <p class="text-sm text-muted-foreground">Catálogo, estoque, reposição e giro filtrados por período e conta.
          </p>
        </div>
        <div class="flex items-center gap-2 w-content">
          <Button variant="outline" @click="openModalFiltros = true">
            <Filter class="w-4 h-4" /> Filtros
          </Button>
          <button type="button" @click="getDataDashboard(true)"
            class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:bg-muted/50">
            <RefreshCw class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mt-1">
        <Badge v-for="item in filtrosAtivos" :key="item" variant="outline" class="text-xs">
          {{ item }}
        </Badge>
      </div>
    </div>

    <section v-if="!loading">
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-4">
        <Card v-for="(kpi, i) in indicadores" :key="i" class="shadow rounded-xl transition">
          <CardHeader class="py-2">
            <CardTitle class="flex flex-row items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <div class="rounded-md p-2" :class="kpi.colorClass">
                <component :is="kpi.icone" class="h-4 w-4" />
              </div>
              <span>{{ kpi.titulo }}</span>
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-1 pb-2">
            <p class="text-base md:text-lg font-semibold text-gray-700 dark:text-gray-200">{{ kpi.valor }}</p>
            <p class="text-xs text-muted-foreground leading-relaxed">{{ kpi.detalhe }}</p>
          </CardContent>
        </Card>
      </div>
    </section>
    <section v-else class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
      <Skeleton v-for="item in 8" :key="item" class="h-[132px] rounded-xl" />
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-6 gap-4">
      <Card class="lg:col-span-3 border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md">
        <CardHeader>
          <CardTitle class="text-lg font-semibold flex items-center gap-2">
            <TrendingUp class="w-5 h-5 text-green-600 dark:text-green-400" />
            Fluxo mensal de estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart class="max-h-72" :data="fluxoEstoqueChart" :options="optionsChartLine" />
        </CardContent>
      </Card>

      <Card class="lg:col-span-3 border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md">
        <CardHeader>
          <CardTitle class="text-lg font-semibold flex items-center gap-2">
            <CalendarPlus class="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Reposições mensais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart class="max-h-72" :data="reposicoesMensaisChart" :options="optionsChartBarStack" />
        </CardContent>
      </Card>

      <Card class="lg:col-span-2 border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md">
        <CardHeader>
          <CardTitle class="text-lg font-semibold flex items-center gap-2">
            <Coins class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Ticket médio mensal
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <BarChart class="max-h-64" :data="ticketMedioChart" :options="optionsChartBarDefault" />
        </CardContent>
      </Card>

      <Card class="lg:col-span-2 border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md">
        <CardHeader>
          <CardTitle class="text-lg font-semibold flex items-center gap-2">
            <Tags class="w-5 h-5 text-violet-600 dark:text-violet-400" />
            Catálogo por categoria
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <PieChart class="max-h-64" :data="categoriasChart" :options="optionsChartPie" />
          <div class="space-y-2">
            <div v-for="item in getPieLegend(categoriasChart)" :key="item.label"
              class="flex items-center justify-between gap-3 text-sm">
              <div class="flex items-center gap-2 min-w-0">
                <span class="h-2.5 w-2.5 rounded-full shrink-0" :style="{ backgroundColor: item.color }"></span>
                <span class="truncate text-muted-foreground">{{ item.label }}</span>
              </div>
              <span class="font-medium text-foreground">{{ item.value }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="lg:col-span-2 border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md">
        <CardHeader>
          <CardTitle class="text-lg font-semibold flex items-center gap-2">
            <PackageOpen class="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Saúde do estoque
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <PieChart class="max-h-64" :data="saudeEstoqueChart" :options="optionsChartPie" />
          <div class="space-y-2">
            <div v-for="item in getPieLegend(saudeEstoqueChart)" :key="item.label"
              class="flex items-center justify-between gap-3 text-sm">
              <div class="flex items-center gap-2 min-w-0">
                <span class="h-2.5 w-2.5 rounded-full shrink-0" :style="{ backgroundColor: item.color }"></span>
                <span class="truncate text-muted-foreground">{{ item.label }}</span>
              </div>
              <span class="font-medium text-foreground">{{ item.value }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="lg:col-span-3 border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md">
        <CardHeader>
          <CardTitle class="text-lg font-semibold flex items-center gap-2">
            <Download class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Variantes mais repostas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart class="max-h-72" :data="maisRepostosChart" :options="optionsChartBarDefault" />
        </CardContent>
      </Card>

      <Card class="lg:col-span-3 border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md">
        <CardHeader>
          <CardTitle class="text-lg font-semibold flex items-center gap-2">
            <Package class="w-5 h-5 text-rose-600 dark:text-rose-400" />
            Variantes com menor saída
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart class="max-h-72" :data="menosSaidasChart" :options="optionsChartBarDefault" />
        </CardContent>
      </Card>

      <Card class="lg:col-span-3 border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md">
        <CardHeader>
          <CardTitle class="text-lg font-semibold flex items-center gap-2">
            <Box class="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Giro de estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart class="max-h-72" :data="giroEstoqueChart" :options="optionsChartBarDefault" />
        </CardContent>
      </Card>

      <Card class="lg:col-span-3 border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md">
        <CardHeader>
          <CardTitle class="text-lg font-semibold flex items-center gap-2">
            <TrendingUp class="w-5 h-5 text-violet-600 dark:text-violet-400" />
            Margem de contribuição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart class="max-h-72" :data="margemMediaChart" :options="optionsChartBarDefault" />
        </CardContent>
      </Card>
    </div>

    <ModalView v-model:open="openModalFiltros" title="Filtros do painel de produtos" size="lg">
      <div class="grid gap-4 p-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">Atalhos rápidos</label>
          <div class="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" @click="applyPreset('today')">Hoje</Button>
            <Button type="button" variant="outline" size="sm" @click="applyPreset('current-month')">Este mês</Button>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Período</label>
          <Calendarpicker class="w-full" :range="true" v-model="filtroPeriodo" />
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="applyPreset('current-month')">Resetar</Button>
          <Button variant="outline" @click="openModalFiltros = false">Cancelar</Button>
          <Button @click="openModalFiltros = false; getDataDashboard(true)">
            <Filter class="w-4 h-4" /> Aplicar filtros
          </Button>
        </div>
      </div>
    </ModalView>

    <nav v-if="uiStore.isMobile"
      class="fixed bottom-0 left-0 w-full bg-card dark:bg-card-dark border-t border-border dark:border-border-dark flex justify-around pt-4 h-20 shadow-lg z-20">
      <button type="button" @click="goTo('/produtos')"
        class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
        <Box />
        <span class="text-xs">Produtos</span>
      </button>
      <button type="button" @click="goBack"
        class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
        <Undo2 />
        <span class="text-xs">Voltar</span>
      </button>
    </nav>
  </div>
</template>
