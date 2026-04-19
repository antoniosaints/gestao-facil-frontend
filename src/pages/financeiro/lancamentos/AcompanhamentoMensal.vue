<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { addMonths, format, isSameDay, isToday, isYesterday, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Filter,
  HandCoins,
  Info,
  MoreVertical,
  PenLine,
  RotateCw,
  Search,
  TrendingDown,
  TrendingUp,
  Undo2,
  Wallet,
  X,
} from 'lucide-vue-next'
import { useToast } from 'vue-toastification'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

import FormularioEfertivar from './modais/FormularioEfertivar.vue'
import GerarCobranca from './modais/GerarCobranca.vue'
import ModalParcela from './modais/ModalParcela.vue'
import LancamentoModal from './formulario/LancamentoModal.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue'

type FiltroTipo = 'TODOS' | 'RECEITA' | 'DESPESA'
type FiltroStatus = 'TODOS' | 'PAGO' | 'PENDENTE' | 'ATRASADO'

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

const toast = useToast()
const store = useLancamentosStore()
const storeCobranca = useCobrancasFinanceirasStore()
const uiStore = useUiStore()

const carregando = ref(false)
const openModalLancar = ref(false)
const openModalFiltros = ref(false)
const activeTab = ref<'geral' | 'resumo'>('geral')
const quickPreset = ref<'all' | 'today'>('all')
const dias = ref<DiaLancamento[]>([])
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

const filtros = ref<{
  search: string
  tipo: FiltroTipo
  status: FiltroStatus
  contaFinanceiraId: string
  categoriaId: string
}>({
  search: '',
  tipo: 'TODOS',
  status: 'TODOS',
  contaFinanceiraId: 'all',
  categoriaId: 'all',
})

function getRequestFilters() {
  return {
    search: filtros.value.search.trim() || undefined,
    tipo: filtros.value.tipo,
    status: filtros.value.status,
    contaFinanceiraId:
      filtros.value.contaFinanceiraId !== 'all' ? Number(filtros.value.contaFinanceiraId) : null,
    categoriaId: filtros.value.categoriaId !== 'all' ? Number(filtros.value.categoriaId) : null,
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
      toast.info('Acompanhamento financeiro atualizado!')
    }
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar o acompanhamento financeiro.')
  } finally {
    carregando.value = false
  }
}

function navigateMonth(direction: 'prev' | 'next') {
  store.currentMonth = direction === 'prev' ? subMonths(store.currentMonth, 1) : addMonths(store.currentMonth, 1)
  carregarLancamentos()
}

