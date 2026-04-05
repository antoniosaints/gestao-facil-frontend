<script setup lang="ts">
import { onMounted, ref } from "vue"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Box, CalendarPlus, Coins, Download, Package, PackageOpen, RefreshCw, Tags, TrendingUp, Undo2 } from "lucide-vue-next"

import Calendarpicker from "@/components/formulario/calendarpicker.vue"
import { optionsChartBarDefault, optionsChartBarStack, optionsChartLine, optionsChartPie } from "@/composables/useChartOptions"
import BarChart from "@/components/graficos/BarChart.vue"
import LineChart from "@/components/graficos/LineChart.vue"
import PieChart from "@/components/graficos/PieChart.vue"
import { useToast } from "vue-toastification"
import { endOfMonth, startOfMonth } from "date-fns"
import { ProdutoRepository } from "@/repositories/produto-repository"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrencyBR } from "@/utils/formatters"
import { goBack, goTo } from "@/hooks/links"
import { useUiStore } from "@/stores/ui/uiStore"

const toast = useToast()
const uiStore = useUiStore()
const loading = ref(true)
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

function montarIndicadores(data: any) {
  indicadores.value = [
    {
      titulo: 'Produtos base',
      valor: `${data.totalProdutosBase || 0}`,
      detalhe: `${data.totalVariantes || 0} variantes cadastradas`,
      icone: 'fa-solid fa-boxes-stacked text-blue-600',
    },
    {
      titulo: 'Categorias',
      valor: `${data.totalCategorias || 0}`,
      detalhe: `${data.produtosNoPdv || 0} variantes visíveis no PDV`,
      icone: 'fa-solid fa-tags text-violet-600',
    },
    {
      titulo: 'Estoque baixo',
      valor: `${data.estoqueBaixo || 0}`,
      detalhe: `${data.produtosSemEstoque || 0} variante(s) sem estoque`,
      icone: 'fa-solid fa-triangle-exclamation text-amber-600',
    },
    {
      titulo: 'Valor em estoque',
      valor: formatCurrencyBR(Number(data.valorEstoque || 0)),
      detalhe: `${data.controlaEstoque || 0} variantes controladas`,
      icone: 'fa-solid fa-warehouse text-emerald-600',
    },
    {
      titulo: 'Ticket médio',
      valor: formatCurrencyBR(Number(data.ticketMedioGeral || 0)),
      detalhe: 'Média das vendas faturadas no período',
      icone: 'fa-solid fa-receipt text-sky-600',
    },
    {
      titulo: 'Lucro realizado',
      valor: formatCurrencyBR(Number(data.lucroMensal || 0)),
      detalhe: 'Receita vendida menos custo estimado',
      icone: 'fa-solid fa-chart-line text-green-600',
    },
    {
      titulo: 'Reposições',
      valor: formatCurrencyBR(Number(data.custoReposicoes || 0)),
      detalhe: 'Custo acumulado de entradas concluídas',
      icone: 'fa-solid fa-truck-ramp-box text-indigo-600',
    },
    {
      titulo: 'Matérias-primas',
      valor: `${data.materiasPrimas || 0}`,
      detalhe: 'Itens marcados para produção local/insumo',
      icone: 'fa-solid fa-industry text-rose-600',
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
    <div class="flex flex-col md:flex-row gap-2 justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Package class="h-6 w-6" :stroke-width="2.5" />
          Painel de produtos
        </h2>
        <p class="text-sm text-muted-foreground">Catálogo, estoque, reposição e giro filtrados por período e conta.</p>
      </div>
      <div class="flex items-center gap-2 w-content">
        <Calendarpicker class="w-content" :range="true" v-model="filtroPeriodo"
          @update:model-value="getDataDashboard(true)" />
        <button type="button" @click="getDataDashboard(true)"
          class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:bg-muted/50">
          <RefreshCw class="w-4 h-4" />
        </button>
      </div>
    </div>

    <section v-if="!loading">
      <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
        <Card v-for="(kpi, i) in indicadores" :key="i" class="shadow rounded-xl transition">
          <CardHeader class="pb-2">
            <CardTitle class="flex flex-row items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <i class="p-1.5 bg-background/30 rounded-md text-sm" :class="kpi.icone"></i>
              <span>{{ kpi.titulo }}</span>
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-1">
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
