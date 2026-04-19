<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  addMonths,
  format,
  isSameDay,
  isToday,
  isYesterday,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  ArrowRight,
  BadgePlus,
  BarChart,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Filter,
  HandCoins,
  Info,
  MoreVertical,
  PenLine,
  Plus,
  RotateCw,
  Search,
  TrendingDown,
  TrendingUp,
  Undo2,
  Wallet,
  X,
} from 'lucide-vue-next'
import { useToast } from 'vue-toastification'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { LancamentosRepository } from '@/repositories/lancamento-repository'
import type { CategoriaFinanceiro, ContasFinanceiro } from '@/types/schemas'
import { formatCurrencyBR } from '@/utils/formatters'
import { goBack, goTo } from '@/hooks/links'
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos'
import { useCobrancasFinanceirasStore } from '@/stores/lancamentos/useCobrancas'
import { useUiStore } from '@/stores/ui/uiStore'

import FormularioEfertivar from '../modais/FormularioEfertivar.vue'
import GerarCobranca from '../modais/GerarCobranca.vue'
import ModalParcela from '../modais/ModalParcela.vue'
import LancamentoModal from '../formulario/LancamentoModal.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue'
import FinanceiroCalendario from './FinanceiroCalendario.vue'

type FiltroTipo = 'TODOS' | 'RECEITA' | 'DESPESA'
type FiltroStatus = 'TODOS' | 'PAGO' | 'PENDENTE' | 'ATRASADO'
type FluxoMode = 'all' | 'receitas' | 'despesas'
type Preset = 'all' | 'today' | 'dueToday'

type LancamentoDia = {
  id: number
  uid: string
  parcelaId: number
  numero: number
  descricao: string
  categoria: string
  cliente: string | null
  conta: string | null
  valor: number
  tipo: 'RECEITA' | 'DESPESA'
  status: 'PAGO' | 'PENDENTE' | 'ATRASADO'
  pago: boolean
  vencimento: string | Date
  dataPagamento: string | Date | null
  formaPagamento: string | null
  cobrancaLink: string | null
}

type DiaLancamento = {
  dia: string | Date
  entradasPrevistas: number
  saidasPrevistas: number
  entradasRealizadas: number
  saidasRealizadas: number
  saldoRealizado: number
  saldoPrevisto: number
  lancamentos: LancamentoDia[]
}

type ResumoMensal = {
  saldoInicialPeriodo: number
  receitasPrevistas: number
  despesasPrevistas: number
  receitasRealizadas: number
  despesasRealizadas: number
  pendenteReceber: number
  pendentePagar: number
  saldoAtualDia: number
  saldoPossivelDia: number
  dataReferenciaSaldo: string | Date
}

type CalendarEvent = {
  id: string
  data: string | Date
  descricao: string
  valor: number
  tipo: 'RECEITA' | 'DESPESA'
  status: 'PAGO' | 'PENDENTE' | 'ATRASADO'
  subtitulo?: string
  payload: LancamentoDia
}

const props = withDefaults(
  defineProps<{
    mode?: FluxoMode
    title: string
    description: string
  }>(),
  {
    mode: 'all',
  },
)

const toast = useToast()
const store = useLancamentosStore()
const storeCobranca = useCobrancasFinanceirasStore()
const uiStore = useUiStore()

const carregando = ref(false)
const openModalLancar = ref(false)
const openModalFiltros = ref(false)
const openModalEvento = ref(false)
const activeTab = ref<'geral' | 'calendario' | 'resumo'>('geral')
const quickPreset = ref<Preset>('all')
const dias = ref<DiaLancamento[]>([])
const calendarioData = ref(new Date(store.currentMonth))
const eventoSelecionado = ref<LancamentoDia | null>(null)
const pendingLaunchDate = ref<Date | null>(null)
const resumo = ref<ResumoMensal>({
  saldoInicialPeriodo: 0,
  receitasPrevistas: 0,
  despesasPrevistas: 0,
  receitasRealizadas: 0,
  despesasRealizadas: 0,
  pendenteReceber: 0,
  pendentePagar: 0,
  saldoAtualDia: 0,
  saldoPossivelDia: 0,
  dataReferenciaSaldo: new Date(),
})
const contas = ref<ContasFinanceiro[]>([])
const categorias = ref<CategoriaFinanceiro[]>([])

const tipoTravado = computed<FiltroTipo | null>(() => {
  if (props.mode === 'receitas') return 'RECEITA'
  if (props.mode === 'despesas') return 'DESPESA'
  return null
})

const filtros = ref<{
  search: string
  tipo: FiltroTipo
  status: FiltroStatus
  contaFinanceiraId: string
  categoriaId: string
}>({
  search: '',
  tipo: tipoTravado.value ?? 'TODOS',
  status: 'TODOS',
  contaFinanceiraId: 'all',
  categoriaId: 'all',
})

