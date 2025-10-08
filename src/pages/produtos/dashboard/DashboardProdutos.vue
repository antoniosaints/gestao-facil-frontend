<script setup lang="ts">
import { ref } from "vue"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Package, TrendingDown, BarChart3, DollarSign } from "lucide-vue-next"
import { Bar, Line, Pie } from "vue-chartjs"
import {
  Chart as ChartJS,
  Title, Tooltip, Legend,
  BarElement, LineElement, PointElement,
  ArcElement, CategoryScale,
  LinearScale,
  Filler
} from "chart.js"
import Calendarpicker from "@/components/formulario/calendarpicker.vue"
import { optionsChartBarStack, optionsChartLine, optionsChartPie } from "@/composables/useChartOptions"
import BarChart from "@/components/graficos/BarChart.vue"
import LineChart from "@/components/graficos/LineChart.vue"
import PieChart from "@/components/graficos/PieChart.vue"

// Registrar plugins do Chart.js
ChartJS.register(
  Title, Tooltip, Legend,
  BarElement, LineElement, PointElement,
  ArcElement, CategoryScale, LinearScale, Filler
)

// Indicadores (simulação)
const indicadores = ref([
  { titulo: "Produtos Totais", valor: "850", detalhe: "R$ 120.000", icone: Package },
  { titulo: "Produtos em Baixa", valor: "35", detalhe: "Abaixo do mínimo", icone: TrendingDown },
  { titulo: "Ticket Médio", valor: "R$ 320", detalhe: "Markup 45%", icone: BarChart3 },
  { titulo: "Faturamento Mensal", valor: "R$ 48.500", detalhe: "Agosto 2025", icone: DollarSign }
])

// Gráficos (mock)
const chartReposicoes = {
  labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
  datasets: [{ label: "Reposições", data: [20, 35, 40, 30, 25, 50], backgroundColor: "#60a5fa", borderRadius: 6 }]
}

const chartVendas = {
  labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
  datasets: [{ label: "Vendas", data: [5000, 8000, 7500, 9000, 8500, 11000], backgroundColor: "rgba(75, 192, 192, 0.2)", borderRadius: 6, borderColor: "#4ade80", fill: true, tension: 0.4 }]
}

const chartMaisVendidos = {
  labels: ["Notebook", "Smartphone", "Mouse", "Teclado", "Monitor"],
  datasets: [{ label: "Qtd Vendida", data: [120, 200, 150, 90, 80], backgroundColor: "#fbbf24", borderRadius: 6 }]
}

const chartCategorias = {
  labels: ["Informática", "Eletrônicos", "Acessórios", "Móveis"],
  datasets: [{ label: "Lucro", data: [25000, 18000, 8000, 5000], backgroundColor: ["#6366f1", "#f87171", "#34d399", "#facc15"], borderRadius: 6 }]
}

const filtroPeriodo = ref([new Date(), new Date()])
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
        <button type="button"
          class="bg-red-600 hidden text-white text-nowrap px-3 py-1.5 rounded-md text-sm hover:bg-red-700 transition-colors">
          <i class="fa-solid fa-filter-circle-xmark"></i>
        </button>
        <Calendarpicker class="w-content" :range="true" v-model="filtroPeriodo" />
      </div>
    </div>
    <!-- Indicadores -->
    <section>
      <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card v-for="(kpi, i) in indicadores" :key="i" class="shadow rounded-xl hover:scale-[1.02] transition">
          <CardHeader class="flex flex-row items-center gap-2">
            <component :is="kpi.icone" class="w-5 h-5 text-blue-500" />
            <CardTitle class="text-md text-gray-700 dark:text-gray-300">{{ kpi.titulo }}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-xl font-bold text-gray-700 dark:text-gray-300">{{ kpi.valor }}</p>
            <p class="text-xs text-muted-foreground">{{ kpi.detalhe }}</p>
          </CardContent>
        </Card>
      </div>
    </section>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Gráfico de Barras -->
      <div
        class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
        <h2 class="text-lg font-semibold mb-4"><i class="fa-solid fa-chart-simple text-emerald-600"></i>
          Reposições
        </h2>
        <BarChart class="max-h-64" :data="chartReposicoes" :options="optionsChartBarStack" />
      </div>

      <div
        class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
        <h2 class="text-lg font-semibold mb-4"><i class="fa-solid fa-chart-line text-emerald-600"></i>
          Vendas
        </h2>
        <LineChart class="max-h-64" :data="chartVendas" :options="optionsChartLine" />
      </div>

      <div
        class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
        <h2 class="text-lg font-semibold mb-4"><i class="fa-solid fa-chart-pie text-emerald-600"></i>
          Categorias
        </h2>
        <PieChart class="max-h-64" :data="chartCategorias" :options="optionsChartPie" />
      </div>

      <div
        class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
        <h2 class="text-lg font-semibold mb-4"><i class="fa-solid fa-chart-simple text-emerald-600"></i>
          Mais vendidos
        </h2>
        <BarChart class="max-h-64" :data="chartMaisVendidos" :options="optionsChartBarStack" />
      </div>
    </div>
  </div>
</template>
