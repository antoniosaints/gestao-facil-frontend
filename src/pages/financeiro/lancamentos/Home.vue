<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import Tabela from './tabela/Tabela.vue'
import Mobile from './tabela/Mobile.vue'
import { useUiStore } from '@/stores/ui/uiStore'
import LancamentoModal from './formulario/LancamentoModal.vue'
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos'
import {
  ArrowDownUp,
  BadgePlus,
  Ban,
  BookOpenText,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ClockAlert,
  CircleChevronDown,
  DollarSign,
  FileText,
  Filter,
  FilterX,
  GitBranch,
  Repeat2,
  RotateCw,
  Tags,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
  Wallet,
} from 'lucide-vue-next'
import GerarDRE from './modais/GerarDRE.vue'
import ModalLoteLancamentos from './modais/ModalLoteLancamentos.vue'
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useToast } from 'vue-toastification'
import router from '@/router'
import ModalView from '@/components/formulario/ModalView.vue'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import { Input } from '@/components/ui/input'
import { moneyMaskOptions } from '@/lib/imaska'
import { vMaska } from 'maska/vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import type { CategoriaFinanceiro, ContasFinanceiro } from '@/types/schemas'
import { useSocketEvent } from '@/composables/useSocketEvent'

const store = useLancamentosStore()
const uiStore = useUiStore()
const toast = useToast()

const contas = reactive<{ data: ContasFinanceiro[] }>({ data: [] })
const categorias = reactive<{ data: CategoriaFinanceiro[] }>({ data: [] })
const openFiltersModal = ref(false)
const quickFiltersContainer = ref<HTMLElement | null>(null)
const visibleQuickFiltersCount = ref(0)
let quickFiltersResizeObserver: ResizeObserver | null = null

type TipoFiltro = 'TODOS' | 'RECEITA' | 'DESPESA'
type StatusFiltro = 'TODOS' | 'PAGO' | 'PENDENTE' | 'ATRASADO' | 'PARCIAL'
type ModalidadeFiltro = 'TODOS' | 'PARCELADOS' | 'RECORRENTES'
type FiltroRapidoId =
  | 'MES_ATUAL'
  | 'MES_PASSADO'
  | 'RECEITAS'
  | 'DESPESAS'
  | 'PENDENTES'
  | 'ATRASADAS'
  | 'PARCELADOS'
  | 'RECORRENTES'

const quickFilters: Array<{
  id: FiltroRapidoId
  label: string
  icon: typeof CalendarRange
  tipo: TipoFiltro
  status: StatusFiltro
  modalidade: ModalidadeFiltro
  periodo: 'MES_ATUAL' | 'MES_PASSADO' | null
  grupo: 'PERIODO' | 'TIPO' | 'STATUS' | 'MODALIDADE'
  larguraEstimada: number
}> = [
  {
    id: 'MES_ATUAL',
    label: 'Este mês',
    icon: CalendarRange,
    tipo: 'TODOS',
    status: 'TODOS',
    modalidade: 'TODOS',
    periodo: 'MES_ATUAL',
    grupo: 'PERIODO',
    larguraEstimada: 104,
  },
  {
    id: 'MES_PASSADO',
    label: 'Mês passado',
    icon: CalendarRange,
    tipo: 'TODOS',
    status: 'TODOS',
    modalidade: 'TODOS',
    periodo: 'MES_PASSADO',
    grupo: 'PERIODO',
    larguraEstimada: 114,
  },
  {
    id: 'RECEITAS',
    label: 'Receitas',
    icon: TrendingUp,
    tipo: 'RECEITA',
    status: 'TODOS',
    modalidade: 'TODOS',
    periodo: null,
    grupo: 'TIPO',
    larguraEstimada: 98,
  },
  {
    id: 'DESPESAS',
    label: 'Despesas',
    icon: TrendingDown,
    tipo: 'DESPESA',
    status: 'TODOS',
    modalidade: 'TODOS',
    periodo: null,
    grupo: 'TIPO',
    larguraEstimada: 100,
  },
  {
    id: 'PENDENTES',
    label: 'Pendentes',
    icon: CheckCircle2,
    tipo: 'TODOS',
    status: 'PENDENTE',
    modalidade: 'TODOS',
    periodo: null,
    grupo: 'STATUS',
    larguraEstimada: 108,
  },
  {
    id: 'ATRASADAS',
    label: 'Atrasadas',
    icon: ClockAlert,
    tipo: 'TODOS',
    status: 'ATRASADO',
    modalidade: 'TODOS',
    periodo: null,
    grupo: 'STATUS',
    larguraEstimada: 102,
  },
  {
    id: 'PARCELADOS',
    label: 'Parcelados',
    icon: GitBranch,
    tipo: 'TODOS',
    status: 'TODOS',
    modalidade: 'PARCELADOS',
    periodo: null,
    grupo: 'MODALIDADE',
    larguraEstimada: 112,
  },
  {
    id: 'RECORRENTES',
    label: 'Recorrentes',
    icon: Repeat2,
    tipo: 'TODOS',
    status: 'TODOS',
    modalidade: 'RECORRENTES',
    periodo: null,
    grupo: 'MODALIDADE',
    larguraEstimada: 116,
  },
]

