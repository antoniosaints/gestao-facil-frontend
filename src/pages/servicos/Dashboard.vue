<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from 'vue-toastification'
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgePlus,
  CalendarRange,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Filter,
  Minus,
  RefreshCw,
  ReceiptText,
  TrendingUp,
  Undo2,
  UserRoundCheck,
  UsersRound,
  Wrench,
} from 'lucide-vue-next'
import Calendario from '@/components/calendario/Calendario.vue'
import type { CalendarEvent } from '@/components/calendario/types'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import LineChart from '@/components/graficos/LineChart.vue'
import PieChart from '@/components/graficos/PieChart.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  OrdensServicoRepository,
  type OrdemServicoStatus,
  type PainelOrdensServico,
} from '@/repositories/os-repository'
import { useOrdemServicoStore } from '@/stores/servicos/useOrdensServicos'
import { useUiStore } from '@/stores/ui/uiStore'
import type { OrdensServico } from '@/types/schemas'
import { formatCurrencyBR } from '@/utils/formatters'
import { goBack, goTo } from '@/hooks/links'
import OrdemServicoModal from './modais/OrdemServicoModal.vue'
import ModalDetalhesOrdem from './os/ModalDetalhesOrdem.vue'
import ModalFaturarOs from './os/ModalFaturarOs.vue'
import GerarCobranca from '@/pages/financeiro/lancamentos/modais/GerarCobranca.vue'

const toast = useToast()
const osStore = useOrdemServicoStore()
const uiStore = useUiStore()
const loading = ref(true)
const loadingCalendar = ref(true)
const openModalFiltros = ref(false)
const painel = ref<PainelOrdensServico | null>(null)
const eventos = ref<OrdensServico[]>([])
const dataSelecionada = ref(new Date())
const filtroPeriodo = ref<[Date, Date]>([startOfMonth(new Date()), endOfMonth(new Date())])
const presetAtivo = ref('month')

const presets = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'month', label: 'Este mês' },
  { key: 'last-month', label: 'Mês passado' },
]

const statusLabel: Record<OrdemServicoStatus, string> = {
  ABERTA: 'Aberta',
  ORCAMENTO: 'Orçamento',
  APROVADA: 'Aprovada',
  ANDAMENTO: 'Em andamento',
  FATURADA: 'Faturada',
  CANCELADA: 'Cancelada',
}

const statusClass: Record<OrdemServicoStatus, string> = {
  ABERTA: 'bg-blue-500',
  ORCAMENTO: 'bg-amber-500',
  APROVADA: 'bg-violet-500',
  ANDAMENTO: 'bg-cyan-500',
  FATURADA: 'bg-emerald-500',
  CANCELADA: 'bg-rose-500',
}

const palette = ['#2563EB', '#F59E0B', '#8B5CF6', '#06B6D4', '#10B981', '#EF4444']

const filtroLabel = computed(() => {
  const [inicio, fim] = filtroPeriodo.value
  return `${inicio.toLocaleDateString('pt-BR')} — ${fim.toLocaleDateString('pt-BR')}`
})

const cards = computed(() => {
  if (!painel.value) return []
  const kpis = painel.value.kpis
  return [
    {
      titulo: 'Valor das ordens',
      valor: formatCurrencyBR(kpis.valorOrdens.atual),
      delta: kpis.valorOrdens.delta,
      detalhe: 'ordens válidas no período',
      icon: ClipboardList,
      color: 'text-blue-600 bg-blue-500/10',
    },
    {
      titulo: 'Total faturado',
      valor: formatCurrencyBR(kpis.faturado.atual),
      delta: kpis.faturado.delta,
      detalhe: 'ordens efetivadas',
      icon: CircleDollarSign,
      color: 'text-emerald-600 bg-emerald-500/10',
    },
    {
      titulo: 'Ticket médio',
      valor: formatCurrencyBR(kpis.ticketMedio.atual),
      delta: kpis.ticketMedio.delta,
      detalhe: 'valor médio por OS',
      icon: ReceiptText,
      color: 'text-violet-600 bg-violet-500/10',
    },
    {
      titulo: 'Ordens registradas',
      valor: String(kpis.quantidade.atual),
      delta: kpis.quantidade.delta,
      detalhe: 'desconsiderando canceladas',
      icon: Wrench,
      color: 'text-cyan-600 bg-cyan-500/10',
    },
  ]
})

function deltaInfo(delta: number) {
  const value = Math.round(delta || 0)
  if (value > 0) return { label: `+${value}%`, class: 'bg-emerald-500/10 text-emerald-600', icon: ArrowUpRight }
  if (value < 0) return { label: `${value}%`, class: 'bg-rose-500/10 text-rose-600', icon: ArrowDownRight }
  return { label: '0%', class: 'bg-muted text-muted-foreground', icon: Minus }
}

