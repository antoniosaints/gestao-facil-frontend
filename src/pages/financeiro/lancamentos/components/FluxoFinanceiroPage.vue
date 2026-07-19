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
  ExternalLink,
  FileText,
  Filter,
  HandCoins,
  Info,
  MoreVertical,
  PenLine,
  Plus,
  RotateCw,
  Search,
  Send,
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
import { InadimplenciaRepository } from '@/repositories/inadimplencia-repository'
import type { CategoriaFinanceiro, ContasFinanceiro } from '@/types/schemas'
import { formatCurrencyBR } from '@/utils/formatters'
import { goBack } from '@/hooks/links'
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos'
import { useCobrancasFinanceirasStore } from '@/stores/lancamentos/useCobrancas'
import { useUiStore } from '@/stores/ui/uiStore'
import { runWithPreservedWindowScroll } from '@/composables/usePreservedWindowScroll'

import FormularioEfertivar from '../modais/FormularioEfertivar.vue'
import GerarCobranca from '../modais/GerarCobranca.vue'
import ModalParcela from '../modais/ModalParcela.vue'
import LancamentoModal from '../formulario/LancamentoModal.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue'
import FinanceiroCalendario from './FinanceiroCalendario.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import CobrancaRapidaModal from '../../inadimplencia/CobrancaRapidaModal.vue'

type FiltroTipo = 'TODOS' | 'RECEITA' | 'DESPESA'
type FiltroStatus = 'TODOS' | 'PAGO' | 'PENDENTE' | 'ATRASADO'
type FluxoMode = 'all' | 'receitas' | 'despesas'
type Preset = 'all' | 'today' | 'dueToday'
type CarregarLancamentosOptions = {
  preserveScroll?: boolean
  silent?: boolean
}

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
const cobrancaRapidaItem = ref<LancamentoDia | null>(null)
const cobrancaRapidaOpen = ref(false)
const cobrancaRapidaSending = ref(false)
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
const mensagemCobrancaPadrao = ref('')

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
    const [responseContas, responseCategorias, inadimplenciaConfig] = await Promise.all([
      LancamentosRepository.listarContas(),
      LancamentosRepository.listarCategorias(),
      InadimplenciaRepository.getConfig(),
    ])

    contas.value = responseContas.data ?? []
    categorias.value = responseCategorias.data ?? []
    mensagemCobrancaPadrao.value = inadimplenciaConfig.mensagemModelo
  } catch (error) {
    console.error(error)
    toast.warning('Não foi possível carregar contas e categorias do filtro.')
  }
}

async function carregarLancamentos(showFeedback = false, options: CarregarLancamentosOptions = {}) {
  const load = async () => {
    try {
      if (!options.silent) {
        carregando.value = true
      }

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
      if (!options.silent) {
        carregando.value = false
      }
    }
  }

  if (options.preserveScroll) {
    await runWithPreservedWindowScroll(load)
    return
  }

  await load()
}

function recarregarMantendoPosicao(showFeedback = false) {
  return carregarLancamentos(showFeedback, { preserveScroll: true, silent: true })
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
    openModalEvento.value = false
    await recarregarMantendoPosicao()
  } catch (error: any) {
    console.error(error)
    toast.error(error.response?.data?.message || 'Erro ao estornar a parcela')
  }
}

function openLinkCobranca(link?: string | null) {
  if (!link) return
  window.open(link, '_blank')
}

function openResumoParcela(item: LancamentoDia) {
  eventoSelecionado.value = item
  openModalEvento.value = true
}

function abrirCobrancaRapida(item: LancamentoDia) {
  openModalEvento.value = false
  cobrancaRapidaItem.value = item
  cobrancaRapidaOpen.value = true
}

async function enviarCobrancaRapida(mensagem?: string) {
  if (!cobrancaRapidaItem.value) return

  try {
    cobrancaRapidaSending.value = true
    await InadimplenciaRepository.enviarAgora(cobrancaRapidaItem.value.id, mensagem)
    toast.success('Cobrança colocada na fila para envio imediato.')
    cobrancaRapidaOpen.value = false
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Falha ao enfileirar a cobrança.')
  } finally {
    cobrancaRapidaSending.value = false
  }
}

