<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue'
import { endOfMonth, startOfMonth } from 'date-fns'
import { useToast } from 'vue-toastification'
import { RouterLink } from 'vue-router'
import {
  AlertTriangle,
  Boxes,
  ChartPie,
  ChevronRight,
  DollarSign,
  EyeClosed,
  FileDigit,
  HandCoins,
  LayoutDashboard,
  Menu,
  PackageSearch,
  Receipt,
  ShoppingCart,
  Tags,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
} from 'lucide-vue-next'

import BarChart from '@/components/graficos/BarChart.vue'
import LineChart from '@/components/graficos/LineChart.vue'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { optionsChartBar, optionsChartBarDefault, optionsChartLine } from '@/composables/useChartOptions'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { OrdensServicoRepository } from '@/repositories/os-repository'
import { ProdutoRepository } from '@/repositories/produto-repository'
import { VendaRepository } from '@/repositories/venda-repository'
import { useDashboardStore } from '@/stores/dashboard/useDashboardStore'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR, formatToCapitalize, formatToNumberValue } from '@/utils/formatters'

type KpiCard = {
  titulo: string
  valor: string | any
  detalhe: string
  icone: any
  colorClass: string
  link?: string
}

type AlertCard = {
  titulo: string
  descricao: string
  tone: 'danger' | 'warning' | 'info' | 'success'
  link?: string
  cta?: string
}

type SummaryBlock = {
  titulo: string
  descricao: string
  icone: any
  link: string
  metrics: Array<{ label: string; value: string | Component }>
}

const store = useDashboardStore()
const uiStore = useUiStore()
const toast = useToast()

const loading = ref(true)
const filtroPeriodo = ref([startOfMonth(new Date()), endOfMonth(new Date())])

const dataVendasMensais: any = ref({ labels: [], datasets: [] })
const dataSaldoMensal: any = ref({ labels: [], datasets: [] })
const dataTicketMedio: any = ref({ labels: [], datasets: [] })
const dataTopProdutos: any = ref({ labels: [], datasets: [] })

const dashboardResumo = ref<any>(null)
const vendasResumo = ref<any>(null)
const financeiroResumo = ref<any>(null)
const financeiroStatus = ref<any>(null)
const produtoResumo = ref<any>(null)
const servicosResumo = ref<any>(null)

const periodoDescricao = computed(() => {
  if (!filtroPeriodo.value) return 'Mês atual'
  return 'Período selecionado'
})

const kpis = computed<KpiCard[]>(() => {
  const resumo = dashboardResumo.value?.data
  const vendas = vendasResumo.value
  const financeiro = financeiroResumo.value
  const produtos = produtoResumo.value
  const servicos = servicosResumo.value?.data

  return [
    {
      titulo: 'Faturamento',
      valor: resumo?.vendasCount || 'R$ 0,00',
      detalhe: `${vendas?.totalFaturado || 0} venda(s) faturada(s) no período`,
      icone: DollarSign,
      colorClass: 'text-green-600 bg-green-500/10',
      link: '/vendas',
    },
    {
      titulo: 'Ticket médio',
      valor: uiStore.permissoes.vendas.painel ? formatCurrencyBR(vendas?.ticketMedio || 0) : EyeClosed,
      detalhe: 'Média das vendas faturadas no período',
      icone: Receipt,
      colorClass: 'text-blue-600 bg-blue-500/10',
      link: '/vendas/dashboard',
    },
    {
      titulo: 'Saldo financeiro',
      valor: uiStore.permissoes.financeiro.painel ? (financeiro?.saldo || 'R$ 0,00') : EyeClosed,
      detalhe: uiStore.permissoes.financeiro.painel ? `Receitas ${financeiro?.receitas || 'R$ 0,00'} • Despesas ${financeiro?.despesas || 'R$ 0,00'}` : 'Sem acesso à essa informação.',
      icone: Wallet,
      colorClass: 'text-emerald-600 bg-emerald-500/10',
      link: '/financeiro/painel',
    },
    {
      titulo: 'Clientes',
      valor: `${resumo?.clientes || 0}`,
      detalhe: 'Base total cadastrada no sistema',
      icone: Users,
      colorClass: 'text-violet-600 bg-violet-500/10',
      link: '/clientes',
    },
    {
      titulo: 'Catálogo',
      valor: `${produtos?.totalProdutosBase || 0} Produto(s)`,
      detalhe: `${produtos?.totalVariantes || 0} variante(s) e ${produtos?.totalCategorias || 0} categoria(s)`,
      icone: Boxes,
      colorClass: 'text-sky-600 bg-sky-500/10',
      link: '/produtos',
    },
    {
      titulo: 'Estoque crítico',
      valor: `${produtos?.estoqueBaixo || resumo?.estoquesBaixos?.length || 0}`,
      detalhe: `${produtos?.produtosSemEstoque || 0} sem estoque • ${produtos?.controlaEstoque || 0} com controle ativo`,
      icone: PackageSearch,
      colorClass: 'text-amber-600 bg-amber-500/10',
      link: '/produtos/dashboard',
    },
    {
      titulo: 'Serviços em aberto',
      valor: `${(servicos?.qtdAberta || 0) + (servicos?.qtdAndamento || 0)}`,
      detalhe: `${servicos?.qtdAberta || 0} aberta(s) • ${servicos?.qtdAndamento || 0} em andamento`,
      icone: Wrench,
      colorClass: 'text-orange-600 bg-orange-500/10',
      link: '/servicos/os',
    },
    {
      titulo: 'Pendências financeiras',
      valor: uiStore.permissoes.financeiro.painel ? formatCurrencyBR(financeiroStatus.value?.pendente || 0) : EyeClosed,
      detalhe: uiStore.permissoes.financeiro.painel ? `Pago no histórico: ${formatCurrencyBR(financeiroStatus.value?.pago || 0)}` : 'Sem acesso à essa informação.',
      icone: HandCoins,
      colorClass: 'text-rose-600 bg-rose-500/10',
      link: '/financeiro/lancamentos',
    },
  ]
})

