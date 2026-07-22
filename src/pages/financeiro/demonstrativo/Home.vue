<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { endOfMonth, endOfYear, startOfMonth, startOfYear, subMonths, subQuarters } from 'date-fns'
import { useToast } from 'vue-toastification'
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CalendarRange,
  CheckCircle,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Filter,
  Inbox,
  Minus,
  Percent,
  RefreshCw,
  Scale,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-vue-next'

import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import BarChart from '@/components/graficos/BarChart.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { colorTheme } from '@/utils/theme'
import {
  LancamentosRepository,
  type DemonstrativoFiltros,
  type DemonstrativoResponse,
  type LinhaDemonstrativo,
  type RegimeDemonstrativo,
} from '@/repositories/lancamento-repository'
import type { CategoriaFinanceiro, ContasFinanceiro } from '@/types/schemas'
import { formatCurrencyBR } from '@/utils/formatters'

const toast = useToast()

const loading = ref(true)
const exportando = ref<'csv' | 'pdf' | null>(null)
const openModalFiltros = ref(false)
const demonstrativo = ref<DemonstrativoResponse | null>(null)
const contas = ref<ContasFinanceiro[]>([])
const categorias = ref<CategoriaFinanceiro[]>([])
const gruposAbertos = ref<Set<string>>(new Set())

const periodo = ref<[Date, Date]>([startOfMonth(new Date()), endOfMonth(new Date())])
const presetAtivo = ref('month')
const regime = ref<RegimeDemonstrativo>('COMPETENCIA')
// Horizonte da série mensal, separado do período filtrado: filtrar "este mês"
// não pode reduzir o gráfico a uma única barra.
const mesesHistorico = ref(12)
const opcoesHistorico = [6, 12, 24]
const filtros = ref<{ contaFinanceiraId: string; categoriaId: string; clienteId: number | null }>({
  contaFinanceiraId: 'all',
  categoriaId: 'all',
  clienteId: null,
})

const presets = [
  { key: 'month', label: 'Este mês' },
  { key: 'last-month', label: 'Mês passado' },
  { key: 'quarter', label: 'Trimestre' },
  { key: 'year', label: 'Este ano' },
  { key: 'last-year', label: 'Ano passado' },
]

function resolvePeriodoPreset(preset: string): [Date, Date] | null {
  const agora = new Date()

  if (preset === 'month') return [startOfMonth(agora), endOfMonth(agora)]
  if (preset === 'last-month') {
    const anterior = subMonths(agora, 1)
    return [startOfMonth(anterior), endOfMonth(anterior)]
  }
  if (preset === 'quarter') return [startOfMonth(subQuarters(agora, 1)), endOfMonth(agora)]
  if (preset === 'year') return [startOfYear(agora), endOfYear(agora)]
  if (preset === 'last-year') {
    const anterior = new Date(agora.getFullYear() - 1, 0, 1)
    return [startOfYear(anterior), endOfYear(anterior)]
  }

  return null
}

// O Calendarpicker em range emite também o estado com uma única data escolhida.
function getIntervalo(): [Date, Date] {
  const inicio = periodo.value?.[0] ?? startOfMonth(new Date())
  const fim = periodo.value?.[1] ?? endOfMonth(new Date())
  return [inicio, fim]
}

