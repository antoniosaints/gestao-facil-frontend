<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { endOfDay, endOfMonth, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns'
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
  Lock,
  MessageCircleMore,
  RefreshCcw,
  RefreshCw,
  Trash2,
  TrendingUp,
} from 'lucide-vue-next'
import BarChart from '@/components/graficos/BarChart.vue'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import DetalhesVenda from '@/pages/vendas/modais/DetalhesVenda.vue'
import ModalDetalhesCaixa from '@/pages/vendas/caixas/ModalDetalhesCaixa.vue'
import ModalFechamentoCaixa from '@/pages/vendas/caixas/ModalFechamentoCaixa.vue'
import PieChart from '@/components/graficos/PieChart.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useConfirm } from '@/composables/useConfirm'
import { optionsChartBarDefault, optionsChartPie } from '@/composables/useChartOptions'
import {
  CaixaRepository,
  type CaixaRelatorioParams,
  type FecharCaixaPayload,
} from '@/repositories/caixa-repository'
import {
  ContaRepository,
  type WhatsAppNotificationInstanceOption,
} from '@/repositories/conta-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { useVendasStore } from '@/stores/vendas/useVenda'
import type { CaixaRelatorioResponse } from '@/types/schemas'
import { formatCurrencyBR, formatPaymentMethodLabel } from '@/utils/formatters'

const toast = useToast()
const confirm = useConfirm()
const storeUi = useUiStore()
const vendasStore = useVendasStore()
const loading = ref(false)
const openModalFiltros = ref(false)
const openModalDetalhes = ref(false)
const filtroPeriodo = ref<[Date, Date]>([startOfMonth(new Date()), endOfMonth(new Date())])
const filtroStatus = ref<'TODOS' | 'ABERTO' | 'FECHADO' | 'CANCELADO'>('TODOS')
const presetAtivo = ref<string>('month')
const page = ref(1)

const presets = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'month', label: 'Este mês' },
  { key: 'last-month', label: 'Mês passado' },
]

const filtroLabel = computed(() => {
  const [i, f] = filtroPeriodo.value
  if (!i || !f) return ''
  return `${i.toLocaleDateString('pt-BR')} — ${f.toLocaleDateString('pt-BR')}`
})
const relatorio = ref<CaixaRelatorioResponse | null>(null)
const caixaSelecionado = ref<CaixaRelatorioResponse['caixas'][number] | null>(null)
const exportingPdfId = ref<number | null>(null)
const deletingCaixaId = ref<number | null>(null)
const whatsappInstances = ref<WhatsAppNotificationInstanceOption[]>([])
const openModalReenvio = ref(false)
const instanciaReenvioId = ref<number | null>(null)
const reenviandoWhatsapp = ref(false)
const connectedInstances = computed(() =>
  whatsappInstances.value.filter((instancia) => instancia.status === 'CONECTADA'),
)
const canResendWhatsapp = computed(() =>
  caixaSelecionado.value?.caixa.status === 'FECHADO' && connectedInstances.value.length > 0,
)
const canDeleteCaixas = computed(() => storeUi.permissoes.admin)
const canCloseCaixas = computed(() => storeUi.permissoes.admin)

const openModalFechar = ref(false)
const caixaParaFechar = ref<CaixaRelatorioResponse['caixas'][number] | null>(null)
const fechandoCaixa = ref(false)

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
    labels: entries.map(([metodo]) => formatPaymentMethodLabel(metodo)),
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
    page: page.value,
    limit: 10,
  }
}

async function carregarRelatorio() {
  try {
    loading.value = true
    relatorio.value = await CaixaRepository.relatorio(buildParams())
    // O backend pode ter feito clamp da página (ex.: filtro reduziu o total).
    page.value = relatorio.value?.pagination?.page ?? 1
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao carregar relatorio de caixas')
  } finally {
    loading.value = false
  }
}

function applyPreset(key: string) {
  const hoje = new Date()
  if (key === 'today') {
    filtroPeriodo.value = [startOfDay(hoje), endOfDay(hoje)]
  } else if (key === '7d') {
    filtroPeriodo.value = [startOfDay(subDays(hoje, 6)), endOfDay(hoje)]
  } else if (key === '30d') {
    filtroPeriodo.value = [startOfDay(subDays(hoje, 29)), endOfDay(hoje)]
  } else if (key === 'month') {
    filtroPeriodo.value = [startOfMonth(hoje), endOfMonth(hoje)]
  } else if (key === 'last-month') {
    const mesPassado = subMonths(hoje, 1)
    filtroPeriodo.value = [startOfMonth(mesPassado), endOfMonth(mesPassado)]
  }
  presetAtivo.value = key
  page.value = 1
  carregarRelatorio()
}

function aplicarCustom() {
  presetAtivo.value = ''
  page.value = 1
  openModalFiltros.value = false
  carregarRelatorio()
}

