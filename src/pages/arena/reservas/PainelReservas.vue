<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
} from 'date-fns'
import {
  CalendarCheck2,
  CircleDollarSign,
  Clock,
  Copy,
  Link2,
  LoaderCircle,
  MapPinned,
  RefreshCcw,
  TicketCheck,
  Users,
} from 'lucide-vue-next'
import { ArenaReservasRepository } from '@/repositories/reservas-repository'
import { ArenaQuadrasRepository } from '@/repositories/quadras-repository'
import type { ArenaAgendamentos, ArenaAgendamentoStatus, ArenaQuadras } from '@/types/schemas'
import { formatCurrencyBR } from '@/utils/formatters'
import { useUiStore } from '@/stores/ui/uiStore'
import { HashGenerator } from '@/utils/generators'

const toast = useToast()
const uiStore = useUiStore()

// Link público de reserva (mesmo do modo arena): clientes reservam horários online.
const linkReservaPublica = computed(() => {
  const id = uiStore.contaInfo?.id
  if (!id) return ''
  return `${window.location.origin}/agendamento/${HashGenerator.encode(id)}`
})

function copiarLinkReserva() {
  if (!linkReservaPublica.value) return
  navigator.clipboard.writeText(linkReservaPublica.value)
  toast.success('Link de reserva copiado!')
}

type Periodo = 'hoje' | 'semana' | 'mes'

const loading = ref(false)
const periodo = ref<Periodo>('mes')
const reservas = ref<ArenaAgendamentos[]>([])
const quadras = ref<ArenaQuadras[]>([])

const periodos: { value: Periodo; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Próximos 7 dias' },
  { value: 'mes', label: 'Este mês' },
]

function intervaloAtual() {
  const agora = new Date()
  if (periodo.value === 'hoje') {
    return { inicio: startOfDay(agora), fim: endOfDay(agora) }
  }
  if (periodo.value === 'semana') {
    return { inicio: startOfDay(agora), fim: endOfDay(new Date(agora.getTime() + 6 * 86400000)) }
  }
  return { inicio: startOfMonth(agora), fim: endOfMonth(agora) }
}

function asArray<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

async function carregar() {
  try {
    loading.value = true
    const { inicio, fim } = intervaloAtual()
    const [reservasResp, quadrasResp] = await Promise.all([
      ArenaReservasRepository.get(undefined, undefined, inicio.toISOString(), fim.toISOString()),
      ArenaQuadrasRepository.get(),
    ])
    reservas.value = asArray<ArenaAgendamentos>(reservasResp)
    quadras.value = asArray<ArenaQuadras>(quadrasResp)
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar o painel de reservas.')
  } finally {
    loading.value = false
  }
}

function selecionarPeriodo(value: Periodo) {
  if (periodo.value === value) return
  periodo.value = value
  carregar()
}

function valorReserva(r: ArenaAgendamentos) {
  return Number(r.valor || 0)
}

function duracaoHoras(r: ArenaAgendamentos) {
  const inicio = new Date(r.startAt).getTime()
  const fim = new Date(r.endAt).getTime()
  if (!Number.isFinite(inicio) || !Number.isFinite(fim) || fim <= inicio) return 0
  return (fim - inicio) / 3600000
}

const naoCanceladas = computed(() => reservas.value.filter((r) => r.status !== 'CANCELADA'))

const totais = computed(() => {
  const porStatus: Record<ArenaAgendamentoStatus, number> = {
    PENDENTE: 0,
    CONFIRMADA: 0,
    CANCELADA: 0,
    BLOQUEADO: 0,
    FINALIZADA: 0,
  }
  for (const r of reservas.value) {
    porStatus[r.status] = (porStatus[r.status] ?? 0) + 1
  }
  const receitaConfirmada = reservas.value
    .filter((r) => r.status === 'CONFIRMADA' || r.status === 'FINALIZADA')
    .reduce((total, r) => total + valorReserva(r), 0)
  const receitaPrevista = naoCanceladas.value.reduce((total, r) => total + valorReserva(r), 0)

  return {
    total: naoCanceladas.value.length,
    porStatus,
    receitaConfirmada,
    receitaPrevista,
  }
})

const reservasHoje = computed(() => {
  const inicio = startOfDay(new Date()).getTime()
  const fim = endOfDay(new Date()).getTime()
  return naoCanceladas.value.filter((r) => {
    const t = new Date(r.startAt).getTime()
    return t >= inicio && t <= fim
  }).length
})

const proximasReservas = computed(() => {
  const agora = Date.now()
  return naoCanceladas.value
    .filter((r) => new Date(r.startAt).getTime() >= agora)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 8)
})

