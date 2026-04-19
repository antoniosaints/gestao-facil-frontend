<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { endOfMonth, startOfMonth, startOfDay, endOfDay } from 'date-fns'
import {
  AlertTriangle,
  CalendarDays,
  Filter,
  HandCoins,
  Landmark,
  RefreshCw,
  RotateCw,
  Search,
  TrendingDown,
  TrendingUp,
  Undo2,
  Wallet,
  X,
} from 'lucide-vue-next'
import { useToast } from 'vue-toastification'

import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import BarChart from '@/components/graficos/BarChart.vue'
import LineChart from '@/components/graficos/LineChart.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

import { optionsChartBarDefault, optionsChartLine } from '@/composables/useChartOptions'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import type { CategoriaFinanceiro, ContasFinanceiro } from '@/types/schemas'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR } from '@/utils/formatters'
import { goBack, goTo } from '@/hooks/links'
import ModalView from '@/components/formulario/ModalView.vue'

type DashboardFinanceiroResponse = {
  data: {
    cards: {
      saldoAtual: number
      saldoPrevisto: number
      receitasRealizadas: number
      despesasRealizadas: number
      receitasPrevistas: number
      despesasPrevistas: number
      aReceberPendente: number
      aPagarPendente: number
      atrasadoReceber: number
      atrasadoPagar: number
    }
    graficos: {
      fluxo: { labels: string[]; datasets: any[] }
      categorias: { labels: string[]; datasets: any[] }
      status: { labels: string[]; datasets: any[] }
    }
    contas: Array<{
      contaId: number
      conta: string
      saldoInicial: number
      saldoAtual: number
      saldoPrevisto: number
      pendenteReceber: number
      pendentePagar: number
    }>
  }
}

type FiltroTipo = 'TODOS' | 'RECEITA' | 'DESPESA'

const toast = useToast()
const uiStore = useUiStore()

const loading = ref(true)
const openModalFiltros = ref(false)
const filtroPeriodo = ref([startOfMonth(new Date()), endOfMonth(new Date())])
const contas = ref<ContasFinanceiro[]>([])
const categorias = ref<CategoriaFinanceiro[]>([])

const filtros = ref<{
  search: string
  tipo: FiltroTipo
  contaFinanceiraId: string
  categoriaId: string
}>({
  search: '',
  tipo: 'TODOS',
  contaFinanceiraId: 'all',
  categoriaId: 'all',
})

const cards = ref<DashboardFinanceiroResponse['data']['cards']>({
  saldoAtual: 0,
  saldoPrevisto: 0,
  receitasRealizadas: 0,
  despesasRealizadas: 0,
  receitasPrevistas: 0,
  despesasPrevistas: 0,
  aReceberPendente: 0,
  aPagarPendente: 0,
  atrasadoReceber: 0,
  atrasadoPagar: 0,
})
const fluxoChart = ref<any>({ labels: [], datasets: [] })
const categoriasChart = ref<any>({ labels: [], datasets: [] })
const statusChart = ref<any>({ labels: [], datasets: [] })
const contasResumo = ref<DashboardFinanceiroResponse['data']['contas']>([])

function getPeriodoSelecionado() {
  const inicio = filtroPeriodo.value?.[0]
    ? filtroPeriodo.value[0].toISOString()
    : startOfMonth(new Date()).toISOString()
  const fim = filtroPeriodo.value?.[1]
    ? filtroPeriodo.value[1].toISOString()
    : endOfMonth(new Date()).toISOString()
  return { inicio, fim }
}

function getRequestFilters() {
  const { inicio, fim } = getPeriodoSelecionado()

  return {
    inicio,
    fim,
    search: filtros.value.search.trim() || undefined,
    tipo: filtros.value.tipo,
    contaFinanceiraId:
      filtros.value.contaFinanceiraId !== 'all' ? Number(filtros.value.contaFinanceiraId) : null,
    categoriaId: filtros.value.categoriaId !== 'all' ? Number(filtros.value.categoriaId) : null,
  }
}

async function carregarFiltros() {
  try {
    const [responseContas, responseCategorias] = await Promise.all([
      LancamentosRepository.listarContas(),
      LancamentosRepository.listarCategorias(),
    ])

    contas.value = responseContas.data ?? []
    categorias.value = responseCategorias.data ?? []
  } catch (error) {
    console.error(error)
    toast.warning('Não foi possível carregar os filtros do painel financeiro.')
  }
}