function openEventoCalendario(evento: any) {
  openResumoParcela(evento.payload as LancamentoDia)
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
  () => recarregarMantendoPosicao(),
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
  <div class="max-w-7xl space-y-2 pb-8 md:pb-0">
    <div class="rounded-lg">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center justify-center lg:justify-between">
        <div class="space-y-1">
          <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
            <component :is="headerIcon" class="h-5 w-5 lg:h-6 lg:w-6 text-primary dark:text-blue-500" />
            {{ title }}
          </h2>
          <div v-if="filtrosAtivos.length" class="text-xs text-muted-foreground truncate hidden lg:block">
            <Badge v-for="item in filtrosAtivos" :key="item" variant="outline" class="text-xs">
              {{ item }}
            </Badge>
          </div>
          <div v-else class="text-sm text-muted-foreground truncate hidden lg:block max-w-[30rem]">
            <span>{{ description }}</span>
          </div>
        </div>

        <div class="hidden lg:flex flex-wrap items-center justify-center lg:justify-between gap-2 self-center lg:self-auto">
          <Button variant="outline" size="icon" class="hidden lg:inline-flex" v-tooltip="'Mês anterior'"
            @click="navigateMonth('prev')">
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
          <Button variant="outline" size="icon" class="hidden lg:inline-flex" v-tooltip="'Próximo mês'"
            @click="navigateMonth('next')">
            <ArrowRight class="h-4 w-4" />
          </Button>
          <Button variant="outline" class="hidden lg:inline-flex" @click="openModalFiltros = true">
            <Filter class="h-4 w-4" /> <span>Filtrar</span>
          </Button>
          <Button class="dark:text-white hidden lg:inline-flex" @click="handleNewLancamento">
            <BadgePlus class="h-4 w-4" /> {{ launchLabel }}
          </Button>
          <Button class="hidden lg:inline-flex" variant="outline" size="icon" v-tooltip="'Atualizar'"
            @click="recarregarMantendoPosicao(true)">
            <RotateCw class="h-4 w-4" :class="{ 'animate-spin': carregando }" />
          </Button>
        </div>
      </div>
    </div>

    <Tabs v-model="activeTab" default-value="geral" class="space-y-2">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="relative w-full sm:max-w-xs">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input v-model="filtros.search" class="pl-9" placeholder="Buscar lançamento..."
            @keydown.enter.prevent="carregarLancamentos(true)" />
        </div>

        <div class="overflow-x-auto">
          <TabsList class="inline-flex w-full md:w-max justify-start gap-2 rounded-md border p-1">
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
              <div class="absolute left-0 top-0 h-full w-1 rounded-l-md" :class="'bg-blue-500'" />
              <div>
                <p class="text-sm font-semibold capitalize text-foreground">{{ getDayLabel(dia.dia) }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ format(new Date(dia.dia), "dd 'de' MMMM", { locale: ptBR }) }}
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <Badge
                  class="border-0 py-2 flex gap-1 shadow-none bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-200">
                  <span class="hidden md:inline-flex">Realizado</span> {{ formatCurrencyBR(dia.saldoRealizado) }}
                </Badge>
                <Badge
                  class="border-0 py-2 flex gap-1 shadow-none bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-200">
                  <span class="hidden md:inline-flex">Previsto</span> {{ formatCurrencyBR(dia.saldoPrevisto) }}
                </Badge>
                <Button variant="outline" size="icon" class="h-8 w-8" v-tooltip="'Adicionar lançamento'"
                  @click="handleQuickCreate(dia.dia)">
                  <Plus class="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div class="grid gap-0 md:pl-4">
              <div v-for="item in dia.lancamentos" :key="item.parcelaId" role="button" tabindex="0"
                :data-testid="`lancamento-row-${item.parcelaId}`"
                class="relative cursor-pointer overflow-hidden border-t bg-card px-3 py-1 shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 fist:rounded-t-none last:rounded-b-md"
                @click="openResumoParcela(item)" @keydown.enter.prevent="openResumoParcela(item)"
                @keydown.space.prevent="openResumoParcela(item)">
                <div class="absolute left-0 top-0 h-full w-1"
                  :class="item.tipo === 'DESPESA' ? 'bg-rose-500' : 'bg-emerald-500'" />

                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0 flex-1 space-y-1.5 pl-1">
                    <div v-if="item.cobrancaLink" class="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" class="px-2 py-0 text-[10px]">Cobrança</Badge>
                    </div>

                    <div class="flex items-center justify-between gap-3">
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
                          'text-emerald-600 dark:text-emerald-400'" class="text-md font-semibold px-2 rounded-md">
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

                  <div class="flex items-center gap-1" @click.stop>
                    <div class="hidden items-center gap-1 lg:flex">
                      <Button v-if="!item.pago" variant="outline" size="icon" class="h-8 w-8" v-tooltip="'Editar'"
                        :data-testid="`editar-parcela-${item.parcelaId}`" @click="editarParcela(item)">
                        <PenLine class="h-4 w-4" />
                      </Button>
                      <Button v-if="!item.pago" size="icon" class="h-8 w-8 dark:text-white"
                        v-tooltip="item.tipo === 'DESPESA' ? 'Pagar' : 'Receber'"
                        :data-testid="`efetivar-parcela-${item.parcelaId}`" @click="efetivarParcela(item.parcelaId)">
                        <CheckCircle2 class="h-4 w-4" />
                      </Button>
                      <Button v-else size="icon" class="h-8 w-8 bg-warning text-white hover:bg-warning/80"
                        v-tooltip="'Estornar'"
                        :data-testid="`estornar-parcela-${item.parcelaId}`" @click="estornarParcela(item.parcelaId)">
                        <Undo2 class="h-4 w-4" />
                      </Button>
                      <Button
                        v-if="uiStore.canCreateCharge && !item.pago && item.tipo === 'RECEITA' && !item.cobrancaLink"
                        size="icon" class="h-8 w-8 bg-success text-white hover:bg-success/80" v-tooltip="'Gerar cobrança'"
                        :data-testid="`cobranca-parcela-${item.parcelaId}`"
                        @click="gerarCobrancaParcela(item.parcelaId, item.valor)">
                        <CircleDollarSign class="h-4 w-4" />
                      </Button>
                      <Button v-if="item.cobrancaLink" variant="outline" size="icon" class="h-8 w-8"
                        v-tooltip="'Abrir cobrança'"
                        :data-testid="`abrir-cobranca-${item.parcelaId}`" @click="openLinkCobranca(item.cobrancaLink)">
                        <ExternalLink class="h-4 w-4" />
                      </Button>
                      <Button v-if="props.mode === 'receitas' && !item.pago" variant="outline" size="icon" class="h-8 w-8"
                        v-tooltip="'Enviar cobrança pelo WhatsApp'"
                        :data-testid="`enviar-cobranca-${item.parcelaId}`" @click="abrirCobrancaRapida(item)">
                        <Send class="h-4 w-4" />
                      </Button>
                      <RouterLink :to="`/financeiro/detalhes?id=${item.id}`">
                        <Button variant="outline" size="icon" class="h-8 w-8" v-tooltip="'Detalhes'">
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
                        <DropdownMenuItem
                          v-if="uiStore.canCreateCharge && !item.pago && item.tipo === 'RECEITA' && !item.cobrancaLink"
                          @click="gerarCobrancaParcela(item.parcelaId, item.valor)">
                          <CircleDollarSign class="mr-2 h-4 w-4" /> Cobrança
                        </DropdownMenuItem>
                        <DropdownMenuItem v-if="props.mode === 'receitas' && !item.pago"
                          @click="abrirCobrancaRapida(item)">
                          <Send class="mr-2 h-4 w-4" /> Enviar pelo WhatsApp
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
        <section class="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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
              <p class="text-xs leading-relaxed text-muted-foreground truncate" :title="item.detalhe">{{ item.detalhe }}
              </p>
            </CardContent>
          </Card>
        </section>
      </TabsContent>
    </Tabs>

    <div v-if="uiStore.isMobile"
      class="fixed inset-x-0 bottom-20 z-20 flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-2 text-xs dark:border-border-dark dark:bg-card-dark md:hidden">
      <span class="font-semibold capitalize text-foreground">
        {{ format(store.currentMonth, 'MMMM yyyy', { locale: ptBR }) }}
      </span>
      <div class="flex items-center gap-4">
        <span class="text-muted-foreground">
          Inicial <span class="font-semibold text-foreground">{{ formatCurrencyBR(resumo.saldoInicialPeriodo) }}</span>
        </span>
        <span class="text-muted-foreground">
          Esperado <span class="font-semibold text-foreground">{{ formatCurrencyBR(resumo.saldoPossivelDia) }}</span>
        </span>
      </div>
    </div>

    <MobileBottomBar v-if="uiStore.isMobile">
      <button type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="navigateMonth('prev')">
        <ArrowLeft class="h-5 w-5" />
        <span class="text-xs">Anterior</span>
      </button>
      <button type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="openModalFiltros = true">
        <Filter class="h-5 w-5" />
        <span class="text-xs">Filtrar</span>
      </button>
      <button type="button"
        class="-mt-4 flex flex-col items-center text-primary"
        @click="handleNewLancamento">
        <span class="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg dark:text-white">
          <BadgePlus class="h-6 w-6" />
        </span>
        <span class="mt-0.5 text-xs">Novo</span>
      </button>
      <button type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="goBack">
        <Undo2 class="h-5 w-5" />
        <span class="text-xs">Voltar</span>
      </button>
      <button type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="navigateMonth('next')">
        <ArrowRight class="h-5 w-5" />
        <span class="text-xs">Próximo</span>
      </button>
    </MobileBottomBar>

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

    <ModalView v-model:open="openModalEvento" :title="eventoSelecionado?.descricao || 'Resumo da parcela'" size="lg">
      <div v-if="eventoSelecionado" class="space-y-4 p-4 -mt-6">
        <div class="flex flex-wrap gap-2 -mb-2">
          <span class="border border-dashed border-muted shadow-none px-2 rounded-sm text-sm"
            :class="eventoSelecionado.tipo === 'DESPESA' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'">
            {{ eventoSelecionado.tipo === 'DESPESA' ? 'Despesa' : 'Receita' }}
          </span>
          <span class="border border-dashed border-muted shadow-none px-2 rounded-sm text-sm"
            :class="eventoSelecionado.status === 'PAGO' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : eventoSelecionado.status === 'ATRASADO' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'">
            {{ eventoSelecionado.status }}
          </span>
          <Badge v-if="eventoSelecionado.cobrancaLink" variant="outline">Cobrança disponível</Badge>
        </div>

        <!-- Valor em destaque -->
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4">
          <div>
            <p class="text-xs uppercase tracking-wide text-muted-foreground">Valor da parcela</p>
            <p class="text-2xl font-bold"
              :class="eventoSelecionado.tipo === 'DESPESA' ? 'text-rose-600' : 'text-emerald-600'">
              {{ eventoSelecionado.tipo === 'DESPESA' ? '-' : '+' }}{{ formatCurrencyBR(eventoSelecionado.valor) }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium text-foreground">
              {{ eventoSelecionado.numero === 0 ? 'Entrada' : `Parcela ${eventoSelecionado.numero}` }}
            </p>
            <p class="text-xs text-muted-foreground">{{ eventoSelecionado.uid }}</p>
          </div>
        </div>

        <!-- Informações -->
        <div class="grid gap-2 sm:grid-cols-2">
          <div class="flex items-start gap-2 rounded-lg border p-3">
            <CalendarDays class="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
            <div class="min-w-0">
              <p class="text-xs uppercase tracking-wide text-muted-foreground">Vencimento</p>
              <p class="text-sm font-medium text-foreground">
                {{ format(new Date(eventoSelecionado.vencimento), 'dd/MM/yyyy', { locale: ptBR }) }}
              </p>
            </div>
          </div>
          <div class="flex items-start gap-2 rounded-lg border p-3">
            <FileText class="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
            <div class="min-w-0">
              <p class="text-xs uppercase tracking-wide text-muted-foreground">Categoria</p>
              <p class="truncate text-sm text-foreground">{{ eventoSelecionado.categoria || 'Não informado' }}</p>
            </div>
          </div>
          <div class="flex items-start gap-2 rounded-lg border p-3">
            <Wallet class="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
            <div class="min-w-0">
              <p class="text-xs uppercase tracking-wide text-muted-foreground">Conta / contato</p>
              <p class="truncate text-sm text-foreground">
                {{ [eventoSelecionado.conta, eventoSelecionado.cliente].filter(Boolean).join(' • ') || 'Não informado'
                }}
              </p>
            </div>
          </div>
          <div class="flex items-start gap-2 rounded-lg border p-3">
            <HandCoins class="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
            <div class="min-w-0">
              <p class="text-xs uppercase tracking-wide text-muted-foreground">Pagamento</p>
              <p class="text-sm text-foreground">
                <span v-if="eventoSelecionado.dataPagamento">
                  {{ format(new Date(eventoSelecionado.dataPagamento), 'dd/MM/yyyy', { locale: ptBR }) }}
                </span>
                <span v-else>Pendente</span>
                <span v-if="eventoSelecionado.formaPagamento"> • {{ eventoSelecionado.formaPagamento }}</span>
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-2 border-t pt-3">
          <!-- Ações principais -->
          <div class="flex flex-wrap gap-2">
            <Button v-if="!eventoSelecionado.pago" class="min-w-[9rem] flex-1"
              @click="handleEfetivarFromModal(eventoSelecionado)">
              <CheckCircle2 class="h-4 w-4" /> {{ eventoSelecionado.tipo === 'DESPESA' ? 'Pagar' : 'Receber' }}
            </Button>
            <Button v-else class="min-w-[9rem] flex-1 bg-warning text-white hover:bg-warning/80"
              @click="estornarParcela(eventoSelecionado.parcelaId)">
              <Undo2 class="h-4 w-4" /> Estornar
            </Button>
            <Button
              v-if="uiStore.canCreateCharge && !eventoSelecionado.pago && eventoSelecionado.tipo === 'RECEITA' && !eventoSelecionado.cobrancaLink"
              class="min-w-[9rem] flex-1 bg-success text-white hover:bg-success/80"
              @click="handleGerarCobrancaFromModal(eventoSelecionado)">
              <CircleDollarSign class="h-4 w-4" /> Gerar cobrança
            </Button>
            <Button v-if="props.mode === 'receitas' && !eventoSelecionado.pago" variant="outline"
              class="min-w-[9rem] flex-1" @click="abrirCobrancaRapida(eventoSelecionado)">
              <Send class="h-4 w-4" /> Enviar pelo WhatsApp
            </Button>
            <Button v-if="eventoSelecionado.cobrancaLink" variant="outline" class="min-w-[9rem] flex-1"
              @click="openLinkCobranca(eventoSelecionado.cobrancaLink)">
              <ExternalLink class="h-4 w-4" /> Abrir cobrança
            </Button>
          </div>
          <!-- Ações secundárias -->
          <div class="flex flex-wrap gap-2">
            <RouterLink :to="`/financeiro/detalhes?id=${eventoSelecionado.id}`" class="min-w-[8rem] flex-1">
              <Button variant="outline" class="w-full" @click="openModalEvento = false">
                <Info class="h-4 w-4" /> Gerenciar
              </Button>
            </RouterLink>
            <Button variant="outline" class="min-w-[8rem] flex-1" @click="handleEditarFromModal(eventoSelecionado)">
              <PenLine class="h-4 w-4" /> Editar
            </Button>
            <RouterLink to="/financeiro/contas" class="min-w-[8rem] flex-1">
              <Button variant="outline" class="w-full" @click="openModalEvento = false">
                <Wallet class="h-4 w-4" /> Contas
              </Button>
            </RouterLink>
          </div>
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

    <FormularioEfertivar />
    <GerarCobranca />
    <ModalParcela />
    <LancamentoModal />
    <ClientesModal />
    <CobrancaRapidaModal v-model:open="cobrancaRapidaOpen" :cliente="cobrancaRapidaItem?.cliente"
      :descricao="cobrancaRapidaItem?.descricao" :valor="cobrancaRapidaItem?.valor"
      :mensagem-inicial="mensagemCobrancaPadrao" :sending="cobrancaRapidaSending" @enviar="enviarCobrancaRapida" />
  </div>
</template>
