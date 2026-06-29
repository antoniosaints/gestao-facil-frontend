<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from 'date-fns'
import { useToast } from 'vue-toastification'
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileDown,
  Filter,
  HandCoins,
  ReceiptText,
  RefreshCcw,
  RefreshCw,
  ShoppingCart,
  Trash2,
  TrendingUp,
  UserRound,
} from 'lucide-vue-next'
import BarChart from '@/components/graficos/BarChart.vue'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import DetalhesVenda from '@/pages/vendas/modais/DetalhesVenda.vue'
import PieChart from '@/components/graficos/PieChart.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useConfirm } from '@/composables/useConfirm'
import { optionsChartBarDefault, optionsChartPie } from '@/composables/useChartOptions'
import {
  CaixaRepository,
  type CaixaRelatorioParams,
} from '@/repositories/caixa-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { useVendasStore } from '@/stores/vendas/useVenda'
import type { CaixaRelatorioResponse } from '@/types/schemas'
import { formatCurrencyBR } from '@/utils/formatters'

const toast = useToast()
const confirm = useConfirm()
const storeUi = useUiStore()
const vendasStore = useVendasStore()
const loading = ref(false)
const openModalFiltros = ref(false)
const openModalDetalhes = ref(false)
const filtroPeriodo = ref([startOfMonth(new Date()), endOfMonth(new Date())])
const filtroStatus = ref<'TODOS' | 'ABERTO' | 'FECHADO' | 'CANCELADO'>('TODOS')
const relatorio = ref<CaixaRelatorioResponse | null>(null)
const caixaSelecionado = ref<CaixaRelatorioResponse['caixas'][number] | null>(null)
const exportingPdfId = ref<number | null>(null)
const deletingCaixaId = ref<number | null>(null)
const canDeleteCaixas = computed(() => storeUi.permissoes.admin)

const filtrosAtivos = computed(() => {
  const inicio = filtroPeriodo.value[0]?.toLocaleDateString('pt-BR')
  const fim = filtroPeriodo.value[1]?.toLocaleDateString('pt-BR')
  const status = filtroStatus.value === 'TODOS' ? 'Todos' : filtroStatus.value
  return [`Periodo: ${inicio} ate ${fim}`, `Status: ${status}`]
})

const indicadores = computed(() => {
  const resumo = relatorio.value?.resumo
  return [
    {
      titulo: 'Vendido',
      valor: formatCurrencyBR(resumo?.totalVendido || 0),
      detalhe: `${resumo?.totalVendas || 0} venda(s) vinculadas`,
      icon: TrendingUp,
      colorClass: 'text-emerald-600 bg-emerald-500/10',
    },
    {
      titulo: 'Sangrias',
      valor: formatCurrencyBR(resumo?.totalSangrias || 0),
      detalhe: 'Saidas manuais registradas',
      icon: BanknoteArrowDown,
      colorClass: 'text-amber-600 bg-amber-500/10',
    },
    {
      titulo: 'Reforcos',
      valor: formatCurrencyBR(resumo?.totalReforcos || 0),
      detalhe: 'Entradas manuais registradas',
      icon: BanknoteArrowUp,
      colorClass: 'text-blue-600 bg-blue-500/10',
    },
    {
      titulo: 'Diferenca',
      valor: formatCurrencyBR(resumo?.diferenca || 0),
      detalhe: 'Diferenca total dos fechamentos',
      icon: CheckCircle2,
      colorClass: 'text-rose-600 bg-rose-500/10',
    },
  ]
})

const metodoPagamentoChart = computed(() => {
  const porMetodo = relatorio.value?.resumo.porMetodo || {}
  const entries = Object.entries(porMetodo).filter(([, valor]) => Number(valor) > 0)

  return {
    labels: entries.map(([metodo]) => getPaymentMethodLabel(metodo)),
    datasets: [
      {
        data: entries.map(([, valor]) => Number(valor)),
        backgroundColor: ['#16a34a', '#2563eb', '#f59e0b', '#7c3aed', '#0f766e', '#dc2626'],
      },
    ],
  }
})

