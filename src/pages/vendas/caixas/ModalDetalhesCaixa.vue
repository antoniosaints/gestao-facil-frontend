<script setup lang="ts">
import { computed } from 'vue'
import {
  Ban,
  Banknote,
  BanknoteArrowDown,
  BanknoteArrowUp,
  Barcode,
  CheckCircle2,
  Coins,
  CreditCard,
  DoorOpen,
  Eye,
  FileDown,
  Globe,
  HandCoins,
  Inbox,
  Lock,
  MessageCircleMore,
  Package,
  QrCode,
  ScrollText,
  ShoppingCart,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Undo2,
  UserRound,
  Users,
  Wallet,
} from 'lucide-vue-next'
import ModalView from '@/components/formulario/ModalView.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CaixaMovimentoTipo, CaixaRelatorioResponse } from '@/types/schemas'
import { formatCurrencyBR, formatDuracaoMs, formatPaymentMethodLabel } from '@/utils/formatters'

type CaixaDetalhe = CaixaRelatorioResponse['caixas'][number]

const props = defineProps<{
  caixa: CaixaDetalhe | null
  canResendWhatsapp?: boolean
  exportando?: boolean
}>()

const emit = defineEmits<{
  'exportar-pdf': [caixaId: number]
  'reenviar-whatsapp': []
  'ver-venda': [vendaId?: number | null]
}>()

const open = defineModel<boolean>('open', { default: false })

const sessao = computed(() => props.caixa?.caixa || null)
const resumo = computed(() => props.caixa?.resumo || null)
const vendas = computed(() => props.caixa?.vendas || [])
const produtos = computed(() => (props.caixa?.produtosMaisVendidos || []).slice(0, 5))

const statusVisual = computed(() => {
  switch (sessao.value?.status) {
    case 'ABERTO':
      return {
        label: 'Aberto',
        icon: DoorOpen,
        classe: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      }
    case 'FECHADO':
      return {
        label: 'Fechado',
        icon: Lock,
        classe: 'border-border bg-muted text-muted-foreground',
      }
    case 'CANCELADO':
      return {
        label: 'Cancelado',
        icon: Ban,
        classe: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400',
      }
    default:
      return {
        label: sessao.value?.status || '-',
        icon: Wallet,
        classe: 'border-border bg-muted text-muted-foreground',
      }
  }
})

function paraTimestamp(valor?: string | Date | null) {
  if (!valor) return null
  const tempo = new Date(valor).getTime()
  return Number.isNaN(tempo) ? null : tempo
}

function formatarDataHora(valor?: string | Date | null) {
  const tempo = paraTimestamp(valor)
  return tempo === null ? '-' : new Date(tempo).toLocaleString('pt-BR')
}

// Turno ainda aberto conta até agora — é o número que o gerente quer ver ao acompanhar
// um caixa em andamento.
const duracaoTurno = computed(() => {
  const inicio = paraTimestamp(sessao.value?.abertoEm)
  if (inicio === null) return null
  const fim = paraTimestamp(sessao.value?.fechadoEm) ?? Date.now()
  if (fim < inicio) return null
  return formatDuracaoMs(fim - inicio)
})

function arredondar(valor: number) {
  return Math.round(valor * 100) / 100
}

/**
 * Extrato da gaveta. `saldoEsperado` no backend é **dinheiro**: parte do saldo inicial e
 * só recebe vendas em espécie, reforços e sangrias. Por isso a conferência usa
 * `porMetodo.DINHEIRO` e não o total vendido — senão a conta nunca fecharia na tela.
 */
