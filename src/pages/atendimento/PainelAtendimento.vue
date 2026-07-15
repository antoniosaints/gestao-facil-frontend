<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import LineChart from '@/components/graficos/LineChart.vue'
import PieChart from '@/components/graficos/PieChart.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useToast } from 'vue-toastification'
import { endOfDay, endOfMonth, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns'
import { WhatsAppRepository, type PainelAtendimento } from '@/repositories/whatsapp-repository'
import { colorTheme } from '@/utils/theme'
import { formatDuracaoMs } from '@/utils/formatters'
import { goTo } from '@/hooks/links'
import {
  ArrowDownRight, ArrowUpRight, Bot, CalendarRange, CheckCheck, Clock, Filter, Headset,
  Hourglass, Inbox, MessageSquare, Minus, RefreshCw, Timer, TriangleAlert, Users,
} from 'lucide-vue-next'

const toast = useToast()
const loading = ref(true)
const openModalFiltros = ref(false)
const filtroPeriodo = ref<[Date, Date]>([startOfMonth(new Date()), endOfMonth(new Date())])
const presetAtivo = ref<string>('month')
const painel = ref<PainelAtendimento | null>(null)

const presets = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'month', label: 'Este mês' },
  { key: 'last-month', label: 'Mês passado' },
]

const PALETTE = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B']
const STATUS_CORES = ['#F59E0B', '#2563EB', '#10B981']

function themeColor(name: string, alpha?: number) {
  if (typeof document === 'undefined') return '#2563EB'
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!value) return '#2563EB'
  return alpha != null ? `hsl(${value} / ${alpha})` : `hsl(${value})`
}

const tickColor = computed(() => (colorTheme.value === 'dark' ? '#cbd5e1' : '#475569'))
const gridColor = computed(() =>
  colorTheme.value === 'dark' ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.22)',
)

const corMap: Record<string, string> = {
  amber: 'bg-amber-500/10 text-amber-600',
  blue: 'bg-blue-500/10 text-blue-600',
  emerald: 'bg-emerald-500/10 text-emerald-600',
  violet: 'bg-violet-500/10 text-violet-600',
  sky: 'bg-sky-500/10 text-sky-600',
  rose: 'bg-rose-500/10 text-rose-600',
}

const cards = computed(() => {
  const k = painel.value?.kpis
  if (!k) return []
  return [
    {
      titulo: 'Tempo médio de espera',
      valor: formatDuracaoMs(k.tempoMedioEsperaMs.atual),
      delta: k.tempoMedioEsperaMs.delta,
      // Em tempo, subir é ruim: invertemos a leitura da cor.
      inverterDelta: true,
      detalhe: 'da fila até alguém assumir',
      icone: Hourglass,
      cor: 'amber',
    },
    {
      titulo: 'Tempo médio de resolução',
      valor: formatDuracaoMs(k.tempoMedioResolucaoMs.atual),
      delta: k.tempoMedioResolucaoMs.delta,
      inverterDelta: true,
      detalhe: 'de assumir até finalizar',
      icone: Timer,
      cor: 'violet',
    },
    {
      titulo: 'Atendimentos finalizados',
      valor: String(k.atendimentosFinalizados.atual),
      delta: k.atendimentosFinalizados.delta,
      detalhe: `${k.atendimentosAssumidos.atual} assumidos no período`,
      icone: CheckCheck,
      cor: 'emerald',
    },
    {
      titulo: 'Respostas de atendente',
      valor: String(k.respostasAtendente.atual),
      delta: k.respostasAtendente.delta,
      detalhe: `${k.respostasIa.atual} respondidas pela IA`,
      icone: Headset,
      cor: 'blue',
    },
  ]
})

function deltaInfo(delta?: number, inverter = false) {
  const v = Math.round(delta ?? 0)
  const bom = inverter ? v < 0 : v > 0
  const ruim = inverter ? v > 0 : v < 0
  if (v === 0) return { label: '0%', cls: 'text-muted-foreground bg-muted', icon: Minus }
  const icon = v > 0 ? ArrowUpRight : ArrowDownRight
  if (bom) return { label: `${v > 0 ? '+' : ''}${v}%`, cls: 'text-emerald-600 bg-emerald-500/10', icon }
  if (ruim) return { label: `${v > 0 ? '+' : ''}${v}%`, cls: 'text-rose-600 bg-rose-500/10', icon }
  return { label: `${v}%`, cls: 'text-muted-foreground bg-muted', icon: Minus }
}

const lineOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: { legend: { display: true, labels: { color: tickColor.value, boxWidth: 10 } } },
  scales: {
    x: { ticks: { color: tickColor.value, maxRotation: 0, autoSkipPadding: 16 }, grid: { display: false } },
    y: { beginAtZero: true, ticks: { color: tickColor.value, precision: 0 }, grid: { color: gridColor.value } },
  },
}))

const pieOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const, labels: { color: tickColor.value, boxWidth: 10 } } },
}))

const volumeData = computed(() => {
  const s = painel.value?.serieVolume
  if (!s) return { labels: [], datasets: [] }
  return {
    labels: s.labels,
    datasets: [
      {
        label: 'Recebidas',
        data: s.recebidas,
        borderColor: '#2563EB',
        backgroundColor: themeColor('--primary', 0.16),
        tension: 0.35,
        fill: true,
      },
      { label: 'Enviadas', data: s.enviadas, borderColor: '#10B981', backgroundColor: 'transparent', tension: 0.35 },
    ],
  }
})

const statusData = computed(() => {
  const d = painel.value?.distribuicaoStatus
  if (!d) return { labels: [], datasets: [] }
  return { labels: d.labels, datasets: [{ data: d.data, backgroundColor: STATUS_CORES }] }
})

const origemData = computed(() => {
  const d = painel.value?.distribuicaoOrigem
  if (!d) return { labels: [], datasets: [] }
  return { labels: d.labels, datasets: [{ data: d.data, backgroundColor: PALETTE }] }
})

const filaOrdenada = computed(() => painel.value?.filaAtual ?? [])
const maxMensagens = computed(() =>
  Math.max(1, ...(painel.value?.produtividade ?? []).map((p) => p.assumidas + p.mensagens)),
)

const filtroLabel = computed(() => {
  const [i, f] = filtroPeriodo.value
  return `${i.toLocaleDateString('pt-BR')} — ${f.toLocaleDateString('pt-BR')}`
})

async function carregar() {
  try {
    loading.value = true
    const [inicio, fim] = filtroPeriodo.value
    painel.value = await WhatsAppRepository.getPainel(inicio.toISOString(), fim.toISOString())
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar o painel de atendimento')
  } finally {
    loading.value = false
  }
}

function applyPreset(preset: string) {
  presetAtivo.value = preset
  const now = new Date()
  if (preset === 'today') filtroPeriodo.value = [startOfDay(now), endOfDay(now)]
  else if (preset === '7d') filtroPeriodo.value = [startOfDay(subDays(now, 6)), endOfDay(now)]
  else if (preset === '30d') filtroPeriodo.value = [startOfDay(subDays(now, 29)), endOfDay(now)]
  else if (preset === 'month') filtroPeriodo.value = [startOfMonth(now), endOfMonth(now)]
  else if (preset === 'last-month') {
    const lm = subMonths(now, 1)
    filtroPeriodo.value = [startOfMonth(lm), endOfMonth(lm)]
  }
  carregar()
}

function aplicarCustom() {
  presetAtivo.value = 'custom'
  openModalFiltros.value = false
  carregar()
}

function abrirConversa(conversaId: number) {
  goTo(`/atendimento?conversa=${conversaId}`)
}

onMounted(carregar)
</script>