const alerts = computed<AlertCard[]>(() => {
  const produtos = produtoResumo.value
  const resumo = dashboardResumo.value?.data
  const vendas = vendasResumo.value
  const financeiroPendencias = formatToNumberValue(financeiroStatus.value?.pendente || 0)
  const servicos = servicosResumo.value?.data

  const list: AlertCard[] = []

  if ((produtos?.estoqueBaixo || 0) > 0) {
    list.push({
      titulo: 'Estoque baixo precisa de revisão',
      descricao: `${produtos.estoqueBaixo} variante(s) estão em nível crítico de estoque.`,
      tone: 'danger',
      link: '/produtos/dashboard',
      cta: 'Abrir painel de produtos',
    })
  }

  if ((produtos?.produtosSemEstoque || 0) > 0) {
    list.push({
      titulo: 'Há itens sem estoque',
      descricao: `${produtos.produtosSemEstoque} variante(s) já estão zeradas.`,
      tone: 'warning',
      link: '/produtos',
      cta: 'Ver catálogo',
    })
  }

  if (financeiroPendencias > 0 && uiStore.permissoes.financeiro.painel) {
    list.push({
      titulo: 'Existem pendências financeiras',
      descricao: `Total pendente acumulado em ${formatCurrencyBR(financeiroPendencias)}.`,
      tone: 'warning',
      link: '/financeiro/lancamentos',
      cta: 'Revisar lançamentos',
    })
  }

  if ((vendas?.totalAberto || 0) > 0) {
    list.push({
      titulo: 'Vendas em aberto exigem acompanhamento',
      descricao: `${vendas.totalAberto} venda(s) ainda não faturadas/concluídas.`,
      tone: 'info',
      link: '/vendas',
      cta: 'Abrir vendas',
    })
  }

  if (((servicos?.qtdAberta || 0) + (servicos?.qtdAndamento || 0)) > 0) {
    list.push({
      titulo: 'Ordens de serviço em execução',
      descricao: `${servicos?.qtdAberta || 0} aberta(s) e ${servicos?.qtdAndamento || 0} em andamento.`,
      tone: 'info',
      link: '/servicos/os',
      cta: 'Ir para serviços',
    })
  }

  if (!list.length) {
    list.push({
      titulo: 'Tudo sob controle',
      descricao: 'Nenhum alerta crítico foi identificado com os dados carregados agora.',
      tone: 'success',
      link: '/',
      cta: 'Atualizar painel',
    })
  }

  return list.slice(0, 4)
})

