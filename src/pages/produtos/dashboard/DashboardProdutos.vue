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

</script>

<template>
  <div class="space-y-4">

    <!-- Indicadores -->
    <section>
      <h2 class="text-2xl font-bold mb-4"><i class="fa-solid fa-chart-line text-green-600"></i> Dashboard de produtos
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card v-for="(kpi, i) in indicadores" :key="i" class="shadow rounded-2xl hover:scale-[1.02] transition">
          <CardHeader class="flex flex-row items-center gap-2">
            <component :is="kpi.icone" class="w-5 h-5 text-blue-500" />
            <CardTitle class="text-sm">{{ kpi.titulo }}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-xl font-bold">{{ kpi.valor }}</p>
            <p class="text-xs text-muted-foreground">{{ kpi.detalhe }}</p>
          </CardContent>
        </Card>
      </div>
    </section>

    <!-- Gráficos -->
    <section class="bg-card border border-border rounded-2xl p-4">
      <h2 class="text-lg font-bold mb-4">📈 Análises de Estoque e Vendas</h2>
      <Tabs default-value="reposicoes" class="w-full">
        <TabsList class="rounded-md">
          <TabsTrigger value="reposicoes"><i class="fa-solid fa-boxes-stacked"></i> Reposições</TabsTrigger>
          <TabsTrigger value="vendas"><i class="fa-solid fa-chart-line"></i> Vendas</TabsTrigger>
          <TabsTrigger value="vendidos"><i class="fa-solid fa-chart-line"></i> Mais Vendidos</TabsTrigger>
          <TabsTrigger value="categorias"><i class="fa-solid fa-chart-pie"></i> Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="reposicoes">
          <Bar class="max-h-[400px] p-4" :data="chartReposicoes" :options="{ responsive: true }" />
        </TabsContent>

        <TabsContent value="vendas">
          <Line class="max-h-[400px] p-4" :data="chartVendas" :options="{ responsive: true }" />
        </TabsContent>

        <TabsContent value="vendidos">
          <Bar class="max-h-[400px] p-4" :data="chartMaisVendidos" :options="{ responsive: true }" />
        </TabsContent>

        <TabsContent value="categorias">
          <Pie class="max-h-[400px] p-4" :data="chartCategorias" />
        </TabsContent>
      </Tabs>
    </section>
  </div>
</template>
