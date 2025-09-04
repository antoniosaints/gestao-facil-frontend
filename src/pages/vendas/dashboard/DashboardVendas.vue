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

const toast = useToast()

const filtroPeriodo = ref([startOfMonth(new Date()), endOfMonth(new Date())])
const indicadores = ref<any[]>([])

const getIndicadores = async (inicio?: string, fim?: string) => {
  try {
    const { data }: any = await VendaRepository.resumo(inicio, fim)
    indicadores.value = [
      { titulo: "Total de Vendas", valor: data.totalVendas, detalhe: data.totalValorVendas, icone: "fa-solid fa-chart-line text-green-600" },
      { titulo: "Total Faturado", valor: data.totalFaturado, detalhe: data.totalValorFaturado, icone: "fa-solid fa-money-bills text-blue-600" },
      { titulo: "Total em Aberto", valor: data.totalAberto, detalhe: data.totalValorAberto, icone: "fa-solid fa-chart-line text-yellow-600" },
      { titulo: "Cancelado", valor: data.totalCancelado, detalhe: data.totalValorCancelado, icone: "fa-solid fa-times text-red-600" },
      { titulo: "Descontos", valor: data.totalVendasComDesconto, detalhe: data.totalValorDescontos, icone: "fa-solid fa-percent text-green-600" },
      { titulo: "Ticket Médio", valor: null, detalhe: data.ticketMedio, icone: "fa-solid fa-chart-line text-blue-600" },
    ]
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar os indicadores')
  }
}

// --- Gráficos (exemplos mockados) ---
const chartStatus = {
  labels: ["Orçamento", "Faturado", "Andamento", "Finalizado", "Pendente", "Cancelado"],
  datasets: [{ label: "Qtd Vendas", data: [10, 40, 15, 30, 5, 20], backgroundColor: "#4ade80", borderRadius: 6 }]
}

const chartMetodo = {
  labels: ["PIX", "Dinheiro", "Cartão"],
  datasets: [{ label: "Método", data: [35, 20, 45], backgroundColor: ["#60a5fa", "#fbbf24", "#f87171"], borderRadius: 6 }]
}
const chartCategoria = {
  labels: ["Informática", "Eletrônicos", "Acessórios"],
  datasets: [{ label: "Categorias", data: [35, 20, 45], backgroundColor: ["#a855f7", "#7dd3fc", "#34d399"], borderRadius: 6 }]
}

const chartPeriodo = {
  labels: ["01", "02", "03", "04", "05", "06", "07"],
  datasets: [{ label: "Vendas", data: [500, 700, 400, 900, 650, 800, 950], borderColor: "#6366f1", backgroundColor: "rgba(99, 102, 241, 0.2)", fill: true, borderRadius: 6, tension: 0.4 }]
}

watch(filtroPeriodo, async (data) => {
  if (data === null) return await getIndicadores()
  await getIndicadores(data[0].toISOString(), data[1].toISOString())
  toast.info('Indicadores atualizados')
})


onMounted(() => {
  getIndicadores()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col md:flex-row gap-2 justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-black dark:text-white">
          Painel de vendas
        </h2>
        <p class="text-sm text-muted-foreground">Resumo geral e insights</p>
      </div>
      <div class="flex items-center gap-2 w-content">
        <button type="button"
          class="bg-red-600 hidden text-white text-nowrap px-3 py-1.5 rounded-md text-sm hover:bg-red-700 transition-colors">
          <i class="fa-solid fa-filter-circle-xmark"></i>
        </button>
        <Calendarpicker class="w-content" :range="true" v-model="filtroPeriodo" />
      </div>
    </div>

    <section>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card v-for="(kpi, i) in indicadores" :key="i" class="shadow rounded-xl hover:scale-[1.02] transition">
          <CardHeader>
            <CardTitle class="text-sm font-normal"><i :class="kpi.icone"></i> {{ kpi.titulo }}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-xs text-muted-foreground">{{ kpi.valor != null ? `Qtd ${kpi.valor}` : 'No período' }}</p>
            <p class="text-lg">R$ {{ kpi.detalhe.replace('.', ',') }}</p>
          </CardContent>
        </Card>
      </div>
    </section>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Gráfico de Barras -->
      <div
        class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-lg p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
        <h2 class="text-lg font-semibold mb-4"><i class="fa-solid fa-chart-simple text-emerald-600"></i>
          Vendas por status
        </h2>
        <BarChart class="max-h-64" :data="chartStatus" :options="optionsChartBarDefault" />
      </div>

      <div
        class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-lg p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
        <h2 class="text-lg font-semibold mb-4"><i class="fa-solid fa-chart-simple text-emerald-600"></i>
          Resumo por período
        </h2>
        <LineChart class="max-h-64" :data="chartPeriodo" :options="optionsChartLine" />
      </div>

      <div
        class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-lg p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
        <h2 class="text-lg font-semibold mb-4"><i class="fa-solid fa-chart-simple text-emerald-600"></i>
          Plano de contas
        </h2>
        <PieChart class="max-h-64" :data="chartMetodo" :options="optionsChartPie" />
      </div>

      <div
        class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-lg p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
        <h2 class="text-lg font-semibold mb-4"><i class="fa-solid fa-chart-pie text-emerald-600"></i>
          Por categoria
        </h2>
        <PieChart class="max-h-64" :data="chartCategoria" :options="optionsChartPie" />
      </div>
    </div>
  </div>
</template>