function toIsoDate(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

function getFiltrosRequest(): DemonstrativoFiltros {
  const [inicio, fim] = getIntervalo()
  return {
    inicio: toIsoDate(inicio),
    fim: toIsoDate(fim),
    regime: regime.value,
    contaFinanceiraId: filtros.value.contaFinanceiraId !== 'all' ? Number(filtros.value.contaFinanceiraId) : null,
    categoriaId: filtros.value.categoriaId !== 'all' ? Number(filtros.value.categoriaId) : null,
    clienteId: filtros.value.clienteId,
    mesesHistorico: mesesHistorico.value,
  }
}

const periodoLabel = computed(() => {
  const [inicio, fim] = getIntervalo()
  return `${inicio.toLocaleDateString('pt-BR')} — ${fim.toLocaleDateString('pt-BR')}`
})

const periodoAnteriorLabel = computed(() => {
  const anterior = demonstrativo.value?.periodo.anterior
  if (!anterior) return ''
  return `${new Date(anterior.inicio).toLocaleDateString('pt-BR')} — ${new Date(anterior.fim).toLocaleDateString('pt-BR')}`
})

function num(valor: string | number | undefined | null) {
  return Number(valor || 0)
}

const filtrosAtivos = computed(() => {
  const items: string[] = []

  if (filtros.value.contaFinanceiraId !== 'all') {
    const conta = contas.value.find((item) => String(item.id) === filtros.value.contaFinanceiraId)
    items.push(`Conta: ${conta?.nome || filtros.value.contaFinanceiraId}`)
  }
  if (filtros.value.categoriaId !== 'all') {
    const categoria = categorias.value.find((item) => String(item.id) === filtros.value.categoriaId)
    items.push(`Categoria: ${categoria?.nome || filtros.value.categoriaId}`)
  }
  if (filtros.value.clienteId) items.push('Cliente selecionado')

  return items
})

const indicadores = computed(() => {
  const resumo = demonstrativo.value?.resumo
  if (!resumo) return []

  return [
    {
      label: 'Receitas',
      valor: formatCurrencyBR(num(resumo.receitas)),
      detalhe: `Anterior: ${formatCurrencyBR(num(resumo.anterior.receitas))}`,
      variacao: resumo.variacao.receitas,
      icon: TrendingUp,
      classe: 'text-emerald-600 bg-emerald-500/10',
    },
    {
      label: 'Despesas',
      valor: formatCurrencyBR(num(resumo.despesas)),
      detalhe: `Anterior: ${formatCurrencyBR(num(resumo.anterior.despesas))}`,
      variacao: resumo.variacao.despesas,
      // Em despesa, crescer é ruim: a seta verde/vermelha inverte de sentido.
      inverterCor: true,
      icon: TrendingDown,
      classe: 'text-rose-600 bg-rose-500/10',
    },
    {
      label: 'Resultado',
      valor: formatCurrencyBR(num(resumo.resultado)),
      detalhe: `Anterior: ${formatCurrencyBR(num(resumo.anterior.resultado))}`,
      variacao: resumo.variacao.resultado,
      icon: Scale,
      classe: num(resumo.resultado) >= 0 ? 'text-blue-600 bg-blue-500/10' : 'text-rose-600 bg-rose-500/10',
    },
    {
      label: 'Margem',
      valor: `${resumo.margem.toFixed(1)}%`,
      detalhe: `${resumo.totalLancamentos} parcela(s) no período`,
      variacao: null,
      icon: Percent,
      classe: 'text-violet-600 bg-violet-500/10',
    },
  ]
})

function variacaoInfo(variacao: number | null, inverter = false) {
  if (variacao === null) return { label: '—', cls: 'text-muted-foreground bg-muted', icon: Minus }

  const positivo = inverter ? variacao < 0 : variacao > 0
  if (variacao === 0) return { label: '0%', cls: 'text-muted-foreground bg-muted', icon: Minus }

  return {
    label: `${variacao > 0 ? '+' : ''}${variacao.toFixed(1)}%`,
    cls: positivo ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10',
    icon: variacao > 0 ? ArrowUpRight : ArrowDownRight,
  }
}

const serieMensal = computed(() => demonstrativo.value?.mensal ?? [])

/// Meses cobertos pelo período filtrado, para destacá-los dentro da série maior.
const mesesDoFiltro = computed(() => {
  const [inicio, fim] = getIntervalo()
  const chaves = new Set<string>()

  let cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1)
  const limite = new Date(fim.getFullYear(), fim.getMonth(), 1)

  while (cursor <= limite) {
    chaves.add(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`)
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  }

  return chaves
})

// Meses fora do filtro entram esmaecidos: dão a tendência sem se confundir com
// o que está sendo apurado no demonstrativo.
function coresPorMes(cor: string) {
  return serieMensal.value.map((ponto) => (mesesDoFiltro.value.has(ponto.mes) ? cor : `${cor}59`))
}

const chartMensal = computed(() => ({
  labels: serieMensal.value.map((ponto) => {
    const [ano, mes] = ponto.mes.split('-')
    return `${mes}/${ano.slice(2)}`
  }),
  datasets: [
    {
      label: 'Receitas',
      data: serieMensal.value.map((ponto) => num(ponto.receitas)),
      backgroundColor: coresPorMes('#10B981'),
      borderRadius: 6,
    },
    {
      label: 'Despesas',
      data: serieMensal.value.map((ponto) => num(ponto.despesas)),
      backgroundColor: coresPorMes('#F43F5E'),
      borderRadius: 6,
    },
    {
      label: 'Resultado',
      data: serieMensal.value.map((ponto) => num(ponto.resultado)),
      backgroundColor: coresPorMes('#3B82F6'),
      borderRadius: 6,
    },
  ],
}))

// Com três séries a legenda é obrigatória; o preset compartilhado a esconde.
const opcoesGrafico = computed(() => {
  const tick = colorTheme.value === 'dark' ? '#cbd5e1' : '#475569'
  const grid = colorTheme.value === 'dark' ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.22)'

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: true, position: 'bottom' as const, labels: { color: tick, boxWidth: 12 } },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${formatCurrencyBR(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: { color: tick, callback: (v: number) => 'R$ ' + Number(v).toLocaleString('pt-BR') },
        grid: { color: grid },
      },
      x: { ticks: { color: tick }, grid: { display: false } },
    },
    elements: { bar: { borderRadius: 6 } },
  }
})

const temDados = computed(
  () =>
    (demonstrativo.value?.grupos.receitas.length ?? 0) > 0 ||
    (demonstrativo.value?.grupos.despesas.length ?? 0) > 0,
)

function chaveGrupo(secao: string, grupo: LinhaDemonstrativo) {
  return `${secao}:${grupo.categoriaId ?? grupo.nome}`
}

function alternarGrupo(secao: string, grupo: LinhaDemonstrativo) {
  const chave = chaveGrupo(secao, grupo)
  const proximo = new Set(gruposAbertos.value)
  if (proximo.has(chave)) proximo.delete(chave)
  else proximo.add(chave)
  gruposAbertos.value = proximo
}

function grupoAberto(secao: string, grupo: LinhaDemonstrativo) {
  return gruposAbertos.value.has(chaveGrupo(secao, grupo))
}

// Detalhar só faz sentido quando a raiz tem mais de uma linha filha; com uma só,
// a subcategoria repetiria exatamente o valor do grupo.
function temDetalhe(grupo: LinhaDemonstrativo) {
  return grupo.subcategorias.length > 1
}

async function carregarOpcoes() {
  try {
    const [responseContas, responseCategorias] = await Promise.all([
      LancamentosRepository.listarContas(),
      LancamentosRepository.listarCategorias(),
    ])
    contas.value = responseContas.data ?? []
    categorias.value = responseCategorias.data ?? []
  } catch (error) {
    console.error(error)
    toast.warning('Não foi possível carregar os filtros do demonstrativo.')
  }
}

async function carregar(feedback = false) {
  try {
    loading.value = true
    const response = await LancamentosRepository.getDemonstrativo(getFiltrosRequest())
    demonstrativo.value = response.data
    if (feedback) toast.info('Demonstrativo atualizado.')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao gerar o demonstrativo.')
  } finally {
    loading.value = false
  }
}

function applyPreset(preset: string) {
  const intervalo = resolvePeriodoPreset(preset)
  if (!intervalo) return

  presetAtivo.value = preset
  periodo.value = intervalo
  carregar(true)
}

function sincronizarPresetAtivo() {
  const [inicio, fim] = getIntervalo()
  const encontrado = presets.find((preset) => {
    const intervalo = resolvePeriodoPreset(preset.key)
    if (!intervalo) return false
    return (
      intervalo[0].toDateString() === inicio.toDateString() &&
      intervalo[1].toDateString() === fim.toDateString()
    )
  })

  presetAtivo.value = encontrado?.key ?? 'custom'
}

function aplicarFiltros() {
  sincronizarPresetAtivo()
  openModalFiltros.value = false
  carregar(true)
}

function limparFiltros() {
  filtros.value = { contaFinanceiraId: 'all', categoriaId: 'all', clienteId: null }
}

function alterarRegime(valor: RegimeDemonstrativo) {
  regime.value = valor
  carregar()
}

function alterarHistorico(meses: number) {
  mesesHistorico.value = meses
  carregar()
}

async function exportar(formato: 'csv' | 'pdf') {
  try {
    exportando.value = formato
    await LancamentosRepository.exportarDemonstrativo(getFiltrosRequest(), formato)
    toast.success(`Demonstrativo exportado em ${formato.toUpperCase()}.`)
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao exportar o demonstrativo.')
  } finally {
    exportando.value = null
  }
}

onMounted(async () => {
  await Promise.all([carregarOpcoes(), carregar()])
})
</script>

<template>
  <div class="w-full min-w-0 space-y-4 overflow-x-hidden pb-6">
    <!-- Cabeçalho e período -->
    <div class="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="min-w-0 flex-1">
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Scale class="h-6 w-6 shrink-0 text-primary" :stroke-width="2.5" />
          <span class="truncate">Demonstrativo</span>
        </h2>
        <p class="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarRange class="h-3.5 w-3.5 shrink-0" /> {{ periodoLabel }}
          <span v-if="periodoAnteriorLabel" class="text-xs">
            • comparado com {{ periodoAnteriorLabel }}
          </span>
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2 self-start lg:self-auto">
        <div class="flex flex-wrap items-center rounded-lg border border-border bg-card p-1">
          <button v-for="preset in presets" :key="preset.key" type="button" @click="applyPreset(preset.key)"
            class="rounded-md px-3 py-1.5 text-xs font-medium transition"
            :class="presetAtivo === preset.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'">
            {{ preset.label }}
          </button>
        </div>
        <Button variant="outline" @click="openModalFiltros = true">
          <Filter class="h-4 w-4" /> Filtros
        </Button>
        <Button variant="outline" :disabled="exportando !== null || loading" @click="exportar('csv')">
          <FileSpreadsheet class="h-4 w-4" /> {{ exportando === 'csv' ? 'Gerando...' : 'CSV' }}
        </Button>
        <Button variant="outline" :disabled="exportando !== null || loading" @click="exportar('pdf')">
          <Download class="h-4 w-4" /> {{ exportando === 'pdf' ? 'Gerando...' : 'PDF' }}
        </Button>
        <Button variant="outline" size="icon" v-tooltip="'Atualizar'" :disabled="loading" @click="carregar(true)">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
      </div>
    </div>

    <!-- Regime de apuração: a decisão contábil mais importante da tela -->
    <div class="flex flex-col gap-3 rounded-lg border bg-card px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <p class="text-sm font-semibold">Regime de apuração</p>
        <p class="text-xs text-muted-foreground">
          {{
            regime === 'COMPETENCIA'
              ? 'Competência: reconhece pelo vencimento, incluindo parcelas ainda em aberto.'
              : 'Caixa: reconhece pela data de pagamento, apenas o que foi efetivamente recebido ou pago.'
          }}
        </p>
      </div>
      <div class="flex shrink-0 items-center rounded-lg border border-border bg-background p-1 gap-1">
        <button type="button" class="rounded-md px-3 py-1.5 text-xs font-medium transition flex items-center gap-2"
          :class="regime === 'COMPETENCIA' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
          @click="alterarRegime('COMPETENCIA')">
          <Calendar class="h-4 w-4" />
          Competência
        </button>
        <button type="button" class="rounded-md px-3 py-1.5 text-xs font-medium transition flex items-center gap-2"
          :class="regime === 'CAIXA' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
          @click="alterarRegime('CAIXA')">
          <CheckCircle class="h-4 w-4" />
          Caixa
        </button>
      </div>
    </div>

    <div v-if="filtrosAtivos.length" class="flex flex-wrap gap-2">
      <Badge v-for="item in filtrosAtivos" :key="item" variant="outline" class="text-xs">{{ item }}</Badge>
    </div>

    <!-- Indicadores -->
    <section v-if="loading" class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Skeleton v-for="item in 4" :key="item" class="h-[120px] rounded-xl" />
    </section>
    <section v-else class="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
      <div v-for="indicador in indicadores" :key="indicador.label" class="rounded-xl border bg-card p-3">
        <div class="flex items-center gap-2">
          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg" :class="indicador.classe">
            <component :is="indicador.icon" class="h-4 w-4" />
          </span>
          <p class="truncate text-[11px] font-medium text-muted-foreground">{{ indicador.label }}</p>
          <span v-if="indicador.variacao !== null"
            class="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            :class="variacaoInfo(indicador.variacao, indicador.inverterCor).cls">
            <component :is="variacaoInfo(indicador.variacao, indicador.inverterCor).icon" class="h-3 w-3" />
            {{ variacaoInfo(indicador.variacao, indicador.inverterCor).label }}
          </span>
        </div>
        <p class="mt-2 truncate text-lg font-bold tabular-nums">{{ indicador.valor }}</p>
        <p class="truncate text-[11px] text-muted-foreground">{{ indicador.detalhe }}</p>
      </div>
    </section>

    <!-- Evolução mensal -->
    <section class="rounded-xl border bg-card p-4">
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <TrendingUp class="h-4 w-4 shrink-0 text-primary" />
        <div class="min-w-0">
          <h3 class="text-sm font-semibold">Evolução mensal</h3>
          <p class="text-[11px] text-muted-foreground">
            Últimos {{ mesesHistorico }} meses. Os meses fora do período filtrado aparecem esmaecidos.
          </p>
        </div>
        <div class="ml-auto flex shrink-0 items-center rounded-lg border border-border bg-background p-1">
          <button v-for="opcao in opcoesHistorico" :key="opcao" type="button"
            class="rounded-md px-2.5 py-1 text-xs font-medium transition"
            :class="mesesHistorico === opcao ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
            @click="alterarHistorico(opcao)">
            {{ opcao }}m
          </button>
        </div>
      </div>
      <Skeleton v-if="loading" class="h-64 w-full rounded-lg" />
      <div v-else class="h-64 w-full min-w-0">
        <BarChart :data="chartMensal" :options="opcoesGrafico" />
      </div>
    </section>

    <!-- Demonstrativo por plano de contas -->
    <section v-for="secao in ['receitas', 'despesas']" :key="secao" class="rounded-xl border bg-card p-4">
      <div class="mb-3 flex items-center gap-2">
        <component :is="secao === 'receitas' ? TrendingUp : TrendingDown" class="h-4 w-4 shrink-0"
          :class="secao === 'receitas' ? 'text-emerald-600' : 'text-rose-600'" />
        <h3 class="text-sm font-semibold capitalize">{{ secao }}</h3>
        <Badge variant="outline" class="ml-auto tabular-nums">
          {{ formatCurrencyBR(num(secao === 'receitas' ? demonstrativo?.resumo.receitas : demonstrativo?.resumo.despesas)) }}
        </Badge>
      </div>

      <Skeleton v-if="loading" class="h-40 w-full rounded-lg" />

      <div v-else-if="!demonstrativo?.grupos[secao as 'receitas'].length"
        class="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
        <Inbox class="h-8 w-8 opacity-50" />
        Nenhum lançamento de {{ secao }} no período e nos filtros selecionados.
      </div>

      <div v-else class="overflow-x-auto">
        <div class="min-w-[560px] overflow-hidden rounded-lg border">
          <div
            class="grid grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))] gap-2 border-b bg-muted/40 px-3 py-2 text-[11px] font-medium text-muted-foreground">
            <span>Categoria</span>
            <span class="text-right">Valor</span>
            <span class="text-right" v-tooltip="'Análise vertical: participação sobre a receita do período'">AV %</span>
            <span class="text-right">Período anterior</span>
            <span class="text-right" v-tooltip="'Análise horizontal: variação sobre o período anterior'">AH %</span>
          </div>

          <template v-for="grupo in demonstrativo.grupos[secao as 'receitas']" :key="chaveGrupo(secao, grupo)">
            <div
              class="grid grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))] items-center gap-2 border-b bg-background px-3 py-2 text-sm"
              :class="temDetalhe(grupo) ? 'cursor-pointer hover:bg-muted/30' : ''"
              @click="temDetalhe(grupo) && alternarGrupo(secao, grupo)">
              <span class="flex min-w-0 items-center gap-1 font-medium">
                <ChevronRight v-if="temDetalhe(grupo)" class="h-3.5 w-3.5 shrink-0 transition-transform"
                  :class="grupoAberto(secao, grupo) ? 'rotate-90' : ''" />
                <span v-else class="w-3.5 shrink-0" />
                <span class="truncate">{{ grupo.nome }}</span>
              </span>
              <span class="text-right font-medium tabular-nums">{{ formatCurrencyBR(num(grupo.valor)) }}</span>
              <span class="text-right tabular-nums text-muted-foreground">{{ grupo.participacao.toFixed(1) }}%</span>
              <span class="text-right tabular-nums text-muted-foreground">{{ formatCurrencyBR(num(grupo.anterior)) }}</span>
              <span class="text-right text-xs font-semibold tabular-nums"
                :class="variacaoInfo(grupo.variacao, secao === 'despesas').cls.split(' ')[0]">
                {{ variacaoInfo(grupo.variacao, secao === 'despesas').label }}
              </span>
            </div>

            <template v-if="grupoAberto(secao, grupo)">
              <div v-for="sub in grupo.subcategorias" :key="`${grupo.nome}-${sub.nome}`"
                class="grid grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))] items-center gap-2 border-b bg-muted/20 px-3 py-1.5 text-xs">
                <span class="truncate pl-6 text-muted-foreground">{{ sub.nome }}</span>
                <span class="text-right tabular-nums">{{ formatCurrencyBR(num(sub.valor)) }}</span>
                <span class="text-right tabular-nums text-muted-foreground">{{ sub.participacao.toFixed(1) }}%</span>
                <span class="text-right tabular-nums text-muted-foreground">{{ formatCurrencyBR(num(sub.anterior)) }}</span>
                <span class="text-right font-semibold tabular-nums"
                  :class="variacaoInfo(sub.variacao, secao === 'despesas').cls.split(' ')[0]">
                  {{ variacaoInfo(sub.variacao, secao === 'despesas').label }}
                </span>
              </div>
            </template>
          </template>
        </div>
      </div>
    </section>

    <!-- Apuração do resultado -->
    <section v-if="!loading && temDados" class="rounded-xl border bg-card p-4">
      <div class="mb-3 flex items-center gap-2">
        <Scale class="h-4 w-4 shrink-0 text-primary" />
        <h3 class="text-sm font-semibold">Apuração do resultado</h3>
      </div>
      <div class="overflow-hidden rounded-lg border">
        <div class="flex items-center justify-between gap-3 border-b bg-background px-3 py-2 text-sm">
          <span class="text-muted-foreground">( + ) Receitas</span>
          <span class="font-medium tabular-nums text-emerald-600">
            {{ formatCurrencyBR(num(demonstrativo?.resumo.receitas)) }}
          </span>
        </div>
        <div class="flex items-center justify-between gap-3 border-b bg-background px-3 py-2 text-sm">
          <span class="text-muted-foreground">( - ) Despesas</span>
          <span class="font-medium tabular-nums text-rose-600">
            {{ formatCurrencyBR(num(demonstrativo?.resumo.despesas)) }}
          </span>
        </div>
        <div class="flex items-center justify-between gap-3 bg-muted/40 px-3 py-2.5 text-sm">
          <span class="font-semibold">( = ) Resultado do período</span>
          <strong class="tabular-nums"
            :class="num(demonstrativo?.resumo.resultado) >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            {{ formatCurrencyBR(num(demonstrativo?.resumo.resultado)) }}
            <span class="ml-2 text-xs font-normal text-muted-foreground">
              margem {{ demonstrativo?.resumo.margem.toFixed(1) }}%
            </span>
          </strong>
        </div>
      </div>
      <p class="mt-2 text-[11px] text-muted-foreground">
        Apurado no regime de {{ regime === 'CAIXA' ? 'caixa' : 'competência' }}. A análise vertical usa a receita do
        período como base 100%.
      </p>
    </section>

    <!-- Filtros -->
    <ModalView v-model:open="openModalFiltros" title="Filtros do demonstrativo" size="lg"
      description="Recorte o demonstrativo por período, conta, categoria e cliente.">
      <div class="grid gap-4 p-4 md:grid-cols-2">
        <div class="space-y-2 md:col-span-2">
          <Label class="text-sm font-medium">Atalhos rápidos</Label>
          <div class="flex flex-wrap gap-2">
            <Button v-for="preset in presets" :key="preset.key" type="button" variant="outline" size="sm"
              @click="applyPreset(preset.key); openModalFiltros = false">
              {{ preset.label }}
            </Button>
          </div>
        </div>

        <div class="space-y-2 md:col-span-2">
          <Label class="text-sm font-medium">Intervalo de datas</Label>
          <Calendarpicker class="w-full" :range="true" v-model="periodo" />
        </div>

        <div class="space-y-2">
          <Label class="text-sm font-medium">Conta financeira</Label>
          <Select v-model="filtros.contaFinanceiraId">
            <SelectTrigger><SelectValue placeholder="Todas as contas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              <SelectItem v-for="conta in contas" :key="conta.id" :value="String(conta.id)">
                {{ conta.nome }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label class="text-sm font-medium">Categoria</Label>
          <Select v-model="filtros.categoriaId">
            <SelectTrigger><SelectValue placeholder="Todas as categorias" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem v-for="categoria in categorias" :key="categoria.id" :value="String(categoria.id)">
                {{ categoria.nome }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2 md:col-span-2">
          <Label class="text-sm font-medium">Cliente / fornecedor</Label>
          <Select2Ajax id="demonstrativoCliente" v-model="filtros.clienteId" url="/clientes/select2" allowClear
            class="w-full" />
        </div>

        <div class="flex justify-end gap-2 md:col-span-2">
          <Button variant="outline" @click="limparFiltros">
            <X class="h-4 w-4" /> Limpar
          </Button>
          <Button variant="outline" @click="openModalFiltros = false">Cancelar</Button>
          <Button class="text-white" @click="aplicarFiltros">
            <Filter class="h-4 w-4" /> Aplicar filtros
          </Button>
        </div>
      </div>
    </ModalView>
  </div>
</template>
