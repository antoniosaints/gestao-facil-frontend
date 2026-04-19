<script setup lang="ts">
import BarChart from '@/components/graficos/BarChart.vue'
import LineChart from '@/components/graficos/LineChart.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { optionsChartBarDefault, optionsChartLine } from '@/composables/useChartOptions'
import {
  type DashboardAdminCardItem,
  type DashboardAdminCharts,
  type DashboardAdminKpis,
  type DashboardAdminRankItem,
  ContaRepository,
} from '@/repositories/conta-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'
import {
  AlertTriangle,
  CalendarClock,
  ChartPie,
  CircleDollarSign,
  CreditCard,
  Loader,
  Menu,
  Tags,
  TrendingUpDown,
  UserMinus,
  UserPlus,
  UserRoundPlus,
  UserStar,
} from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useToast } from 'vue-toastification'

const uiStore = useUiStore()
const toast = useToast()

const loading = ref(false)
const kpis = ref<DashboardAdminKpis>({
  totalAssinantes: 0,
  faturamentoMes: 0,
  receberMes: 0,
  pendenteTotal: 0,
  atrasadoTotal: 0,
  totalAReceber: 0,
  novosAssinantes: 0,
})
const proximosVencimentos = ref<DashboardAdminCardItem[]>([])
const topInvestidores = ref<DashboardAdminRankItem[]>([])
const inativosMaisTempo = ref<DashboardAdminRankItem[]>([])
const charts = ref<DashboardAdminCharts>({
  novosAssinantes: { labels: [], datasets: [] },
  faturamentoMensal: { labels: [], datasets: [] },
  topInvestidores: { labels: [], datasets: [] },
  inativosMaisTempo: { labels: [], datasets: [] },
})