const headerIcon = computed(() => {
  if (props.mode === 'receitas') return TrendingUp
  if (props.mode === 'despesas') return TrendingDown
  return CalendarDays
})

const launchLabel = computed(() => {
  if (props.mode === 'receitas') return 'Nova receita'
  if (props.mode === 'despesas') return 'Nova despesa'
  return 'Novo lançamento'
})

const calendarioTitulo = computed(() => {
  if (props.mode === 'receitas') return 'Calendário de contas a receber'
  if (props.mode === 'despesas') return 'Calendário de contas a pagar'
  return 'Calendário financeiro'
})

const calendarioDescricao = computed(() => {
  if (props.mode === 'receitas') return 'Leitura por vencimento com foco em recebimentos pendentes e realizados.'
  if (props.mode === 'despesas') return 'Leitura por vencimento com foco em pagamentos pendentes e realizados.'
  return 'Leitura consolidada por vencimento, com acesso rápido às ações financeiras.'
})

function getRequestFilters() {
  return {
    search: filtros.value.search.trim() || undefined,
    tipo: tipoTravado.value ?? filtros.value.tipo,
    status: filtros.value.status,
    contaFinanceiraId:
      filtros.value.contaFinanceiraId !== 'all' ? Number(filtros.value.contaFinanceiraId) : null,
    categoriaId: filtros.value.categoriaId !== 'all' ? Number(filtros.value.categoriaId) : null,
    saldoCompleto: Boolean(tipoTravado.value),
  }
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
    toast.warning('Não foi possível carregar contas e categorias do filtro.')
  }
}

async function carregarLancamentos(showFeedback = false) {
  try {
    carregando.value = true
    const response = await LancamentosRepository.getLancamentosMensais(
      store.currentMonth.toISOString().slice(0, 7),
      getRequestFilters(),
    )

    dias.value = response.data?.dias ?? []
    resumo.value = response.data?.resumo ?? resumo.value

    if (showFeedback) {
      toast.info('Fluxo financeiro atualizado!')
    }
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar o fluxo financeiro.')
  } finally {
    carregando.value = false
  }
}

function navigateMonth(direction: 'prev' | 'next') {
  store.currentMonth = direction === 'prev' ? subMonths(store.currentMonth, 1) : addMonths(store.currentMonth, 1)
  calendarioData.value = new Date(store.currentMonth)
  carregarLancamentos()
}

function clearFilters(reload = true) {
  filtros.value = {
    search: '',
    tipo: tipoTravado.value ?? 'TODOS',
    status: 'TODOS',
    contaFinanceiraId: 'all',
    categoriaId: 'all',
  }
  quickPreset.value = 'all'

  if (reload) {
    carregarLancamentos(true)
  }
}

function applyFilters() {
  openModalFiltros.value = false
  carregarLancamentos(true)
}

function applyPreset(preset: 'today' | 'due-today' | 'overdue' | 'receitas' | 'despesas' | 'reset') {
  if (preset === 'today') {
    store.currentMonth = new Date()
    calendarioData.value = new Date()
    quickPreset.value = 'today'
    return
  }

  if (preset === 'due-today') {
    store.currentMonth = new Date()
    calendarioData.value = new Date()
    quickPreset.value = 'dueToday'
    return
  }

  if (preset === 'overdue') {
    store.currentMonth = new Date()
    calendarioData.value = new Date()
    filtros.value.status = 'ATRASADO'
    quickPreset.value = 'all'
    return
  }

  if (preset === 'receitas' && !tipoTravado.value) {
    filtros.value.tipo = 'RECEITA'
    return
  }

  if (preset === 'despesas' && !tipoTravado.value) {
    filtros.value.tipo = 'DESPESA'
    return
  }

  if (preset === 'reset') {
    clearFilters(false)
  }
}

function handleNewLancamento() {
  if (tipoTravado.value === 'RECEITA') {
    openByTipo('RECEITA')
    return
  }

  if (tipoTravado.value === 'DESPESA') {
    openByTipo('DESPESA')
    return
  }

  openModalLancar.value = true
}

function openByTipo(tipo: 'RECEITA' | 'DESPESA') {
  store.form.tipo = tipo
  store.openSave({ presetDate: pendingLaunchDate.value })
  pendingLaunchDate.value = null
  openModalLancar.value = false
}

function handleQuickCreate(date: string | Date) {
  pendingLaunchDate.value = new Date(date)

  if (tipoTravado.value === 'RECEITA') {
    openByTipo('RECEITA')
    return
  }

  if (tipoTravado.value === 'DESPESA') {
    openByTipo('DESPESA')
    return
  }

  openModalLancar.value = true
}