async function carregarDashboard(showFeedback = false) {
  try {
    loading.value = true
    const response = (await LancamentosRepository.getDashboardVisaoGeral(
      getRequestFilters(),
    )) as DashboardFinanceiroResponse

    cards.value = response.data.cards
    fluxoChart.value = {
      labels: [...(response.data.graficos.fluxo.labels || [])],
      datasets: [...(response.data.graficos.fluxo.datasets || [])],
    }
    categoriasChart.value = {
      labels: [...(response.data.graficos.categorias.labels || [])],
      datasets: [...(response.data.graficos.categorias.datasets || [])],
    }
    statusChart.value = {
      labels: [...(response.data.graficos.status.labels || [])],
      datasets: [...(response.data.graficos.status.datasets || [])],
    }
    contasResumo.value = response.data.contas || []

    if (showFeedback) {
      toast.info('Painel financeiro atualizado!')
    }
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar o painel financeiro.')
  } finally {
    loading.value = false
  }
}

function clearFilters(reload = true) {
  filtros.value = {
    search: '',
    tipo: 'TODOS',
    contaFinanceiraId: 'all',
    categoriaId: 'all',
  }
  filtroPeriodo.value = [startOfMonth(new Date()), endOfMonth(new Date())]

  if (reload) {
    carregarDashboard(true)
  }
}

function applyFilters() {
  openModalFiltros.value = false
  carregarDashboard(true)
}

function applyPreset(preset: 'today' | 'current-month' | 'receitas' | 'despesas') {
  if (preset === 'today') {
    filtroPeriodo.value = [startOfDay(new Date()), endOfDay(new Date())]
  }

  if (preset === 'current-month') {
    filtroPeriodo.value = [startOfMonth(new Date()), endOfMonth(new Date())]
    filtros.value.tipo = 'TODOS'
  }

  if (preset === 'receitas') {
    filtros.value.tipo = 'RECEITA'
  }

  if (preset === 'despesas') {
    filtros.value.tipo = 'DESPESA'
  }
}

function getContaNomeById(id: string) {
  return contas.value.find((conta) => String(conta.id) === id)?.nome || null
}

function getCategoriaNomeById(id: string) {
  return categorias.value.find((categoria) => String(categoria.id) === id)?.nome || null
}

const filtrosAtivos = computed(() => {
  const items: string[] = []

  const { inicio, fim } = getPeriodoSelecionado()
  items.push(`Período: ${new Date(inicio).toLocaleDateString('pt-BR')} até ${new Date(fim).toLocaleDateString('pt-BR')}`)

  if (filtros.value.search.trim()) items.push(`Busca: ${filtros.value.search.trim()}`)
  if (filtros.value.tipo !== 'TODOS') items.push(`Tipo: ${filtros.value.tipo}`)
  if (filtros.value.contaFinanceiraId !== 'all') {
    items.push(`Conta: ${getContaNomeById(filtros.value.contaFinanceiraId) || filtros.value.contaFinanceiraId}`)
  }
  if (filtros.value.categoriaId !== 'all') {
    items.push(
      `Categoria: ${getCategoriaNomeById(filtros.value.categoriaId) || filtros.value.categoriaId}`,
    )
  }

  return items
})