async function loadDashboard() {
  try {
    loading.value = true
    const response = await ContaRepository.getDashboardAdmin()
    kpis.value = response.data.kpis
    proximosVencimentos.value = response.data.proximosVencimentos || []
    topInvestidores.value = response.data.topInvestidores || []
    inativosMaisTempo.value = response.data.inativosMaisTempo || []
    charts.value = response.data.charts
  } catch (error) {
    console.log(error)
    toast.error('Erro ao carregar o dashboard administrativo')
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ChartPie class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Dashboard
        </h2>
        <p class="text-sm text-muted-foreground">
          Acompanhamento financeiro e operacional das assinaturas do sistema.
        </p>
      </div>

      <Button variant="outline" class="w-fit bg-card" @click="loadDashboard">Recarregar</Button>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <RouterLink to="/admin/assinantes">
        <Card class="border-border shadow-sm transition hover:border-primary/40">
          <CardHeader class="pb-3">
            <CardTitle class="flex items-center gap-3 text-base">
              <UserRoundPlus class="h-9 w-9 rounded-md bg-blue-500/10 p-2 text-blue-500" />
              Total de assinantes
            </CardTitle>
            <CardDescription>Contas cadastradas na base</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-semibold text-foreground">{{ kpis.totalAssinantes }}</div>
          </CardContent>
        </Card>
      </RouterLink>

      <RouterLink to="/admin/faturas">
        <Card class="border-border shadow-sm transition hover:border-primary/40">
          <CardHeader class="pb-3">
            <CardTitle class="flex items-center gap-3 text-base">
              <TrendingUpDown class="h-9 w-9 rounded-md bg-green-500/10 p-2 text-green-500" />
              Faturamento do mes
            </CardTitle>
            <CardDescription>Mensalidades pagas no ciclo atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-semibold text-foreground">{{ formatCurrencyBR(kpis.faturamentoMes) }}</div>
          </CardContent>
        </Card>
      </RouterLink>

      <RouterLink to="/admin/faturas">
        <Card class="border-border shadow-sm transition hover:border-primary/40">
          <CardHeader class="pb-3">
            <CardTitle class="flex items-center gap-3 text-base">
              <CalendarClock class="h-9 w-9 rounded-md bg-orange-500/10 p-2 text-orange-500" />
              A receber no mes
            </CardTitle>
            <CardDescription>Pendencias do ciclo corrente</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-semibold text-foreground">{{ formatCurrencyBR(kpis.receberMes) }}</div>
          </CardContent>
        </Card>
      </RouterLink>

      <RouterLink to="/admin/faturas">
        <Card class="border-border shadow-sm transition hover:border-primary/40">
          <CardHeader class="pb-3">
            <CardTitle class="flex items-center gap-3 text-base">
              <CircleDollarSign class="h-9 w-9 rounded-md bg-yellow-500/10 p-2 text-yellow-500" />
              Total a receber
            </CardTitle>
            <CardDescription>Pendente + atrasado</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-semibold text-foreground">{{ formatCurrencyBR(kpis.totalAReceber) }}</div>
          </CardContent>
        </Card>
      </RouterLink>

      <Card class="border-border shadow-sm">
        <CardHeader class="pb-3">
          <CardTitle class="flex items-center gap-3 text-base">
            <UserPlus class="h-9 w-9 rounded-md bg-cyan-500/10 p-2 text-cyan-500" />
            Novos assinantes
          </CardTitle>
          <CardDescription>Entradas registradas no mes</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-semibold text-foreground">{{ kpis.novosAssinantes }}</div>
        </CardContent>
      </Card>

      <Card class="border-border shadow-sm">
        <CardHeader class="pb-3">
          <CardTitle class="flex items-center gap-3 text-base">
            <CreditCard class="h-9 w-9 rounded-md bg-indigo-500/10 p-2 text-indigo-500" />
            Pendente total
          </CardTitle>
          <CardDescription>Faturas ainda abertas</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-semibold text-foreground">{{ formatCurrencyBR(kpis.pendenteTotal) }}</div>
        </CardContent>
      </Card>

      <Card class="border-border shadow-sm">
        <CardHeader class="pb-3">
          <CardTitle class="flex items-center gap-3 text-base">
            <AlertTriangle class="h-9 w-9 rounded-md bg-red-500/10 p-2 text-red-500" />
            Atrasado total
          </CardTitle>
          <CardDescription>Faturas vencidas e nao liquidadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-semibold text-foreground">{{ formatCurrencyBR(kpis.atrasadoTotal) }}</div>
        </CardContent>
      </Card>

      <Card class="border-border shadow-sm">
        <CardHeader class="pb-3">
          <CardTitle class="flex items-center gap-3 text-base">
            <UserMinus class="h-9 w-9 rounded-md bg-slate-500/10 p-2 text-slate-500" />
            Inativos no radar
          </CardTitle>
          <CardDescription>Contas com maior tempo de inatividade</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-semibold text-foreground">{{ inativosMaisTempo.length }}</div>
        </CardContent>
      </Card>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card class="border-border shadow-sm">
        <CardHeader class="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Novos assinantes</CardTitle>
            <CardDescription>Evolucao mensal dos cadastros</CardDescription>
          </div>
          <RouterLink to="/admin/assinantes" class="text-sm text-primary">Ver lista</RouterLink>
        </CardHeader>
        <CardContent>
          <BarChart v-if="!loading" class="max-h-72" :data="charts.novosAssinantes" :options="optionsChartBarDefault" />
          <Empty v-else>
            <EmptyHeader>
              <EmptyMedia variant="icon"><Loader class="h-6 w-6 animate-spin text-info" /></EmptyMedia>
              <EmptyTitle>Carregando...</EmptyTitle>
              <EmptyDescription>Buscando a evolucao dos assinantes.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>

      <Card class="border-border shadow-sm">
        <CardHeader class="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Faturamento mensal</CardTitle>
            <CardDescription>Valores pagos por mes</CardDescription>
          </div>
          <RouterLink to="/admin/faturas" class="text-sm text-primary">Ver faturas</RouterLink>
        </CardHeader>
        <CardContent>
          <LineChart v-if="!loading" class="max-h-72" :data="charts.faturamentoMensal" :options="optionsChartLine" />
          <Empty v-else>
            <EmptyHeader>
              <EmptyMedia variant="icon"><Loader class="h-6 w-6 animate-spin text-info" /></EmptyMedia>
              <EmptyTitle>Carregando...</EmptyTitle>
              <EmptyDescription>Montando o historico de faturamento.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card class="border-border shadow-sm">
        <CardHeader class="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Clientes que mais investiram</CardTitle>
            <CardDescription>Ranking por mensalidades pagas</CardDescription>
          </div>
          <RouterLink to="/admin/faturas" class="text-sm text-primary">Financeiro</RouterLink>
        </CardHeader>
        <CardContent class="space-y-4">
          <BarChart v-if="!loading" class="max-h-72" :data="charts.topInvestidores" :options="optionsChartBarDefault" />
          <div class="space-y-3">
            <div
              v-for="item in topInvestidores"
              :key="item.nome"
              class="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 px-3 py-2"
            >
              <div>
                <div class="text-sm font-medium text-foreground">{{ item.nome }}</div>
              </div>
              <div class="text-sm text-muted-foreground">{{ formatCurrencyBR(item.total || 0) }}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="border-border shadow-sm">
        <CardHeader class="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Clientes inativos ha mais tempo</CardTitle>
            <CardDescription>Contas com maior tempo sem regularizacao</CardDescription>
          </div>
          <RouterLink to="/admin/assinantes" class="text-sm text-primary">Assinantes</RouterLink>
        </CardHeader>
        <CardContent class="space-y-4">
          <BarChart v-if="!loading" class="max-h-72" :data="charts.inativosMaisTempo" :options="optionsChartBarDefault" />
          <div class="space-y-3">
            <div
              v-for="item in inativosMaisTempo"
              :key="item.nome"
              class="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 px-3 py-2"
            >
              <div>
                <div class="text-sm font-medium text-foreground">{{ item.nome }}</div>
                <div class="text-xs text-muted-foreground">{{ item.email }}</div>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium text-foreground">{{ item.diasInativo || 0 }}d</div>
                <div class="text-xs text-muted-foreground">{{ item.status }}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card class="border-border shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Proximos do vencimento</CardTitle>
          <CardDescription>Contas que vencem nos proximos 7 dias</CardDescription>
        </div>
        <RouterLink to="/admin/assinantes" class="text-sm text-primary">Abrir assinantes</RouterLink>
      </CardHeader>
      <CardContent>
        <div v-if="proximosVencimentos.length" class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="item in proximosVencimentos"
            :key="item.id"
            class="rounded-xl border border-border/70 bg-background/70 p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-sm font-medium text-foreground">{{ item.nome }}</div>
                <div class="text-xs text-muted-foreground">{{ item.email }}</div>
              </div>
              <div class="text-xs font-medium text-muted-foreground">
                {{ item.diasParaVencer }}d
              </div>
            </div>
            <div class="mt-4 flex items-center justify-between text-sm">
              <span class="text-muted-foreground">{{ formatDateToPtBR(item.vencimento) }}</span>
              <span class="font-medium text-foreground">{{ formatCurrencyBR(item.valorPlano) }}</span>
            </div>
          </div>
        </div>
        <Empty v-else>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarClock class="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Sem vencimentos imediatos</EmptyTitle>
            <EmptyDescription>Nenhuma conta vence nos proximos 7 dias.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>

    <nav
      v-if="uiStore.isMobile"
      class="fixed bottom-0 left-0 z-20 flex h-20 w-full justify-around border-t border-border bg-card pt-4 shadow-lg"
    >
      <RouterLink to="/admin/assinantes" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300">
        <UserStar class="h-5 w-5" />
        <span class="text-xs">Assinantes</span>
      </RouterLink>
      <RouterLink to="/admin/faturas" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300">
        <Tags class="h-5 w-5" />
        <span class="text-xs">Faturas</span>
      </RouterLink>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="uiStore.openSidebar = true"
      >
        <Menu class="h-5 w-5" />
        <span class="text-xs">Menu</span>
      </button>
    </nav>
  </div>
</template>