const conferencia = computed(() => {
  const dados = resumo.value
  if (!dados) return null

  const saldoInicial = Number(dados.saldoInicial || 0)
  const vendasDinheiro = Number(dados.porMetodo?.DINHEIRO || 0)
  const reforcos = Number(dados.totalReforcos || 0)
  const sangrias = Number(dados.totalSangrias || 0)
  const esperado = Number(dados.saldoEsperado || 0)
  // Estornos e vendas apagadas mexem no saldo esperado mas não aparecem em `porMetodo`.
  // Sem essa linha o extrato exibido não fecharia com o valor autoritativo da API.
  const ajustes = arredondar(esperado - (saldoInicial + vendasDinheiro + reforcos - sangrias))

  const contadoBruto = dados.saldoContado ?? sessao.value?.saldoContado ?? null
  const contado = contadoBruto === null || contadoBruto === undefined ? null : Number(contadoBruto)

  return {
    saldoInicial,
    vendasDinheiro,
    reforcos,
    sangrias,
    ajustes,
    esperado,
    contado,
    diferenca: contado === null ? null : arredondar(contado - esperado),
  }
})

const diferencaVisual = computed(() => {
  const diferenca = conferencia.value?.diferenca
  if (diferenca === null || diferenca === undefined) {
    return {
      icon: Timer,
      titulo: 'Conferência pendente',
      descricao: 'O caixa ainda não foi fechado, então não há valor contado.',
      classe: 'border-border bg-muted/40 text-muted-foreground',
      valor: null as string | null,
    }
  }
  if (diferenca === 0) {
    return {
      icon: CheckCircle2,
      titulo: 'Caixa conferido',
      descricao: 'O valor contado bateu exatamente com o esperado.',
      classe: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      valor: formatCurrencyBR(0),
    }
  }
  if (diferenca > 0) {
    return {
      icon: TrendingUp,
      titulo: 'Sobra na gaveta',
      descricao: 'Contaram mais dinheiro do que o esperado.',
      classe: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
      valor: `+ ${formatCurrencyBR(diferenca)}`,
    }
  }
  return {
    icon: TrendingDown,
    titulo: 'Falta na gaveta',
    descricao: 'Contaram menos dinheiro do que o esperado.',
    classe: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400',
    valor: `- ${formatCurrencyBR(Math.abs(diferenca))}`,
  }
})

function iconeMetodo(metodo: string) {
  switch (metodo) {
    case 'DINHEIRO':
      return Banknote
    case 'PIX':
      return QrCode
    case 'CARTAO':
    case 'CREDITO':
    case 'DEBITO':
      return CreditCard
    case 'BOLETO':
      return Barcode
    case 'CREDIARIO':
      return HandCoins
    case 'CHEQUE':
      return ScrollText
    case 'GATEWAY':
      return Globe
    default:
      return Wallet
  }
}

// A barra de proporção responde a "o que mais entrou nesse caixa?" de relance —
// uma lista de valores soltos obriga o gerente a comparar de cabeça.
const metodos = computed(() => {
  const entradas = Object.entries(resumo.value?.porMetodo || {})
    .map(([metodo, valor]) => ({ metodo, valor: Number(valor || 0) }))
    .filter((item) => item.valor !== 0)
    .sort((a, b) => b.valor - a.valor)

  const total = entradas.reduce((acc, item) => acc + item.valor, 0)

  return entradas.map((item) => ({
    ...item,
    label: formatPaymentMethodLabel(item.metodo),
    icon: iconeMetodo(item.metodo),
    percentual: total > 0 ? (item.valor / total) * 100 : 0,
  }))
})

const indicadores = computed(() => [
  {
    label: 'Total vendido',
    valor: formatCurrencyBR(resumo.value?.totalVendido || 0),
    detalhe: `${resumo.value?.totalVendas || 0} venda(s)`,
    icon: TrendingUp,
    classe: 'text-emerald-600 bg-emerald-500/10',
  },
  {
    label: 'Reforços',
    valor: formatCurrencyBR(resumo.value?.totalReforcos || 0),
    detalhe: 'Entradas manuais',
    icon: BanknoteArrowUp,
    classe: 'text-blue-600 bg-blue-500/10',
  },
  {
    label: 'Sangrias',
    valor: formatCurrencyBR(resumo.value?.totalSangrias || 0),
    detalhe: 'Retiradas manuais',
    icon: BanknoteArrowDown,
    classe: 'text-amber-600 bg-amber-500/10',
  },
  {
    label: 'Operadores',
    valor: String(sessao.value?.operadores?.length || 1),
    detalhe: 'Com acesso ao turno',
    icon: Users,
    classe: 'text-violet-600 bg-violet-500/10',
  },
])