function clearFilters(reload = true) {
  filtros.value = {
    search: '',
    tipo: 'TODOS',
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
  if (preset === 'today' || preset === 'due-today') {
    store.currentMonth = new Date()
    quickPreset.value = 'today'
  }

  if (preset === 'overdue') {
    store.currentMonth = new Date()
    filtros.value.status = 'ATRASADO'
    quickPreset.value = 'all'
  }

  if (preset === 'receitas') {
    filtros.value.tipo = 'RECEITA'
  }

  if (preset === 'despesas') {
    filtros.value.tipo = 'DESPESA'
  }

  if (preset === 'reset') {
    quickPreset.value = 'all'
    clearFilters(false)
  }
}

function openByTipo(tipo: 'RECEITA' | 'DESPESA') {
  store.form.tipo = tipo
  store.openSave()
  openModalLancar.value = false
}

function editarParcela(item: LancamentoDia) {
  store.idMutation = item.parcelaId
  store.formParcela = {
    valor: item.valor,
    vencimento: new Date(item.vencimento),
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
  } catch (error: any) {
    console.error(error)
    toast.error(error.response?.data?.message || 'Erro ao estornar a parcela')
  }
}

function openLinkCobranca(link?: string | null) {
  if (!link) return
  window.open(link, '_blank')
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

const filtrosAtivos = computed(() => {
  const items: string[] = []

  if (quickPreset.value === 'today') items.push('Visualização: hoje')
  if (filtros.value.search.trim()) items.push(`Busca: ${filtros.value.search.trim()}`)
  if (filtros.value.tipo !== 'TODOS') items.push(`Tipo: ${filtros.value.tipo}`)
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
  if (quickPreset.value !== 'today') return dias.value

  const hoje = new Date()
  return dias.value.filter((dia) => isSameDay(new Date(dia.dia), hoje))
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
    titulo: 'Saldo possível do dia',
    valor: resumo.value.saldoPossivelDia,
    detalhe: 'Considera o saldo atual somado ao fluxo previsto até a data de referência.',
    icone: TrendingUp,
    colorClass: resumo.value.saldoPossivelDia >= 0 ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10',
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

onMounted(async () => {
  await Promise.all([carregarOpcoes(), carregarLancamentos()])
})
watch(() => store.filters.update, () => carregarLancamentos())
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-4 pb-24 md:pb-0">
    <div class="rounded-2xl border bg-card p-4 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="space-y-1">
          <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
            <CalendarDays class="h-6 w-6 text-primary" />
            Acompanhamento financeiro
          </h2>
          <p class="text-sm text-muted-foreground">
            Saldo realizado vs. saldo possível do dia, com leitura por vencimento e menos ruído visual.
          </p>
        </div>

        <div class="flex items-center gap-2 self-start lg:self-auto">
          <Button variant="outline" size="icon" @click="navigateMonth('prev')">
            <ArrowLeft class="h-4 w-4" />
          </Button>
          <div class="min-w-[180px] text-center">
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
      <div v-if="filtrosAtivos.length" class="mt-3 flex flex-wrap gap-2">
        <Badge v-for="item in filtrosAtivos" :key="item" variant="outline" class="text-xs">
          {{ item }}
        </Badge>
      </div>
    </div>

    <Tabs v-model="activeTab" default-value="geral" class="space-y-4">
      <div class="overflow-x-auto">
        <TabsList class="inline-flex w-max min-w-full justify-start gap-2 rounded-xl border bg-card p-1">
          <TabsTrigger value="geral" class="px-4">Geral</TabsTrigger>
          <TabsTrigger value="resumo" class="px-4">Resumos KPI</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="geral" class="space-y-4">
        <div v-if="carregando" class="flex flex-col items-center justify-center py-16 text-center">
          <RotateCw class="mb-3 h-8 w-8 animate-spin text-primary" />
          <p class="text-sm text-muted-foreground">Carregando acompanhamento financeiro...</p>
        </div>

        <div v-else-if="!displayedDias.length" class="rounded-2xl border bg-card p-10 text-center shadow-sm">
          <CalendarDays class="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 class="text-lg font-semibold text-foreground">Nenhum lançamento encontrado</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            Ajuste os filtros ou crie um novo lançamento para este período.
          </p>
          <Button class="mt-4" variant="outline" @click="openModalLancar = true">Novo lançamento</Button>
        </div>

        <div v-else class="space-y-4">
          <div v-for="dia in displayedDias" :key="String(dia.dia)" class="space-y-2">
            <div
              class="flex flex-col gap-2 rounded-xl border bg-card px-3 py-1.5 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <p class="text-sm font-semibold capitalize text-foreground">{{ getDayLabel(dia.dia) }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ format(new Date(dia.dia), "dd 'de' MMMM", { locale: ptBR }) }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <Badge class="border-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  Realizado {{ formatCurrencyBR(dia.saldoRealizado) }}
                </Badge>
                <Badge class="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Possível {{ formatCurrencyBR(dia.saldoPrevisto) }}
                </Badge>
              </div>
            </div>

            <div class="grid gap-2 md:pl-4">
              <div v-for="item in dia.lancamentos" :key="item.parcelaId"
                class="relative overflow-hidden rounded-r-xl border bg-card px-3 py-1.5 shadow-sm">
                <div class="absolute left-0 top-0 h-full w-1"
                  :class="item.tipo === 'DESPESA' ? 'bg-rose-500' : 'bg-emerald-500'" />

                <div class="flex items-start justify-between gap-3">
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

                      <div class="text-right flex flex-col gap-1">
                        <p :class="item.tipo === 'DESPESA' ? 'text-rose-600' : 'text-emerald-600'"
                          class="text-md font-semibold">
                          {{ item.tipo === 'DESPESA' ? '-' : '+' }}{{ formatCurrencyBR(item.valor) }}
                        </p>
                        <div class="flex flex-wrap gap-1">
                          <Badge class="border-0 px-2 py-0 text-[10px]"
                            :class="item.tipo === 'DESPESA' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'">
                            {{ item.tipo === 'DESPESA' ? 'Despesa' : 'Receita' }}
                          </Badge>
                          <Badge class="border-0 px-2 py-0 text-[10px]"
                            :class="item.status === 'PAGO' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : item.status === 'ATRASADO' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'">
                            {{ item.status }}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-1">
                    <div class="hidden items-center gap-1 lg:flex">
                      <Button variant="outline" size="icon" class="h-8 w-8" @click="editarParcela(item)">
                        <PenLine class="h-4 w-4" />
                      </Button>
                      <Button v-if="!item.pago" size="icon" class="h-8 w-8" @click="efetivarParcela(item.parcelaId)">
                        <CheckCircle2 class="h-4 w-4" />
                      </Button>
                      <Button v-else size="icon" class="h-8 w-8 bg-warning text-white hover:bg-warning/80"
                        @click="estornarParcela(item.parcelaId)">
                        <Undo2 class="h-4 w-4" />
                      </Button>
                      <Button v-if="!item.pago && !item.cobrancaLink" size="icon"
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
                        <DropdownMenuItem @click="editarParcela(item)">
                          <PenLine class="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem v-if="!item.pago" @click="efetivarParcela(item.parcelaId)">
                          <CheckCircle2 class="mr-2 h-4 w-4" /> {{ item.tipo === 'DESPESA' ? 'Pagar' : 'Receber' }}
                        </DropdownMenuItem>
                        <DropdownMenuItem v-else @click="estornarParcela(item.parcelaId)">
                          <Undo2 class="mr-2 h-4 w-4" /> Estornar
                        </DropdownMenuItem>
                        <DropdownMenuItem v-if="!item.pago && !item.cobrancaLink"
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

      <TabsContent value="resumo">
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card v-for="item in indicadores" :key="item.titulo" class="shadow rounded-xl transition">
            <CardHeader class="pb-2">
              <CardTitle class="flex flex-row items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <div class="rounded-md p-2" :class="item.colorClass">
                  <component :is="item.icone" class="h-4 w-4" />
                </div>
                <span>{{ item.titulo }}</span>
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-1">
              <p class="text-base md:text-lg font-semibold text-gray-700 dark:text-gray-200">
                {{ formatCurrencyBR(item.valor) }}
              </p>
              <p class="text-xs text-muted-foreground leading-relaxed">{{ item.detalhe }}</p>
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
        <Button class="w-full" @click="openModalLancar = true">
          <TrendingUp class="h-4 w-4" />
        </Button>
        <Button variant="outline" class="w-full" @click="goBack">
          <Undo2 class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <ModalView v-model:open="openModalLancar" title="Novo lançamento" size="sm">
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

    <ModalView v-model:open="openModalFiltros" title="Filtros do acompanhamento" size="lg">
      <div class="grid gap-4 p-4 md:grid-cols-2">
        <div class="space-y-2 md:col-span-2">
          <label class="text-sm font-medium">Atalhos rápidos</label>
          <div class="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" @click="applyPreset('today')">Hoje</Button>
            <Button type="button" variant="outline" size="sm" @click="applyPreset('due-today')">Vencendo hoje</Button>
            <Button type="button" variant="outline" size="sm" @click="applyPreset('overdue')">Atrasados</Button>
            <Button type="button" variant="outline" size="sm" @click="applyPreset('receitas')">Somente receitas</Button>
            <Button type="button" variant="outline" size="sm" @click="applyPreset('despesas')">Somente despesas</Button>
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

        <div class="space-y-2">
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
