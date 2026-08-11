<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { endOfDay, endOfMonth, format, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns'
import { useToast } from 'vue-toastification'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import BarChart from '@/components/graficos/BarChart.vue'
import LineChart from '@/components/graficos/LineChart.vue'
import PieChart from '@/components/graficos/PieChart.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RestauranteRepository, type RestaurantePainel } from '@/repositories/restaurante-repository'
import { formatCurrencyBR, formatPaymentMethodLabel } from '@/utils/formatters'
import { colorTheme } from '@/utils/theme'
import { Bike, CalendarRange, ChefHat, CircleDollarSign, Clock3, CreditCard, Filter, Package, ReceiptText, RefreshCw, ShoppingBag, Store, TrendingUp, XCircle } from 'lucide-vue-next'

const toast = useToast()
const loading = ref(true)
const openModalFiltros = ref(false)
const painel = ref<RestaurantePainel | null>(null)
const filtroPeriodo = ref<[Date, Date]>([startOfMonth(new Date()), endOfMonth(new Date())])
const presetAtivo = ref('month')
const presets = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'month', label: 'Este mês' },
  { key: 'last-month', label: 'Mês passado' },
]
const PALETTE = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4']

function themeColor(name: string, alpha?: number) {
  if (typeof document === 'undefined') return '#2563EB'
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value ? (alpha != null ? `hsl(${value} / ${alpha})` : `hsl(${value})`) : '#2563EB'
}
const primary = computed(() => { void colorTheme.value; return themeColor('--primary') })
const primarySoft = computed(() => { void colorTheme.value; return themeColor('--primary', 0.16) })
const tickColor = computed(() => colorTheme.value === 'dark' ? '#cbd5e1' : '#475569')
const gridColor = computed(() => colorTheme.value === 'dark' ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.22)')
const filtroLabel = computed(() => `${filtroPeriodo.value[0].toLocaleDateString('pt-BR')} — ${filtroPeriodo.value[1].toLocaleDateString('pt-BR')}`)

const cards = computed(() => {
  if (!painel.value) return []
  const { resumo, operacao } = painel.value
  return [
    { titulo: 'Faturamento', valor: formatCurrencyBR(resumo.faturamento), detalhe: `${resumo.pedidos} pedido(s) no período`, icone: CircleDollarSign, cor: 'emerald' },
    { titulo: 'Ticket médio', valor: formatCurrencyBR(resumo.ticketMedio), detalhe: 'por pedido não cancelado', icone: ReceiptText, cor: 'blue' },
    { titulo: 'Produção média', valor: minutes(operacao.tempoMedioProducaoMinutos), detalhe: `${operacao.pedidosComTempoProducao} pedido(s) medidos`, icone: ChefHat, cor: 'violet' },
    { titulo: 'Cancelamentos', valor: `${resumo.taxaCancelamento}%`, detalhe: `${resumo.cancelamentos} pedido(s) cancelado(s)`, icone: XCircle, cor: 'amber' },
  ]
})
const corMap: Record<string, string> = {
  emerald: 'text-emerald-600 bg-emerald-500/10', blue: 'text-blue-600 bg-blue-500/10',
  violet: 'text-violet-600 bg-violet-500/10', amber: 'text-amber-600 bg-amber-500/10',
}
const serieChart = computed(() => ({
  labels: (painel.value?.vendasPorDia || []).map((item) => format(new Date(`${item.data}T12:00:00`), 'dd/MM')),
  datasets: [{ label: 'Faturamento', data: painel.value?.vendasPorDia.map((item) => item.valor) || [], borderColor: primary.value, backgroundColor: primarySoft.value, fill: true, tension: 0.35, borderWidth: 2, pointRadius: 2, pointHoverRadius: 5 }],
}))
const pagamentoChart = computed(() => ({ labels: painel.value?.formasPagamento.map((item) => formatPaymentMethodLabel(item.metodo)) || [], datasets: [{ data: painel.value?.formasPagamento.map((item) => item.valor) || [], backgroundColor: PALETTE, borderWidth: 0 }] }))
const canaisChart = computed(() => ({ labels: painel.value?.canais.map((item) => channelName(item.origem)) || [], datasets: [{ label: 'Faturamento', data: painel.value?.canais.map((item) => item.valor) || [], backgroundColor: primary.value, borderRadius: 6 }] }))
const lineOptions = computed(() => ({ responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context: any) => ` ${formatCurrencyBR(context.parsed.y ?? 0)}` } } }, scales: { y: { ticks: { color: tickColor.value, callback: (value: number) => `R$ ${Number(value).toLocaleString('pt-BR')}` }, grid: { color: gridColor.value }, beginAtZero: true }, x: { ticks: { color: tickColor.value, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }, grid: { display: false } } } }))
const barOptions = computed(() => ({ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context: any) => ` ${formatCurrencyBR(context.parsed.y ?? 0)}` } } }, scales: { y: { ticks: { color: tickColor.value, callback: (value: number) => `R$ ${Number(value).toLocaleString('pt-BR')}` }, grid: { color: gridColor.value }, beginAtZero: true }, x: { ticks: { color: tickColor.value }, grid: { display: false } } } }))
const doughnutOptions = computed(() => ({ responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context: any) => ` ${context.label}: ${formatCurrencyBR(context.parsed)}` } } } }))
const temPagamento = computed(() => (painel.value?.formasPagamento || []).some((item) => item.valor > 0))
const temCanais = computed(() => (painel.value?.canais || []).some((item) => item.valor > 0))