const indicadores = computed(() => [
  {
    titulo: 'Saldo atual',
    valor: cards.value.saldoAtual,
    detalhe: 'Saldo realizado com pagamentos confirmados.',
    icone: Wallet,
    colorClass: 'text-blue-600 bg-blue-500/10',
  },
  {
    titulo: 'Saldo previsto',
    valor: cards.value.saldoPrevisto,
    detalhe: 'Projeção até o fim do período filtrado.',
    icone: TrendingUp,
    colorClass: 'text-emerald-600 bg-emerald-500/10',
  },
  {
    titulo: 'Receitas realizadas',
    valor: cards.value.receitasRealizadas,
    detalhe: `Previstas: ${formatCurrencyBR(cards.value.receitasPrevistas)}`,
    icone: TrendingUp,
    colorClass: 'text-green-600 bg-green-500/10',
  },
  {
    titulo: 'Despesas realizadas',
    valor: cards.value.despesasRealizadas,
    detalhe: `Previstas: ${formatCurrencyBR(cards.value.despesasPrevistas)}`,
    icone: TrendingDown,
    colorClass: 'text-rose-600 bg-rose-500/10',
  },
  {
    titulo: 'A receber pendente',
    valor: cards.value.aReceberPendente,
    detalhe: 'Receitas ainda abertas no período.',
    icone: CalendarDays,
    colorClass: 'text-amber-600 bg-amber-500/10',
  },
  {
    titulo: 'A pagar pendente',
    valor: cards.value.aPagarPendente,
    detalhe: 'Despesas ainda abertas no período.',
    icone: HandCoins,
    colorClass: 'text-orange-600 bg-orange-500/10',
  },
  {
    titulo: 'Atrasado para receber',
    valor: cards.value.atrasadoReceber,
    detalhe: 'Receitas vencidas e sem baixa financeira.',
    icone: AlertTriangle,
    colorClass: 'text-yellow-600 bg-yellow-500/10',
  },
  {
    titulo: 'Atrasado para pagar',
    valor: cards.value.atrasadoPagar,
    detalhe: 'Despesas vencidas e ainda não pagas.',
    icone: AlertTriangle,
    colorClass: 'text-rose-600 bg-rose-500/10',
  },
])

onMounted(async () => {
  await Promise.all([carregarFiltros(), carregarDashboard()])
})
</script>