function editarParcela(item: LancamentoDia) {
  store.idMutation = item.parcelaId
  store.formParcela = {
    valor: item.valor,
    vencimento: new Date(item.vencimento),
    vencimentoOriginal: new Date(item.vencimento),
    numero: item.numero,
    pago: item.pago,
    escopo: 'ATUAL',
  }
  store.openModalParcela = true
}

function gerarCobrancaParcela(idParcela: number, valor?: number) {
  storeCobranca.openSave({
    id: idParcela,
    tipo: 'parcela',
    valor,
  })
}

function efetivarParcela(id: number) {
  store.idMutation = id
  store.openModalEfetivar = true
}

async function estornarParcela(id: number) {
  try {
    await LancamentosRepository.estornarParcela(id)
    toast.success('Parcela estornada com sucesso')
    carregarLancamentos()
    openModalEvento.value = false
  } catch (error: any) {
    console.error(error)
    toast.error(error.response?.data?.message || 'Erro ao estornar a parcela')
  }
}

function openLinkCobranca(link?: string | null) {
  if (!link) return
  window.open(link, '_blank')
}

function openEventoCalendario(evento: any) {
  eventoSelecionado.value = evento.payload as LancamentoDia
  openModalEvento.value = true
}

function handleEfetivarFromModal(item: LancamentoDia) {
  openModalEvento.value = false
  efetivarParcela(item.parcelaId)
}

function handleEditarFromModal(item: LancamentoDia) {
  openModalEvento.value = false
  editarParcela(item)
}

function handleGerarCobrancaFromModal(item: LancamentoDia) {
  openModalEvento.value = false
  gerarCobrancaParcela(item.parcelaId, item.valor)
}

function getDayLabel(dateStr: string | Date) {
  const date = new Date(dateStr)
  if (isToday(date)) return 'Hoje'
  if (isYesterday(date)) return 'Ontem'
  return format(date, 'EEEE', { locale: ptBR })
}

function getReferenceLabel() {
  const referenceDate = new Date(resumo.value.dataReferenciaSaldo)
  return isSameDay(referenceDate, new Date())
    ? 'Saldo atual do dia'
    : `Saldo em ${format(referenceDate, 'dd/MM', { locale: ptBR })}`
}

function getContaNomeById(id: string) {
  return contas.value.find((conta) => String(conta.id) === id)?.nome || null
}

function getCategoriaNomeById(id: string) {
  return categorias.value.find((categoria) => String(categoria.id) === id)?.nome || null
}

function buildDiaWithFilteredLancamentos(dia: DiaLancamento, lancamentos: LancamentoDia[]) {
  const entradasPrevistas = lancamentos
    .filter((item) => item.tipo === 'RECEITA')
    .reduce((acc, item) => acc + Number(item.valor || 0), 0)
  const saidasPrevistas = lancamentos
    .filter((item) => item.tipo === 'DESPESA')
    .reduce((acc, item) => acc + Number(item.valor || 0), 0)
  const entradasRealizadas = lancamentos
    .filter((item) => item.tipo === 'RECEITA' && item.pago)
    .reduce((acc, item) => acc + Number(item.valor || 0), 0)
  const saidasRealizadas = lancamentos
    .filter((item) => item.tipo === 'DESPESA' && item.pago)
    .reduce((acc, item) => acc + Number(item.valor || 0), 0)

  return {
    ...dia,
    entradasPrevistas,
    saidasPrevistas,
    entradasRealizadas,
    saidasRealizadas,
    saldoRealizado: dia.saldoRealizado,
    saldoPrevisto: dia.saldoPrevisto,
    lancamentos,
  }
}

const filtrosAtivos = computed(() => {
  const items: string[] = []

  if (quickPreset.value === 'today') items.push('Visualização: hoje')
  if (quickPreset.value === 'dueToday') items.push('Visualização: vencendo hoje')
  if (filtros.value.search.trim()) items.push(`Busca: ${filtros.value.search.trim()}`)
  if (!tipoTravado.value && filtros.value.tipo !== 'TODOS') items.push(`Tipo: ${filtros.value.tipo}`)
  if (filtros.value.status !== 'TODOS') items.push(`Status: ${filtros.value.status}`)
  if (filtros.value.contaFinanceiraId !== 'all') {
    items.push(`Conta: ${getContaNomeById(filtros.value.contaFinanceiraId) || filtros.value.contaFinanceiraId}`)
  }
  if (filtros.value.categoriaId !== 'all') {
    items.push(
      `Categoria: ${getCategoriaNomeById(filtros.value.categoriaId) || filtros.value.categoriaId}`,
    )
  }

  return items
})