function visualMovimento(tipo: CaixaMovimentoTipo) {
  switch (tipo) {
    case 'ABERTURA':
      return { label: 'Abertura', icon: DoorOpen, sinal: '', classe: 'text-muted-foreground bg-muted' }
    case 'VENDA':
      return { label: 'Venda', icon: ShoppingCart, sinal: '+', classe: 'text-emerald-600 bg-emerald-500/10' }
    case 'REFORCO':
      return { label: 'Reforço', icon: BanknoteArrowUp, sinal: '+', classe: 'text-blue-600 bg-blue-500/10' }
    case 'SANGRIA':
      return { label: 'Sangria', icon: BanknoteArrowDown, sinal: '-', classe: 'text-amber-600 bg-amber-500/10' }
    case 'ESTORNO':
      return { label: 'Estorno', icon: Undo2, sinal: '-', classe: 'text-rose-600 bg-rose-500/10' }
    case 'FECHAMENTO':
      return { label: 'Fechamento', icon: Lock, sinal: '', classe: 'text-muted-foreground bg-muted' }
    default:
      return { label: tipo, icon: Coins, sinal: '', classe: 'text-muted-foreground bg-muted' }
  }
}

const movimentos = computed(() =>
  (props.caixa?.movimentos || []).map((movimento) => ({
    ...movimento,
    visual: visualMovimento(movimento.tipo),
  })),
)

const statusVendaClasse: Record<string, string> = {
  FINALIZADO: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  FATURADO: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  PENDENTE: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  ANDAMENTO: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  ORCAMENTO: 'border-border bg-muted text-muted-foreground',
  CANCELADO: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400',
}

const maiorQuantidadeProduto = computed(() =>
  produtos.value.reduce((maior, item) => Math.max(maior, Number(item.quantidade || 0)), 0),
)
</script>