const quickFiltersVisiveis = computed(() => quickFilters.slice(0, visibleQuickFiltersCount.value))
const quickFiltersNoMenu = computed(() => quickFilters.slice(visibleQuickFiltersCount.value))

const filtros = reactive({
  tipo: (store.filters.tipo as TipoFiltro) || 'TODOS',
  status: (store.filters.status as StatusFiltro) || 'TODOS',
  modalidade: (store.filters.modalidade as ModalidadeFiltro) || 'TODOS',
  origem: (store.filters.origem as 'TODOS' | 'ASSINATURA_PAGAR') || 'TODOS',
  ignorado: (store.filters.ignorado as 'TODOS' | 'COM_PARCELA_IGNORADA' | 'SEM_PARCELA_IGNORADA') || 'TODOS',
  contaFinanceiraId: store.filters.contaFinanceiraId ? String(store.filters.contaFinanceiraId) : 'all',
  categoriaId: store.filters.categoriaId ? String(store.filters.categoriaId) : 'all',
  clienteId: store.filters.clienteId || null,
  inicio: store.filters.inicio || '',
  fim: store.filters.fim || '',
  valorMinimo: store.filters.valorMinimo || '',
  valorMaximo: store.filters.valorMaximo || '',
})

const openByTipo = (tipo: 'RECEITA' | 'DESPESA') => {
  store.form.tipo = tipo
  store.openSave()
}

async function loadFilterOptions() {
  try {
    const [responseContas, responseCategorias] = await Promise.all([
      LancamentosRepository.listarContas(),
      LancamentosRepository.listarCategorias(),
    ])

    contas.data = responseContas.data ?? []
    categorias.data = responseCategorias.data ?? []
  } catch (error) {
    console.error(error)
    toast.warning('Não foi possível carregar contas e categorias dos filtros.')
  }
}