function minutes(value: number | null) { return value === null ? '—' : `${Math.round(value)} min` }
function channelName(value: string) { return ({ DELIVERY: 'Delivery', RETIRADA: 'Retirada', MESA: 'Salão' } as Record<string, string>)[value] || value }
function maxValor(items: Array<{ quantidade: number }>) { return Math.max(1, ...items.map((item) => item.quantidade)) }
async function carregar() {
  try {
    loading.value = true
    const [inicio, fim] = filtroPeriodo.value
    painel.value = await RestauranteRepository.painel({ inicio: inicio.toISOString(), fim: fim.toISOString() })
  } catch (error: any) { toast.error(error.response?.data?.error?.message || 'Erro ao carregar o painel do restaurante') } finally { loading.value = false }
}
function applyPreset(preset: string) {
  presetAtivo.value = preset
  const now = new Date()
  if (preset === 'today') filtroPeriodo.value = [startOfDay(now), endOfDay(now)]
  else if (preset === '7d') filtroPeriodo.value = [startOfDay(subDays(now, 6)), endOfDay(now)]
  else if (preset === '30d') filtroPeriodo.value = [startOfDay(subDays(now, 29)), endOfDay(now)]
  else if (preset === 'month') filtroPeriodo.value = [startOfMonth(now), endOfMonth(now)]
  else if (preset === 'last-month') { const month = subMonths(now, 1); filtroPeriodo.value = [startOfMonth(month), endOfMonth(month)] }
  carregar()
}
function aplicarCustom() { presetAtivo.value = 'custom'; openModalFiltros.value = false; carregar() }
onMounted(carregar)
</script>