const displayedDias = computed(() => {
  if (quickPreset.value === 'all') return dias.value

  const hoje = new Date()

  return dias.value
    .map((dia) => {
      if (!isSameDay(new Date(dia.dia), hoje)) return null

      if (quickPreset.value === 'today') {
        return dia
      }

      const pendentesHoje = dia.lancamentos.filter((item) => !item.pago)
      if (!pendentesHoje.length) return null
      return buildDiaWithFilteredLancamentos(dia, pendentesHoje)
    })
    .filter((dia): dia is DiaLancamento => Boolean(dia))
})

const indicadores = computed(() => [
  {
    titulo: getReferenceLabel(),
    valor: resumo.value.saldoAtualDia,
    detalhe: 'Baseado no saldo realizado e efetivações confirmadas.',
    icone: Wallet,
    colorClass: 'text-blue-600 bg-blue-500/10',
  },
  {
    titulo: props.mode === 'receitas' ? 'Recebível possível do dia' : props.mode === 'despesas' ? 'Pagável possível do dia' : 'Saldo possível do dia',
    valor: resumo.value.saldoPossivelDia,
    detalhe: 'Considera o saldo atual somado ao fluxo previsto até a data de referência.',
    icone: TrendingUp,
    colorClass:
      resumo.value.saldoPossivelDia >= 0
        ? 'text-emerald-600 bg-emerald-500/10'
        : 'text-rose-600 bg-rose-500/10',
  },
  {
    titulo: 'Receitas previstas',
    valor: resumo.value.receitasPrevistas,
    detalhe: `Realizadas no período: ${formatCurrencyBR(resumo.value.receitasRealizadas)}`,
    icone: TrendingUp,
    colorClass: 'text-green-600 bg-green-500/10',
  },
  {
    titulo: 'Despesas previstas',
    valor: resumo.value.despesasPrevistas,
    detalhe: `Realizadas no período: ${formatCurrencyBR(resumo.value.despesasRealizadas)}`,
    icone: TrendingDown,
    colorClass: 'text-rose-600 bg-rose-500/10',
  },
  {
    titulo: 'A receber pendente',
    valor: resumo.value.pendenteReceber,
    detalhe: 'Parcelas de receita ainda abertas neste mês.',
    icone: CalendarDays,
    colorClass: 'text-amber-600 bg-amber-500/10',
  },
  {
    titulo: 'A pagar pendente',
    valor: resumo.value.pendentePagar,
    detalhe: 'Parcelas de despesa ainda abertas neste mês.',
    icone: HandCoins,
    colorClass: 'text-orange-600 bg-orange-500/10',
  },
])

const eventosCalendario = computed<CalendarEvent[]>(() =>
  displayedDias.value.flatMap((dia) =>
    dia.lancamentos.map((item) => ({
      id: `${item.parcelaId}-${item.id}`,
      data: item.vencimento,
      descricao: item.descricao,
      valor: Number(item.valor || 0),
      tipo: item.tipo,
      status: item.status,
      subtitulo: [item.categoria, item.conta, item.cliente].filter(Boolean).join(' • '),
      payload: item,
    })),
  ),
)

const mapStatus = (status: 'PAGO' | 'PENDENTE' | 'ATRASADO', tipo: 'RECEITA' | 'DESPESA') => {
  switch (status) {
    case 'PAGO':
      return tipo === 'RECEITA' ? 'RECEBIDO' : 'PAGO'
    case 'PENDENTE':
      return 'PENDENTE'
    case 'ATRASADO':
      return 'ATRASADO'
  }
}

watch(
  () => store.filters.update,
  () => carregarLancamentos(),
)

watch(
  calendarioData,
  (value) => {
    if (
      value.getMonth() !== store.currentMonth.getMonth() ||
      value.getFullYear() !== store.currentMonth.getFullYear()
    ) {
      store.currentMonth = startOfMonth(value)
      carregarLancamentos()
    }
  },
)

watch(
  () => store.currentMonth,
  (value) => {
    calendarioData.value = new Date(value)
  },
)

watch(openModalLancar, (value) => {
  if (!value) {
    pendingLaunchDate.value = null
  }
})

