<script setup lang="ts">
import { onMounted, ref, watch } from "vue"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import Calendarpicker from "@/components/formulario/calendarpicker.vue"
import { optionsChartBarDefault, optionsChartLine, optionsChartPie } from "@/composables/useChartOptions"
import BarChart from "@/components/graficos/BarChart.vue"
import LineChart from "@/components/graficos/LineChart.vue"
import PieChart from "@/components/graficos/PieChart.vue"
import { useToast } from "vue-toastification"
import { VendaRepository } from "@/repositories/venda-repository"
import { endOfMonth, startOfMonth } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Tag, Tags, Undo2, TrendingUp, DollarSign, CreditCard, CheckCircle2 } from "lucide-vue-next"
import { useUiStore } from "@/stores/ui/uiStore"
import { goBack, goTo } from "@/hooks/links"

const toast = useToast()
const uiStore = useUiStore()
const filtroPeriodo = ref([startOfMonth(new Date()), endOfMonth(new Date())])
const loading = ref(true);
const indicadores = ref<any[]>([])
const topProdutos: any = ref({ labels: [], datasets: [] });
const faturamentoMensal: any = ref({ labels: [], datasets: [] });
const tipoPagamento: any = ref({ labels: [], datasets: [] });
const statusVendas: any = ref({ labels: [], datasets: [] });

const getIndicadores = async (inicio?: string, fim?: string) => {
  try {
    loading.value = true
    const { data }: any = await VendaRepository.resumo(inicio, fim)
    indicadores.value = [
      { titulo: "Total geral", valor: data.totalVendas, detalhe: data.totalValorVendas, icone: "fa-solid fa-chart-line text-green-600" },
      { titulo: "Faturado", valor: data.totalFaturado, detalhe: data.totalValorFaturado, icone: "fa-solid fa-money-bills text-blue-600" },
      { titulo: "Em Aberto", valor: data.totalAberto, detalhe: data.totalValorAberto, icone: "fa-solid fa-chart-line text-yellow-600" },
      { titulo: "Orçamento", valor: data.totalOrcamento, detalhe: data.totalValorOrcamento, icone: "fa-solid fa-list-check text-red-600" },
      { titulo: "Descontos", valor: data.totalVendasComDesconto, detalhe: data.totalValorDescontos, icone: "fa-solid fa-percent text-green-600" },
      { titulo: "Ticket Médio", valor: null, detalhe: data.ticketMedio, icone: "fa-solid fa-chart-line text-blue-600" },
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
    <div class="flex flex-col md:flex-row gap-2 justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Tags class="h-6 w-6" :stroke-width="2.5" />
          Painel de vendas
        </h2>
        <p class="text-sm text-muted-foreground">Resumo geral e insights</p>
      </div>
      <div class="flex items-center gap-2 w-content">
        <Calendarpicker class="w-content" :range="true" v-model="filtroPeriodo"
          @update:model-value="atualizarIndicadores" />
      </div>
    </div>

    <section v-if="!loading">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card v-for="(kpi, i) in indicadores" :key="i" class="shadow rounded-xl transition ">
          <CardHeader>
            <CardTitle class="flex flex-row items-center gap-2 text-md text-gray-700 dark:text-gray-300"><i
                class="p-1 bg-background/20 rounded-md" :class="kpi.icone"></i> {{ kpi.titulo }}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-xs text-muted-foreground">{{ kpi.valor != null ? `Qtd ${kpi.valor}` : 'No período' }}</p>
            <p class="text-lg text-gray-700 dark:text-gray-300">R$ {{ kpi.detalhe.replace('.', ',') }}</p>
          </CardContent>
        </Card>
      </div>
    </section>
    <section v-if="loading" class="flex">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div class="flex flex-col space-y-3">
          <Skeleton class="h-[130px] w-[250px] rounded-xl" />
        </div>
      </div>
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