<template>
  <div class="space-y-4 pb-24 md:pb-4">
    <!-- Cabeçalho -->
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Headset class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Painel de atendimento
        </h2>
        <p class="text-sm text-muted-foreground flex items-center gap-1.5">
          <CalendarRange class="h-3.5 w-3.5" /> {{ filtroLabel }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex flex-wrap items-center rounded-lg border border-border bg-card p-1">
          <button v-for="p in presets" :key="p.key" type="button" @click="applyPreset(p.key)"
            class="rounded-md px-3 py-1.5 text-xs font-medium transition"
            :class="presetAtivo === p.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'">
            {{ p.label }}
          </button>
        </div>
        <Button variant="outline" size="sm" @click="openModalFiltros = true">
          <Filter class="h-4 w-4" /> Período
        </Button>
        <Button variant="outline" size="icon" class="h-9 w-9" :disabled="loading" @click="carregar">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
      </div>
    </div>

    <!-- Estado agora: independente do período, é o que exige ação imediata -->
    <section v-if="loading" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Skeleton v-for="i in 4" :key="i" class="h-[92px] rounded-xl" />
    </section>
    <section v-else-if="painel" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card class="rounded-xl border-amber-500/30 bg-amber-500/5">
        <CardContent class="flex items-center gap-3 p-4">
          <div class="rounded-lg bg-amber-500/10 p-2 text-amber-600"><Inbox class="h-5 w-5" /></div>
          <div class="min-w-0">
            <p class="text-xs text-muted-foreground">Na fila agora</p>
            <p class="text-2xl font-bold leading-tight">{{ painel.agora.naFila }}</p>
          </div>
        </CardContent>
      </Card>
      <Card class="rounded-xl">
        <CardContent class="flex items-center gap-3 p-4">
          <div class="rounded-lg bg-blue-500/10 p-2 text-blue-600"><MessageSquare class="h-5 w-5" /></div>
          <div class="min-w-0">
            <p class="text-xs text-muted-foreground">Em atendimento</p>
            <p class="text-2xl font-bold leading-tight">{{ painel.agora.emAtendimento }}</p>
          </div>
        </CardContent>
      </Card>
      <Card class="rounded-xl">
        <CardContent class="flex items-center gap-3 p-4">
          <div class="rounded-lg bg-rose-500/10 p-2 text-rose-600"><Clock class="h-5 w-5" /></div>
          <div class="min-w-0">
            <p class="text-xs text-muted-foreground">Maior espera</p>
            <p class="text-2xl font-bold leading-tight">{{ formatDuracaoMs(painel.agora.esperaMaiorMs) }}</p>
          </div>
        </CardContent>
      </Card>
      <Card class="rounded-xl">
        <CardContent class="flex items-center gap-3 p-4">
          <div class="rounded-lg bg-violet-500/10 p-2 text-violet-600"><Users class="h-5 w-5" /></div>
          <div class="min-w-0">
            <p class="text-xs text-muted-foreground">Mensagens não lidas</p>
            <p class="text-2xl font-bold leading-tight">{{ painel.agora.naoLidas }}</p>
          </div>
        </CardContent>
      </Card>
    </section>

    <!-- KPIs do período -->
    <section v-if="loading" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Skeleton v-for="i in 4" :key="i" class="h-[132px] rounded-xl" />
    </section>
    <section v-else-if="painel" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card v-for="(kpi, i) in cards" :key="i" class="rounded-xl transition hover:shadow-md">
        <CardContent class="p-4">
          <div class="flex items-start justify-between">
            <div class="rounded-lg p-2" :class="corMap[kpi.cor]">
              <component :is="kpi.icone" class="h-5 w-5" />
            </div>
            <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
              :class="deltaInfo(kpi.delta, kpi.inverterDelta).cls">
              <component :is="deltaInfo(kpi.delta, kpi.inverterDelta).icon" class="h-3 w-3" />
              {{ deltaInfo(kpi.delta, kpi.inverterDelta).label }}
            </span>
          </div>
          <p class="mt-3 text-sm text-muted-foreground">{{ kpi.titulo }}</p>
          <p class="text-2xl font-bold tracking-tight text-foreground">{{ kpi.valor }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground truncate">{{ kpi.detalhe }}</p>
        </CardContent>
      </Card>
    </section>

    <!-- Volume e distribuições -->
    <section v-if="loading" class="grid gap-4 lg:grid-cols-3">
      <Skeleton class="h-[320px] rounded-xl lg:col-span-2" />
      <Skeleton class="h-[320px] rounded-xl" />
    </section>
    <section v-else-if="painel" class="grid gap-4 lg:grid-cols-3">
      <Card class="rounded-xl lg:col-span-2">
        <CardContent class="p-4">
          <p class="text-sm font-semibold text-foreground">Volume de mensagens</p>
          <p class="mb-3 text-xs text-muted-foreground">Recebidas do cliente vs. enviadas pela conta</p>
          <div class="h-[260px]">
            <LineChart :data="volumeData" :options="lineOptions" />
          </div>
        </CardContent>
      </Card>
      <Card class="rounded-xl">
        <CardContent class="p-4">
          <p class="text-sm font-semibold text-foreground">Conversas por status</p>
          <p class="mb-3 text-xs text-muted-foreground">Estado atual da base</p>
          <div class="h-[260px]">
            <PieChart :data="statusData" :options="pieOptions" />
          </div>
        </CardContent>
      </Card>
    </section>

    <!-- Fila atual + produtividade -->
    <section v-if="!loading && painel" class="grid gap-4 lg:grid-cols-3">
      <Card class="rounded-xl lg:col-span-2">
        <CardContent class="p-4">
          <div class="mb-3 flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-foreground">Fila de espera</p>
              <p class="text-xs text-muted-foreground">Quem está aguardando atendimento agora</p>
            </div>
            <span class="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600">
              {{ filaOrdenada.length }}
            </span>
          </div>

          <div v-if="!filaOrdenada.length" class="flex flex-col items-center gap-2 py-10 text-center">
            <CheckCheck class="h-8 w-8 text-emerald-500" />
            <p class="text-sm font-medium">Nenhuma conversa esperando</p>
            <p class="text-xs text-muted-foreground">A fila está zerada.</p>
          </div>

          <div v-else class="max-h-[320px] space-y-1 overflow-y-auto">
            <button v-for="c in filaOrdenada" :key="c.conversaId" type="button"
              @click="abrirConversa(c.conversaId)"
              class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-muted">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-foreground">{{ c.contato }}</p>
                <p class="truncate text-xs text-muted-foreground">{{ c.ultimaMensagem || c.telefone }}</p>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <span v-if="c.naoLidas" class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {{ c.naoLidas }}
                </span>
                <span class="inline-flex items-center gap-1 text-xs font-semibold"
                  :class="(c.esperandoMs ?? 0) > 3_600_000 ? 'text-rose-600' : 'text-muted-foreground'">
                  <Clock class="h-3 w-3" /> {{ formatDuracaoMs(c.esperandoMs) }}
                </span>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card class="rounded-xl">
        <CardContent class="p-4">
          <p class="text-sm font-semibold text-foreground">Produtividade</p>
          <p class="mb-3 text-xs text-muted-foreground">Por atendente, no período</p>

          <div v-if="!painel.produtividade.length" class="flex flex-col items-center gap-2 py-10 text-center">
            <Users class="h-8 w-8 text-muted-foreground" />
            <p class="text-sm font-medium">Sem atendimentos no período</p>
          </div>

          <div v-else class="space-y-3">
            <div v-for="p in painel.produtividade" :key="p.atendenteId">
              <div class="flex items-center justify-between text-xs">
                <span class="truncate font-medium text-foreground">{{ p.nome }}</span>
                <span class="shrink-0 text-muted-foreground">{{ p.finalizadas }} finalizados</span>
              </div>
              <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div class="h-full rounded-full bg-primary"
                  :style="{ width: `${((p.assumidas + p.mensagens) / maxMensagens) * 100}%` }" />
              </div>
              <p class="mt-0.5 text-[11px] text-muted-foreground">
                {{ p.assumidas }} assumidos · {{ p.mensagens }} mensagens
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>

    <!-- Origem das mensagens -->
    <section v-if="!loading && painel" class="grid gap-4 lg:grid-cols-3">
      <Card class="rounded-xl">
        <CardContent class="p-4">
          <p class="text-sm font-semibold text-foreground">Quem respondeu</p>
          <p class="mb-3 text-xs text-muted-foreground">Distribuição por origem no período</p>
          <div class="h-[240px]">
            <PieChart :data="origemData" :options="pieOptions" />
          </div>
        </CardContent>
      </Card>

      <Card class="rounded-xl lg:col-span-2">
        <CardContent class="flex h-full flex-col justify-center gap-3 p-4">
          <div class="flex items-center gap-3">
            <div class="rounded-lg bg-violet-500/10 p-2 text-violet-600"><Bot class="h-5 w-5" /></div>
            <div>
              <p class="text-sm text-muted-foreground">Respondidas pelo agente de IA</p>
              <p class="text-xl font-bold">
                {{ painel.kpis.respostasIa.atual }}
                <span class="text-xs font-normal text-muted-foreground">
                  de {{ painel.kpis.respostasIa.atual + painel.kpis.respostasAtendente.atual }} respostas
                </span>
              </p>
            </div>
          </div>

          <!-- Mensagens gravadas antes da instrumentação não têm origem: dizer isso é melhor do
               que silenciosamente somá-las a uma das fatias. -->
          <div v-if="painel.distribuicaoOrigem.semOrigem"
            class="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <TriangleAlert class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p class="text-xs text-muted-foreground">
              {{ painel.distribuicaoOrigem.semOrigem }} mensagem(ns) do período são anteriores ao registro de
              origem e ficam fora desta distribuição — não é possível saber se partiram de um atendente ou do
              agente de IA.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>

    <!-- Filtro de período customizado -->
    <ModalView v-model:open="openModalFiltros" title="Filtrar período" size="lg">
      <div class="space-y-4">
        <Calendarpicker class="w-full" :range="true" v-model="filtroPeriodo" />
        <div class="flex justify-end gap-2">
          <Button variant="outline" size="sm" @click="openModalFiltros = false">Cancelar</Button>
          <Button size="sm" @click="aplicarCustom">Aplicar</Button>
        </div>
      </div>
    </ModalView>
  </div>
</template>