function irParaPagina(novaPagina: number) {
  const totalPages = relatorio.value?.pagination?.totalPages ?? 1
  const alvo = Math.min(Math.max(novaPagina, 1), totalPages)
  if (alvo === page.value) return
  page.value = alvo
  carregarRelatorio()
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

function abrirFecharCaixa(item: CaixaRelatorioResponse['caixas'][number]) {
  caixaParaFechar.value = item
  openModalFechar.value = true
}

async function confirmarFecharCaixa(payload: Omit<FecharCaixaPayload, 'caixaId'>) {
  if (!caixaParaFechar.value) return
  try {
    fechandoCaixa.value = true
    await CaixaRepository.fecharCaixaGerencial({
      caixaId: caixaParaFechar.value.caixa.id,
      ...payload,
    })
    toast.success('Caixa fechado com sucesso')
    openModalFechar.value = false
    await carregarRelatorio()
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao fechar o caixa')
  } finally {
    fechandoCaixa.value = false
  }
}

async function carregarInstanciasWhatsapp() {
  try {
    whatsappInstances.value = await ContaRepository.listarInstanciasWhatsappNotificacao()
  } catch {
    // Sem permissao ou modulo inativo: apenas oculta o botao de reenvio.
    whatsappInstances.value = []
  }
}

function abrirModalReenvio() {
  instanciaReenvioId.value = connectedInstances.value[0]?.id ?? null
  openModalReenvio.value = true
}

async function reenviarWhatsapp() {
  if (!caixaSelecionado.value || !instanciaReenvioId.value) {
    toast.error('Selecione a instância WhatsApp para o envio')
    return
  }

  try {
    reenviandoWhatsapp.value = true
    const resultado = await CaixaRepository.reenviarWhatsapp(
      caixaSelecionado.value.caixa.id,
      instanciaReenvioId.value,
    )
    toast.success(`Resumo do caixa enviado para ${resultado.recipients} destinatário(s)`)
    openModalReenvio.value = false
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao reenviar resumo via WhatsApp')
  } finally {
    reenviandoWhatsapp.value = false
  }
}

onMounted(() => {
  carregarRelatorio()
  carregarInstanciasWhatsapp()
})
</script>

<template>
  <div class="space-y-4 pb-24 md:pb-0">
    <div class="flex flex-col">
      <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
            <HandCoins class="h-6 w-6 text-primary" />
            Caixas do PDV
          </h2>
          <!-- <p class="text-sm text-muted-foreground">Conferencia operacional de aberturas, vendas e fechamentos.</p> -->
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="hidden flex-wrap items-center rounded-lg border border-border bg-card p-1 md:flex">
            <button v-for="p in presets" :key="p.key" type="button" @click="applyPreset(p.key)"
              class="rounded-md px-3 py-1.5 text-xs font-medium transition"
              :class="presetAtivo === p.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'">
              {{ p.label }}
            </button>
          </div>
          <Button variant="outline" size="sm" @click="openModalFiltros = true">
            <Filter class="h-4 w-4" /> Filtros
          </Button>
          <Button variant="outline" size="icon" v-tooltip="'Atualizar'" :disabled="loading" @click="carregarRelatorio">
            <RefreshCw class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <Badge v-for="item in filtrosAtivos" :key="item" variant="outline" class="text-xs">
          {{ item }}
        </Badge>
      </div>
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

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-6">
      <Card class="rounded-xl shadow xl:col-span-2">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Métodos de pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="hasPaymentChartData" class="grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
            <PieChart class="max-h-52" :data="metodoPagamentoChart" :options="optionsChartPie" />
            <div class="space-y-2">
              <div v-for="(valor, index) in metodoPagamentoChart.datasets[0].data"
                :key="metodoPagamentoChart.labels[index]"
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

      <Card class="rounded-xl shadow xl:col-span-2">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Resumo operacional</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart class="max-h-52" :data="resumoOperacionalChart" :options="optionsChartBarDefault" />
        </CardContent>
      </Card>

      <section class="rounded-md border bg-card p-4 xl:col-span-2">
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
    </section>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <section class="rounded-md border bg-card p-4 xl:col-span-3">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="font-semibold">Caixas</h3>
          <span class="text-xs text-muted-foreground">{{ relatorio?.pagination?.total ?? relatorio?.caixas.length ?? 0
            }} registro(s)</span>
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
                    <Button variant="outline" size="sm" :disabled="exportingPdfId === item.caixa.id"
                      @click="exportarPdf(item.caixa.id)">
                      <FileDown class="h-4 w-4" /> PDF
                    </Button>
                    <Button variant="outline" size="sm" @click="abrirDetalhes(item)">
                      <Eye class="h-4 w-4" /> Detalhes
                    </Button>
                    <Button v-if="canCloseCaixas && item.caixa.status === 'ABERTO'" size="sm" title="Fechar caixa"
                      @click="abrirFecharCaixa(item)">
                      <Lock class="h-4 w-4" /> Fechar
                    </Button>
                    <Button v-if="canDeleteCaixas" variant="destructive" size="sm"
                      :disabled="!canDeleteCaixaItem(item) || deletingCaixaId === item.caixa.id"
                      :title="item.resumo.totalVendas > 0 ? 'Caixas com vendas vinculadas não podem ser apagados.' : 'Apagar caixa'"
                      @click="deletarCaixa(item)">
                      <Trash2 class="h-4 w-4" /> Apagar
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="(relatorio?.pagination?.totalPages || 1) > 1" class="mt-3 flex items-center justify-end gap-2">
          <span class="flex-1 text-xs text-muted-foreground">
            Página {{ relatorio?.pagination?.page || 1 }} de {{ relatorio?.pagination?.totalPages || 1 }}
          </span>
          <Button variant="outline" size="sm" :disabled="loading || (relatorio?.pagination?.page || 1) <= 1"
            @click="irParaPagina((relatorio?.pagination?.page || 1) - 1)">
            Anterior
          </Button>
          <Button variant="outline" size="sm"
            :disabled="loading || (relatorio?.pagination?.page || 1) >= (relatorio?.pagination?.totalPages || 1)"
            @click="irParaPagina((relatorio?.pagination?.page || 1) + 1)">
            Próximo
          </Button>
        </div>
      </section>
    </div>

    <ModalView v-model:open="openModalFiltros" title="Filtros de caixas" size="lg">
      <div class="grid gap-4 p-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">Atalhos rápidos</label>
          <div class="flex flex-wrap gap-2">
            <Button v-for="p in presets" :key="p.key" type="button" variant="outline" size="sm"
              @click="applyPreset(p.key); openModalFiltros = false">
              {{ p.label }}
            </Button>
          </div>
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">Intervalo de datas</label>
          <Calendarpicker class="w-full" :range="true" v-model="filtroPeriodo" />
          <p v-if="filtroLabel" class="text-xs text-muted-foreground">{{ filtroLabel }}</p>
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
          <Button @click="aplicarCustom">
            <Filter class="h-4 w-4" /> Aplicar
          </Button>
        </div>
      </div>
    </ModalView>

    <ModalDetalhesCaixa v-model:open="openModalDetalhes" :caixa="caixaSelecionado"
      :can-resend-whatsapp="canResendWhatsapp"
      :exportando="exportingPdfId !== null && exportingPdfId === caixaSelecionado?.caixa.id"
      @exportar-pdf="exportarPdf" @reenviar-whatsapp="abrirModalReenvio" @ver-venda="abrirDetalhesVenda" />

    <ModalFechamentoCaixa v-model:open="openModalFechar"
      :caixa="caixaParaFechar?.caixa || null"
      :saldo-esperado="Number(caixaParaFechar?.resumo.saldoEsperado || 0)"
      :por-metodo="caixaParaFechar?.resumo.porMetodo || {}"
      :loading="fechandoCaixa"
      observacao-placeholder="Ex.: Fechamento gerencial pelo painel"
      @confirmar="confirmarFecharCaixa" />

    <ModalView v-model:open="openModalReenvio" title="Reenviar resumo via WhatsApp" size="md">
      <div class="grid gap-4 p-4">
        <p class="text-sm text-muted-foreground">
          O resumo completo do caixa <strong>{{ caixaSelecionado?.caixa.codigo }}</strong> será enviado
          para os administradores da conta pela instância selecionada.
        </p>
        <div class="space-y-2">
          <label class="text-sm font-medium">Instância WhatsApp (conectadas)</label>
          <select v-model.number="instanciaReenvioId" class="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option v-for="instancia in connectedInstances" :key="instancia.id" :value="instancia.id">
              {{ instancia.nome }}{{ instancia.numeroConectado ? ` (${instancia.numeroConectado})` : '' }}
            </option>
          </select>
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" :disabled="reenviandoWhatsapp" @click="openModalReenvio = false">Cancelar</Button>
          <Button class="text-white" :disabled="reenviandoWhatsapp || !instanciaReenvioId" @click="reenviarWhatsapp">
            <MessageCircleMore class="h-4 w-4" />
            {{ reenviandoWhatsapp ? 'Enviando...' : 'Confirmar envio' }}
          </Button>
        </div>
      </div>
    </ModalView>
    <MobileBottomBar v-if="storeUi.isMobile">
      <button type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="openModalFiltros = true">
        <Filter class="h-5 w-5" />
        <span class="text-xs">Filtros</span>
      </button>
      <button type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="applyPreset('today')">
        <CalendarDays class="h-5 w-5" />
        <span class="text-xs">Hoje</span>
      </button>
      <button type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="applyPreset('month')">
        <HandCoins class="h-5 w-5" />
        <span class="text-xs">Mes</span>
      </button>
      <button type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="carregarRelatorio">
        <RefreshCcw class="h-5 w-5" />
        <span class="text-xs">Atualizar</span>
      </button>
    </MobileBottomBar>
    <DetalhesVenda />
  </div>
</template>