function formatFilterDate(value: unknown): string | null {
  if (!value) return null

  if (typeof value === 'string') return value

  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return null

  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatFilterAmount(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null

  const normalized = String(value).trim()
  return normalized || null
}

function applyFilters() {
  store.filters.tipo = filtros.tipo
  store.filters.status = filtros.status
  store.filters.modalidade = filtros.modalidade
  store.filters.origem = filtros.origem
  store.filters.ignorado = filtros.ignorado
  store.filters.contaFinanceiraId = filtros.contaFinanceiraId !== 'all' ? Number(filtros.contaFinanceiraId) : null
  store.filters.categoriaId = filtros.categoriaId !== 'all' ? Number(filtros.categoriaId) : null
  store.filters.clienteId = filtros.clienteId || null
  store.filters.inicio = formatFilterDate(filtros.inicio)
  store.filters.fim = formatFilterDate(filtros.fim)
  store.filters.valorMinimo = formatFilterAmount(filtros.valorMinimo)
  store.filters.valorMaximo = formatFilterAmount(filtros.valorMaximo)
  openFiltersModal.value = false
  store.updateTable()
}

function clearFilters() {
  filtros.tipo = 'TODOS'
  filtros.status = 'TODOS'
  filtros.modalidade = 'TODOS'
  filtros.origem = 'TODOS'
  filtros.ignorado = 'TODOS'
  filtros.contaFinanceiraId = 'all'
  filtros.categoriaId = 'all'
  filtros.clienteId = null
  filtros.inicio = ''
  filtros.fim = ''
  filtros.valorMinimo = ''
  filtros.valorMaximo = ''
}

function formatDateForFilter(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMonthRange(periodo: 'MES_ATUAL' | 'MES_PASSADO') {
  const today = new Date()
  const monthOffset = periodo === 'MES_PASSADO' ? -1 : 0
  const firstDay = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 0)

  return {
    inicio: formatDateForFilter(firstDay),
    fim: formatDateForFilter(lastDay),
  }
}

function isQuickFilterActive(quickFilter: (typeof quickFilters)[number]) {
  if (quickFilter.grupo === 'PERIODO') {
    const periodo = getMonthRange(quickFilter.periodo!)
    return (
      formatFilterDate(filtros.inicio) === periodo.inicio &&
      formatFilterDate(filtros.fim) === periodo.fim
    )
  }
  if (quickFilter.grupo === 'TIPO') return filtros.tipo === quickFilter.tipo
  if (quickFilter.grupo === 'STATUS') return filtros.status === quickFilter.status
  return filtros.modalidade === quickFilter.modalidade
}

const hasActiveFilters = computed(
  () =>
    filtros.tipo !== 'TODOS' ||
    filtros.status !== 'TODOS' ||
    filtros.modalidade !== 'TODOS' ||
    filtros.origem !== 'TODOS' ||
    filtros.ignorado !== 'TODOS' ||
    filtros.contaFinanceiraId !== 'all' ||
    filtros.categoriaId !== 'all' ||
    Boolean(filtros.clienteId) ||
    Boolean(formatFilterDate(filtros.inicio)) ||
    Boolean(formatFilterDate(filtros.fim)) ||
    Boolean(formatFilterAmount(filtros.valorMinimo)) ||
    Boolean(formatFilterAmount(filtros.valorMaximo)),
)

function recalcularFiltrosRapidosVisiveis() {
  const larguraDisponivel = quickFiltersContainer.value?.clientWidth ?? 0
  if (!larguraDisponivel) return

  const larguraRotulo = 142
  const larguraMaisFiltros = 126
  const espacamento = 8
  let larguraUsada = larguraRotulo
  let quantidade = 0

  for (const [indice, quickFilter] of quickFilters.entries()) {
    const aindaTemFiltros = indice < quickFilters.length - 1
    const reservaMenu = aindaTemFiltros ? larguraMaisFiltros : 0
    if (larguraUsada + quickFilter.larguraEstimada + reservaMenu > larguraDisponivel) break
    larguraUsada += quickFilter.larguraEstimada + espacamento
    quantidade += 1
  }

  visibleQuickFiltersCount.value = Math.max(1, quantidade)
}

function syncLocalFiltersFromStore() {
  filtros.tipo = (store.filters.tipo as TipoFiltro) || 'TODOS'
  filtros.status = (store.filters.status as StatusFiltro) || 'TODOS'
  filtros.modalidade = (store.filters.modalidade as ModalidadeFiltro) || 'TODOS'
  filtros.origem = (store.filters.origem as 'TODOS' | 'ASSINATURA_PAGAR') || 'TODOS'
  filtros.ignorado = (store.filters.ignorado as 'TODOS' | 'COM_PARCELA_IGNORADA' | 'SEM_PARCELA_IGNORADA') || 'TODOS'
  filtros.contaFinanceiraId = store.filters.contaFinanceiraId ? String(store.filters.contaFinanceiraId) : 'all'
  filtros.categoriaId = store.filters.categoriaId ? String(store.filters.categoriaId) : 'all'
  filtros.clienteId = store.filters.clienteId || null
  filtros.inicio = store.filters.inicio || ''
  filtros.fim = store.filters.fim || ''
  filtros.valorMinimo = store.filters.valorMinimo || ''
  filtros.valorMaximo = store.filters.valorMaximo || ''
}

function applyQuickFilter(quickFilter: (typeof quickFilters)[number]) {
  if (quickFilter.grupo === 'PERIODO') {
    const periodo = getMonthRange(quickFilter.periodo!)
    const estaAtivo = isQuickFilterActive(quickFilter)
    filtros.inicio = estaAtivo ? '' : periodo.inicio
    filtros.fim = estaAtivo ? '' : periodo.fim
  } else if (quickFilter.grupo === 'TIPO') {
    filtros.tipo = isQuickFilterActive(quickFilter) ? 'TODOS' : quickFilter.tipo
  } else if (quickFilter.grupo === 'STATUS') {
    filtros.status = isQuickFilterActive(quickFilter) ? 'TODOS' : quickFilter.status
  } else {
    filtros.modalidade = isQuickFilterActive(quickFilter) ? 'TODOS' : quickFilter.modalidade
  }
  applyFilters()
}

function clearAndApplyFilters() {
  clearFilters()
  applyFilters()
}

function goToCategorias() {
  router.push('/financeiro/categorias')
}

function goToContas() {
  router.push('/financeiro/contas')
}

onMounted(() => {
  loadFilterOptions()
  // O DataTable restaura os filtros salvos durante a montagem do filho. Reflete-os
  // também na tela pai para que o atalho correspondente permaneça destacado.
  syncLocalFiltersFromStore()
  nextTick(() => {
    recalcularFiltrosRapidosVisiveis()
    if (quickFiltersContainer.value) {
      quickFiltersResizeObserver = new ResizeObserver(recalcularFiltrosRapidosVisiveis)
      quickFiltersResizeObserver.observe(quickFiltersContainer.value)
    }
  })
})

onBeforeUnmount(() => quickFiltersResizeObserver?.disconnect())

useSocketEvent('financeiro:updated', () => {
  store.updateTable()
  loadFilterOptions()
})
</script>

<template>
  <div>
    <div class="mb-2 flex flex-col justify-between gap-2 md:flex-row">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Wallet class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Lançamentos
        </h2>
        <p class="text-sm text-muted-foreground">Lançamentos financeiros do sistema</p>
      </div>
      <div class="hidden items-center justify-between gap-2 md:flex">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline">
              <CircleChevronDown />
              Ações
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem class="cursor-pointer" @click="goToCategorias">
                <Tags />
                <span>Categorias</span>
              </DropdownMenuItem>
              <DropdownMenuItem class="cursor-pointer" @click="goToContas">
                <BookOpenText />
                <span>Contas financeiras</span>
              </DropdownMenuItem>
              <DropdownMenuItem class="cursor-pointer" @click="openFiltersModal = true">
                <Filter />
                <span>Filtros avançados</span>
              </DropdownMenuItem>
              <DropdownMenuItem class="cursor-pointer" @click="store.toggleExibicaoValorParcelas">
                <DollarSign />
                <span>{{ store.exibirValorParcelasAtuais ? 'Mostrar total' : 'Mostrar parcelas' }}</span>
              </DropdownMenuItem>
              <DropdownMenuItem class="cursor-pointer" @click="store.openModalLote = true">
                <Upload />
                <span>Importar CSV</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          class="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          @click="openFiltersModal = true"
        >
          <Filter class="h-5 w-5" /> <span class="hidden md:inline">Filtros</span>
        </button>
        <Button v-if="hasActiveFilters" variant="outline" size="sm" @click="clearAndApplyFilters">
          <FilterX class="h-4 w-4" />
          Limpar filtros
        </Button>

        <button
          class="flex items-center gap-2 rounded-md bg-warning px-3 py-1.5 text-sm text-white"
          @click="store.openModalDre = true"
        >
          <FileText class="h-5 w-5" /> <span class="hidden md:inline">DRE</span>
        </button>
        <button
          class="flex items-center gap-2 rounded-md bg-success px-3 py-1.5 text-sm text-white"
          @click="openByTipo('RECEITA')"
        >
          <BadgePlus class="inline-flex h-5 w-5" /> <span class="hidden md:inline">Receita</span>
        </button>
        <button
          class="flex items-center gap-2 rounded-md bg-danger px-3 py-1.5 text-sm text-white"
          @click="openByTipo('DESPESA')"
        >
          <BadgePlus class="inline-flex h-5 w-5" /> <span class="hidden md:inline">Despesa</span>
        </button>
        <button class="rounded-md border border-border bg-background px-2 py-1.5 text-sm" @click="store.updateTable">
          <RotateCw class="h-5 w-5" />
        </button>
      </div>
    </div>

    <section ref="quickFiltersContainer" class="rounded-lg border border-border bg-card px-3 py-1" aria-label="Filtros rápidos de lançamentos">
      <div class="flex flex-wrap items-center gap-2">
        <span class="mr-1 text-sm font-medium text-muted-foreground">Filtros rápidos:</span>
        <Button
          v-for="quickFilter in quickFiltersVisiveis"
          :key="quickFilter.id"
          type="button"
          size="sm"
          :variant="isQuickFilterActive(quickFilter) ? 'default' : 'outline'"
          :aria-pressed="isQuickFilterActive(quickFilter)"
          @click="applyQuickFilter(quickFilter)"
        >
          <component :is="quickFilter.icon" class="h-3.5 w-3.5" aria-hidden="true" />
          {{ quickFilter.label }}
        </Button>
        <DropdownMenu v-if="quickFiltersNoMenu.length">
          <DropdownMenuTrigger as-child>
            <Button type="button" variant="outline" size="sm">
              Mais filtros
              <ChevronDown class="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              v-for="quickFilter in quickFiltersNoMenu"
              :key="quickFilter.id"
              :class="{ 'bg-accent': isQuickFilterActive(quickFilter) }"
              @click="applyQuickFilter(quickFilter)"
            >
              <component :is="quickFilter.icon" class="mr-2 h-4 w-4" aria-hidden="true" />
              {{ quickFilter.label }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </section>

    <div v-if="!uiStore.isMobile" class="overflow-x-auto rounded-lg">
      <Tabela />
    </div>
    <div v-else class="overflow-x-auto rounded-lg">
      <Mobile />
    </div>

    <ModalView v-model:open="openFiltersModal" title="Filtros avançados" description="Aplique filtros estruturados na listagem principal de lançamentos." size="lg" desktop-variant="sheet">
      <div class="grid gap-4 px-4 md:grid-cols-2">
        <div class="space-y-2">
          <label class="flex items-center gap-1.5 text-sm font-medium"><CalendarDays class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />Período inicial</label>
          <Calendarpicker v-model="filtros.inicio" placeholder="Selecione a data inicial" :teleport="true" />
        </div>
        <div class="space-y-2">
          <label class="flex items-center gap-1.5 text-sm font-medium"><CalendarDays class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />Período final</label>
          <Calendarpicker v-model="filtros.fim" placeholder="Selecione a data final" :teleport="true" />
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-1.5 text-sm font-medium"><DollarSign class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />Valor mínimo</label>
          <Input v-model="filtros.valorMinimo" v-maska="moneyMaskOptions" type="text" inputmode="decimal" placeholder="0,00" />
        </div>
        <div class="space-y-2">
          <label class="flex items-center gap-1.5 text-sm font-medium"><DollarSign class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />Valor máximo</label>
          <Input v-model="filtros.valorMaximo" v-maska="moneyMaskOptions" type="text" inputmode="decimal" placeholder="0,00" />
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-1.5 text-sm font-medium"><ArrowDownUp class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />Tipo</label>
          <Select v-model="filtros.tipo">
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="RECEITA">Receita</SelectItem>
              <SelectItem value="DESPESA">Despesa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-1.5 text-sm font-medium"><CheckCircle2 class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />Status</label>
          <Select v-model="filtros.status">
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="ATRASADO">Atrasado</SelectItem>
              <SelectItem value="PARCIAL">Parcial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-1.5 text-sm font-medium"><GitBranch class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />Modalidade</label>
          <Select v-model="filtros.modalidade">
            <SelectTrigger>
              <SelectValue placeholder="Modalidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todas</SelectItem>
              <SelectItem value="PARCELADOS">Parcelados</SelectItem>
              <SelectItem value="RECORRENTES">Recorrentes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-1.5 text-sm font-medium"><GitBranch class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />Origem</label>
          <Select v-model="filtros.origem">
            <SelectTrigger>
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todas</SelectItem>
              <SelectItem value="ASSINATURA_PAGAR">Assinatura</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-1.5 text-sm font-medium"><Ban class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />Parcelas ignoradas</label>
          <Select v-model="filtros.ignorado">
            <SelectTrigger>
              <SelectValue placeholder="Parcelas ignoradas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="COM_PARCELA_IGNORADA">Com parcela ignorada</SelectItem>
              <SelectItem value="SEM_PARCELA_IGNORADA">Sem parcelas ignoradas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-1.5 text-sm font-medium"><Wallet class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />Conta financeira</label>
          <Select v-model="filtros.contaFinanceiraId">
            <SelectTrigger>
              <SelectValue placeholder="Conta financeira" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem v-for="conta in contas.data" :key="conta.id" :value="String(conta.id)">
                {{ conta.nome }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-1.5 text-sm font-medium"><Tags class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />Categoria</label>
          <Select v-model="filtros.categoriaId">
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem v-for="categoria in categorias.data" :key="categoria.id" :value="String(categoria.id)">
                {{ categoria.nome }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2 md:col-span-2">
          <label class="flex items-center gap-1.5 text-sm font-medium"><Users class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />Cliente / fornecedor</label>
          <Select2Ajax v-model="filtros.clienteId" url="/clientes/select2" allowClear />
        </div>

        <div class="flex justify-end gap-2 md:col-span-2">
          <Button variant="outline" @click="openFiltersModal = false">Cancelar</Button>
          <Button @click="applyFilters">
            <Filter class="h-4 w-4" /> Aplicar
          </Button>
        </div>
      </div>
    </ModalView>

    <LancamentoModal />
    <ModalLoteLancamentos />
    <ClientesModal />
    <GerarDRE />
  </div>
</template>