const resumoOperacionalChart = computed(() => {
  const resumo = relatorio.value?.resumo
  return {
    labels: ['Vendido', 'Sangrias', 'Reforços', 'Diferença'],
    datasets: [
      {
        label: 'Valor',
        data: [
          resumo?.totalVendido || 0,
          resumo?.totalSangrias || 0,
          resumo?.totalReforcos || 0,
          resumo?.diferenca || 0,
        ],
        backgroundColor: ['#16a34a', '#f59e0b', '#2563eb', '#e11d48'],
      },
    ],
  }
})

const hasPaymentChartData = computed(() => metodoPagamentoChart.value.datasets[0].data.length > 0)

function buildParams(): CaixaRelatorioParams {
  return {
    inicio: startOfDay(filtroPeriodo.value[0] || new Date()).toISOString(),
    fim: endOfDay(filtroPeriodo.value[1] || new Date()).toISOString(),
    status: filtroStatus.value === 'TODOS' ? null : filtroStatus.value,
  }
}

async function carregarRelatorio() {
  try {
    loading.value = true
    relatorio.value = await CaixaRepository.relatorio(buildParams())
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao carregar relatorio de caixas')
  } finally {
    loading.value = false
  }
}

function applyPreset(preset: 'today' | 'current-month') {
  if (preset === 'today') {
    filtroPeriodo.value = [startOfDay(new Date()), endOfDay(new Date())]
  }

  if (preset === 'current-month') {
    filtroPeriodo.value = [startOfMonth(new Date()), endOfMonth(new Date())]
  }
}

function getPaymentMethodLabel(method?: string | null) {
  switch (method) {
    case 'DINHEIRO':
      return 'Dinheiro'
    case 'CARTAO':
      return 'Cartao'
    case 'PIX':
      return 'PIX'
    case 'BOLETO':
      return 'Boleto'
    default:
      return '-'
  }
}

function abrirDetalhes(caixa: CaixaRelatorioResponse['caixas'][number]) {
  caixaSelecionado.value = caixa
  openModalDetalhes.value = true
}

function abrirDetalhesVenda(vendaId?: number | null) {
  if (!vendaId) {
    toast.error('Movimento sem venda vinculada')
    return
  }
  vendasStore.openDetalhes(vendaId)
}

async function exportarPdf(caixaId: number) {
  try {
    exportingPdfId.value = caixaId
    await CaixaRepository.exportarPdf(caixaId)
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao exportar PDF do caixa')
  } finally {
    exportingPdfId.value = null
  }
}

function canDeleteCaixaItem(item: CaixaRelatorioResponse['caixas'][number]) {
  return canDeleteCaixas.value && item.resumo.totalVendas === 0
}

async function deletarCaixa(item: CaixaRelatorioResponse['caixas'][number]) {
  if (!canDeleteCaixaItem(item)) return

  const confirmed = await confirm.confirm({
    title: 'Apagar caixa',
    message: `Deseja apagar o caixa ${item.caixa.codigo}? Essa ação remove abertura, movimentos e operadores vinculados.`,
    confirmText: 'Sim, apagar',
    colorButton: 'danger',
  })

  if (!confirmed) return

  try {
    deletingCaixaId.value = item.caixa.id
    await CaixaRepository.deletarCaixa(item.caixa.id)
    toast.success('Caixa apagado com sucesso')
    await carregarRelatorio()
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao apagar caixa')
  } finally {
    deletingCaixaId.value = null
  }
}

onMounted(() => {
  carregarRelatorio()
})
</script>

