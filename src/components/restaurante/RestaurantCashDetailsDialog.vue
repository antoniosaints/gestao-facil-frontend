<script setup lang="ts">
import { computed } from 'vue'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Coins,
  CreditCard,
  DoorOpen,
  Inbox,
  Lock,
  QrCode,
  ReceiptText,
  ShoppingCart,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  UserRound,
  UtensilsCrossed,
  Wallet,
} from 'lucide-vue-next'
import ModalView from '@/components/formulario/ModalView.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { RestauranteCaixaContexto } from '@/repositories/restaurante-repository'
import { formatCurrencyBR, formatDuracaoMs, formatPaymentMethodLabel } from '@/utils/formatters'

const props = withDefaults(
  defineProps<{
    contexto: RestauranteCaixaContexto
    loading?: boolean
    podeOperar?: boolean
  }>(),
  { loading: false, podeOperar: true },
)

const emit = defineEmits<{
  sangria: []
  reforco: []
  fechar: []
}>()

const open = defineModel<boolean>('open', { default: false })
const caixa = computed(() => props.contexto.caixa)
const resumo = computed(() => props.contexto.resumo)
const caixaAberto = computed(() => caixa.value.status === 'ABERTO')
const podeOperar = computed(() => caixaAberto.value && props.podeOperar)

const statusVisual = computed(() => {
  if (caixa.value.status === 'ABERTO') {
    return {
      label: 'Aberto',
      icon: DoorOpen,
      classe: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    }
  }
  if (caixa.value.status === 'FECHADO') {
    return {
      label: 'Fechado',
      icon: Lock,
      classe: 'border-muted-foreground/30 bg-muted text-muted-foreground',
    }
  }
  return {
    label: 'Cancelado',
    icon: Lock,
    classe: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400',
  }
})

function formatarDataHora(valor?: string | null) {
  if (!valor) return '-'
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? '-' : data.toLocaleString('pt-BR')
}

const duracaoTurno = computed(() => {
  const inicio = new Date(caixa.value.abertoEm).getTime()
  const fim = caixa.value.fechadoEm ? new Date(caixa.value.fechadoEm).getTime() : Date.now()
  return Number.isNaN(inicio) || Number.isNaN(fim) || fim < inicio
    ? null
    : formatDuracaoMs(fim - inicio)
})

const conferencia = computed(() => {
  const saldoInicial = Number(caixa.value.saldoInicial || 0)
  const reforcos = Number(resumo.value.totalReforcos || 0)
  const sangrias = Number(resumo.value.totalSangrias || 0)
  const esperado = Number(caixa.value.saldoEsperado || 0)
  const contado = caixa.value.saldoContado == null ? null : Number(caixa.value.saldoContado)
  return {
    saldoInicial,
    reforcos,
    sangrias,
    esperado,
    contado,
    diferenca: contado === null ? null : Math.round((contado - esperado) * 100) / 100,
  }
})

const consolidadoTurno = computed(() => {
  const pedidos = Number(resumo.value.totalPedidos || 0)
  const reforcos = Number(resumo.value.totalReforcos || 0)
  const sangrias = Number(resumo.value.totalSangrias || 0)
  return {
    pedidos,
    reforcos,
    sangrias,
    totalLiquido: pedidos + reforcos - sangrias,
  }
})

const diferencaVisual = computed(() => {
  const diferenca = conferencia.value.diferenca
  if (diferenca === null) {
    return {
      icon: Timer,
      titulo: 'Conferência pendente',
      descricao: 'O caixa permanece aberto e aguarda a contagem final.',
      classe: 'border-border bg-muted/40 text-muted-foreground',
      valor: null,
    }
  }
  if (diferenca === 0) {
    return {
      icon: CheckCircle2,
      titulo: 'Caixa conferido',
      descricao: 'O valor contado confere com o esperado.',
      classe: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      valor: formatCurrencyBR(0),
    }
  }
  const sobra = diferenca > 0
  return {
    icon: sobra ? TrendingUp : TrendingDown,
    titulo: sobra ? 'Sobra no caixa' : 'Falta no caixa',
    descricao: sobra
      ? 'Foi contado mais dinheiro que o esperado.'
      : 'Foi contado menos dinheiro que o esperado.',
    classe: sobra
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
      : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400',
    valor: `${sobra ? '+' : '-'} ${formatCurrencyBR(Math.abs(diferenca))}`,
  }
})

