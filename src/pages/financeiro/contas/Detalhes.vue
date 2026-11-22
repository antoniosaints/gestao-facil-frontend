<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import DataTable from '@/components/tabela/DataTable.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { loadServerTableState } from '@/composables/serverTableState'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useContasFinanceirasStore } from '@/stores/lancamentos/useContasFinanceiras'
import { useUiStore } from '@/stores/ui/uiStore'
import type { ContaFinanceiraDetalhesResponse, FiltroStatusFinanceiro, FiltroTipoFinanceiro } from '@/types/schemas'
import { resolveFileUrl } from '@/utils/fileUrl'
import { formatCurrencyBR } from '@/utils/formatters'
import { isAxiosError } from 'axios'
import { endOfMonth, isValid, parseISO, startOfMonth } from 'date-fns'
import {
  ArrowDownLeft, ArrowLeft, ArrowRightLeft, ArrowUpRight, CalendarDays,
  CircleDollarSign, Loader2, MoreVertical, Pencil, RotateCw, Wallet,
} from 'lucide-vue-next'
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import ModalAjusteSaldoConta from './ModalAjusteSaldoConta.vue'
import ModalConta from './ModalConta.vue'
import ModalTransferenciaConta from './ModalTransferenciaConta.vue'
import { columnsMovimentacoesConta } from './tabela/columnDefMovimentacoes'

type FiltroStatusParcela = Exclude<FiltroStatusFinanceiro, 'PARCIAL'>

const route = useRoute()
const uiStore = useUiStore()
const store = useContasFinanceirasStore()
const contaId = computed(() => {
  const id = Number(route.params.id)
  return Number.isSafeInteger(id) && id > 0 ? id : null
})
const chaveTabela = computed(() => 'financeiro-conta-detalhes-' + contaId.value)

const loading = ref(false)
const erro = ref('')
const openTransferModal = ref(false)
const openAjusteModal = ref(false)
const detalhes = ref<ContaFinanceiraDetalhesResponse | null>(null)
const filtroPeriodo = ref<Date[] | null>(null)
const filtroTipo = ref<FiltroTipoFinanceiro>('TODOS')
const filtroStatus = ref<FiltroStatusParcela>('TODOS')
const limparBusca = ref(0)
const filtrosTabela = reactive({ inicio: '', fim: '', tipo: 'TODOS', status: 'TODOS', update: false })
let ultimaConsulta = 0

const conta = computed(() => detalhes.value?.conta ?? null)
const resumo = computed(() => detalhes.value?.resumo ?? null)
const podeEditar = computed(() => uiStore.permissoes.financeiro.editar)

function periodoPadrao(): [Date, Date] {
  const hoje = new Date()
  return [startOfMonth(hoje), endOfMonth(hoje)]
}

const filtrosTransferencia = computed(() => {
  const [inicioPadrao, fimPadrao] = periodoPadrao()
  return {
    inicio: filtroPeriodo.value?.[0] ?? inicioPadrao,
    fim: filtroPeriodo.value?.[1] ?? filtroPeriodo.value?.[0] ?? fimPadrao,
    tipo: filtroTipo.value,
    status: filtroStatus.value,
  }
})

function resetFiltros() {
  filtroPeriodo.value = periodoPadrao()
  filtroTipo.value = 'TODOS'
  filtroStatus.value = 'TODOS'
  limparBusca.value++
}

async function carregarDetalhes() {
  const consulta = ++ultimaConsulta
  const id = contaId.value
  if (!id) {
    erro.value = 'Conta financeira inválida.'
    loading.value = false
    return
  }

  loading.value = true
  erro.value = ''
  const { inicio, fim, tipo, status } = filtrosTransferencia.value
  const filtros = { inicio: inicio.toISOString(), fim: fim.toISOString(), tipo, status }
  Object.assign(filtrosTabela, filtros, { update: !filtrosTabela.update })

  try {
    const response = await LancamentosRepository.getContaFinanceiraDetalhes(id, filtros)
    if (consulta === ultimaConsulta) detalhes.value = response.data
  } catch (error) {
    if (consulta !== ultimaConsulta) return
    erro.value = isAxiosError(error) && error.response?.status === 404
      ? 'Conta financeira não encontrada.'
      : 'Não foi possível carregar os detalhes da conta.'
  } finally {
    if (consulta === ultimaConsulta) loading.value = false
  }
}

async function aposAlteracao() {
  store.updateTable()
  await carregarDetalhes()
}