<template>
  <div class="space-y-4 pb-24 md:pb-4">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground"><Store class="h-6 w-6 text-primary" :stroke-width="2.5" />Painel do restaurante</h2>
        <p class="flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarRange class="h-3.5 w-3.5" />{{ filtroLabel }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex flex-wrap items-center rounded-lg border border-border bg-card p-1"><button v-for="item in presets" :key="item.key" type="button" class="rounded-md px-3 py-1.5 text-xs font-medium transition" :class="presetAtivo === item.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'" @click="applyPreset(item.key)">{{ item.label }}</button></div>
        <Button variant="outline" size="sm" @click="openModalFiltros = true"><Filter class="h-4 w-4" />Período</Button>
        <Button variant="outline" size="icon" class="h-9 w-9" :disabled="loading" @click="carregar"><RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" /></Button>
      </div>
    </div>

    <section v-if="loading" class="grid grid-cols-2 gap-4 lg:grid-cols-4"><Skeleton v-for="item in 4" :key="item" class="h-[132px] rounded-xl" /></section>
    <section v-else class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card v-for="(kpi, index) in cards" :key="index" class="rounded-xl transition hover:shadow-md"><CardContent class="p-4"><div class="flex items-center justify-between"><div class="rounded-lg p-2" :class="corMap[kpi.cor]"><component :is="kpi.icone" class="h-5 w-5" /></div></div><p class="mt-3 text-sm text-muted-foreground">{{ kpi.titulo }}</p><p class="text-2xl font-bold tracking-tight text-foreground">{{ kpi.valor }}</p><p class="mt-0.5 truncate text-xs text-muted-foreground">{{ kpi.detalhe }}</p></CardContent></Card>
    </section>

    <section v-if="!loading && painel" class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="flex items-center gap-3 rounded-xl border border-border bg-card p-4"><div class="rounded-lg bg-sky-500/10 p-2 text-sky-600"><ShoppingBag class="h-5 w-5" /></div><div><p class="text-xs text-muted-foreground">Pedidos em aberto</p><p class="text-lg font-bold">{{ painel.resumo.pedidosEmAberto }}</p><p class="text-xs text-muted-foreground">aguardando conclusão</p></div></div>
      <div class="flex items-center gap-3 rounded-xl border border-border bg-card p-4"><div class="rounded-lg bg-amber-500/10 p-2 text-amber-600"><Clock3 class="h-5 w-5" /></div><div><p class="text-xs text-muted-foreground">Retirada pelo entregador</p><p class="text-lg font-bold">{{ minutes(painel.operacao.tempoMedioRetiradaMinutos) }}</p><p class="text-xs text-muted-foreground">tempo médio até a retirada</p></div></div>
      <div class="flex items-center gap-3 rounded-xl border border-border bg-card p-4"><div class="rounded-lg bg-emerald-500/10 p-2 text-emerald-600"><Bike class="h-5 w-5" /></div><div><p class="text-xs text-muted-foreground">Entrega média</p><p class="text-lg font-bold">{{ minutes(painel.operacao.tempoMedioEntregaMinutos) }}</p><p class="text-xs text-muted-foreground">{{ painel.operacao.entregasConcluidas }} entrega(s) medida(s)</p></div></div>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div class="rounded-xl border border-border bg-card p-4 xl:col-span-2"><div class="mb-4 flex items-center gap-2"><TrendingUp class="h-5 w-5 text-primary" /><h3 class="font-semibold">Curva de faturamento</h3></div><Skeleton v-if="loading" class="h-72 w-full rounded-lg" /><div v-else-if="painel?.vendasPorDia.length" class="h-72"><LineChart :data="serieChart" :options="lineOptions" /></div><div v-else class="flex h-72 items-center justify-center text-sm text-muted-foreground">Sem vendas no período</div></div>
      <div class="rounded-xl border border-border bg-card p-4"><div class="mb-4 flex items-center gap-2"><CreditCard class="h-5 w-5 text-primary" /><h3 class="font-semibold">Formas de pagamento</h3></div><Skeleton v-if="loading" class="h-72 w-full rounded-lg" /><template v-else-if="temPagamento"><div class="h-56"><PieChart :data="pagamentoChart" :options="doughnutOptions" /></div><div class="mt-3 flex flex-wrap gap-x-4 gap-y-1"><span v-for="(label, index) in pagamentoChart.labels" :key="label" class="flex items-center gap-1.5 text-xs"><i class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: PALETTE[index % PALETTE.length] }" />{{ label }}</span></div></template><div v-else class="flex h-56 items-center justify-center text-sm text-muted-foreground">Sem pagamentos no período</div></div>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div class="rounded-xl border border-border bg-card p-4"><div class="mb-4 flex items-center gap-2"><Store class="h-5 w-5 text-primary" /><h3 class="font-semibold">Pedidos por canal</h3></div><Skeleton v-if="loading" class="h-60 w-full rounded-lg" /><div v-else-if="temCanais" class="h-60"><BarChart :data="canaisChart" :options="barOptions" /></div><div v-else class="flex h-60 items-center justify-center text-sm text-muted-foreground">Sem pedidos no período</div></div>
      <div class="rounded-xl border border-border bg-card p-4 xl:col-span-2"><div class="mb-4 flex items-center gap-2"><Package class="h-5 w-5 text-primary" /><h3 class="font-semibold">Top produtos</h3></div><Skeleton v-if="loading" class="h-60 w-full rounded-lg" /><template v-else><div v-if="!painel?.produtosMaisVendidos.length" class="flex h-48 items-center justify-center text-sm text-muted-foreground">Sem itens vendidos</div><ul v-else class="space-y-3"><li v-for="(item, index) in painel.produtosMaisVendidos" :key="item.nome" class="space-y-1"><div class="flex items-center justify-between gap-2 text-sm"><span class="flex min-w-0 items-center gap-2"><span class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{{ index + 1 }}</span><span class="truncate font-medium">{{ item.nome }}</span></span><span class="shrink-0 font-semibold">{{ formatCurrencyBR(item.faturamento) }}</span></div><div class="flex items-center gap-2"><div class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div class="h-full rounded-full bg-primary" :style="{ width: `${(item.quantidade / maxValor(painel.produtosMaisVendidos)) * 100}%` }" /></div><span class="shrink-0 text-xs text-muted-foreground">{{ item.quantidade }} un</span></div></li></ul></template></div>
    </section>

    <ModalView v-model:open="openModalFiltros" title="Período personalizado" size="lg"><div class="grid gap-4 p-4"><div class="space-y-2"><label class="text-sm font-medium">Atalhos rápidos</label><div class="flex flex-wrap gap-2"><Button v-for="item in presets" :key="item.key" type="button" variant="outline" size="sm" @click="applyPreset(item.key); openModalFiltros = false">{{ item.label }}</Button></div></div><div class="space-y-2"><label class="text-sm font-medium">Intervalo de datas</label><Calendarpicker v-model="filtroPeriodo" class="w-full" :range="true" /></div><div class="flex justify-end gap-2"><Button variant="outline" @click="openModalFiltros = false">Cancelar</Button><Button @click="aplicarCustom"><Filter class="h-4 w-4" />Aplicar</Button></div></div></ModalView>
  </div>
</template>