function iconMetodo(metodo: string) {
  if (metodo === 'DINHEIRO') return Banknote
  if (metodo === 'PIX') return QrCode
  if (['CARTAO', 'CREDITO', 'DEBITO'].includes(metodo)) return CreditCard
  if (metodo === 'MESA') return UtensilsCrossed
  if (metodo === 'MANUAL') return ReceiptText
  return CircleDollarSign
}

const metodos = computed(() => {
  const items = Object.entries(resumo.value.porMetodo || {})
    .map(([metodo, valor]) => ({ metodo, valor: Number(valor || 0) }))
    .filter((item) => item.valor > 0)
    .sort((a, b) => b.valor - a.valor)
  const total = items.reduce((soma, item) => soma + item.valor, 0)
  return items.map((item) => ({
    ...item,
    icon: iconMetodo(item.metodo),
    label: formatPaymentMethodLabel(item.metodo),
    percentual: total ? (item.valor / total) * 100 : 0,
  }))
})

const indicadores = computed(() => [
  {
    label: 'Entradas em pedidos',
    valor: formatCurrencyBR(resumo.value.totalPedidos),
    detalhe: `${resumo.value.pedidos} pedido(s) no turno`,
    icon: TrendingUp,
    classe: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    label: 'Reforços',
    valor: formatCurrencyBR(resumo.value.totalReforcos),
    detalhe: 'Entradas manuais',
    icon: ArrowDownToLine,
    classe: 'bg-blue-500/10 text-blue-600',
  },
  {
    label: 'Sangrias',
    valor: formatCurrencyBR(resumo.value.totalSangrias),
    detalhe: 'Retiradas manuais',
    icon: ArrowUpFromLine,
    classe: 'bg-amber-500/10 text-amber-600',
  },
  {
    label: 'Numerário esperado',
    valor: formatCurrencyBR(caixa.value.saldoEsperado),
    detalhe: 'Fundo de troco e movimentos',
    icon: Wallet,
    classe: 'bg-primary/10 text-primary',
  },
])

function visualMovimento(tipo: string) {
  const mapa: Record<string, { label: string; icon: any; classe: string; sinal: string }> = {
    ABERTURA: {
      label: 'Abertura',
      icon: DoorOpen,
      classe: 'bg-emerald-500/10 text-emerald-600',
      sinal: '',
    },
    REFORCO: {
      label: 'Reforço',
      icon: ArrowDownToLine,
      classe: 'bg-blue-500/10 text-blue-600',
      sinal: '+',
    },
    SANGRIA: {
      label: 'Sangria',
      icon: ArrowUpFromLine,
      classe: 'bg-amber-500/10 text-amber-600',
      sinal: '-',
    },
    FECHAMENTO: {
      label: 'Fechamento',
      icon: Lock,
      classe: 'bg-muted text-muted-foreground',
      sinal: '',
    },
  }
  return (
    mapa[tipo] || { label: tipo, icon: Coins, classe: 'bg-muted text-muted-foreground', sinal: '' }
  )
}

const movimentos = computed(() =>
  caixa.value.movimentos.map((movimento) => ({
    ...movimento,
    visual: visualMovimento(movimento.tipo),
  })),
)

function statusPedidoClasse(status: string) {
  if (status === 'CANCELADO')
    return 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400'
  if (status === 'CONCLUIDO')
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
  if (status === 'PRONTO') return 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400'
  return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
}
</script>

