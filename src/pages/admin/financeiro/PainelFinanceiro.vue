<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import {
  AlertTriangle,
  ChartPie,
  CircleDollarSign,
  RefreshCcw,
  TrendingUp,
  UserStar,
} from 'lucide-vue-next'
import BarChart from '@/components/graficos/BarChart.vue'
import PieChart from '@/components/graficos/PieChart.vue'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { optionsChartBarDefault, optionsChartPie } from '@/composables/useChartOptions'
import { ContaRepository, type AdminFinanceiroPainelResponse } from '@/repositories/conta-repository'
import { formatCurrencyBR } from '@/utils/formatters'

const toast = useToast()
const loading = ref(false)
const painel = ref<AdminFinanceiroPainelResponse | null>(null)

const indicadores = computed(() => {
  const resumo = painel.value?.resumo
  return [
    {
      titulo: 'MRR estimado',
      valor: formatCurrencyBR(resumo?.mrrEstimado || 0),
      detalhe: `${resumo?.contasAtivas || 0} de ${resumo?.totalContas || 0} contas ativas`,
      icon: TrendingUp,
      colorClass: 'text-emerald-600 bg-emerald-500/10',
    },
    {
      titulo: 'Recebido no mês',
      valor: formatCurrencyBR(resumo?.recebidoMes || 0),
      detalhe: `${resumo?.faturasPagasMes || 0} fatura(s) paga(s)`,
      icon: CircleDollarSign,
      colorClass: 'text-blue-600 bg-blue-500/10',
    },
    {
      titulo: 'Pendente',
      valor: formatCurrencyBR(resumo?.pendenteTotal || 0),
      detalhe: `${resumo?.faturasPendentes || 0} fatura(s) em aberto`,
      icon: ChartPie,
      colorClass: 'text-amber-600 bg-amber-500/10',
    },
    {
      titulo: 'Em atraso',
      valor: formatCurrencyBR(resumo?.atrasadoTotal || 0),
      detalhe: `${resumo?.faturasAtrasadas || 0} fatura(s) vencida(s)`,
      icon: AlertTriangle,
      colorClass: 'text-rose-600 bg-rose-500/10',
    },
  ]
})

const receitaChart = computed(() => ({
  labels: painel.value?.receitaMensal.map((item) => item.mes) || [],
  datasets: [
    {
      label: 'Recebido (R$)',
      data: painel.value?.receitaMensal.map((item) => item.recebido) || [],
      backgroundColor: '#16a34a',
    },
    {
      label: 'Gerado (R$)',
      data: painel.value?.receitaMensal.map((item) => item.gerado) || [],
      backgroundColor: '#2563eb',
    },
  ],
}))

const statusChart = computed(() => {
  const entries = painel.value?.statusDistribuicao.filter((item) => item.quantidade > 0) || []
  return {
    labels: entries.map((item) => item.status),
    datasets: [
      {
        data: entries.map((item) => item.valor),
        backgroundColor: ['#f59e0b', '#16a34a', '#dc2626', '#64748b'],
      },
    ],
  }
})

function getStatusColor(status: string | null) {
  if (status === 'BLOQUEADO') return 'red' as const
  if (status === 'INATIVO') return 'orange' as const
  return 'green' as const
}

async function carregar() {
  try {
    loading.value = true
    painel.value = await ContaRepository.getFinanceiroPainelAdmin()
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao carregar o painel financeiro')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  carregar()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <CircleDollarSign class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Painel financeiro
        </h2>
        <p class="text-sm text-muted-foreground">
          Visão financeira do SaaS: recorrência, faturas e inadimplência dos assinantes.
        </p>
      </div>
      <Button variant="outline" class="gap-2 bg-card" :disabled="loading" @click="carregar">
        <RefreshCcw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" />
        Atualizar
      </Button>
    </div>

    <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card v-for="item in indicadores" :key="item.titulo" class="rounded-xl shadow">
        <CardHeader class="py-2">
          <CardTitle class="flex items-center gap-2 text-sm">
            <span class="rounded-md p-2" :class="item.colorClass">
              <component :is="item.icon" class="h-4 w-4" />
            </span>
            {{ item.titulo }}
          </CardTitle>
        </CardHeader>
        <CardContent class="pb-3">
          <p class="text-lg font-semibold">{{ item.valor }}</p>
          <p class="truncate text-xs text-muted-foreground" :title="item.detalhe">{{ item.detalhe }}</p>
        </CardContent>
      </Card>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <Card class="rounded-xl shadow xl:col-span-3">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Receita dos últimos 12 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart class="max-h-64" :data="receitaChart" :options="optionsChartBarDefault" />
        </CardContent>
      </Card>

      <Card class="rounded-xl shadow xl:col-span-2">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Faturas por status (valor)</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="statusChart.labels.length" class="grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_150px]">
            <PieChart class="max-h-56" :data="statusChart" :options="optionsChartPie" />
            <div class="space-y-2">
              <div
                v-for="item in painel?.statusDistribuicao.filter((entry) => entry.quantidade > 0)"
                :key="item.status"
                class="flex items-center justify-between gap-2 rounded-md border bg-background px-2 py-1.5 text-xs"
              >
                <span>{{ item.status }} ({{ item.quantidade }})</span>
                <strong>{{ formatCurrencyBR(item.valor) }}</strong>
              </div>
            </div>
          </div>
          <div v-else class="flex h-56 items-center justify-center text-sm text-muted-foreground">
            Nenhuma fatura registrada.
          </div>
        </CardContent>
      </Card>
    </section>

    <section class="rounded-md border bg-card p-4">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="flex items-center gap-2 font-semibold">
          <UserStar class="h-4 w-4" />
          Maiores pendências por assinante
        </h3>
        <span class="text-xs text-muted-foreground">{{ painel?.topInadimplentes.length || 0 }} conta(s)</span>
      </div>
      <div v-if="loading" class="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
      <div v-else-if="!painel?.topInadimplentes.length" class="py-8 text-center text-sm text-muted-foreground">
        Nenhuma pendência encontrada. 🎉
      </div>
      <div v-else class="overflow-auto">
        <table class="w-full min-w-[640px] text-sm">
          <thead class="border-b text-left text-xs text-muted-foreground">
            <tr>
              <th class="py-2">Conta</th>
              <th class="py-2">E-mail</th>
              <th class="py-2">Status</th>
              <th class="py-2 text-right">Faturas em aberto</th>
              <th class="py-2 text-right">Valor pendente</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in painel.topInadimplentes" :key="item.contaId" class="border-b last:border-b-0">
              <td class="py-2 font-medium">{{ item.nome }}</td>
              <td class="py-2 text-muted-foreground">{{ item.email || '-' }}</td>
              <td class="py-2">
                <BadgeCell :label="item.status || '-'" :color="getStatusColor(item.status)" />
              </td>
              <td class="py-2 text-right">
                <Badge variant="outline">{{ item.faturas }}</Badge>
              </td>
              <td class="py-2 text-right font-semibold">{{ formatCurrencyBR(item.valor) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
