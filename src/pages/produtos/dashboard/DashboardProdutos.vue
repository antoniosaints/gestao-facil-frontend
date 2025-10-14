<script setup lang="ts">
import { onMounted, ref } from "vue"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Package } from "lucide-vue-next"

import Calendarpicker from "@/components/formulario/calendarpicker.vue"
import { optionsChartBarDefault, optionsChartBarStack } from "@/composables/useChartOptions"
import BarChart from "@/components/graficos/BarChart.vue"
import { useToast } from "vue-toastification"
import { endOfMonth, startOfMonth } from "date-fns"
import { ProdutoRepository } from "@/repositories/produto-repository"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrencyBR } from "@/utils/formatters"
import { Input } from "@/components/ui/input"
const toast = useToast()
const loading = ref(true)
const filtroPeriodo = ref([startOfMonth(new Date()), endOfMonth(new Date())])
const indicadores = ref<any[]>([])
const ticketMedioChart: any = ref({ labels: [], datasets: [] });
const reposicoesMensaisChart: any = ref({ labels: [], datasets: [] });
const menosSaidasChart: any = ref({ labels: [], datasets: [] });
const maisSaidasChart: any = ref({ labels: [], datasets: [] });
const anoTicketMedio = ref(new Date().getFullYear())

const getIndicadores = async (inicio?: string, fim?: string) => {
  try {
    loading.value = true
    const data: any = await ProdutoRepository.getResumoGeral(inicio, fim)
    indicadores.value = [
      { titulo: "Ticket Médio", valor: data.ticketMedioGeral ? formatCurrencyBR(data.ticketMedioGeral) : null, icone: "fa-solid fa-chart-line text-green-600" },
      { titulo: "Estoques Baixos", valor: data.estoqueBaixo ? `${data.estoqueBaixo} produto(s)` : null, icone: "fa-solid fa-angles-down text-red-600" },
      { titulo: "Lucro Mensal", valor: data.lucroMensal ? formatCurrencyBR(data.lucroMensal) : null, icone: "fa-solid fa-chart-line text-blue-600" },
      { titulo: "Custo Reposições", valor: data.custoReposicoes ? formatCurrencyBR(data.custoReposicoes) : null, icone: "fa-solid fa-money-bill-trend-up text-purple-600" },
    ]

    loading.value = false
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar os indicadores')
  } finally {
    loading.value = false
  }
}


async function getDataDashboard() {
  try {
    const inicio = filtroPeriodo.value === null ? startOfMonth(new Date()).toISOString() : filtroPeriodo.value[0].toISOString();
    const fim = filtroPeriodo.value === null ? endOfMonth(new Date()).toISOString() : filtroPeriodo.value[1].toISOString();
    const [indicadores, ticket, reposicoes, menosSaidas, maisSaidas] = await Promise.all([
      getIndicadores(inicio, fim),
      ProdutoRepository.getTicketMedioMensal(),
      ProdutoRepository.getReposicoesMensais(),
      ProdutoRepository.getProdutosMenosSaidas(inicio, fim),
      ProdutoRepository.getProdutosMaisSaidas(inicio, fim),
    ])
    ticketMedioChart.value = { labels: [...ticket.labels], datasets: [...ticket.datasets] };
    reposicoesMensaisChart.value = { labels: [...reposicoes.labels], datasets: [...reposicoes.datasets] };
    menosSaidasChart.value = { labels: [...menosSaidas.labels], datasets: [...menosSaidas.datasets] };
    maisSaidasChart.value = { labels: [...maisSaidas.labels], datasets: [...maisSaidas.datasets] };
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
          <Package class="h-6 w-6" :stroke-width="2.5" />
          Painel de produtos
        </h2>
        <p class="text-sm text-muted-foreground">Resumo geral e insights</p>
      </div>
      <div class="flex items-center gap-2 w-content">
        <Calendarpicker class="w-content" :range="true" v-model="filtroPeriodo"
          @update:model-value="atualizarIndicadores" />
      </div>
    </div>

    <section v-if="!loading">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card v-for="(kpi, i) in indicadores" :key="i" class="shadow rounded-xl transition ">
          <CardHeader>
            <CardTitle class="flex flex-row items-center gap-1 text-md text-gray-700 dark:text-gray-300"><i
                class="p-1 bg-background/20 rounded-md" :class="kpi.icone"></i> {{ kpi.titulo }}
            </CardTitle>
          </CardHeader>
          <CardContent class="-mt-4">
            <p class="text-lg text-gray-700 dark:text-gray-300">{{ kpi.valor }}</p>
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
        <div class="flex flex-row items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">
            Tícket Médio Mensal
          </h2>
        </div>
        <BarChart class="max-h-64" :data="ticketMedioChart" :options="optionsChartBarDefault" />
      </div>

      <div
        class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
        <h2 class="text-lg font-semibold mb-4">
          Reposições Mensais
        </h2>
        <BarChart class="max-h-64" :data="reposicoesMensaisChart" :options="optionsChartBarStack" />
      </div>

      <div
        class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
        <h2 class="text-lg font-semibold mb-4">
          Menos Saídas
        </h2>
        <BarChart class="max-h-64" :data="menosSaidasChart" :options="optionsChartBarDefault" />
      </div>

      <div
        class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
        <h2 class="text-lg font-semibold mb-4">
          Mais Reposições
        </h2>
        <BarChart class="max-h-64" :data="maisSaidasChart" :options="optionsChartBarDefault" />
      </div>
    </div>
  </div>
</template>