<template>
  <ModalView
    v-model:open="open"
    :icon="Wallet"
    title="Detalhes do caixa"
    description="Conferência, pedidos vinculados e movimentações do turno."
    size="5xl"
  >
    <div class="grid gap-3 px-3 pb-4 md:gap-4 md:p-4">
      <header class="rounded-xl border bg-card p-4">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div class="flex min-w-0 gap-3">
            <span
              class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
              ><Wallet class="h-6 w-6"
            /></span>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="truncate text-lg font-semibold">{{ caixa.codigo }}</h3>
                <Badge :class="statusVisual.classe"
                  ><component :is="statusVisual.icon" class="mr-1 h-3 w-3" />{{
                    statusVisual.label
                  }}</Badge
                >
              </div>
              <p class="mt-1 text-xs text-muted-foreground">Turno operacional do Restaurante</p>
            </div>
          </div>
          <div v-if="podeOperar" class="flex flex-wrap gap-2">
            <Button variant="outline" :disabled="loading" @click="emit('sangria')"
              ><ArrowUpFromLine class="h-4 w-4" />Sangria</Button
            ><Button variant="outline" :disabled="loading" @click="emit('reforco')"
              ><ArrowDownToLine class="h-4 w-4" />Reforço</Button
            ><Button :disabled="loading" @click="emit('fechar')"
              ><Lock class="h-4 w-4" />Fechar caixa</Button
            >
          </div>
        </div>
        <div class="mt-4 grid gap-2 sm:grid-cols-3">
          <div class="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
            <DoorOpen class="h-4 w-4 shrink-0 text-emerald-600" />
            <div class="min-w-0">
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground">Abertura</p>
              <p class="truncate text-xs font-semibold">{{ formatarDataHora(caixa.abertoEm) }}</p>
              <p class="truncate text-[11px] text-muted-foreground">
                <UserRound class="mr-0.5 inline h-3 w-3" />{{ caixa.abertoPor?.nome || '-' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
            <Lock
              class="h-4 w-4 shrink-0"
              :class="caixaAberto ? 'text-emerald-600' : 'text-muted-foreground'"
            />
            <div class="min-w-0">
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground">Fechamento</p>
              <p class="truncate text-xs font-semibold">
                {{ caixaAberto ? 'Em andamento' : formatarDataHora(caixa.fechadoEm) }}
              </p>
              <p class="truncate text-[11px] text-muted-foreground">
                {{ caixaAberto ? 'Aguardando contagem final' : caixa.fechadoPor?.nome || '-' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
            <Clock3 class="h-4 w-4 shrink-0 text-primary" />
            <div class="min-w-0">
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground">
                Duração do turno
              </p>
              <p class="truncate text-sm font-semibold">{{ duracaoTurno || '—' }}</p>
              <p class="text-[11px] text-muted-foreground">
                {{ caixaAberto ? 'Contando até agora' : 'Turno encerrado' }}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section class="overflow-hidden rounded-xl border border-primary/30 bg-primary/5">
        <div class="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-center">
          <div>
            <div class="flex items-center gap-2">
              <CircleDollarSign class="h-4 w-4 text-primary" />
              <h3 class="text-sm font-semibold">Consolidado do turno</h3>
            </div>
            <p class="mt-1 text-xs text-muted-foreground">
              Pedidos + reforços − sangrias. O fundo de troco não entra neste total.
            </p>
            <div
              class="mt-4 grid grid-cols-3 divide-x rounded-lg border bg-background/70 text-center"
            >
              <div class="px-2 py-2.5">
                <p class="text-[10px] uppercase tracking-wide text-muted-foreground">Pedidos</p>
                <p class="mt-1 text-sm font-semibold tabular-nums text-emerald-600">
                  + {{ formatCurrencyBR(consolidadoTurno.pedidos) }}
                </p>
              </div>
              <div class="px-2 py-2.5">
                <p class="text-[10px] uppercase tracking-wide text-muted-foreground">Reforços</p>
                <p class="mt-1 text-sm font-semibold tabular-nums text-blue-600">
                  + {{ formatCurrencyBR(consolidadoTurno.reforcos) }}
                </p>
              </div>
              <div class="px-2 py-2.5">
                <p class="text-[10px] uppercase tracking-wide text-muted-foreground">Sangrias</p>
                <p class="mt-1 text-sm font-semibold tabular-nums text-amber-600">
                  − {{ formatCurrencyBR(consolidadoTurno.sangrias) }}
                </p>
              </div>
            </div>
          </div>
          <div class="rounded-xl bg-primary p-4 text-primary-foreground shadow-sm">
            <p class="text-xs font-medium opacity-80">Total líquido do turno</p>
            <p class="mt-1 text-3xl font-black tabular-nums">
              {{ formatCurrencyBR(consolidadoTurno.totalLiquido) }}
            </p>
            <p class="mt-2 text-[11px] leading-snug opacity-80">
              Faturamento líquido operacional; não representa lucro, pois custos e despesas não
              estão incluídos.
            </p>
          </div>
        </div>
      </section>

      <section class="rounded-xl border bg-card p-4">
        <div class="mb-3 flex items-center gap-2">
          <Coins class="h-4 w-4 text-primary" />
          <h3 class="text-sm font-semibold">Conferência da gaveta</h3>
          <span class="ml-auto text-[11px] text-muted-foreground">Numerário do turno</span>
        </div>
        <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div class="overflow-hidden rounded-lg border">
            <div class="flex items-center justify-between gap-3 border-b px-3 py-2 text-sm">
              <span class="flex items-center gap-2 text-muted-foreground"
                ><Wallet class="h-4 w-4" />Fundo de troco</span
              ><strong>{{ formatCurrencyBR(conferencia.saldoInicial) }}</strong>
            </div>
            <div class="flex items-center justify-between gap-3 border-b px-3 py-2 text-sm">
              <span class="flex items-center gap-2 text-muted-foreground"
                ><ArrowDownToLine class="h-4 w-4 text-blue-600" />Reforços</span
              ><strong class="text-blue-600">+ {{ formatCurrencyBR(conferencia.reforcos) }}</strong>
            </div>
            <div class="flex items-center justify-between gap-3 border-b px-3 py-2 text-sm">
              <span class="flex items-center gap-2 text-muted-foreground"
                ><ArrowUpFromLine class="h-4 w-4 text-amber-600" />Sangrias</span
              ><strong class="text-amber-600"
                >- {{ formatCurrencyBR(conferencia.sangrias) }}</strong
              >
            </div>
            <div
              class="flex items-center justify-between gap-3 border-b bg-muted/40 px-3 py-2.5 text-sm"
            >
              <span class="flex items-center gap-2 font-semibold"
                ><Target class="h-4 w-4 text-primary" />Esperado na gaveta</span
              ><strong>{{ formatCurrencyBR(conferencia.esperado) }}</strong>
            </div>
            <div class="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <span class="flex items-center gap-2 font-semibold"
                ><Coins class="h-4 w-4 text-primary" />Contado no fechamento</span
              ><strong>{{
                conferencia.contado === null ? '—' : formatCurrencyBR(conferencia.contado)
              }}</strong>
            </div>
          </div>
          <div
            class="flex flex-col justify-center gap-2 rounded-lg border p-4 text-center"
            :class="diferencaVisual.classe"
          >
            <component :is="diferencaVisual.icon" class="mx-auto h-7 w-7" />
            <p class="text-sm font-bold">{{ diferencaVisual.titulo }}</p>
            <p v-if="diferencaVisual.valor" class="text-2xl font-black">
              {{ diferencaVisual.valor }}
            </p>
            <p class="text-[11px] leading-snug opacity-90">{{ diferencaVisual.descricao }}</p>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        <div
          v-for="indicador in indicadores"
          :key="indicador.label"
          class="rounded-xl border bg-card p-3"
        >
          <div class="flex items-center gap-2">
            <span
              class="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
              :class="indicador.classe"
              ><component :is="indicador.icon" class="h-4 w-4"
            /></span>
            <p class="truncate text-[11px] font-medium text-muted-foreground">
              {{ indicador.label }}
            </p>
          </div>
          <p class="mt-2 truncate text-lg font-bold tabular-nums">{{ indicador.valor }}</p>
          <p class="truncate text-[11px] text-muted-foreground">{{ indicador.detalhe }}</p>
        </div>
      </section>

      <section class="rounded-xl border bg-card p-4">
        <div class="mb-3 flex items-center gap-2">
          <CreditCard class="h-4 w-4 text-primary" />
          <h3 class="text-sm font-semibold">Entradas por método</h3>
        </div>
        <div
          v-if="!metodos.length"
          class="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground"
        >
          <Inbox class="h-8 w-8 opacity-50" />Nenhuma entrada registrada neste turno.
        </div>
        <div v-else class="grid gap-2 sm:grid-cols-2">
          <div
            v-for="metodo in metodos"
            :key="metodo.metodo"
            class="rounded-lg border bg-background px-3 py-2.5"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="flex items-center gap-2 text-sm font-medium"
                ><component :is="metodo.icon" class="h-4 w-4 text-primary" />{{
                  metodo.label
                }}</span
              ><strong class="tabular-nums">{{ formatCurrencyBR(metodo.valor) }}</strong>
            </div>
            <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full bg-primary transition-all"
                :style="{ width: `${metodo.percentual}%` }"
              />
            </div>
            <p class="mt-1 text-right text-[10px] text-muted-foreground">
              {{ metodo.percentual.toFixed(1) }}% das entradas
            </p>
          </div>
        </div>
      </section>

      <section class="rounded-xl border bg-card p-4">
        <div class="mb-3 flex items-center gap-2">
          <ShoppingCart class="h-4 w-4 text-primary" />
          <h3 class="text-sm font-semibold">Pedidos vinculados</h3>
          <Badge variant="outline" class="ml-auto">{{ caixa.pedidos.length }}</Badge>
        </div>
        <div
          v-if="!caixa.pedidos.length"
          class="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground"
        >
          <Inbox class="h-8 w-8 opacity-50" />Nenhum pedido vinculado a este caixa.
        </div>
        <div v-else class="max-h-72 overflow-auto rounded-lg border">
          <table class="w-full min-w-[630px] text-sm">
            <thead
              class="sticky top-0 border-b bg-muted text-left text-[11px] text-muted-foreground"
            >
              <tr>
                <th class="px-3 py-2">Pedido</th>
                <th class="px-3 py-2">Canal</th>
                <th class="px-3 py-2">Pagamento</th>
                <th class="px-3 py-2">Status</th>
                <th class="px-3 py-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="pedido in caixa.pedidos"
                :key="pedido.id"
                class="border-b last:border-b-0 hover:bg-muted/30"
              >
                <td class="px-3 py-2 font-medium">{{ pedido.codigo }}</td>
                <td class="px-3 py-2 text-muted-foreground">{{ pedido.origem }}</td>
                <td class="px-3 py-2">
                  {{ formatPaymentMethodLabel(pedido.pagamentoMetodoSnapshot) }}
                </td>
                <td class="px-3 py-2">
                  <span
                    class="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                    :class="statusPedidoClasse(pedido.status)"
                    >{{ pedido.status }}</span
                  >
                </td>
                <td class="px-3 py-2 text-right font-semibold tabular-nums">
                  {{ formatCurrencyBR(pedido.total) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-xl border bg-card p-4">
        <div class="mb-3 flex items-center gap-2">
          <Coins class="h-4 w-4 text-primary" />
          <h3 class="text-sm font-semibold">Movimentos do caixa</h3>
          <Badge variant="outline" class="ml-auto">{{ movimentos.length }}</Badge>
        </div>
        <div
          v-if="!movimentos.length"
          class="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground"
        >
          <Inbox class="h-8 w-8 opacity-50" />Nenhuma movimentação registrada neste turno.
        </div>
        <div v-else class="max-h-72 space-y-2 overflow-auto pr-1">
          <article
            v-for="movimento in movimentos"
            :key="movimento.id"
            class="flex items-center gap-3 rounded-lg border bg-background px-3 py-2"
          >
            <span
              class="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
              :class="movimento.visual.classe"
              ><component :is="movimento.visual.icon" class="h-4 w-4"
            /></span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-2">
                <p class="text-sm font-semibold">{{ movimento.visual.label }}</p>
                <p class="text-[11px] text-muted-foreground">
                  · {{ formatarDataHora(movimento.createdAt) }}
                </p>
              </div>
              <p class="truncate text-xs text-muted-foreground">
                {{ movimento.descricao || 'Sem descrição' }}
              </p>
            </div>
            <strong
              class="shrink-0 text-sm tabular-nums"
              :class="
                movimento.visual.sinal === '+'
                  ? 'text-emerald-600'
                  : movimento.visual.sinal === '-'
                    ? 'text-rose-600'
                    : 'text-muted-foreground'
              "
              >{{ movimento.visual.sinal }} {{ formatCurrencyBR(movimento.valor) }}</strong
            >
          </article>
        </div>
      </section>
    </div>
  </ModalView>
</template>
