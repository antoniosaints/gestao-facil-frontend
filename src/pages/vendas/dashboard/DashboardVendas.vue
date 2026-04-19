<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import Calendarpicker from "@/components/formulario/calendarpicker.vue"
import ModalView from "@/components/formulario/ModalView.vue"
import { optionsChartBarDefault, optionsChartLine, optionsChartPie } from "@/composables/useChartOptions"
import BarChart from "@/components/graficos/BarChart.vue"
import LineChart from "@/components/graficos/LineChart.vue"
import PieChart from "@/components/graficos/PieChart.vue"
import { useToast } from "vue-toastification"
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns"
import { VendaRepository } from "@/repositories/venda-repository"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CircleDollarSign, Clock3, CreditCard, DollarSign, FileText, Filter, ReceiptText, RefreshCw, Tag, Tags, TrendingUp, Undo2, ShoppingCart, CheckCircle2 } from "lucide-vue-next"
import { useUiStore } from "@/stores/ui/uiStore"
import { goBack, goTo } from "@/hooks/links"
import { formatCurrencyBR } from "@/utils/formatters"

const toast = useToast()
const uiStore = useUiStore()
const openModalFiltros = ref(false)
const filtroPeriodo = ref([startOfMonth(new Date()), endOfMonth(new Date())])
const loading = ref(true);
const indicadores = ref<any[]>([])
const topProdutos: any = ref({ labels: [], datasets: [] });
const faturamentoMensal: any = ref({ labels: [], datasets: [] });
const tipoPagamento: any = ref({ labels: [], datasets: [] });
const statusVendas: any = ref({ labels: [], datasets: [] });