<template>
  <div class="space-y-4 pb-24 md:pb-0">
    <div class="">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Landmark class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
            Painel financeiro
          </h2>
          <p class="text-sm text-muted-foreground">
            Indicadores calculados por parcela, pagamentos efetivos, vencimentos e conta financeira com uso de espaço mais enxuto.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Button variant="outline" @click="openModalFiltros = true">
            <Filter class="h-4 w-4" /> Filtros
          </Button>
          <Button variant="outline" size="icon" @click="carregarDashboard(true)">
            <RefreshCw class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div class="mt-1 flex flex-wrap gap-2">
        <Badge v-for="item in filtrosAtivos" :key="item" variant="outline" class="text-xs">
          {{ item }}
        </Badge>
      </div>
    </div>

    <section v-if="loading" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Skeleton v-for="item in 8" :key="item" class="h-[140px] rounded-2xl" />
    </section>

    <section v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card v-for="item in indicadores" :key="item.titulo" class="shadow rounded-xl transition">
        <CardHeader class="pb-2 py-3">
          <CardTitle class="flex flex-row items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <div class="rounded-md p-2" :class="item.colorClass">
              <component :is="item.icone" class="h-4 w-4" />
            </div>
            <span>{{ item.titulo }}</span>
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-1 pb-3">
          <p class="text-base md:text-lg font-semibold text-gray-700 dark:text-gray-200">
            {{ formatCurrencyBR(item.valor) }}
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">{{ item.detalhe }}</p>
        </CardContent>
      </Card>
    </section>

    <div class="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <Card class="shadow-sm">
        <CardHeader>
          <CardTitle class="text-lg">Evolução do saldo</CardTitle>
          <CardDescription>
            Comparação entre o saldo realizado acumulado e a projeção prevista para o período filtrado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LineChart class="max-h-80" :data="fluxoChart" :options="optionsChartLine" />
        </CardContent>
      </Card>

      <Card class="shadow-sm">
        <CardHeader>
          <CardTitle class="text-lg">Saúde financeira do período</CardTitle>
          <CardDescription>
            Valores consolidados por situação financeira para ajudar a priorizar cobranças e pagamentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart class="max-h-80" :data="statusChart" :options="optionsChartBarDefault" />
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card class="shadow-sm">
        <CardHeader>
          <CardTitle class="text-lg">Categorias com maior impacto</CardTitle>
          <CardDescription>
            Receitas e despesas previstas agrupadas por categoria no período selecionado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart class="max-h-80" :data="categoriasChart" :options="optionsChartBarDefault" />
        </CardContent>
      </Card>

      <Card class="shadow-sm">
        <CardHeader>
          <CardTitle class="text-lg">Resumo por conta financeira</CardTitle>
          <CardDescription>
            Saldo atual, saldo previsto e pendências separadas por conta financeira.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div v-if="!contasResumo.length" class="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhuma conta financeira encontrada para os filtros aplicados.
          </div>

          <div
            v-for="conta in contasResumo"
            :key="conta.contaId"
            class="rounded-2xl border bg-muted/20 px-4 py-2"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-foreground">{{ conta.conta }}</p>
                <p class="text-xs text-muted-foreground">Saldo inicial {{ formatCurrencyBR(conta.saldoInicial) }}</p>
              </div>
              <Badge class="border-0" :class="conta.saldoPrevisto >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'">
                Previsto {{ formatCurrencyBR(conta.saldoPrevisto) }}
              </Badge>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <p class="text-xs text-muted-foreground">Saldo atual</p>
                <p class="font-semibold text-foreground">{{ formatCurrencyBR(conta.saldoAtual) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">A receber pendente</p>
                <p class="font-semibold text-amber-600">{{ formatCurrencyBR(conta.pendenteReceber) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">A pagar pendente</p>
                <p class="font-semibold text-orange-600">{{ formatCurrencyBR(conta.pendentePagar) }}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <nav v-if="uiStore.isMobile" class="fixed bottom-0 left-0 w-full border-t bg-card/95 pt-4 shadow-lg backdrop-blur z-20 h-20">
      <div class="flex justify-around">
        <button type="button" @click="goTo('/financeiro/lancamentos')" class="flex flex-col items-center text-muted-foreground hover:text-primary transition">
          <Wallet class="h-5 w-5" />
          <span class="text-xs">Lançamentos</span>
        </button>
        <button type="button" @click="carregarDashboard(true)" class="flex flex-col items-center text-muted-foreground hover:text-primary transition">
          <RotateCw class="h-5 w-5" />
          <span class="text-xs">Atualizar</span>
        </button>
        <button type="button" @click="goBack" class="flex flex-col items-center text-muted-foreground hover:text-primary transition">
          <Undo2 class="h-5 w-5" />
          <span class="text-xs">Voltar</span>
        </button>
      </div>
    </nav>

    <ModalView v-model:open="openModalFiltros" title="Filtros do painel financeiro" size="lg">
      <div class="grid gap-4 p-4 md:grid-cols-2">
        <div class="space-y-2 md:col-span-2">
          <label class="text-sm font-medium">Atalhos rápidos</label>
          <div class="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" @click="applyPreset('today')">Hoje</Button>
            <Button type="button" variant="outline" size="sm" @click="applyPreset('current-month')">Este mês</Button>
            <Button type="button" variant="outline" size="sm" @click="applyPreset('receitas')">Somente receitas</Button>
            <Button type="button" variant="outline" size="sm" @click="applyPreset('despesas')">Somente despesas</Button>
          </div>
        </div>

        <div class="space-y-2 md:col-span-2">
          <label class="text-sm font-medium">Período</label>
          <Calendarpicker :range="true" v-model="filtroPeriodo" />
        </div>

        <div class="space-y-2 md:col-span-2">
          <label class="text-sm font-medium">Busca</label>
          <div class="relative">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input v-model="filtros.search" class="pl-9" placeholder="Descrição, UID, categoria ou cliente" />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Tipo</label>
          <Select v-model="filtros.tipo">
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os tipos</SelectItem>
              <SelectItem value="RECEITA">Somente receitas</SelectItem>
              <SelectItem value="DESPESA">Somente despesas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Conta financeira</label>
          <Select v-model="filtros.contaFinanceiraId">
            <SelectTrigger><SelectValue placeholder="Conta financeira" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              <SelectItem v-for="conta in contas" :key="conta.id" :value="String(conta.id)">
                {{ conta.nome }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2 md:col-span-2">
          <label class="text-sm font-medium">Categoria</label>
          <Select v-model="filtros.categoriaId">
            <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem v-for="categoria in categorias" :key="categoria.id" :value="String(categoria.id)">
                {{ categoria.nome }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex justify-end gap-2 md:col-span-2">
          <Button variant="outline" @click="clearFilters(false)">
            <X class="h-4 w-4" /> Limpar
          </Button>
          <Button variant="outline" @click="openModalFiltros = false">Cancelar</Button>
          <Button @click="applyFilters">
            <Filter class="h-4 w-4" /> Aplicar filtros
          </Button>
        </div>
      </div>
    </ModalView>
  </div>
</template>