<template>
  <div class="space-y-4 pb-24 md:pb-0">
    <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <HandCoins class="h-6 w-6 text-primary" />
          Caixas do PDV
        </h2>
        <p class="text-sm text-muted-foreground">Conferencia operacional de aberturas, vendas e fechamentos.</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="openModalFiltros = true">
          <Filter class="h-4 w-4" /> Filtros
        </Button>
        <Button variant="outline" size="icon" :disabled="loading" @click="carregarRelatorio">
          <RefreshCw class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <Badge v-for="item in filtrosAtivos" :key="item" variant="outline" class="text-xs">
        {{ item }}
      </Badge>
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
      <Card class="rounded-xl shadow xl:col-span-2">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Métodos de pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="hasPaymentChartData" class="grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
            <PieChart class="max-h-52" :data="metodoPagamentoChart" :options="optionsChartPie" />
            <div class="space-y-2">
              <div v-for="(valor, index) in metodoPagamentoChart.datasets[0].data" :key="metodoPagamentoChart.labels[index]"
                class="flex items-center justify-between gap-2 rounded-md border bg-background px-2 py-1.5 text-xs">
                <span class="truncate">{{ metodoPagamentoChart.labels[index] }}</span>
                <strong>{{ formatCurrencyBR(valor) }}</strong>
              </div>
            </div>
          </div>
          <div v-else class="flex h-52 items-center justify-center text-sm text-muted-foreground">
            Sem pagamentos no período.
          </div>
        </CardContent>
      </Card>

      <Card class="rounded-xl shadow xl:col-span-3">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Resumo operacional</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart class="max-h-52" :data="resumoOperacionalChart" :options="optionsChartBarDefault" />
        </CardContent>
      </Card>
    </section>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <section class="rounded-md border bg-card p-4 xl:col-span-2">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="font-semibold">Caixas</h3>
          <span class="text-xs text-muted-foreground">{{ relatorio?.caixas.length || 0 }} registro(s)</span>
        </div>
        <div v-if="loading" class="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
        <div v-else-if="!relatorio?.caixas.length" class="py-8 text-center text-sm text-muted-foreground">
          Nenhum caixa encontrado no periodo.
        </div>
        <div v-else class="overflow-auto">
          <table class="w-full min-w-[760px] text-sm">
            <thead class="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th class="py-2">Caixa</th>
                <th class="py-2">Operador</th>
                <th class="py-2">Abertura</th>
                <th class="py-2">Status</th>
                <th class="py-2 text-right">Vendido</th>
                <th class="py-2 text-right">Esperado</th>
                <th class="py-2 text-right">Diferenca</th>
                <th class="py-2 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in relatorio.caixas" :key="item.caixa.id" class="border-b last:border-b-0">
                <td class="py-3 font-medium">{{ item.caixa.codigo }}</td>
                <td class="py-3">{{ item.caixa.abertoPor?.nome || '-' }}</td>
                <td class="py-3">{{ new Date(item.caixa.abertoEm).toLocaleString('pt-BR') }}</td>
                <td class="py-3">
                  <Badge variant="outline">{{ item.caixa.status }}</Badge>
                </td>
                <td class="py-3 text-right">{{ formatCurrencyBR(item.resumo.totalVendido || 0) }}</td>
                <td class="py-3 text-right">{{ formatCurrencyBR(item.resumo.saldoEsperado || 0) }}</td>
                <td class="py-3 text-right">{{ formatCurrencyBR(item.resumo.diferenca || 0) }}</td>
                <td class="py-3 text-right">
                  <div class="inline-flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      :disabled="exportingPdfId === item.caixa.id"
                      @click="exportarPdf(item.caixa.id)"
                    >
                      <FileDown class="h-4 w-4" /> PDF
                    </Button>
                    <Button variant="outline" size="sm" @click="abrirDetalhes(item)">
                      <Eye class="h-4 w-4" /> Detalhes
                    </Button>
                    <Button
                      v-if="canDeleteCaixas"
                      variant="destructive"
                      size="sm"
                      :disabled="!canDeleteCaixaItem(item) || deletingCaixaId === item.caixa.id"
                      :title="item.resumo.totalVendas > 0 ? 'Caixas com vendas vinculadas não podem ser apagados.' : 'Apagar caixa'"
                      @click="deletarCaixa(item)"
                    >
                      <Trash2 class="h-4 w-4" /> Apagar
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-md border bg-card p-4">
        <h3 class="mb-3 font-semibold">Produtos mais vendidos</h3>
        <div v-if="!relatorio?.produtosMaisVendidos.length" class="py-8 text-center text-sm text-muted-foreground">
          Sem produtos vendidos.
        </div>
        <div v-else class="space-y-2">
          <div v-for="produto in relatorio.produtosMaisVendidos" :key="produto.nome"
            class="flex items-center justify-between rounded-md border bg-background p-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium" :title="produto.nome">{{ produto.nome }}</p>
              <p class="text-xs text-muted-foreground">{{ produto.quantidade }} unidade(s)</p>
            </div>
            <span class="text-sm font-semibold">{{ formatCurrencyBR(produto.total) }}</span>
          </div>
        </div>
      </section>
    </div>

    <ModalView v-model:open="openModalFiltros" title="Filtros de caixas" size="lg">
      <div class="grid gap-4 p-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">Atalhos</label>
          <div class="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" @click="applyPreset('today')">
              <CalendarDays class="h-4 w-4" /> Hoje
            </Button>
            <Button type="button" variant="outline" size="sm" @click="applyPreset('current-month')">
              Mes atual
            </Button>
          </div>
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">Periodo</label>
          <Calendarpicker class="w-full" :range="true" v-model="filtroPeriodo" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">Status</label>
          <select v-model="filtroStatus" class="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="TODOS">Todos</option>
            <option value="ABERTO">Aberto</option>
            <option value="FECHADO">Fechado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="openModalFiltros = false">Cancelar</Button>
          <Button @click="openModalFiltros = false; carregarRelatorio()">
            Aplicar
          </Button>
        </div>
      </div>
    </ModalView>

    <ModalView v-model:open="openModalDetalhes" title="Detalhes do caixa" size="5xl">
      <div v-if="caixaSelecionado" class="grid gap-3 px-3 pb-4 md:gap-4 md:p-4">
        <div class="rounded-md border bg-background p-4">
          <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="truncate text-lg font-semibold">{{ caixaSelecionado.caixa.codigo }}</h3>
                <Badge variant="outline">{{ caixaSelecionado.caixa.status }}</Badge>
              </div>
              <p class="mt-1 text-sm text-muted-foreground">
                Aberto em {{ new Date(caixaSelecionado.caixa.abertoEm).toLocaleString('pt-BR') }}
                por {{ caixaSelecionado.caixa.abertoPor?.nome || '-' }}
              </p>
              <p v-if="caixaSelecionado.caixa.fechadoEm" class="text-sm text-muted-foreground">
                Fechado em {{ new Date(caixaSelecionado.caixa.fechadoEm).toLocaleString('pt-BR') }}
                por {{ caixaSelecionado.caixa.fechadoPor?.nome || '-' }}
              </p>
            </div>
            <Button
              variant="outline"
              class="w-full md:w-auto"
              :disabled="exportingPdfId === caixaSelecionado.caixa.id"
              @click="exportarPdf(caixaSelecionado.caixa.id)"
            >
              <FileDown class="h-4 w-4" /> Exportar PDF
            </Button>
          </div>
        </div>

        <section class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 md:gap-3">
          <div class="rounded-md border bg-card p-3">
            <p class="text-xs text-muted-foreground">Vendido</p>
            <p class="font-semibold">{{ formatCurrencyBR(caixaSelecionado.resumo.totalVendido || 0) }}</p>
          </div>
          <div class="rounded-md border bg-card p-3">
            <p class="text-xs text-muted-foreground">Sangrias</p>
            <p class="font-semibold">{{ formatCurrencyBR(caixaSelecionado.resumo.totalSangrias || 0) }}</p>
          </div>
          <div class="rounded-md border bg-card p-3">
            <p class="text-xs text-muted-foreground">Reforcos</p>
            <p class="font-semibold">{{ formatCurrencyBR(caixaSelecionado.resumo.totalReforcos || 0) }}</p>
          </div>
          <div class="rounded-md border bg-card p-3">
            <p class="text-xs text-muted-foreground">Diferenca</p>
            <p class="font-semibold">{{ formatCurrencyBR(caixaSelecionado.resumo.diferenca || 0) }}</p>
          </div>
        </section>

        <section class="grid gap-2 md:grid-cols-3 md:gap-3">
          <div class="rounded-md border bg-card p-3">
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <ShoppingCart class="h-4 w-4" />
              Vendas vinculadas
            </div>
            <p class="mt-1 text-lg font-semibold">{{ caixaSelecionado.resumo.totalVendas }}</p>
          </div>
          <div class="rounded-md border bg-card p-3">
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <UserRound class="h-4 w-4" />
              Operadores
            </div>
            <p class="mt-1 text-lg font-semibold">{{ caixaSelecionado.caixa.operadores?.length || 1 }}</p>
          </div>
          <div class="rounded-md border bg-card p-3">
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <ReceiptText class="h-4 w-4" />
              Movimentos
            </div>
            <p class="mt-1 text-lg font-semibold">{{ caixaSelecionado.movimentos.length }}</p>
          </div>
        </section>

        <section class="rounded-md border bg-card p-3">
          <h3 class="mb-2 text-sm font-semibold">Por metodo de pagamento</h3>
          <div class="grid gap-2 sm:grid-cols-2">
            <div v-for="(valor, metodo) in caixaSelecionado.resumo.porMetodo" :key="metodo"
              class="flex justify-between rounded-md border bg-background px-3 py-2 text-sm">
              <span>{{ metodo }}</span>
              <strong>{{ formatCurrencyBR(valor) }}</strong>
            </div>
          </div>
        </section>

        <section class="rounded-md border bg-card p-3">
          <div class="mb-2 flex items-center justify-between">
            <h3 class="text-sm font-semibold">Vendas vinculadas</h3>
            <span class="text-xs text-muted-foreground">{{ caixaSelecionado.vendas.length }} registro(s)</span>
          </div>
          <div v-if="!caixaSelecionado.vendas.length" class="py-6 text-center text-sm text-muted-foreground">
            Nenhuma venda vinculada a este caixa.
          </div>
          <div v-if="caixaSelecionado.vendas.length" class="space-y-2 md:hidden">
            <article
              v-for="venda in caixaSelecionado.vendas"
              :key="venda.id"
              class="rounded-md border bg-background p-3"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold">{{ venda.Uid || `#${venda.id}` }}</p>
                  <p class="text-xs text-muted-foreground">{{ new Date(venda.data).toLocaleString('pt-BR') }}</p>
                </div>
                <Badge variant="outline">{{ venda.status }}</Badge>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div class="rounded-md bg-muted/40 p-2">
                  <span class="block text-muted-foreground">Pagamento</span>
                  <strong>{{ getPaymentMethodLabel(venda.PagamentoVendas?.metodo) }}</strong>
                </div>
                <div class="rounded-md bg-muted/40 p-2 text-right">
                  <span class="block text-muted-foreground">Valor</span>
                  <strong>{{ formatCurrencyBR(venda.valor || 0) }}</strong>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" class="mt-3 w-full" @click="abrirDetalhesVenda(venda.id)">
                <Eye class="h-4 w-4" />
                Detalhes da venda
              </Button>
            </article>
          </div>
          <div v-if="caixaSelecionado.vendas.length" class="hidden max-h-72 overflow-auto md:block">
            <table class="w-full min-w-[760px] text-sm">
              <thead class="border-b text-left text-xs text-muted-foreground">
                <tr>
                  <th class="py-2">Venda</th>
                  <th class="py-2">Data</th>
                  <th class="py-2">Status</th>
                  <th class="py-2">Pagamento</th>
                  <th class="py-2 text-right">Valor</th>
                  <th class="py-2 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="venda in caixaSelecionado.vendas" :key="venda.id" class="border-b last:border-b-0">
                  <td class="py-2 font-medium">{{ venda.Uid || `#${venda.id}` }}</td>
                  <td class="py-2">{{ new Date(venda.data).toLocaleString('pt-BR') }}</td>
                  <td class="py-2"><Badge variant="outline">{{ venda.status }}</Badge></td>
                  <td class="py-2">{{ getPaymentMethodLabel(venda.PagamentoVendas?.metodo) }}</td>
                  <td class="py-2 text-right">{{ formatCurrencyBR(venda.valor || 0) }}</td>
                  <td class="py-2 text-right">
                    <Button type="button" variant="outline" size="sm" @click="abrirDetalhesVenda(venda.id)">
                      <Eye class="h-4 w-4" />
                      Detalhes
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="rounded-md border bg-card p-3">
          <h3 class="mb-2 text-sm font-semibold">Movimentos</h3>
          <div v-if="!caixaSelecionado.movimentos.length" class="py-6 text-center text-sm text-muted-foreground">
            Nenhum movimento registrado neste caixa.
          </div>
          <div v-if="caixaSelecionado.movimentos.length" class="space-y-2 md:hidden">
            <article
              v-for="movimento in caixaSelecionado.movimentos"
              :key="movimento.id"
              class="rounded-md border bg-background p-3"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold">{{ movimento.descricao || movimento.tipo }}</p>
                  <p class="text-xs text-muted-foreground">{{ new Date(movimento.createdAt).toLocaleString('pt-BR') }}</p>
                </div>
                <span class="text-sm font-semibold">{{ formatCurrencyBR(movimento.valor || 0) }}</span>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div class="rounded-md bg-muted/40 p-2">
                  <span class="block text-muted-foreground">Tipo</span>
                  <strong>{{ movimento.tipo }}</strong>
                </div>
                <div class="rounded-md bg-muted/40 p-2">
                  <span class="block text-muted-foreground">Metodo</span>
                  <strong>{{ getPaymentMethodLabel(movimento.metodoPagamento) }}</strong>
                </div>
              </div>
              <Button
                v-if="movimento.vendaId"
                type="button"
                variant="outline"
                size="sm"
                class="mt-3 w-full"
                @click="abrirDetalhesVenda(movimento.vendaId)"
              >
                <Eye class="h-4 w-4" />
                Ver venda
              </Button>
            </article>
          </div>
          <div v-if="caixaSelecionado.movimentos.length" class="hidden max-h-72 overflow-auto md:block">
            <table class="w-full min-w-[660px] text-sm">
              <thead class="border-b text-left text-xs text-muted-foreground">
                <tr>
                  <th class="py-2">Data</th>
                  <th class="py-2">Tipo</th>
                  <th class="py-2">Metodo</th>
                  <th class="py-2">Descricao</th>
                  <th class="py-2 text-right">Valor</th>
                  <th class="py-2 text-right">Venda</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="movimento in caixaSelecionado.movimentos" :key="movimento.id" class="border-b last:border-b-0">
                  <td class="py-2">{{ new Date(movimento.createdAt).toLocaleString('pt-BR') }}</td>
                  <td class="py-2">{{ movimento.tipo }}</td>
                  <td class="py-2">{{ getPaymentMethodLabel(movimento.metodoPagamento) }}</td>
                  <td class="py-2">{{ movimento.descricao || '-' }}</td>
                  <td class="py-2 text-right">{{ formatCurrencyBR(movimento.valor || 0) }}</td>
                  <td class="py-2 text-right">
                    <Button
                      v-if="movimento.vendaId"
                      type="button"
                      variant="outline"
                      size="sm"
                      @click="abrirDetalhesVenda(movimento.vendaId)"
                    >
                      <Eye class="h-4 w-4" />
                    </Button>
                    <span v-else class="text-xs text-muted-foreground">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </ModalView>
    <MobileBottomBar v-if="storeUi.isMobile">
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="openModalFiltros = true">
        <Filter class="h-5 w-5" />
        <span class="text-xs">Filtros</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="applyPreset('today'); carregarRelatorio()">
        <CalendarDays class="h-5 w-5" />
        <span class="text-xs">Hoje</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="applyPreset('current-month'); carregarRelatorio()">
        <HandCoins class="h-5 w-5" />
        <span class="text-xs">Mes</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="carregarRelatorio">
        <RefreshCcw class="h-5 w-5" />
        <span class="text-xs">Atualizar</span>
      </button>
    </MobileBottomBar>
    <DetalhesVenda />
  </div>
</template>