<template>
  <ModalView v-model:open="open" :icon="Wallet" title="Detalhes do caixa"
    description="Conferência, recebimentos e histórico do turno." size="5xl">
    <div v-if="caixa && sessao && resumo" class="grid gap-3 px-3 pb-4 md:gap-4 md:p-4">
      <!-- Identificação do turno -->
      <header class="rounded-xl border bg-card p-4">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div class="flex min-w-0 gap-3">
            <div class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Wallet class="h-6 w-6" />
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="truncate text-lg font-semibold">{{ sessao.codigo }}</h3>
                <span
                  class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                  :class="statusVisual.classe">
                  <component :is="statusVisual.icon" class="h-3 w-3" />
                  {{ statusVisual.label }}
                </span>
              </div>
              <p v-if="sessao.pdv?.nome" class="mt-0.5 truncate text-xs text-muted-foreground">
                {{ sessao.pdv.nome }}
              </p>
            </div>
          </div>

          <div class="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <Button v-if="canResendWhatsapp" variant="outline" class="w-full sm:w-auto"
              @click="emit('reenviar-whatsapp')">
              <MessageCircleMore class="h-4 w-4" /> Reenviar WhatsApp
            </Button>
            <Button variant="outline" class="w-full sm:w-auto" :disabled="exportando"
              @click="emit('exportar-pdf', sessao.id)">
              <FileDown class="h-4 w-4" />
              {{ exportando ? 'Gerando...' : 'Exportar PDF' }}
            </Button>
          </div>
        </div>

        <!-- Linha do tempo do turno -->
        <div class="mt-4 grid gap-2 sm:grid-cols-3">
          <div class="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
            <DoorOpen class="h-4 w-4 shrink-0 text-emerald-600" />
            <div class="min-w-0">
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground">Abertura</p>
              <p class="truncate text-xs font-semibold">{{ formatarDataHora(sessao.abertoEm) }}</p>
              <p class="truncate text-[11px] text-muted-foreground">
                <UserRound class="mr-0.5 inline h-3 w-3" />{{ sessao.abertoPor?.nome || '-' }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
            <Lock class="h-4 w-4 shrink-0" :class="sessao.fechadoEm ? 'text-muted-foreground' : 'text-emerald-600'" />
            <div class="min-w-0">
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground">Fechamento</p>
              <p class="truncate text-xs font-semibold">
                {{ sessao.fechadoEm ? formatarDataHora(sessao.fechadoEm) : 'Em andamento' }}
              </p>
              <p class="truncate text-[11px] text-muted-foreground">
                <UserRound class="mr-0.5 inline h-3 w-3" />{{ sessao.fechadoPor?.nome || '-' }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
            <Timer class="h-4 w-4 shrink-0 text-primary" />
            <div class="min-w-0">
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground">Duração do turno</p>
              <p class="truncate text-sm font-semibold">{{ duracaoTurno || '—' }}</p>
              <p v-if="!sessao.fechadoEm" class="text-[11px] text-muted-foreground">Contando até agora</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Conferência da gaveta: o bloco mais importante da tela -->
      <section v-if="conferencia" class="rounded-xl border bg-card p-4">
        <div class="mb-3 flex items-center gap-2">
          <Coins class="h-4 w-4 text-primary" />
          <h3 class="text-sm font-semibold">Conferência da gaveta</h3>
          <span class="ml-auto text-[11px] text-muted-foreground">Somente dinheiro em espécie</span>
        </div>

        <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div class="overflow-hidden rounded-lg border" data-testid="extrato-gaveta">
            <div class="flex items-center justify-between gap-3 border-b bg-background px-3 py-2 text-sm">
              <span class="flex items-center gap-2 text-muted-foreground">
                <Wallet class="h-4 w-4" /> Saldo inicial (fundo de troco)
              </span>
              <span class="font-medium tabular-nums">{{ formatCurrencyBR(conferencia.saldoInicial) }}</span>
            </div>
            <div class="flex items-center justify-between gap-3 border-b bg-background px-3 py-2 text-sm">
              <span class="flex items-center gap-2 text-muted-foreground">
                <Banknote class="h-4 w-4 text-emerald-600" /> Vendas em dinheiro
              </span>
              <span class="font-medium tabular-nums text-emerald-600">
                + {{ formatCurrencyBR(conferencia.vendasDinheiro) }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-3 border-b bg-background px-3 py-2 text-sm">
              <span class="flex items-center gap-2 text-muted-foreground">
                <BanknoteArrowUp class="h-4 w-4 text-blue-600" /> Reforços
              </span>
              <span class="font-medium tabular-nums text-blue-600">
                + {{ formatCurrencyBR(conferencia.reforcos) }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-3 border-b bg-background px-3 py-2 text-sm">
              <span class="flex items-center gap-2 text-muted-foreground">
                <BanknoteArrowDown class="h-4 w-4 text-amber-600" /> Sangrias
              </span>
              <span class="font-medium tabular-nums text-amber-600">
                - {{ formatCurrencyBR(conferencia.sangrias) }}
              </span>
            </div>
            <div v-if="conferencia.ajustes !== 0"
              class="flex items-center justify-between gap-3 border-b bg-background px-3 py-2 text-sm">
              <span class="flex items-center gap-2 text-muted-foreground">
                <Undo2 class="h-4 w-4" /> Estornos e ajustes
              </span>
              <span class="font-medium tabular-nums">
                {{ conferencia.ajustes > 0 ? '+' : '-' }} {{ formatCurrencyBR(Math.abs(conferencia.ajustes)) }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-3 border-b bg-muted/40 px-3 py-2.5 text-sm">
              <span class="flex items-center gap-2 font-semibold">
                <Target class="h-4 w-4 text-primary" /> Esperado na gaveta
              </span>
              <strong class="tabular-nums">{{ formatCurrencyBR(conferencia.esperado) }}</strong>
            </div>
            <div class="flex items-center justify-between gap-3 bg-background px-3 py-2.5 text-sm">
              <span class="flex items-center gap-2 font-semibold">
                <Coins class="h-4 w-4 text-primary" /> Contado no fechamento
              </span>
              <strong class="tabular-nums">
                {{ conferencia.contado === null ? '—' : formatCurrencyBR(conferencia.contado) }}
              </strong>
            </div>
          </div>

          <div class="flex flex-col justify-center gap-2 rounded-lg border p-4 text-center"
            :class="diferencaVisual.classe">
            <component :is="diferencaVisual.icon" class="mx-auto h-7 w-7" />
            <p class="text-sm font-bold">{{ diferencaVisual.titulo }}</p>
            <p v-if="diferencaVisual.valor" class="text-2xl font-black tabular-nums">
              {{ diferencaVisual.valor }}
            </p>
            <p class="text-[11px] leading-snug opacity-90">{{ diferencaVisual.descricao }}</p>
          </div>
        </div>
      </section>

      <!-- Indicadores do turno -->
      <section class="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        <div v-for="indicador in indicadores" :key="indicador.label" class="rounded-xl border bg-card p-3">
          <div class="flex items-center gap-2">
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg" :class="indicador.classe">
              <component :is="indicador.icon" class="h-4 w-4" />
            </span>
            <p class="truncate text-[11px] font-medium text-muted-foreground">{{ indicador.label }}</p>
          </div>
          <p class="mt-2 truncate text-lg font-bold tabular-nums">{{ indicador.valor }}</p>
          <p class="truncate text-[11px] text-muted-foreground">{{ indicador.detalhe }}</p>
        </div>
      </section>

      <!-- Recebimentos por método -->
      <section class="rounded-xl border bg-card p-4">
        <div class="mb-3 flex items-center gap-2">
          <CreditCard class="h-4 w-4 text-primary" />
          <h3 class="text-sm font-semibold">Recebimentos por método</h3>
        </div>
        <div v-if="!metodos.length" class="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
          <Inbox class="h-8 w-8 opacity-50" />
          Nenhum recebimento registrado neste caixa.
        </div>
        <div v-else class="grid gap-2 sm:grid-cols-2">
          <div v-for="metodo in metodos" :key="metodo.metodo" class="rounded-lg border bg-background px-3 py-2.5">
            <div class="flex items-center justify-between gap-2 text-sm">
              <span class="flex min-w-0 items-center gap-2">
                <component :is="metodo.icon" class="h-4 w-4 shrink-0 text-muted-foreground" />
                <span class="truncate font-medium">{{ metodo.label }}</span>
              </span>
              <strong class="shrink-0 tabular-nums">{{ formatCurrencyBR(metodo.valor) }}</strong>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div class="h-full rounded-full bg-primary" :style="{ width: `${metodo.percentual}%` }" />
              </div>
              <span class="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                {{ metodo.percentual.toFixed(0) }}%
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Conferência por método informada no fechamento -->
      <section v-if="resumo.fechamentoMetodos?.length" class="rounded-xl border bg-card p-4">
        <div class="mb-3 flex items-center gap-2">
          <CheckCircle2 class="h-4 w-4 text-primary" />
          <h3 class="text-sm font-semibold">Conferência por método</h3>
        </div>
        <div class="overflow-hidden rounded-lg border">
          <div
            class="hidden grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] gap-2 border-b bg-muted/40 px-3 py-2 text-[11px] font-medium text-muted-foreground sm:grid">
            <span>Método</span>
            <span class="text-right">Esperado</span>
            <span class="text-right">Contado</span>
            <span class="text-right">Diferença</span>
          </div>
          <div v-for="metodo in resumo.fechamentoMetodos" :key="metodo.metodo"
            class="grid grid-cols-2 gap-x-2 gap-y-1 border-b bg-background px-3 py-2 text-sm last:border-b-0 sm:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
            <span class="flex items-center gap-2 font-medium">
              <component :is="iconeMetodo(metodo.metodo)" class="h-4 w-4 shrink-0 text-muted-foreground" />
              <span class="truncate">{{ formatPaymentMethodLabel(metodo.metodo) }}</span>
            </span>
            <span class="text-right tabular-nums text-muted-foreground">
              <span class="text-[11px] sm:hidden">Esperado: </span>{{ formatCurrencyBR(metodo.esperado) }}
            </span>
            <span class="text-right tabular-nums">
              <span class="text-[11px] text-muted-foreground sm:hidden">Contado: </span>{{ formatCurrencyBR(metodo.contado) }}
            </span>
            <span class="flex items-center justify-end gap-1 text-right font-semibold tabular-nums"
              :class="metodo.diferenca === 0 ? 'text-muted-foreground' : metodo.diferenca > 0 ? 'text-amber-600' : 'text-rose-600'">
              <CheckCircle2 v-if="metodo.diferenca === 0" class="h-3.5 w-3.5" />
              <TrendingUp v-else-if="metodo.diferenca > 0" class="h-3.5 w-3.5" />
              <TrendingDown v-else class="h-3.5 w-3.5" />
              {{ formatCurrencyBR(metodo.diferenca) }}
            </span>
          </div>
        </div>
        <p class="mt-2 text-[11px] text-muted-foreground">
          Métodos sem valor contado no fechamento são considerados corretos.
        </p>
      </section>

      <!-- Produtos mais vendidos no turno -->
      <section v-if="produtos.length" class="rounded-xl border bg-card p-4">
        <div class="mb-3 flex items-center gap-2">
          <Package class="h-4 w-4 text-primary" />
          <h3 class="text-sm font-semibold">Mais vendidos no turno</h3>
        </div>
        <div class="grid gap-2">
          <div v-for="(produto, indice) in produtos" :key="`${produto.nome}-${indice}`"
            class="flex items-center gap-3 rounded-lg border bg-background px-3 py-2">
            <span class="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
              {{ indice + 1 }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ produto.nome }}</p>
              <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div class="h-full rounded-full bg-primary/60"
                  :style="{ width: `${maiorQuantidadeProduto ? (Number(produto.quantidade) / maiorQuantidadeProduto) * 100 : 0}%` }" />
              </div>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-sm font-semibold tabular-nums">{{ produto.quantidade }} un.</p>
              <p class="text-[11px] tabular-nums text-muted-foreground">{{ formatCurrencyBR(produto.total) }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Vendas vinculadas -->
      <section class="rounded-xl border bg-card p-4">
        <div class="mb-3 flex items-center gap-2">
          <ShoppingCart class="h-4 w-4 text-primary" />
          <h3 class="text-sm font-semibold">Vendas vinculadas</h3>
          <Badge variant="outline" class="ml-auto">{{ vendas.length }}</Badge>
        </div>

        <div v-if="!vendas.length"
          class="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
          <Inbox class="h-8 w-8 opacity-50" />
          Nenhuma venda vinculada a este caixa.
        </div>

        <div v-else class="space-y-2 md:hidden">
          <article v-for="venda in vendas" :key="venda.id" class="rounded-lg border bg-background p-3">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold">{{ venda.Uid || `#${venda.id}` }}</p>
                <p class="text-xs text-muted-foreground">{{ formatarDataHora(venda.data) }}</p>
              </div>
              <span class="shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                :class="statusVendaClasse[venda.status] || 'border-border bg-muted text-muted-foreground'">
                {{ venda.status }}
              </span>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div class="rounded-md bg-muted/40 p-2">
                <span class="block text-muted-foreground">Pagamento</span>
                <strong class="flex items-center gap-1">
                  <component :is="iconeMetodo(venda.PagamentoVendas?.metodo || '')" class="h-3.5 w-3.5" />
                  {{ formatPaymentMethodLabel(venda.PagamentoVendas?.metodo) }}
                </strong>
              </div>
              <div class="rounded-md bg-muted/40 p-2 text-right">
                <span class="block text-muted-foreground">Valor</span>
                <strong class="tabular-nums">{{ formatCurrencyBR(venda.valor || 0) }}</strong>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" class="mt-3 w-full" @click="emit('ver-venda', venda.id)">
              <Eye class="h-4 w-4" />
              Detalhes da venda
            </Button>
          </article>
        </div>

        <div v-if="vendas.length" class="hidden max-h-72 overflow-auto rounded-lg border md:block">
          <table class="w-full min-w-[760px] text-sm">
            <thead class="sticky top-0 border-b bg-muted text-left text-[11px] font-medium text-muted-foreground">
              <tr>
                <th class="px-3 py-2">Venda</th>
                <th class="px-3 py-2">Data</th>
                <th class="px-3 py-2">Status</th>
                <th class="px-3 py-2">Pagamento</th>
                <th class="px-3 py-2 text-right">Valor</th>
                <th class="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="venda in vendas" :key="venda.id" class="border-b last:border-b-0 hover:bg-muted/30">
                <td class="px-3 py-1 font-medium">{{ venda.Uid || `#${venda.id}` }}</td>
                <td class="px-3 py-1 text-muted-foreground">{{ formatarDataHora(venda.data) }}</td>
                <td class="px-3 py-1">
                  <span class="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                    :class="statusVendaClasse[venda.status] || 'border-border bg-muted text-muted-foreground'">
                    {{ venda.status }}
                  </span>
                </td>
                <td class="px-3 py-1">
                  <span class="flex items-center gap-1.5">
                    <component :is="iconeMetodo(venda.PagamentoVendas?.metodo || '')"
                      class="h-4 w-4 text-muted-foreground" />
                    {{ formatPaymentMethodLabel(venda.PagamentoVendas?.metodo) }}
                  </span>
                </td>
                <td class="px-3 py-1 text-right font-medium tabular-nums">{{ formatCurrencyBR(venda.valor || 0) }}</td>
                <td class="px-3 py-1 text-right">
                  <Button type="button" variant="outline" size="sm" title="Ver detalhes da venda"
                    @click="emit('ver-venda', venda.id)">
                    <Eye class="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Histórico de movimentos -->
      <section class="rounded-xl border bg-card p-4">
        <div class="mb-3 flex items-center gap-2">
          <Coins class="h-4 w-4 text-primary" />
          <h3 class="text-sm font-semibold">Movimentos do caixa</h3>
          <Badge variant="outline" class="ml-auto">{{ movimentos.length }}</Badge>
        </div>

        <div v-if="!movimentos.length"
          class="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
          <Inbox class="h-8 w-8 opacity-50" />
          Nenhum movimento registrado neste caixa.
        </div>

        <div v-else class="max-h-80 space-y-2 overflow-auto pr-1">
          <article v-for="movimento in movimentos" :key="movimento.id"
            class="flex items-center gap-3 rounded-lg border bg-background px-3 py-1">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg" :class="movimento.visual.classe">
              <component :is="movimento.visual.icon" class="h-4 w-4" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-2">
                <p class="text-sm font-semibold">{{ movimento.visual.label }}</p> 
                <span v-if="movimento.metodoPagamento" class="text-[11px] text-muted-foreground">
                  · {{ formatPaymentMethodLabel(movimento.metodoPagamento) }}
                </span>
                <p class="text-[11px] text-muted-foreground">
                  · {{ formatarDataHora(movimento.createdAt) }}
                </p>
              </div>
              <p class="truncate text-xs text-muted-foreground">
                {{ movimento.descricao || 'Sem descrição' }}
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <span class="text-sm font-bold tabular-nums"
                :class="movimento.visual.sinal === '+' ? 'text-emerald-600'
                  : movimento.visual.sinal === '-' ? 'text-rose-600' : 'text-muted-foreground'">
                {{ movimento.visual.sinal }} {{ formatCurrencyBR(movimento.valor || 0) }}
              </span>
              <Button v-if="movimento.vendaId" type="button" variant="outline" size="sm" title="Ver venda vinculada"
                @click="emit('ver-venda', movimento.vendaId)">
                <Eye class="h-4 w-4" />
              </Button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </ModalView>
</template>