watch(contaId, () => {
  detalhes.value = null
  openAjusteModal.value = false
  openTransferModal.value = false
  store.openModal = false
  resetFiltros()

  const salvo = loadServerTableState(chaveTabela.value)?.filters
  if (!salvo) return
  if (typeof salvo.inicio === 'string' && typeof salvo.fim === 'string') {
    const inicio = parseISO(salvo.inicio)
    const fim = parseISO(salvo.fim)
    if (isValid(inicio) && isValid(fim) && inicio <= fim) filtroPeriodo.value = [inicio, fim]
  }
  if (salvo.tipo === 'RECEITA' || salvo.tipo === 'DESPESA') filtroTipo.value = salvo.tipo
  if (salvo.status === 'PAGO' || salvo.status === 'PENDENTE' || salvo.status === 'ATRASADO') {
    filtroStatus.value = salvo.status
  }
}, { immediate: true })

watch([contaId, filtrosTransferencia], carregarDetalhes, { immediate: true })
</script>

<template>
  <div class="mx-auto min-w-0 space-y-4 pb-8">
    <header class="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div class="flex min-w-0 items-center gap-3">
        <div class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted"
          :style="{ borderColor: conta?.corDestaque || undefined }">
          <img v-if="conta?.icone" :src="resolveFileUrl(conta.icone, { fallback: '/imgs/logo.png' })"
            alt="" class="size-full object-cover" />
          <Wallet v-else class="size-5 text-primary" aria-hidden="true" />
        </div>
        <div class="min-w-0">
          <h1 class="break-words text-xl font-semibold text-foreground">{{ conta?.nome || 'Detalhes da conta' }}</h1>
          <p v-if="conta?.Uid" class="text-sm text-muted-foreground">{{ conta.Uid }}</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button as-child variant="outline">
          <RouterLink :to="{ name: 'financeiro-contas' }">
            <ArrowLeft class="size-4" /> Voltar
          </RouterLink>
        </Button>
        <Button v-if="conta && podeEditar" @click="store.openUpdate(conta)">
          <Pencil class="size-4" /> Editar conta
        </Button>
        <DropdownMenu v-if="conta">
          <DropdownMenuTrigger as-child>
            <Button variant="outline"><MoreVertical class="size-4" /> Mais ações</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem v-if="podeEditar" @select="openAjusteModal = true">
              <CircleDollarSign class="mr-2 size-4" /> Ajustar saldo
            </DropdownMenuItem>
            <DropdownMenuItem v-if="podeEditar" @select="openTransferModal = true">
              <ArrowRightLeft class="mr-2 size-4" /> Transferir entre contas
            </DropdownMenuItem>
            <DropdownMenuItem :disabled="loading" @select="carregarDetalhes">
              <RotateCw class="mr-2 size-4" /> Atualizar dados
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>

    <Alert v-if="erro" variant="destructive">
      <AlertTitle>{{ erro }}</AlertTitle>
      <AlertDescription v-if="contaId">
        <Button variant="outline" size="sm" class="mt-2" @click="carregarDetalhes">Tentar novamente</Button>
      </AlertDescription>
    </Alert>

    <div v-if="loading && !conta" role="status" class="flex items-center gap-2 rounded-xl border bg-card p-4 text-sm">
      <Loader2 class="size-4 animate-spin" /> Carregando conta financeira...
    </div>

    <template v-if="conta">
      <section class="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <div class="space-y-1">
          <h2 class="text-sm font-semibold">Cálculos gerais</h2>
          <p v-if="conta.ignorarNosCalculos" class="text-xs text-muted-foreground">
            O saldo e as movimentações desta conta aparecem na visão individual.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{{ conta.ignorarNosCalculos ? 'Fora dos cálculos gerais' : 'Incluída nos cálculos gerais' }}</Badge>
          <Button v-if="store.suporteAtivo" size="sm" variant="outline" @click="store.openUpdate(conta, true)">
            Alterar participação
          </Button>
        </div>
      </section>

      <section class="space-y-3 rounded-xl border bg-card p-4">
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(18rem,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
          <div class="space-y-2 sm:col-span-2 xl:col-span-1">
            <Label for="contaPeriodo">Período</Label>
            <Calendarpicker id="contaPeriodo" v-model="filtroPeriodo" :range="true" />
          </div>
          <div class="space-y-2">
            <Label for="contaTipo">Tipo</Label>
            <Select v-model="filtroTipo">
              <SelectTrigger id="contaTipo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="RECEITA">Entradas</SelectItem>
                <SelectItem value="DESPESA">Saídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="contaStatus">Status</Label>
            <Select v-model="filtroStatus">
              <SelectTrigger id="contaStatus"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="PAGO">Pagos</SelectItem>
                <SelectItem value="PENDENTE">Pendentes</SelectItem>
                <SelectItem value="ATRASADO">Atrasados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" class="justify-self-start" @click="resetFiltros">Limpar filtros</Button>
        </div>
      </section>

      <div v-if="resumo" class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-6">
        <div class="rounded-2xl border border-border bg-card p-4">
          <div class="flex items-center gap-2 text-xs text-muted-foreground"><Wallet class="h-4 w-4" /> Saldo atual</div>
          <div class="mt-2 text-lg font-semibold text-foreground">{{ formatCurrencyBR(resumo.saldoAtual) }}</div>
          <div class="mt-1 text-xs text-muted-foreground">Saldo inicial {{ formatCurrencyBR(resumo.saldoInicial) }}</div>
        </div>

        <div class="rounded-2xl border border-border bg-card p-4">
          <div class="flex items-center gap-2 text-xs text-muted-foreground"><CircleDollarSign class="h-4 w-4" /> Saldo previsto</div>
          <div class="mt-2 text-lg font-semibold text-foreground">{{ formatCurrencyBR(resumo.saldoPrevisto) }}</div>
          <div class="mt-1 text-xs text-muted-foreground">Considera todas as parcelas filtradas</div>
        </div>

        <div class="rounded-2xl border border-border bg-card p-4">
          <div class="flex items-center gap-2 text-xs text-muted-foreground"><ArrowUpRight class="h-4 w-4 text-green-500" /> Entradas</div>
          <div class="mt-2 text-sm font-medium text-foreground">Previstas: {{ formatCurrencyBR(resumo.entradasPrevistas) }}</div>
          <div class="mt-1 text-sm text-muted-foreground">Realizadas: {{ formatCurrencyBR(resumo.entradasRealizadas) }}</div>
        </div>

        <div class="rounded-2xl border border-border bg-card p-4">
          <div class="flex items-center gap-2 text-xs text-muted-foreground"><ArrowDownLeft class="h-4 w-4 text-red-500" /> Saídas</div>
          <div class="mt-2 text-sm font-medium text-foreground">Previstas: {{ formatCurrencyBR(resumo.saidasPrevistas) }}</div>
          <div class="mt-1 text-sm text-muted-foreground">Realizadas: {{ formatCurrencyBR(resumo.saidasRealizadas) }}</div>
        </div>

        <div class="rounded-2xl border border-border bg-card p-4">
          <div class="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays class="h-4 w-4" /> Pendências</div>
          <div class="mt-2 text-sm font-medium text-foreground">Receber: {{ formatCurrencyBR(resumo.pendenteReceber) }}</div>
          <div class="mt-1 text-sm text-muted-foreground">Pagar: {{ formatCurrencyBR(resumo.pendentePagar) }}</div>
        </div>

        <div class="rounded-2xl border border-border bg-card p-4">
          <div class="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays class="h-4 w-4" /> Situação</div>
          <div class="mt-2 text-sm font-medium text-foreground">{{ resumo.totalMovimentacoes }} {{ resumo.totalMovimentacoes === 1 ? 'movimentação' : 'movimentações' }}</div>
          <div class="mt-1 text-xs text-muted-foreground">
            {{ resumo.pagos }} pagas • {{ resumo.pendentes }} pendentes • {{ resumo.atrasados }} atrasadas
          </div>
        </div>
      </div>

      <section class="min-w-0 rounded-xl border bg-card">
        <div class="flex items-center justify-between gap-2 border-b px-4 py-3">
          <h2 class="text-sm font-semibold">Movimentações da conta</h2>
          <Loader2 v-if="loading" class="size-4 animate-spin text-muted-foreground" aria-label="Atualizando resumo" />
        </div>
        <div class="min-w-0 overflow-x-auto px-4 pb-2">
          <DataTable
            :key="conta.id"
            :state-key="chaveTabela"
            :columns="columnsMovimentacoesConta"
            :api="'/lancamentos/contas/' + conta.id + '/detalhes?tabela=true'"
            :filters="filtrosTabela"
            :clear-search-token="limparBusca"
          />
        </div>
      </section>
    </template>

    <ModalConta v-model:open="store.openModal" :conta="store.selectedConta"
      :somente-calculos="store.somenteCalculos" @saved="aposAlteracao" />
    <ModalTransferenciaConta v-model:open="openTransferModal" :conta-origem="conta"
      :filtros="filtrosTransferencia" @completed="aposAlteracao" />
    <ModalAjusteSaldoConta v-model:open="openAjusteModal" :conta="conta" @completed="aposAlteracao" />
  </div>
</template>