onMounted(async () => {
  filtros.value.tipo = tipoTravado.value ?? filtros.value.tipo
  calendarioData.value = new Date(store.currentMonth)
  await Promise.all([carregarOpcoes(), carregarLancamentos()])
})
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-4 pb-24 md:pb-0">
    <div class="rounded-lg border bg-card p-4 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center justify-center lg:justify-between">
        <div class="space-y-1">
          <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
            <component :is="headerIcon" class="h-6 w-6 text-primary dark:text-blue-500" />
            {{ title }}
          </h2>
          <p class="text-xs text-muted-foreground truncate">
            {{ description }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <Button variant="outline" size="icon" @click="navigateMonth('prev')">
            <ArrowLeft class="h-4 w-4" />
          </Button>
          <div class="min-w-max text-center">
            <p class="text-base font-semibold capitalize text-foreground">
              {{ format(store.currentMonth, 'MMMM yyyy', { locale: ptBR }) }}
            </p>
            <p class="text-xs text-muted-foreground">
              Saldo inicial: {{ formatCurrencyBR(resumo.saldoInicialPeriodo) }}
            </p>
          </div>
          <Button variant="outline" size="icon" @click="navigateMonth('next')">
            <ArrowRight class="h-4 w-4" />
          </Button>
          <Button variant="outline" @click="openModalFiltros = true">
            <Filter class="h-4 w-4" /> Filtros
          </Button>
          <Button class="dark:text-white" @click="handleNewLancamento">
            <BadgePlus class="h-4 w-4" /> {{ launchLabel }}
          </Button>
          <Button variant="outline" size="icon" @click="carregarLancamentos(true)">
            <RotateCw class="h-4 w-4" :class="{ 'animate-spin': carregando }" />
          </Button>
        </div>
      </div>

      <div v-if="filtrosAtivos.length" class="mt-3 flex flex-wrap gap-2">
        <Badge v-for="item in filtrosAtivos" :key="item" variant="outline" class="text-xs">
          {{ item }}
        </Badge>
      </div>
    </div>

    <Tabs v-model="activeTab" default-value="geral" class="space-y-2">
      <div class="overflow-x-auto">
        <TabsList class="inline-flex w-max min-w-full justify-start gap-2 rounded-md border bg-card p-1">
          <TabsTrigger value="geral" class="px-4">
            <span class="flex items-center gap-2">
              <BarChart class="h-4 w-4" />Geral
            </span>
          </TabsTrigger>
          <TabsTrigger value="calendario" class="px-4">
            <span class="flex items-center gap-2">
              <CalendarDays class="h-4 w-4" />Calendário
            </span>
          </TabsTrigger>
          <TabsTrigger value="resumo" class="px-4">
            <span class="flex items-center gap-2">
              <FileText class="h-4 w-4" />Resumo
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="geral" class="space-y-4">
        <div v-if="carregando" class="flex flex-col items-center justify-center py-16 text-center">
          <RotateCw class="mb-3 h-8 w-8 animate-spin text-primary" />
          <p class="text-sm text-muted-foreground">Carregando fluxo financeiro...</p>
        </div>

        <div v-else-if="!displayedDias.length" class="rounded-2xl border bg-card p-10 text-center shadow-sm">
          <CalendarDays class="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 class="text-lg font-semibold text-foreground">Nenhum lançamento encontrado</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            Ajuste os filtros ou crie um novo lançamento para este período.
          </p>
          <Button class="mt-4" @click="handleNewLancamento">{{ launchLabel }}</Button>
        </div>

        <div v-else class="space-y-4">
          <div v-for="dia in displayedDias" :key="String(dia.dia)" class="space-y-0">
            <div
              class="flex flex-row relative gap-2 rounded-t-md rounded-bl-md border bg-card px-3 py-1.5 shadow-sm md:flex-row md:items-center justify-between border-none">
              <div class="absolute left-0 top-0 h-full w-1 rounded-l-md"
                  :class="'bg-blue-500'" />
              <div>
                <p class="text-sm font-semibold capitalize text-foreground">{{ getDayLabel(dia.dia) }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ format(new Date(dia.dia), "dd 'de' MMMM", { locale: ptBR }) }}
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <Badge class="border-0 py-2 flex gap-1 shadow-none bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-200">
                  <span class="hidden md:inline-flex">Realizado</span> {{ formatCurrencyBR(dia.saldoRealizado) }}
                </Badge>
                <Badge class="border-0 py-2 flex gap-1 shadow-none bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-200">
                  <span class="hidden md:inline-flex">Previsto</span> {{ formatCurrencyBR(dia.saldoPrevisto) }}
                </Badge>
                <Button variant="outline" size="icon" class="h-8 w-8" @click="handleQuickCreate(dia.dia)">
                  <Plus class="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div class="grid gap-0 md:pl-4">
              <div v-for="item in dia.lancamentos" :key="item.parcelaId"
                class="relative overflow-hidden border-t bg-card px-3 py-1 shadow-sm fist:rounded-t-none last:rounded-b-md">
                <div class="absolute left-0 top-0 h-full w-1"
                  :class="item.tipo === 'DESPESA' ? 'bg-rose-500' : 'bg-emerald-500'" />

                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0 flex-1 space-y-1.5 pl-1">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <Badge v-if="item.cobrancaLink" variant="outline" class="px-2 py-0 text-[10px]">Cobrança</Badge>
                    </div>

                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="truncate text-sm font-semibold text-foreground">{{ item.descricao }}</p>
                        <p class="truncate text-xs text-muted-foreground">
                          {{ item.categoria }}<span v-if="item.conta"> • {{ item.conta }}</span><span
                            v-if="item.cliente"> • {{ item.cliente }}</span>
                        </p>
                        <p class="truncate text-[11px] text-muted-foreground">
                          Parcela {{ item.numero === 0 ? 'Entrada' : item.numero }} • Venc. {{ format(new
                            Date(item.vencimento), 'dd/MM/yyyy', { locale: ptBR }) }}
                          <span v-if="item.dataPagamento"> • Pgto {{ format(new Date(item.dataPagamento), 'dd/MM/yyyy',
                            { locale: ptBR }) }}</span>
                          <span v-if="item.formaPagamento"> • {{ item.formaPagamento }}</span>
                        </p>
                      </div>

                      <div class="flex flex-col gap-1 text-right">
                        <p :class="item.tipo === 'DESPESA' ? 
                        'text-rose-600 dark:text-rose-400' : 
                        'text-emerald-600 dark:text-emerald-400'"
                          class="text-md font-semibold px-2 rounded-md">
                          {{ formatCurrencyBR(item.valor) }}
                        </p>
                        <div class="flex flex-wrap justify-end gap-1">
                          <span class="border shadow-none rounded-sm border-dashed px-2 py-0 text-[10px]"
                            :class="item.status === 'PAGO' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300 dark:border-blue-950' 
                            : item.status === 'ATRASADO' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-950' 
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-950'">
                            {{ mapStatus(item.status, item.tipo) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-1">
                    <div class="hidden items-center gap-1 lg:flex">
                      <Button v-if="!item.pago" variant="outline" size="icon" class="h-8 w-8" @click="editarParcela(item)">
                        <PenLine class="h-4 w-4" />
                      </Button>
                      <Button v-if="!item.pago" size="icon" class="h-8 w-8 dark:text-white" @click="efetivarParcela(item.parcelaId)">
                        <CheckCircle2 class="h-4 w-4" />
                      </Button>
                      <Button v-else size="icon" class="h-8 w-8 bg-warning text-white hover:bg-warning/80"
                        @click="estornarParcela(item.parcelaId)">
                        <Undo2 class="h-4 w-4" />
                      </Button>
                      <Button v-if="!item.pago && item.tipo === 'RECEITA' && !item.cobrancaLink" size="icon"
                        class="h-8 w-8 bg-success text-white hover:bg-success/80"
                        @click="gerarCobrancaParcela(item.parcelaId, item.valor)">
                        <CircleDollarSign class="h-4 w-4" />
                      </Button>
                      <Button v-if="item.cobrancaLink" variant="outline" size="icon" class="h-8 w-8"
                        @click="openLinkCobranca(item.cobrancaLink)">
                        <Info class="h-4 w-4" />
                      </Button>
                      <RouterLink :to="`/financeiro/detalhes?id=${item.id}`">
                        <Button variant="outline" size="icon" class="h-8 w-8">
                          <Info class="h-4 w-4" />
                        </Button>
                      </RouterLink>
                    </div>

                    <DropdownMenu v-if="uiStore.isMobile">
                      <DropdownMenuTrigger as-child>
                        <Button variant="outline" size="icon" class="h-8 w-8">
                          <MoreVertical class="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" class="w-44">
                        <RouterLink :to="`/financeiro/detalhes?id=${item.id}`">
                          <DropdownMenuItem>
                            <Info class="mr-2 h-4 w-4" /> Detalhes
                          </DropdownMenuItem>
                        </RouterLink>
                        <DropdownMenuItem v-if="!item.pago" @click="editarParcela(item)">
                          <PenLine class="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem v-if="!item.pago" @click="efetivarParcela(item.parcelaId)">
                          <CheckCircle2 class="mr-2 h-4 w-4" /> {{ item.tipo === 'DESPESA' ? 'Pagar' : 'Receber' }}
                        </DropdownMenuItem>
                        <DropdownMenuItem v-else @click="estornarParcela(item.parcelaId)">
                          <Undo2 class="mr-2 h-4 w-4" /> Estornar
                        </DropdownMenuItem>
                        <DropdownMenuItem v-if="!item.pago && item.tipo === 'RECEITA' && !item.cobrancaLink"
                          @click="gerarCobrancaParcela(item.parcelaId, item.valor)">
                          <CircleDollarSign class="mr-2 h-4 w-4" /> Cobrança
                        </DropdownMenuItem>
                        <DropdownMenuItem v-if="item.cobrancaLink" @click="openLinkCobranca(item.cobrancaLink)">
                          <Info class="mr-2 h-4 w-4" /> Abrir cobrança
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="calendario" class="space-y-4">
        <FinanceiroCalendario v-model:selected-date="calendarioData" :eventos="eventosCalendario"
          :title="calendarioTitulo" :description="calendarioDescricao" @event-click="openEventoCalendario" />
      </TabsContent>

      <TabsContent value="resumo">
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card v-for="item in indicadores" :key="item.titulo" class="rounded-xl shadow transition">
            <CardHeader class="p-2 px-4">
              <CardTitle class="flex flex-row items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <div class="rounded-md p-2" :class="item.colorClass">
                  <component :is="item.icone" class="h-4 w-4" />
                </div>
                <span>{{ item.titulo }}</span>
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-1 px-4 pb-2">
              <p class="text-base font-semibold text-gray-700 dark:text-gray-200 md:text-lg">
                {{ formatCurrencyBR(item.valor) }}
              </p>
              <p class="text-xs leading-relaxed text-muted-foreground truncate" :title="item.detalhe">{{ item.detalhe }}</p>
            </CardContent>
          </Card>
        </section>
      </TabsContent>
    </Tabs>

    <div v-if="uiStore.isMobile" class="fixed bottom-0 left-0 right-0 z-20 border-t bg-card/95 px-3 py-3 backdrop-blur">
      <div class="grid grid-cols-3 gap-2">
        <Button variant="outline" class="w-full" @click="goTo('/financeiro/lancamentos')">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <Button class="w-full" @click="handleNewLancamento">
          <BadgePlus class="h-4 w-4" />
        </Button>
        <Button variant="outline" class="w-full" @click="goBack">
          <Undo2 class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <ModalView v-if="!tipoTravado" v-model:open="openModalLancar" title="Novo lançamento" size="sm">
      <div class="grid grid-cols-2 gap-4 p-4">
        <button
          class="rounded-2xl border bg-emerald-50 p-4 text-left transition hover:bg-emerald-100 dark:bg-emerald-950/30"
          @click="openByTipo('RECEITA')">
          <TrendingUp class="mb-2 h-6 w-6 text-emerald-600" />
          <p class="font-medium text-foreground">Receita</p>
          <p class="text-xs text-muted-foreground">Registrar entrada financeira.</p>
        </button>
        <button class="rounded-2xl border bg-rose-50 p-4 text-left transition hover:bg-rose-100 dark:bg-rose-950/30"
          @click="openByTipo('DESPESA')">
          <TrendingDown class="mb-2 h-6 w-6 text-rose-600" />
          <p class="font-medium text-foreground">Despesa</p>
          <p class="text-xs text-muted-foreground">Registrar saída financeira.</p>
        </button>
      </div>
    </ModalView>

    <ModalView v-model:open="openModalEvento" :title="eventoSelecionado?.descricao || 'Lançamento do calendário'"
      size="lg">
      <div v-if="eventoSelecionado" class="space-y-4 p-4">
        <div class="flex flex-wrap gap-2">
          <Badge class="border-0"
            :class="eventoSelecionado.tipo === 'DESPESA' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'">
            {{ eventoSelecionado.tipo === 'DESPESA' ? 'Despesa' : 'Receita' }}
          </Badge>
          <Badge class="border-0"
            :class="eventoSelecionado.status === 'PAGO' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : eventoSelecionado.status === 'ATRASADO' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'">
            {{ eventoSelecionado.status }}
          </Badge>
          <Badge v-if="eventoSelecionado.cobrancaLink" variant="outline">Cobrança disponível</Badge>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <div class="rounded-xl border p-3">
            <p class="text-xs uppercase tracking-wide text-muted-foreground">Valor</p>
            <p class="mt-1 text-lg font-semibold"
              :class="eventoSelecionado.tipo === 'DESPESA' ? 'text-rose-600' : 'text-emerald-600'">
              {{ eventoSelecionado.tipo === 'DESPESA' ? '-' : '+' }}{{ formatCurrencyBR(eventoSelecionado.valor) }}
            </p>
          </div>
          <div class="rounded-xl border p-3">
            <p class="text-xs uppercase tracking-wide text-muted-foreground">Vencimento</p>
            <p class="mt-1 text-sm font-medium text-foreground">
              {{ format(new Date(eventoSelecionado.vencimento), 'dd/MM/yyyy', { locale: ptBR }) }}
            </p>
          </div>
          <div class="rounded-xl border p-3">
            <p class="text-xs uppercase tracking-wide text-muted-foreground">Categoria</p>
            <p class="mt-1 text-sm text-foreground">{{ eventoSelecionado.categoria }}</p>
          </div>
          <div class="rounded-xl border p-3">
            <p class="text-xs uppercase tracking-wide text-muted-foreground">Conta / contato</p>
            <p class="mt-1 text-sm text-foreground">
              {{ [eventoSelecionado.conta, eventoSelecionado.cliente].filter(Boolean).join(' • ') || 'Não informado' }}
            </p>
          </div>
          <div class="rounded-xl border p-3 md:col-span-2">
            <p class="text-xs uppercase tracking-wide text-muted-foreground">Pagamento</p>
            <p class="mt-1 text-sm text-foreground">
              <span v-if="eventoSelecionado.dataPagamento">
                {{ format(new Date(eventoSelecionado.dataPagamento), 'dd/MM/yyyy', { locale: ptBR }) }}
              </span>
              <span v-else>Pendente</span>
              <span v-if="eventoSelecionado.formaPagamento"> • {{ eventoSelecionado.formaPagamento }}</span>
            </p>
          </div>
        </div>

        <div class="flex flex-wrap justify-end gap-2">
          <RouterLink :to="`/financeiro/detalhes?id=${eventoSelecionado.id}`">
            <Button variant="outline" @click="openModalEvento = false">
              <Info class="h-4 w-4" /> Ver detalhes
            </Button>
          </RouterLink>
          <Button variant="outline" @click="handleEditarFromModal(eventoSelecionado)">
            <PenLine class="h-4 w-4" /> Editar parcela
          </Button>
          <Button v-if="!eventoSelecionado.pago" @click="handleEfetivarFromModal(eventoSelecionado)">
            <CheckCircle2 class="h-4 w-4" /> {{ eventoSelecionado.tipo === 'DESPESA' ? 'Pagar' : 'Receber' }}
          </Button>
          <Button v-else class="bg-warning text-white hover:bg-warning/80"
            @click="estornarParcela(eventoSelecionado.parcelaId)">
            <Undo2 class="h-4 w-4" /> Estornar
          </Button>
          <Button
            v-if="!eventoSelecionado.pago && eventoSelecionado.tipo === 'RECEITA' && !eventoSelecionado.cobrancaLink"
            class="bg-success text-white hover:bg-success/80" @click="handleGerarCobrancaFromModal(eventoSelecionado)">
            <CircleDollarSign class="h-4 w-4" /> Cobrança
          </Button>
          <Button v-if="eventoSelecionado.cobrancaLink" variant="outline"
            @click="openLinkCobranca(eventoSelecionado.cobrancaLink)">
            <Info class="h-4 w-4" /> Abrir cobrança
          </Button>
        </div>
      </div>
    </ModalView>

    <ModalView v-model:open="openModalFiltros" title="Filtros do fluxo financeiro" size="lg">
      <div class="grid gap-4 p-4 md:grid-cols-2">
        <div class="space-y-2 md:col-span-2">
          <label class="text-sm font-medium">Atalhos rápidos</label>
          <div class="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" @click="applyPreset('today')">Hoje</Button>
            <Button type="button" variant="outline" size="sm" @click="applyPreset('due-today')">Vencendo hoje</Button>
            <Button type="button" variant="outline" size="sm" @click="applyPreset('overdue')">Atrasados</Button>
            <Button v-if="!tipoTravado" type="button" variant="outline" size="sm"
              @click="applyPreset('receitas')">Somente receitas</Button>
            <Button v-if="!tipoTravado" type="button" variant="outline" size="sm"
              @click="applyPreset('despesas')">Somente despesas</Button>
          </div>
        </div>

        <div class="space-y-2 md:col-span-2">
          <label class="text-sm font-medium">Busca</label>
          <div class="relative">
            <Search
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input v-model="filtros.search" class="pl-9" placeholder="Descrição, UID, categoria ou cliente" />
          </div>
        </div>

        <div class="space-y-2" v-if="!tipoTravado">
          <label class="text-sm font-medium">Tipo</label>
          <Select v-model="filtros.tipo">
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os tipos</SelectItem>
              <SelectItem value="RECEITA">Somente receitas</SelectItem>
              <SelectItem value="DESPESA">Somente despesas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Status</label>
          <Select v-model="filtros.status">
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os status</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="ATRASADO">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Conta financeira</label>
          <Select v-model="filtros.contaFinanceiraId">
            <SelectTrigger>
              <SelectValue placeholder="Conta financeira" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              <SelectItem v-for="conta in contas" :key="conta.id" :value="String(conta.id)">
                {{ conta.nome }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Categoria</label>
          <Select v-model="filtros.categoriaId">
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem v-for="categoria in categorias" :key="categoria.id" :value="String(categoria.id)">
                {{ categoria.nome }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex justify-end gap-2 md:col-span-2">
          <Button variant="outline" @click="clearFilters(false)">
            <X class="h-4 w-4" /> Limpar
          </Button>
          <Button variant="outline" @click="openModalFiltros = false">Cancelar</Button>
          <Button @click="applyFilters">
            <Filter class="h-4 w-4" /> Aplicar filtros
          </Button>
        </div>
      </div>
    </ModalView>

    <FormularioEfertivar @success="carregarLancamentos" />
    <GerarCobranca />
    <ModalParcela />
    <LancamentoModal />
    <ClientesModal />
  </div>
</template>