const lineData = computed(() => ({
  labels: painel.value?.serie.map((item) =>
    format(new Date(`${item.data}T12:00:00`), 'dd MMM', { locale: ptBR }),
  ) || [],
  datasets: [
    {
      label: 'Valor das ordens',
      data: painel.value?.serie.map((item) => item.valor) || [],
      borderColor: '#2563EB',
      backgroundColor: 'rgba(37, 99, 235, 0.12)',
      fill: true,
      tension: 0.35,
      borderWidth: 2,
      pointRadius: 2,
    },
    {
      label: 'Faturado',
      data: painel.value?.serie.map((item) => item.faturado) || [],
      borderColor: '#10B981',
      backgroundColor: 'transparent',
      tension: 0.35,
      borderWidth: 2,
      pointRadius: 2,
    },
  ],
}))

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'bottom' },
    tooltip: { callbacks: { label: (context: any) => ` ${context.dataset.label}: ${formatCurrencyBR(context.parsed.y)}` } },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { callback: (value: number) => `R$ ${Number(value).toLocaleString('pt-BR')}` },
    },
    x: { grid: { display: false } },
  },
} as any

const statusData = computed(() => ({
  labels: painel.value?.distribuicaoStatus.map((item) => statusLabel[item.status]) || [],
  datasets: [{
    data: painel.value?.distribuicaoStatus.map((item) => item.total) || [],
    backgroundColor: palette,
    borderWidth: 0,
  }],
}))

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: { legend: { display: false } },
} as any

const hasStatus = computed(() =>
  (painel.value?.distribuicaoStatus || []).some((item) => item.total > 0),
)

function maxValue(items: Array<{ valor: number }>) {
  return Math.max(1, ...items.map((item) => item.valor))
}

async function carregarPainel() {
  loading.value = true
  try {
    const [inicio, fim] = filtroPeriodo.value
    painel.value = await OrdensServicoRepository.getPainel(inicio.toISOString(), fim.toISOString())
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível carregar o painel de serviços.')
  } finally {
    loading.value = false
  }
}

async function carregarEventos() {
  loadingCalendar.value = true
  try {
    const response = await OrdensServicoRepository.getEventos(
      startOfMonth(dataSelecionada.value).toISOString(),
      endOfMonth(dataSelecionada.value).toISOString(),
    )
    eventos.value = response.data
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível carregar o calendário de serviços.')
  } finally {
    loadingCalendar.value = false
  }
}

function applyPreset(preset: string) {
  presetAtivo.value = preset
  const now = new Date()
  if (preset === 'today') filtroPeriodo.value = [startOfDay(now), endOfDay(now)]
  else if (preset === '7d') filtroPeriodo.value = [startOfDay(subDays(now, 6)), endOfDay(now)]
  else if (preset === '30d') filtroPeriodo.value = [startOfDay(subDays(now, 29)), endOfDay(now)]
  else if (preset === 'month') filtroPeriodo.value = [startOfMonth(now), endOfMonth(now)]
  else {
    const previousMonth = subMonths(now, 1)
    filtroPeriodo.value = [startOfMonth(previousMonth), endOfMonth(previousMonth)]
  }
  void carregarPainel()
}

function aplicarCustom() {
  presetAtivo.value = 'custom'
  openModalFiltros.value = false
  void carregarPainel()
}

function abrirCriacao(date?: Date) {
  osStore.openSave()
  if (date) osStore.form.data = date
}

function abrirEvento(event: CalendarEvent) {
  if (event.id) void osStore.openDetalhes(Number(event.id))
}

watch(dataSelecionada, carregarEventos)
watch(() => osStore.filters.update, () => {
  void Promise.all([carregarPainel(), carregarEventos()])
})

onMounted(() => {
  void Promise.all([carregarPainel(), carregarEventos()])
})
</script>