const summaryBlocks = computed<SummaryBlock[]>(() => {
  const resumo = dashboardResumo.value?.data
  const vendas = vendasResumo.value
  const financeiro = financeiroResumo.value
  const produtos = produtoResumo.value
  const servicos = servicosResumo.value?.data

  return [
    {
      titulo: 'Vendas',
      descricao: 'Visão rápida do comercial.',
      icone: ShoppingCart,
      link: '/vendas/dashboard',
      metrics: [
        { label: 'Vendas totais', value: `${vendas?.totalVendas || 0}` },
        { label: 'Faturadas', value: `${vendas?.totalFaturado || 0}` },
        { label: 'Valor total', value: uiStore.permissoes.vendas.painel ? formatCurrencyBR(vendas?.totalValorVendas || 0) : EyeClosed },
      ],
    },
    {
      titulo: 'Financeiro',
      descricao: 'Receitas, despesas e saldo consolidado.',
      icone: Wallet,
      link: '/financeiro/painel',
      metrics: [
        { label: 'Receitas', value: uiStore.permissoes.financeiro.painel ? (financeiro?.receitas || 'R$ 0,00') : EyeClosed },
        { label: 'Despesas', value: uiStore.permissoes.financeiro.painel ? (financeiro?.despesas || 'R$ 0,00') : EyeClosed },
        { label: 'Saldo', value: uiStore.permissoes.financeiro.painel ? (financeiro?.saldo || 'R$ 0,00') : EyeClosed },
      ],
    },
    {
      titulo: 'Produtos',
      descricao: 'Catálogo operacional do estoque.',
      icone: Boxes,
      link: '/produtos/dashboard',
      metrics: [
        { label: 'Produtos base', value: `${produtos?.totalProdutosBase || 0}` },
        { label: 'Estoque baixo', value: `${produtos?.estoqueBaixo || 0}` },
        { label: 'Valor em estoque', value: uiStore.permissoes.financeiro.painel ? formatCurrencyBR(produtos?.valorEstoque || 0) : EyeClosed },
      ],
    },
    {
      titulo: 'Serviços',
      descricao: 'Carteira atual de ordens e faturamento.',
      icone: FileDigit,
      link: '/servicos/os',
      metrics: [
        { label: 'Abertas', value: `${servicos?.qtdAberta || 0}` },
        { label: 'Em andamento', value: `${servicos?.qtdAndamento || 0}` },
        { label: 'Faturadas', value: `${servicos?.qtdFaturada || 0}` },
      ],
    },
  ]
})

const quickActions = [
  { titulo: 'Nova venda', link: '/vendas', icon: ShoppingCart },
  { titulo: 'Novo lançamento', link: '/financeiro/lancamentos', icon: Wallet },
  { titulo: 'Novo produto', link: '/produtos', icon: Boxes },
  { titulo: 'Nova OS', link: '/servicos/os', icon: Wrench },
]

function getPeriodoSelecionado() {
  const inicio = filtroPeriodo.value === null
    ? startOfMonth(new Date()).toISOString()
    : filtroPeriodo.value[0].toISOString()
  const fim = filtroPeriodo.value === null
    ? endOfMonth(new Date()).toISOString()
    : filtroPeriodo.value[1].toISOString()

  return { inicio, fim }
}

function getAlertClasses(tone: AlertCard['tone']) {
  switch (tone) {
    case 'danger':
      return 'border-red-200 bg-red-500/5 dark:border-red-800 dark:bg-red-900/10'
    case 'warning':
      return 'border-amber-200 bg-amber-500/5 dark:border-amber-800 dark:bg-amber-900/10'
    case 'success':
      return 'border-emerald-200 bg-emerald-500/5 dark:border-emerald-800 dark:bg-emerald-900/10'
    default:
      return 'border-blue-200 bg-blue-500/5 dark:border-blue-800 dark:bg-blue-900/10'
  }
}

async function getDataDashboard(showFeedback = false) {
  try {
    loading.value = true
    const { inicio, fim } = getPeriodoSelecionado()

    const [
      resumoDashboard,
      resumoVendas,
      vendasMensais,
      saldoMensal,
      ticketMedio,
      topProdutos,
      resumoFinanceiro,
      resumoFinanceiroStatus,
      resumoProdutos,
      resumoServicos,
    ] = await Promise.all([
      store.getResumo(inicio, fim),
      VendaRepository.resumo(inicio, fim),
      VendaRepository.getResumoMensal(inicio, fim),
      LancamentosRepository.getSaldoMensal(inicio, fim),
      ProdutoRepository.getTicketMedioMensal(inicio, fim),
      VendaRepository.getTopProdutos(inicio, fim),
      LancamentosRepository.resumoTotal(),
      LancamentosRepository.resumoStatusTotal(),
      ProdutoRepository.getResumoGeral(inicio, fim),
      OrdensServicoRepository.getResumo(),
    ])

    dashboardResumo.value = resumoDashboard
    vendasResumo.value = resumoVendas.data
    financeiroResumo.value = resumoFinanceiro
    financeiroStatus.value = resumoFinanceiroStatus
    produtoResumo.value = resumoProdutos
    servicosResumo.value = resumoServicos

    dataVendasMensais.value = { labels: [...vendasMensais.data.labels], datasets: [...vendasMensais.data.datasets] }
    dataSaldoMensal.value = { labels: [...saldoMensal.labels], datasets: [...saldoMensal.datasets] }
    dataTicketMedio.value = { labels: [...ticketMedio.labels], datasets: [...ticketMedio.datasets] }
    dataTopProdutos.value = { labels: [...topProdutos.labels], datasets: [...topProdutos.datasets] }

    if (showFeedback) {
      toast.info('Dashboard atualizada!')
    }
  } catch (error) {
    console.log(error)
    toast.warning('Erro ao buscar os dados da dashboard, recarregue a página!')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getDataDashboard()
})
</script>