function getPeriodoSelecionado() {
  const inicio = filtroPeriodo.value === null ? startOfMonth(new Date()).toISOString() : filtroPeriodo.value[0].toISOString();
  const fim = filtroPeriodo.value === null ? endOfMonth(new Date()).toISOString() : filtroPeriodo.value[1].toISOString();
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

function toCurrency(value: string | number | null | undefined) {
  return formatCurrencyBR(Number(value || 0))
}

const getIndicadores = async (inicio?: string, fim?: string) => {
  try {
    loading.value = true
    const { data }: any = await VendaRepository.resumo(inicio, fim)
    indicadores.value = [
      {
        titulo: 'Total geral',
        valor: toCurrency(data.totalValorVendas),
        detalhe: `${data.totalVendas || 0} venda(s) no período`,
        icone: ShoppingCart,
        colorClass: 'text-emerald-600 bg-emerald-500/10',
      },
      {
        titulo: 'Faturado',
        valor: toCurrency(data.totalValorFaturado),
        detalhe: `${data.totalFaturado || 0} venda(s) concluídas`,
        icone: CircleDollarSign,
        colorClass: 'text-blue-600 bg-blue-500/10',
      },
      {
        titulo: 'Em aberto',
        valor: toCurrency(data.totalValorAberto),
        detalhe: `${data.totalAberto || 0} venda(s) aguardando fechamento`,
        icone: Clock3,
        colorClass: 'text-amber-600 bg-amber-500/10',
      },
      {
        titulo: 'Orçamento',
        valor: toCurrency(data.totalValorOrcamento),
        detalhe: `${data.totalOrcamento || 0} orçamento(s) ativos`,
        icone: FileText,
        colorClass: 'text-rose-600 bg-rose-500/10',
      },
      {
        titulo: 'Descontos',
        valor: toCurrency(data.totalValorDescontos),
        detalhe: `${data.totalVendasComDesconto || 0} venda(s) com desconto`,
        icone: TrendingUp,
        colorClass: 'text-violet-600 bg-violet-500/10',
      },
      {
        titulo: 'Ticket médio',
        valor: toCurrency(data.ticketMedio),
        detalhe: 'Média financeira por venda no período',
        icone: ReceiptText,
        colorClass: 'text-sky-600 bg-sky-500/10',
      },
    ]

    loading.value = false
  } catch (error) {
    loading.value = false
    console.error(error)
    toast.error('Erro ao carregar os indicadores')
  }
}

async function getDataDashboard() {
  try {
    const inicio = filtroPeriodo.value === null ? startOfMonth(new Date()).toISOString() : filtroPeriodo.value[0].toISOString();
    const fim = filtroPeriodo.value === null ? endOfMonth(new Date()).toISOString() : filtroPeriodo.value[1].toISOString();
    const [indicadores, produtos, faturamento, pagamentos, status] = await Promise.all([
      getIndicadores(inicio, fim),
      VendaRepository.getTopProdutos(inicio, fim),
      VendaRepository.getFaturamentoMensal(),
      VendaRepository.getMetodoPagamento(inicio, fim),
      VendaRepository.getStatusVenda(inicio, fim),
    ])
    topProdutos.value = { labels: [...produtos.labels], datasets: [...produtos.datasets] };
    faturamentoMensal.value = { labels: [...faturamento.labels], datasets: [...faturamento.datasets] };
    tipoPagamento.value = { labels: [...pagamentos.labels], datasets: [...pagamentos.datasets] };
    statusVendas.value = { labels: [...status.labels], datasets: [...status.datasets] };
  } catch (error) {
    console.log(error)
    toast.warning('Erro ao buscar os dados do dashboard, recarregue a página!')
  }
}

async function atualizarIndicadores() {
  await getDataDashboard()
  toast.info('Indicadores atualizados!')
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
          <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Tags class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
            Painel de vendas
          </h2>
          <p class="text-sm text-muted-foreground">Resumo geral e insights</p>
        </div>
        <div class="flex items-center gap-2 w-content">
          <Button variant="outline" @click="openModalFiltros = true">
            <Filter class="h-4 w-4" /> Filtros
          </Button>
          <Button variant="outline" size="icon" @click="atualizarIndicadores()">
            <RefreshCw class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mt-1">
        <Badge v-for="item in filtrosAtivos" :key="item" variant="outline" class="text-xs">
          {{ item }}
        </Badge>
      </div>
    </div>

    <section v-if="!loading">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card v-for="(kpi, i) in indicadores" :key="i" class="shadow rounded-xl transition">
          <CardHeader class="pb-2">
            <CardTitle class="flex flex-row items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <div class="rounded-md p-2" :class="kpi.colorClass">
                <component :is="kpi.icone" class="h-4 w-4" />
              </div>
              <span>{{ kpi.titulo }}</span>
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-1">
            <p class="text-base md:text-lg font-semibold text-gray-700 dark:text-gray-300">{{ kpi.valor }}</p>
            <p class="text-xs text-muted-foreground leading-relaxed">{{ kpi.detalhe }}</p>
          </CardContent>
        </Card>
      </div>
    </section>
    <section v-if="loading" class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      <Skeleton v-for="item in 6" :key="item" class="h-[130px] rounded-xl" />
    </section>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Gráfico de Barras -->
      <div
        class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp class="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Top Produtos
        </h2>
        <BarChart class="max-h-64" :data="topProdutos" :options="optionsChartBarDefault" />
      </div>

      <div
        class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign class="h-5 w-5 text-green-600 dark:text-green-400" />
          Faturamento Mensal
        </h2>
        <BarChart class="max-h-64" :data="faturamentoMensal" :options="optionsChartBarDefault" />
      </div>

      <div
        class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <CreditCard class="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Forma de pagamento
        </h2>
        <BarChart class="max-h-64" :data="tipoPagamento" :options="optionsChartBarDefault" />
      </div>

      <div
        class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 class="h-5 w-5 text-orange-600 dark:text-orange-400" />
          Por Status
        </h2>
        <BarChart class="max-h-64" :data="statusVendas" :options="optionsChartBarDefault" />
      </div>
    </div>
    <ModalView v-model:open="openModalFiltros" title="Filtros do painel de vendas" size="lg">
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
          <Button @click="openModalFiltros = false; atualizarIndicadores()">
            <Filter class="h-4 w-4" /> Aplicar filtros
          </Button>
        </div>
      </div>
    </ModalView>
    <nav v-if="uiStore.isMobile"
      class="fixed bottom-0 left-0 w-full bg-card dark:bg-card-dark border-t border-border dark:border-border-dark flex justify-around pt-4 h-20 shadow-lg z-20">
      <button type="button" @click="goTo('/vendas')"
        class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
        <Tag />
        <span class="text-xs">Vendas</span>
      </button>
      <button type="button" @click="goBack"
        class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
        <Undo2 />
        <span class="text-xs">Voltar</span>
      </button>
    </nav>
  </div>
</template>
