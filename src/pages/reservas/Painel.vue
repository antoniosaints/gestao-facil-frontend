<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { endOfDay, endOfMonth, startOfDay, startOfMonth, subDays } from 'date-fns'
import { useToast } from 'vue-toastification'
import BarChart from '@/components/graficos/BarChart.vue'
import PieChart from '@/components/graficos/PieChart.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ReservationsRepository,
  type ReservationsDashboard,
  type ReservationStatus,
} from '@/repositories/reservas-gerais-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  RefreshCw,
  Settings2,
  TicketCheck,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-vue-next'

const toast = useToast()
const loading = ref(true)
const dashboard = ref<ReservationsDashboard | null>(null)
const presetAtivo = ref('month')
const range = ref<[Date, Date]>([startOfMonth(new Date()), endOfMonth(new Date())])

const presets = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'month', label: 'Este mês' },
]

const statusLabel: Record<ReservationStatus, string> = {
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  CONFIRMADA: 'Confirmadas',
  CONCLUIDA: 'Concluídas',
  CANCELADA: 'Canceladas',
  EXPIRADA: 'Expiradas',
}

const statusVariant: Record<ReservationStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  AGUARDANDO_PAGAMENTO: 'secondary',
  CONFIRMADA: 'default',
  CONCLUIDA: 'outline',
  CANCELADA: 'destructive',
  EXPIRADA: 'destructive',
}

const periodoLabel = computed(() => {
  const [inicio, fim] = range.value
  return `${inicio.toLocaleDateString('pt-BR')} — ${fim.toLocaleDateString('pt-BR')}`
})

