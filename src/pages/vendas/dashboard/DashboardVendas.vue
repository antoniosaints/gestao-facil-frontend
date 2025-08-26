<script setup lang="ts">
import { ref } from "vue"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Bar, Line, Pie } from "vue-chartjs"
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  CategoryScale,
  LinearScale
} from "chart.js"

// Registrando plugins Chart.js
ChartJS.register(
  Title, Tooltip, Legend,
  BarElement, LineElement, PointElement,
  ArcElement, CategoryScale, LinearScale
)

// --- Indicadores (KPI) ---
const indicadores = ref([
  { titulo: "Total de Vendas", valor: "120", detalhe: "R$ 35.000", icone: "fa-solid fa-chart-line text-green-600" },
  { titulo: "Total Faturado", valor: "95", detalhe: "R$ 28.000", icone: "fa-solid fa-money-bills text-blue-600" },
  { titulo: "Total em Aberto", valor: "15", detalhe: "R$ 5.000", icone: "fa-solid fa-chart-line text-yellow-600" },
  { titulo: "Cancelado", valor: "10", detalhe: "R$ 2.000", icone: "fa-solid fa-times text-red-600" },
  { titulo: "Descontos", valor: "-", detalhe: "R$ 1.500", icone: "fa-solid fa-percent text-green-600" },
  { titulo: "Ticket Médio", valor: "-", detalhe: "R$ 291,67", icone: "fa-solid fa-chart-line text-blue-600" },
])

// --- Gráficos (exemplos mockados) ---
const chartStatus = {
  labels: ["Orçamento", "Faturado", "Andamento", "Finalizado", "Pendente", "Cancelado"],
  datasets: [{ label: "Qtd Vendas", data: [10, 40, 15, 30, 5, 20], backgroundColor: "#4ade80" }]
}

const chartMetodo = {
  labels: ["PIX", "Dinheiro", "Cartão"],
  datasets: [{ label: "Método", data: [35, 20, 45], backgroundColor: ["#60a5fa", "#fbbf24", "#f87171"] }]
}

const chartPeriodo = {
  labels: ["01", "02", "03", "04", "05", "06", "07"],
  datasets: [{ label: "Vendas", data: [500, 700, 400, 900, 650, 800, 950], borderColor: "#6366f1", backgroundColor: "#a5b4fc" }]
}

// --- Listagens ---
const ultimasVendas = ref([
  { id: 1, cliente: "João", valor: 300, status: "FATURADO", data: "20/08/2025" },
  { id: 2, cliente: "Maria", valor: 150, status: "ORCAMENTO", data: "21/08/2025" },
  { id: 3, cliente: "Carlos", valor: 700, status: "ANDAMENTO", data: "22/08/2025" }
])

const pendentesPagamento = ref([
  { id: 5, cliente: "Carlos", valor: 500, metodo: "Cartão" },
  { id: 6, cliente: "Fernanda", valor: 250, metodo: "PIX" }
])

const garantias = ref([
  { id: 7, produto: "Notebook Dell", cliente: "Lucas", validade: "10/09/2025" }
])

// --- Alertas ---
const alertas = ref([
  "3 vendas aguardando faturamento",
  "2 pagamentos estornados",
  "5 produtos com estoque baixo"
])
</script>

<template>
  <div class="space-y-8">

    <!-- Indicadores -->
    <section>
      <h2 class="text-2xl font-bold mb-4"><i class="fa-solid fa-chart-line text-green-600"></i> Dashboard de vendas</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card v-for="(kpi, i) in indicadores" :key="i" class="shadow rounded-lg hover:scale-[1.02] transition">
          <CardHeader>
            <CardTitle class="text-sm text-muted-foreground"><i :class="kpi.icone"></i> {{ kpi.titulo }}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-xl font-bold">{{ kpi.valor }}</p>
            <p class="text-xs text-muted-foreground">{{ kpi.detalhe }}</p>
          </CardContent>
        </Card>
      </div>
    </section>

    <!-- Gráficos -->
    <section class="bg-card shadow-md rounded-lg p-4 border border-border">
      <h2 class="text-lg font-bold mb-4">📈 Gráficos de Vendas</h2>
      <Tabs default-value="status" class="w-full">
        <TabsList>
          <TabsTrigger value="status">Por Status</TabsTrigger>
          <TabsTrigger value="metodo">Por Método</TabsTrigger>
          <TabsTrigger value="periodo">Por Período</TabsTrigger>
        </TabsList>
        <TabsContent value="status">
          <Bar class="max-h-[400px]" :data="chartStatus" :options="{ responsive: true, plugins: { legend: { display: false }}}"/>
        </TabsContent>
        <TabsContent value="metodo">
          <Pie class="max-h-[400px]" :data="chartMetodo" />
        </TabsContent>
        <TabsContent value="periodo">
          <Line class="max-h-[400px]" :data="chartPeriodo" />
        </TabsContent>
      </Tabs>
    </section>

    <!-- Listagens rápidas -->
    <section>
      <h2 class="text-lg font-bold mb-4">📋 Listagens Rápidas</h2>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        <!-- Últimas vendas -->
        <Card>
          <CardHeader><CardTitle>Últimas Vendas</CardTitle></CardHeader>
          <CardContent>
            <ul class="space-y-2 text-sm">
              <li v-for="v in ultimasVendas" :key="v.id" class="flex justify-between">
                <span>{{ v.cliente }} ({{ v.status }})</span>
                <span class="font-bold">R$ {{ v.valor }}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <!-- Pendentes -->
        <Card>
          <CardHeader><CardTitle>Pagamentos Pendentes</CardTitle></CardHeader>
          <CardContent>
            <ul class="space-y-2 text-sm">
              <li v-for="p in pendentesPagamento" :key="p.id" class="flex justify-between">
                <span>{{ p.cliente }} - {{ p.metodo }}</span>
                <span class="font-bold">R$ {{ p.valor }}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <!-- Garantias -->
        <Card>
          <CardHeader><CardTitle>Vendas com Garantia</CardTitle></CardHeader>
          <CardContent>
            <ul class="space-y-2 text-sm">
              <li v-for="g in garantias" :key="g.id" class="flex justify-between">
                <span>{{ g.produto }} - {{ g.cliente }}</span>
                <span>Validade: {{ g.validade }}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>

    <!-- Alertas -->
    <section>
      <h2 class="text-lg font-bold mb-4">🔔 Alertas / Ações</h2>
      <Card>
        <CardContent>
          <ul class="list-disc list-inside space-y-1 text-sm">
            <li v-for="a in alertas" :key="a">{{ a }}</li>
          </ul>
        </CardContent>
      </Card>
    </section>

  </div>
</template>