<template>
  <div class="space-y-4 pb-20 md:pb-0">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ChartPie class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Dashboard
        </h2>
        <p class="text-sm text-muted-foreground">Resumo geral com indicadores centralizados do sistema.</p>
      </div>
      <div class="flex items-center gap-2 w-content">
        <Calendarpicker :range="true" v-model="filtroPeriodo" @update:model-value="getDataDashboard(true)" />
        <Button variant="outline" size="icon" @click="getDataDashboard(true)">
          <LayoutDashboard class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <Card class="border-border/70 bg-card shadow-sm">
      <CardContent class="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-sm font-medium text-foreground">Visão executiva do negócio</p>
          <p class="text-xs text-muted-foreground">
            {{ periodoDescricao }} • dados centralizados de vendas, financeiro, catálogo e serviços.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <RouterLink v-for="action in quickActions" :key="action.titulo" :to="action.link">
            <Button variant="outline" class="gap-2">
              <component :is="action.icon" class="h-4 w-4" />
              {{ action.titulo }}
            </Button>
          </RouterLink>
        </div>
      </CardContent>
    </Card>

    <section v-if="loading" class="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-4">
      <Skeleton v-for="item in 8" :key="item" class="h-[152px] rounded-2xl" />
    </section>

    <section v-else class="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-4">
      <RouterLink v-for="item in kpis" :key="item.titulo" :to="item.link || '/'">
        <Card class="h-full rounded-2xl border-border/70 bg-card shadow-sm transition hover:border-primary/30 hover:shadow-md">
          <CardHeader class="py-3">
            <CardTitle class="flex items-center gap-3 text-sm text-foreground">
              <span class="rounded-xl p-2" :class="item.colorClass">
                <component :is="item.icone" class="h-4 w-4" />
              </span>
              <span>{{ item.titulo }}</span>
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-1 pb-3">
            <p class="text-lg font-semibold text-foreground md:text-xl">
              <component v-if="(typeof item.valor !== 'string')" :is="item.valor" class="h-5 w-5 my-1.5" />
              <span v-else>{{ item.valor }}</span> 
            </p>
            <p class="text-xs leading-relaxed text-muted-foreground">{{ item.detalhe }}</p>
          </CardContent>
        </Card>
      </RouterLink>
    </section>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-6">
      <Card class="border-border/70 bg-card shadow-sm lg:col-span-4">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <AlertTriangle class="h-5 w-5 text-amber-600" />
            Centro de alertas
          </CardTitle>
          <CardDescription>Prioridades operacionais para revisão rápida.</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-3 md:grid-cols-2">
          <div
            v-for="alert in alerts"
            :key="alert.titulo"
            class="rounded-xl border px-4 py-2"
            :class="getAlertClasses(alert.tone)"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-medium text-foreground">{{ alert.titulo }}</p>
                <p class="mt-1 text-sm text-muted-foreground">{{ alert.descricao }}</p>
              </div>
              <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <RouterLink v-if="alert.link" :to="alert.link" class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary dark:text-blue-500">
              {{ alert.cta || 'Abrir' }}
              <ChevronRight class="h-4 w-4" />
            </RouterLink>
          </div>
        </CardContent>
      </Card>

      <Card class="border-border/70 bg-card shadow-sm lg:col-span-2">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <TrendingUp class="h-5 w-5 text-green-600" />
            Tendência comercial
          </CardTitle>
          <CardDescription>
            {{ dashboardResumo?.data?.percentageByLastMonth >= 0 ? 'Crescimento' : 'Queda' }} frente ao mês anterior.
          </CardDescription>
        </CardHeader>
        <CardContent class="flex gap-2 flex-col">
          <div>
            <p class="text-3xl font-semibold text-foreground">
              {{ dashboardResumo?.data?.percentageByLastMonth?.toFixed?.(1) || 0 }}%
            </p>
            <p class="text-sm text-muted-foreground">Comparação do faturamento com o mês anterior.</p>
          </div>
          <div class="space-y-2 rounded-xl border border-border/70 bg-muted/10 p-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Vendas totais</span>
              <span class="font-medium text-foreground">{{ vendasResumo?.totalVendas || 0 }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Vendas em aberto</span>
              <span class="font-medium text-foreground">{{ vendasResumo?.totalAberto || 0 }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Orçamentos</span>
              <span class="font-medium text-foreground">{{ vendasResumo?.totalOrcamento || 0 }}</span>
            </div>
          </div>
          <RouterLink to="/vendas/dashboard">
            <Button variant="outline" class="w-full">Abrir painel de vendas</Button>
          </RouterLink>
        </CardContent>
      </Card>
    </div>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card
        v-for="block in summaryBlocks"
        :key="block.titulo"
        class="border-border/70 bg-card shadow-sm"
      >
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-base">
            <component :is="block.icone" class="h-5 w-5 text-primary" />
            {{ block.titulo }}
          </CardTitle>
          <CardDescription>{{ block.descricao }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div
            v-for="metric in block.metrics"
            :key="metric.label"
            class="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-sm"
          >
            <span class="text-muted-foreground">{{ metric.label }}</span>
            <component v-if="(typeof metric.value !== 'string')" :is="metric.value" class="h-5 w-5" />
            <span v-else class="font-medium text-foreground">{{ metric.value }}</span>
          </div>
          <RouterLink :to="block.link">
            <Button variant="outline" class="mt-1 w-full">Ver mais</Button>
          </RouterLink>
        </CardContent>
      </Card>
    </section>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <Card class="border-border/70 bg-card shadow-sm lg:col-span-2">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <Tags class="h-5 w-5 text-green-600" />
            Vendas mensais
          </CardTitle>
          <CardDescription>Receita e volume vendidos ao longo dos meses.</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart class="max-h-72" :data="dataVendasMensais" :options="optionsChartBar" />
        </CardContent>
      </Card>

      <Card class="border-border/70 bg-card shadow-sm lg:col-span-2">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <HandCoins class="h-5 w-5 text-emerald-600" />
            Saldo mensal
          </CardTitle>
          <CardDescription>Evolução consolidada do financeiro.</CardDescription>
        </CardHeader>
        <CardContent>
          <LineChart class="max-h-72" :data="dataSaldoMensal" :options="optionsChartLine" />
        </CardContent>
      </Card>

      <Card class="border-border/70 bg-card shadow-sm lg:col-span-2">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <Receipt class="h-5 w-5 text-blue-600" />
            Ticket médio mensal
          </CardTitle>
          <CardDescription>Média de faturamento por venda faturada.</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart class="max-h-72" :data="dataTicketMedio" :options="optionsChartBarDefault" />
        </CardContent>
      </Card>

      <Card class="border-border/70 bg-card shadow-sm lg:col-span-2">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <Boxes class="h-5 w-5 text-violet-600" />
            Top produtos
          </CardTitle>
          <CardDescription>Itens com melhor saída no período filtrado.</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart class="max-h-72" :data="dataTopProdutos" :options="optionsChartBarDefault" />
        </CardContent>
      </Card>
    </div>

    <MobileBottomBar v-if="uiStore.isMobile">
      <RouterLink to="/vendas">
        <button
          type="button"
          class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        >
          <Tags class="h-5 w-5" />
          <span class="text-xs">Vendas</span>
        </button>
      </RouterLink>
      <RouterLink to="/servicos/os">
        <button
          type="button"
          class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        >
          <FileDigit class="h-5 w-5" />
          <span class="text-xs">Serviços</span>
        </button>
      </RouterLink>
      <RouterLink to="/produtos">
        <button
          type="button"
          class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        >
          <Boxes class="h-5 w-5" />
          <span class="text-xs">Produtos</span>
        </button>
      </RouterLink>
      <button
        type="button"
        @click="uiStore.openSidebar = true"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
      >
        <Menu class="h-5 w-5" />
        <span class="text-xs">Menu</span>
      </button>
    </MobileBottomBar>
  </div>
</template>