const cards = computed(() => {
  const kpis = dashboard.value?.kpis
  if (!kpis) return []
  return [
    {
      titulo: 'Reservas no período',
      valor: kpis.totalReservas.toLocaleString('pt-BR'),
      detalhe: `${kpis.reservasValidas.toLocaleString('pt-BR')} reservas válidas`,
      icon: TicketCheck,
      color: 'bg-cyan-500/10 text-cyan-600',
    },
    {
      titulo: 'Taxa de confirmação',
      valor: `${kpis.taxaConfirmacao.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
      detalhe: 'confirmadas ou concluídas',
      icon: TrendingUp,
      color: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      titulo: 'Receita recebida',
      valor: formatCurrencyBR(kpis.receita),
      detalhe: 'pagamentos das reservas do período',
      icon: CircleDollarSign,
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      titulo: 'Ticket médio',
      valor: formatCurrencyBR(kpis.ticketMedio),
      detalhe: 'por reserva confirmada ou concluída',
      icon: WalletCards,
      color: 'bg-violet-500/10 text-violet-600',
    },
  ]
})

const volumeData = computed(() => ({
  labels: (dashboard.value?.serie || []).map((item) => {
    const [year, month, day] = item.data.split('-')
    return `${day}/${month}`
  }),
  datasets: [
    {
      label: 'Reservas',
      data: (dashboard.value?.serie || []).map((item) => item.reservas),
      backgroundColor: '#06b6d4',
      borderRadius: 6,
    },
  ],
}))

const statusData = computed(() => ({
  labels: (dashboard.value?.distribuicaoStatus || []).map((item) => statusLabel[item.status]),
  datasets: [
    {
      data: (dashboard.value?.distribuicaoStatus || []).map((item) => item.total),
      backgroundColor: ['#f59e0b', '#06b6d4', '#10b981', '#ef4444', '#94a3b8'],
    },
  ],
}))

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, ticks: { precision: 0 } },
  },
}

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 10 } } },
}

async function carregar(showFeedback = false) {
  try {
    loading.value = true
    dashboard.value = await ReservationsRepository.getDashboard(
      range.value[0].toISOString(),
      range.value[1].toISOString(),
    )
    if (showFeedback) toast.info('Painel de reservas atualizado')
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível carregar o painel de reservas.')
  } finally {
    loading.value = false
  }
}

function applyPreset(key: string) {
  presetAtivo.value = key
  const now = new Date()
  if (key === 'today') range.value = [startOfDay(now), endOfDay(now)]
  if (key === '7d') range.value = [startOfDay(subDays(now, 6)), endOfDay(now)]
  if (key === '30d') range.value = [startOfDay(subDays(now, 29)), endOfDay(now)]
  if (key === 'month') range.value = [startOfMonth(now), endOfMonth(now)]
  void carregar()
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

onMounted(() => carregar())
</script>

<template>
  <div class="space-y-4 pb-20 md:pb-4">
    <header class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <CalendarCheck2 class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Painel de reservas
        </h2>
        <p class="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays class="h-3.5 w-3.5" /> {{ periodoLabel }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex flex-wrap items-center rounded-lg border border-border bg-card p-1">
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
        <Button variant="outline" size="icon" class="h-9 w-9" :disabled="loading" @click="carregar(true)">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          <span class="sr-only">Atualizar painel</span>
        </Button>
      </div>
    </header>

    <Card class="border-border/70 bg-card shadow-sm">
      <CardContent class="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-sm font-medium text-foreground">Operação de reservas</p>
          <p class="text-xs text-muted-foreground">
            Acompanhe a agenda e acesse rapidamente as tarefas mais frequentes.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <RouterLink to="/reservas/lista?nova=1">
            <Button size="sm" class="gap-2"><CalendarPlus class="h-4 w-4" />Nova reserva</Button>
          </RouterLink>
          <RouterLink to="/reservas/lista">
            <Button size="sm" variant="outline" class="gap-2"><TicketCheck class="h-4 w-4" />Ver reservas</Button>
          </RouterLink>
          <RouterLink to="/reservas/calendario">
            <Button size="sm" variant="outline" class="gap-2"><CalendarClock class="h-4 w-4" />Calendário</Button>
          </RouterLink>
        </div>
      </CardContent>
    </Card>

    <section v-if="loading" class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Skeleton v-for="item in 3" :key="item" class="h-24 rounded-xl" />
    </section>
    <section v-else-if="dashboard" class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card class="rounded-xl border-cyan-500/30 bg-cyan-500/5">
        <CardContent class="flex items-center gap-3 p-4">
          <span class="rounded-lg bg-cyan-500/10 p-2 text-cyan-600"><Clock3 class="h-5 w-5" /></span>
          <div><p class="text-xs text-muted-foreground">Próximas 24 horas</p><p class="text-2xl font-bold">{{ dashboard.agora.proximas24h }}</p></div>
        </CardContent>
      </Card>
      <Card class="rounded-xl border-amber-500/30 bg-amber-500/5">
        <CardContent class="flex items-center gap-3 p-4">
          <span class="rounded-lg bg-amber-500/10 p-2 text-amber-600"><WalletCards class="h-5 w-5" /></span>
          <div><p class="text-xs text-muted-foreground">Aguardando pagamento</p><p class="text-2xl font-bold">{{ dashboard.agora.aguardandoPagamento }}</p></div>
        </CardContent>
      </Card>
      <Card class="rounded-xl border-rose-500/30 bg-rose-500/5">
        <CardContent class="flex items-center gap-3 p-4">
          <span class="rounded-lg bg-rose-500/10 p-2 text-rose-600"><CircleDollarSign class="h-5 w-5" /></span>
          <div><p class="text-xs text-muted-foreground">Valor pendente</p><p class="text-xl font-bold">{{ formatCurrencyBR(dashboard.agora.valorPendente) }}</p></div>
        </CardContent>
      </Card>
    </section>

    <section v-if="loading" class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Skeleton v-for="item in 4" :key="item" class="h-36 rounded-xl" />
    </section>
    <section v-else class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card v-for="card in cards" :key="card.titulo" class="h-full rounded-xl transition hover:shadow-md">
        <CardContent class="p-4">
          <span class="inline-flex rounded-lg p-2" :class="card.color"><component :is="card.icon" class="h-5 w-5" /></span>
          <p class="mt-3 text-xs text-muted-foreground">{{ card.titulo }}</p>
          <p class="text-xl font-bold tracking-tight text-foreground md:text-2xl">{{ card.valor }}</p>
          <p class="mt-1 text-xs text-muted-foreground">{{ card.detalhe }}</p>
        </CardContent>
      </Card>
    </section>

    <section v-if="loading" class="grid gap-4 lg:grid-cols-3">
      <Skeleton class="h-80 rounded-xl lg:col-span-2" />
      <Skeleton class="h-80 rounded-xl" />
    </section>
    <section v-else-if="dashboard" class="grid gap-4 lg:grid-cols-3">
      <Card class="rounded-xl lg:col-span-2">
        <CardHeader><CardTitle class="text-base">Volume de reservas</CardTitle></CardHeader>
        <CardContent>
          <div v-if="dashboard.serie.length" class="h-64"><BarChart :data="volumeData" :options="barOptions" /></div>
          <div v-else class="flex h-64 items-center justify-center text-sm text-muted-foreground">Sem reservas no período selecionado.</div>
        </CardContent>
      </Card>
      <Card class="rounded-xl">
        <CardHeader><CardTitle class="text-base">Reservas por status</CardTitle></CardHeader>
        <CardContent>
          <div v-if="dashboard.kpis.totalReservas" class="h-64"><PieChart :data="statusData" :options="pieOptions" /></div>
          <div v-else class="flex h-64 items-center justify-center text-sm text-muted-foreground">Sem dados para distribuir.</div>
        </CardContent>
      </Card>
    </section>

    <section v-if="loading" class="grid gap-4 lg:grid-cols-3">
      <Skeleton v-for="item in 3" :key="item" class="h-72 rounded-xl" />
    </section>
    <section v-else-if="dashboard" class="grid gap-4 lg:grid-cols-3">
      <Card class="rounded-xl">
        <CardHeader><CardTitle class="text-base">Próximas reservas</CardTitle></CardHeader>
        <CardContent class="space-y-2">
          <RouterLink
            v-for="booking in dashboard.proximas.slice(0, 5)"
            :key="booking.id"
            to="/reservas/lista"
            class="block rounded-lg border border-border/70 bg-muted/10 p-3 transition hover:border-primary/40"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0"><p class="truncate text-sm font-medium">{{ booking.nomeCliente }}</p><p class="truncate text-xs text-muted-foreground">{{ booking.servicoNome }} · {{ booking.recursoNome }}</p></div>
              <Badge :variant="statusVariant[booking.status]">{{ statusLabel[booking.status] }}</Badge>
            </div>
            <p class="mt-2 text-xs font-medium text-primary">{{ dateTime(booking.inicio) }}</p>
          </RouterLink>
          <p v-if="!dashboard.proximas.length" class="py-12 text-center text-sm text-muted-foreground">Nenhuma reserva nas próximas 24 horas.</p>
        </CardContent>
      </Card>

      <Card class="rounded-xl">
        <CardHeader><CardTitle class="text-base">Serviços mais reservados</CardTitle></CardHeader>
        <CardContent class="space-y-3">
          <div v-for="(item, index) in dashboard.topServicos" :key="item.nome" class="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div class="flex min-w-0 items-center gap-3"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{{ index + 1 }}</span><div class="min-w-0"><p class="truncate text-sm font-medium">{{ item.nome }}</p><p class="text-xs text-muted-foreground">{{ formatCurrencyBR(item.receita) }} recebido</p></div></div>
            <span class="text-sm font-semibold">{{ item.reservas }}</span>
          </div>
          <p v-if="!dashboard.topServicos.length" class="py-12 text-center text-sm text-muted-foreground">Sem serviços no período.</p>
        </CardContent>
      </Card>

      <Card class="rounded-xl">
        <CardHeader><CardTitle class="text-base">Estrutura do módulo</CardTitle></CardHeader>
        <CardContent class="space-y-1 flex flex-col">
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl border bg-muted/10 p-3"><Users class="h-4 w-4 text-cyan-600" /><p class="mt-2 text-2xl font-bold">{{ dashboard.configuracao.recursosAtivos }}</p><p class="text-xs text-muted-foreground">recursos ativos</p></div>
            <div class="rounded-xl border bg-muted/10 p-3"><CalendarCheck2 class="h-4 w-4 text-emerald-600" /><p class="mt-2 text-2xl font-bold">{{ dashboard.configuracao.servicosAtivos }}</p><p class="text-xs text-muted-foreground">serviços ativos</p></div>
          </div>
          <div class="rounded-xl border p-3">
            <div class="flex items-center justify-between gap-2"><span class="text-sm font-medium">Página pública</span><Badge :variant="dashboard.configuracao.paginaAtiva ? 'default' : 'secondary'">{{ dashboard.configuracao.paginaAtiva ? 'Ativa' : 'Inativa' }}</Badge></div>
            <a v-if="dashboard.configuracao.paginaAtiva && dashboard.configuracao.slug" :href="`/reservar/${dashboard.configuracao.slug}`" target="_blank" class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"><ExternalLink class="h-4 w-4" />Abrir página pública</a>
          </div>
          <RouterLink to="/reservas/recursos"><Button variant="outline" class="w-full gap-2"><Users class="h-4 w-4" />Recursos e horários</Button></RouterLink>
          <RouterLink to="/reservas/configuracoes"><Button variant="outline" class="w-full gap-2"><Settings2 class="h-4 w-4" />Configurações <ArrowRight class="ml-auto h-4 w-4" /></Button></RouterLink>
        </CardContent>
      </Card>
    </section>
  </div>
</template>