const ocupacaoPorQuadra = computed(() => {
  const mapa = new Map<number, { nome: string; reservas: number; horas: number; receita: number }>()
  for (const q of quadras.value) {
    if (q.id != null) mapa.set(q.id, { nome: q.name, reservas: 0, horas: 0, receita: 0 })
  }
  for (const r of naoCanceladas.value) {
    const id = r.quadraId
    if (id == null) continue
    const atual =
      mapa.get(id) || { nome: r.Quadra?.name || `Quadra ${id}`, reservas: 0, horas: 0, receita: 0 }
    atual.reservas += 1
    atual.horas += duracaoHoras(r)
    atual.receita += valorReserva(r)
    mapa.set(id, atual)
  }
  const linhas = [...mapa.values()].sort((a, b) => b.reservas - a.reservas)
  const maxReservas = Math.max(1, ...linhas.map((l) => l.reservas))
  return linhas.map((l) => ({ ...l, percentual: Math.round((l.reservas / maxReservas) * 100) }))
})

const statusResumo = computed(() => {
  const s = totais.value.porStatus
  return [
    { key: 'CONFIRMADA', label: 'Confirmadas', valor: s.CONFIRMADA, classe: 'bg-emerald-500' },
    { key: 'PENDENTE', label: 'Pendentes', valor: s.PENDENTE, classe: 'bg-amber-500' },
    { key: 'FINALIZADA', label: 'Finalizadas', valor: s.FINALIZADA, classe: 'bg-blue-500' },
    { key: 'BLOQUEADO', label: 'Bloqueadas', valor: s.BLOQUEADO, classe: 'bg-slate-500' },
    { key: 'CANCELADA', label: 'Canceladas', valor: s.CANCELADA, classe: 'bg-red-500' },
  ]
})

const totalStatus = computed(() =>
  statusResumo.value.reduce((total, item) => total + item.valor, 0),
)

const statusBadgeClass: Record<ArenaAgendamentoStatus, string> = {
  CONFIRMADA: 'bg-emerald-500/15 text-emerald-500',
  PENDENTE: 'bg-amber-500/15 text-amber-500',
  FINALIZADA: 'bg-blue-500/15 text-blue-500',
  BLOQUEADO: 'bg-slate-500/15 text-slate-400',
  CANCELADA: 'bg-red-500/15 text-red-500',
}

const statusLabel: Record<ArenaAgendamentoStatus, string> = {
  CONFIRMADA: 'Confirmada',
  PENDENTE: 'Pendente',
  FINALIZADA: 'Finalizada',
  BLOQUEADO: 'Bloqueada',
  CANCELADA: 'Cancelada',
}

function nomeCliente(r: ArenaAgendamentos) {
  return r.Cliente?.nome || r.nomeCliente || 'Sem cliente'
}

function nomeQuadra(r: ArenaAgendamentos) {
  return r.Quadra?.name || (r.quadraId != null ? `Quadra ${r.quadraId}` : 'Quadra')
}