<template>
  <div class="space-y-4 pb-24 md:pb-4">
    <header class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Wrench class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Painel de serviços
        </h2>
        <p class="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarRange class="h-3.5 w-3.5" />
          {{ filtroLabel }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex flex-wrap items-center rounded-lg border bg-card p-1">
          <button
            v-for="preset in presets"
            :key="preset.key"
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-medium transition"
            :class="presetAtivo === preset.key
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'"
            @click="applyPreset(preset.key)"
          >
            {{ preset.label }}
          </button>
        </div>
        <Button variant="outline" size="sm" @click="openModalFiltros = true">
          <Filter class="h-4 w-4" /> Período
        </Button>
        <Button variant="outline" size="icon" class="h-9 w-9" :disabled="loading" @click="carregarPainel">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
        <Button class="hidden md:flex" @click="abrirCriacao()">
          <BadgePlus class="h-4 w-4" /> Nova OS
        </Button>
      </div>
    </header>

    <section v-if="loading" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Skeleton v-for="item in 4" :key="item" class="h-[132px] rounded-xl" />
    </section>
    <section v-else class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card v-for="card in cards" :key="card.titulo" class="rounded-xl transition hover:shadow-md">
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <span class="rounded-lg p-2" :class="card.color"><component :is="card.icon" class="h-5 w-5" /></span>
            <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold" :class="deltaInfo(card.delta).class">
              <component :is="deltaInfo(card.delta).icon" class="h-3 w-3" />
              {{ deltaInfo(card.delta).label }}
            </span>
          </div>
          <p class="mt-3 text-sm text-muted-foreground">{{ card.titulo }}</p>
          <p class="text-2xl font-bold tracking-tight">{{ card.valor }}</p>
          <p class="mt-0.5 truncate text-xs text-muted-foreground">{{ card.detalhe }} · vs. anterior</p>
        </CardContent>
      </Card>
    </section>

    <section v-if="!loading && painel" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div class="flex items-center gap-3 rounded-xl border bg-card p-4">
        <span class="rounded-lg bg-cyan-500/10 p-2 text-cyan-600"><Clock3 class="h-5 w-5" /></span>
        <div>
          <p class="text-xs text-muted-foreground">Fila operacional</p>
          <p class="text-lg font-bold">{{ painel.operacao.abertas + painel.operacao.emAndamento }}</p>
          <p class="text-xs text-muted-foreground">{{ painel.operacao.abertas }} abertas · {{ painel.operacao.emAndamento }} em execução</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-xl border bg-card p-4">
        <span class="rounded-lg bg-emerald-500/10 p-2 text-emerald-600"><CheckCircle2 class="h-5 w-5" /></span>
        <div>
          <p class="text-xs text-muted-foreground">Taxa de faturamento</p>
          <p class="text-lg font-bold">{{ painel.operacao.taxaFaturamento.toFixed(1) }}%</p>
          <p class="text-xs text-muted-foreground">{{ painel.operacao.faturadas }} OS faturadas</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-xl border bg-card p-4">
        <span class="rounded-lg bg-violet-500/10 p-2 text-violet-600"><UsersRound class="h-5 w-5" /></span>
        <div>
          <p class="text-xs text-muted-foreground">Clientes atendidos</p>
          <p class="text-lg font-bold">{{ painel.operacao.clientesAtendidos }}</p>
          <p class="text-xs text-muted-foreground">clientes únicos no período</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-xl border bg-card p-4">
        <span class="rounded-lg bg-blue-500/10 p-2 text-blue-600"><Wrench class="h-5 w-5" /></span>
        <div>
          <p class="text-xs text-muted-foreground">Catálogo de serviços</p>
          <p class="text-lg font-bold">{{ painel.operacao.servicosAtivos }}</p>
          <p class="text-xs text-muted-foreground">{{ painel.operacao.orcamentos }} orçamentos · {{ painel.operacao.aprovadas }} aprovadas</p>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div class="rounded-xl border bg-card p-4 xl:col-span-2">
        <div class="mb-4 flex items-center gap-2">
          <TrendingUp class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Evolução das ordens</h3>
        </div>
        <Skeleton v-if="loading" class="h-72 w-full rounded-lg" />
        <div v-else-if="painel?.serie.length" class="h-72">
          <LineChart :data="lineData" :options="lineOptions" />
        </div>
        <div v-else class="flex h-72 items-center justify-center text-sm text-muted-foreground">Sem ordens no período</div>
      </div>

      <div class="rounded-xl border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <ClipboardList class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Distribuição por status</h3>
        </div>
        <Skeleton v-if="loading" class="h-72 w-full rounded-lg" />
        <template v-else-if="hasStatus">
          <div class="h-52"><PieChart :data="statusData" :options="pieOptions" /></div>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <span v-for="item in painel?.distribuicaoStatus" :key="item.status" class="flex items-center gap-1.5 text-xs">
              <i class="h-2.5 w-2.5 rounded-full" :class="statusClass[item.status]" />
              {{ statusLabel[item.status] }}: {{ item.total }}
            </span>
          </div>
        </template>
        <div v-else class="flex h-72 items-center justify-center text-sm text-muted-foreground">Sem dados de status</div>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div class="rounded-xl border bg-card p-4 xl:col-span-2">
        <div class="mb-4 flex items-center gap-2">
          <Clock3 class="h-5 w-5 text-amber-500" />
          <h3 class="font-semibold">Ordens que pedem atenção</h3>
        </div>
        <Skeleton v-if="loading" class="h-64 w-full rounded-lg" />
        <div v-else-if="!painel?.pendentes.length" class="flex h-48 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 class="h-9 w-9 opacity-40" />
          Nenhuma ordem pendente no período
        </div>
        <div v-else class="space-y-2">
          <button
            v-for="ordem in painel.pendentes"
            :key="ordem.id"
            type="button"
            class="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition hover:bg-muted/50"
            @click="osStore.openDetalhes(ordem.id)"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <strong>{{ ordem.uid }}</strong>
                <Badge variant="outline">{{ statusLabel[ordem.status] }}</Badge>
              </div>
              <p class="truncate text-sm">{{ ordem.cliente }} · {{ ordem.descricao || 'Sem descrição' }}</p>
              <p class="text-xs text-muted-foreground">{{ format(new Date(ordem.data), "dd/MM/yyyy 'às' HH:mm") }} · {{ ordem.operador }}</p>
            </div>
            <strong class="shrink-0 text-sm">{{ formatCurrencyBR(ordem.valor) }}</strong>
          </button>
        </div>
      </div>

      <div class="rounded-xl border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <Wrench class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Top serviços</h3>
        </div>
        <Skeleton v-if="loading" class="h-64 w-full rounded-lg" />
        <div v-else-if="!painel?.topServicos.length" class="flex h-48 items-center justify-center text-sm text-muted-foreground">Sem serviços no período</div>
        <ul v-else class="space-y-3">
          <li v-for="(item, index) in painel.topServicos" :key="item.nome" class="space-y-1">
            <div class="flex items-center justify-between gap-2 text-sm">
              <span class="flex min-w-0 items-center gap-2">
                <span class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{{ index + 1 }}</span>
                <span class="truncate">{{ item.nome }}</span>
              </span>
              <strong class="shrink-0">{{ formatCurrencyBR(item.valor) }}</strong>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div class="h-full rounded-full bg-primary" :style="{ width: `${(item.valor / maxValue(painel.topServicos)) * 100}%` }" />
              </div>
              <span class="text-xs text-muted-foreground">{{ item.quantidade }} un</span>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div class="rounded-xl border bg-card p-4">
        <div class="mb-4 flex items-center gap-2">
          <UserRoundCheck class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Equipe em destaque</h3>
        </div>
        <Skeleton v-if="loading" class="h-56 w-full rounded-lg" />
        <div v-else-if="!painel?.topOperadores.length" class="flex h-44 items-center justify-center text-sm text-muted-foreground">Sem técnicos no período</div>
        <ul v-else class="space-y-3">
          <li v-for="(item, index) in painel.topOperadores" :key="item.nome" class="flex items-center gap-3">
            <span class="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{{ index + 1 }}</span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ item.nome }}</p>
              <p class="text-xs text-muted-foreground">{{ item.quantidade }} ordens</p>
            </div>
            <strong class="text-sm">{{ formatCurrencyBR(item.valor) }}</strong>
          </li>
        </ul>
      </div>

      <div class="xl:col-span-2">
        <Calendario
          v-model:selected-date="dataSelecionada"
          :eventos="eventos"
          title="Calendário de serviços"
          :description="loadingCalendar ? 'Atualizando agenda…' : 'Clique em uma ordem para abrir os detalhes'"
          @event-click="abrirEvento"
          @create-event="abrirCriacao"
        />
      </div>
    </section>

    <ModalView v-model:open="openModalFiltros" title="Período personalizado" size="lg">
      <div class="grid gap-4 p-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">Atalhos rápidos</label>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="preset in presets"
              :key="preset.key"
              type="button"
              variant="outline"
              size="sm"
              @click="applyPreset(preset.key); openModalFiltros = false"
            >
              {{ preset.label }}
            </Button>
          </div>
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">Intervalo de datas</label>
          <Calendarpicker v-model="filtroPeriodo" class="w-full" :range="true" />
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="openModalFiltros = false">Cancelar</Button>
          <Button @click="aplicarCustom"><Filter class="h-4 w-4" /> Aplicar</Button>
        </div>
      </div>
    </ModalView>

    <nav
      v-if="uiStore.isMobile"
      class="fixed bottom-0 left-0 z-20 flex h-20 w-full justify-around border-t bg-card pt-4 shadow-lg"
    >
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="goTo('/servicos/os')">
        <ClipboardList />
        <span class="text-xs">Ordens</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="abrirCriacao()">
        <BadgePlus />
        <span class="text-xs">Nova OS</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="goBack">
        <Undo2 />
        <span class="text-xs">Voltar</span>
      </button>
    </nav>

    <OrdemServicoModal />
    <ModalDetalhesOrdem />
    <ModalFaturarOs />
    <GerarCobranca />
  </div>
</template>