function formatarData(value: Date | string) {
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function formatarHora(value: Date | string) {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

onMounted(carregar)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div class="space-y-1">
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <CalendarCheck2 class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Painel de reservas
        </h2>
        <p class="text-sm text-muted-foreground">
          Visão detalhada das reservas: ocupação por quadra, próximos agendamentos e receita do período.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex rounded-lg border border-border/70 bg-card/80 p-1">
          <button
            v-for="opt in periodos"
            :key="opt.value"
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            :class="periodo === opt.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="selecionarPeriodo(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg border border-border/70 bg-card/80 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          @click="carregar"
        >
          <RefreshCcw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" />
          Atualizar
        </button>
      </div>
    </div>

    <!-- Link de reserva pública -->
    <div v-if="linkReservaPublica" class="rounded-2xl border border-border/70 bg-card/70 p-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="min-w-0">
          <div class="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Link2 class="h-4 w-4 text-primary" /> Link de reserva pública
          </div>
          <p class="mt-1 text-xs text-muted-foreground">
            Envie para os clientes reservarem horários online, com pagamento e confirmação automática.
          </p>
        </div>
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-sm text-primary transition-colors hover:bg-background"
          @click="copiarLinkReserva"
        >
          <Copy class="h-4 w-4 shrink-0" />
          <span class="max-w-[16rem] truncate">{{ linkReservaPublica }}</span>
        </button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <div class="rounded-2xl border border-border/70 bg-card/70 p-4">
        <div class="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <TicketCheck class="h-4 w-4" /> Reservas
        </div>
        <div class="mt-2 text-2xl font-bold text-foreground">{{ totais.total }}</div>
        <div class="text-xs text-muted-foreground">{{ reservasHoje }} para hoje</div>
      </div>

      <div class="rounded-2xl border border-border/70 bg-card/70 p-4">
        <div class="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <CalendarCheck2 class="h-4 w-4" /> Confirmadas
        </div>
        <div class="mt-2 text-2xl font-bold text-emerald-500">{{ totais.porStatus.CONFIRMADA }}</div>
        <div class="text-xs text-muted-foreground">{{ totais.porStatus.PENDENTE }} pendentes</div>
      </div>

      <div class="rounded-2xl border border-border/70 bg-card/70 p-4">
        <div class="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <CircleDollarSign class="h-4 w-4" /> Receita confirmada
        </div>
        <div class="mt-2 text-2xl font-bold text-foreground">{{ formatCurrencyBR(totais.receitaConfirmada) }}</div>
        <div class="text-xs text-muted-foreground">Prevista: {{ formatCurrencyBR(totais.receitaPrevista) }}</div>
      </div>

      <div class="rounded-2xl border border-border/70 bg-card/70 p-4">
        <div class="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <MapPinned class="h-4 w-4" /> Quadras
        </div>
        <div class="mt-2 text-2xl font-bold text-foreground">{{ quadras.length }}</div>
        <div class="text-xs text-muted-foreground">{{ ocupacaoPorQuadra.filter((q) => q.reservas > 0).length }} com reservas</div>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center rounded-2xl border border-border/70 p-10">
      <LoaderCircle class="h-6 w-6 animate-spin text-primary" />
    </div>

    <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <!-- Próximas reservas -->
      <section class="rounded-2xl border border-border/70 bg-card/70 p-4">
        <div class="mb-3 flex items-center gap-2">
          <Clock class="h-4 w-4 text-primary" />
          <h3 class="text-sm font-semibold text-foreground">Próximas reservas</h3>
        </div>

        <div v-if="!proximasReservas.length" class="py-8 text-center text-sm text-muted-foreground">
          Nenhuma reserva futura no período selecionado.
        </div>

        <ul v-else class="space-y-2">
          <li
            v-for="r in proximasReservas"
            :key="r.id"
            class="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="truncate text-sm font-medium text-foreground">{{ nomeQuadra(r) }}</span>
                <span :class="['rounded-full px-2 py-0.5 text-[10px] font-semibold', statusBadgeClass[r.status]]">
                  {{ statusLabel[r.status] }}
                </span>
              </div>
              <div class="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Users class="h-3 w-3" /> <span class="truncate">{{ nomeCliente(r) }}</span>
              </div>
            </div>
            <div class="shrink-0 text-right">
              <div class="text-sm font-semibold text-foreground">
                {{ formatarData(r.startAt) }} · {{ formatarHora(r.startAt) }}
              </div>
              <div class="text-xs text-muted-foreground">{{ formatCurrencyBR(valorReserva(r)) }}</div>
            </div>
          </li>
        </ul>
      </section>

      <div class="space-y-4">
        <!-- Ocupação por quadra -->
        <section class="rounded-2xl border border-border/70 bg-card/70 p-4">
          <div class="mb-3 flex items-center gap-2">
            <MapPinned class="h-4 w-4 text-primary" />
            <h3 class="text-sm font-semibold text-foreground">Ocupação por quadra</h3>
          </div>

          <div v-if="!ocupacaoPorQuadra.length" class="py-6 text-center text-sm text-muted-foreground">
            Nenhuma quadra cadastrada.
          </div>

          <div v-else class="space-y-3">
            <div v-for="q in ocupacaoPorQuadra" :key="q.nome" class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="truncate font-medium text-foreground">{{ q.nome }}</span>
                <span class="text-muted-foreground">
                  {{ q.reservas }} reserva(s) · {{ q.horas.toFixed(1) }}h · {{ formatCurrencyBR(q.receita) }}
                </span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-border/60">
                <div class="h-full rounded-full bg-primary" :style="{ width: q.percentual + '%' }" />
              </div>
            </div>
          </div>
        </section>

        <!-- Distribuição por status -->
        <section class="rounded-2xl border border-border/70 bg-card/70 p-4">
          <div class="mb-3 flex items-center gap-2">
            <TicketCheck class="h-4 w-4 text-primary" />
            <h3 class="text-sm font-semibold text-foreground">Distribuição por status</h3>
          </div>

          <div class="space-y-2">
            <div v-for="item in statusResumo" :key="item.key" class="flex items-center gap-3">
              <span :class="['h-2.5 w-2.5 rounded-full', item.classe]" />
              <span class="w-24 text-xs text-muted-foreground">{{ item.label }}</span>
              <div class="h-2 flex-1 overflow-hidden rounded-full bg-border/60">
                <div
                  class="h-full rounded-full"
                  :class="item.classe"
                  :style="{ width: (totalStatus ? (item.valor / totalStatus) * 100 : 0) + '%' }"
                />
              </div>
              <span class="w-8 text-right text-xs font-semibold text-foreground">{{ item.valor }}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
