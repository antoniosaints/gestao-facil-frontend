<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import type { ContaFinanceiraDetalhesResponse, ContasFinanceiro, FiltroStatusFinanceiro, FiltroTipoFinanceiro } from '@/types/schemas'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, CalendarDays, CircleDollarSign, Loader2, Search, Wallet } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import ModalAjusteSaldoConta from './ModalAjusteSaldoConta.vue'
import ModalTransferenciaConta from './ModalTransferenciaConta.vue'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  conta: ContasFinanceiro | null
}>()

const toast = useToast()
const loading = ref(false)
const openTransferModal = ref(false)
const openAjusteModal = ref(false)
const detalhes = ref<ContaFinanceiraDetalhesResponse | null>(null)
const filtroPeriodo = ref<[Date, Date]>([startOfMonth(new Date()), endOfMonth(new Date())])
const filtroTipo = ref<FiltroTipoFinanceiro>('TODOS')
const filtroStatus = ref<FiltroStatusFinanceiro>('TODOS')
const search = ref('')

const title = computed(() => `Detalhes da conta${props.conta?.nome ? ` • ${props.conta.nome}` : ''}`)
const description = computed(
  () => 'Acompanhe saldo, entradas, saídas e movimentações desta conta com filtros por período, tipo, status e busca.',
)

const resumo = computed(() => detalhes.value?.resumo ?? null)
const movimentacoes = computed(() => detalhes.value?.movimentacoes ?? [])
const filtrosTransferencia = computed(() => ({
  inicio: filtroPeriodo.value[0],
  fim: filtroPeriodo.value[1],
  tipo: filtroTipo.value,
  status: filtroStatus.value,
  search: search.value,
}))

async function loadDetalhes() {
  if (!props.conta?.id) return

  try {
    loading.value = true
    const response = await LancamentosRepository.getContaFinanceiraDetalhes(props.conta.id, {
      inicio: format(filtroPeriodo.value[0], 'yyyy-MM-dd'),
      fim: format(filtroPeriodo.value[1], 'yyyy-MM-dd'),
      tipo: filtroTipo.value,
      status: filtroStatus.value,
      search: search.value.trim() || undefined,
    })
    detalhes.value = response.data
  } catch (error) {
    console.log(error)
    toast.error('Não foi possível carregar os detalhes da conta financeira.')
  } finally {
    loading.value = false
  }
}

function resetFiltros() {
  filtroPeriodo.value = [startOfMonth(new Date()), endOfMonth(new Date())]
  filtroTipo.value = 'TODOS'
  filtroStatus.value = 'TODOS'
  search.value = ''
}

watch(
  () => [open.value, props.conta?.id] as const,
  async ([isOpen]) => {
    if (!isOpen || !props.conta?.id) return
    resetFiltros()
    await loadDetalhes()
  },
)
</script>

<template>
  <ModalView v-model:open="open" :title="title" :description="description" size="5xl">
    <div class="space-y-4 px-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div class="md:col-span-4">
          <label class="mb-1 block text-sm font-medium">Período</label>
          <Calendarpicker v-model="filtroPeriodo" :teleport="true" :range="true" />
        </div>

        <div class="md:col-span-2">
          <label class="mb-1 block text-sm font-medium">Tipo</label>
          <Select v-model="filtroTipo">
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="RECEITA">Entradas</SelectItem>
              <SelectItem value="DESPESA">Saídas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="md:col-span-2">
          <label class="mb-1 block text-sm font-medium">Status</label>
          <Select v-model="filtroStatus">
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="PAGO">Pagos</SelectItem>
              <SelectItem value="PENDENTE">Pendentes</SelectItem>
              <SelectItem value="ATRASADO">Atrasados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="md:col-span-4">
          <label class="mb-1 block text-sm font-medium">Busca</label>
          <div class="relative">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input v-model="search" class="pl-9" placeholder="Descrição, UID, categoria ou cliente" @keyup.enter="loadDetalhes" />
          </div>
        </div>
      </div>

      <div class="flex flex-wrap justify-end gap-2">
        <Button variant="outline" @click="resetFiltros">Limpar filtros</Button>
        <Button variant="outline" :disabled="loading || !props.conta?.id" @click="openAjusteModal = true">
          Ajustar saldo
        </Button>
        <Button variant="outline" :disabled="loading || !props.conta?.id" @click="openTransferModal = true">
          <ArrowRightLeft class="mr-2 h-4 w-4" />
          Transferir entre contas
        </Button>
        <Button :disabled="loading" class="text-white" @click="loadDetalhes">
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          Atualizar visão
        </Button>
      </div>

      <div v-if="resumo" class="grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-6">
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
          <div class="mt-2 text-sm font-medium text-foreground">{{ resumo.totalMovimentacoes }} movimentação(ões)</div>
          <div class="mt-1 text-xs text-muted-foreground">
            {{ resumo.pagos }} pagas • {{ resumo.pendentes }} pendentes • {{ resumo.atrasados }} atrasadas
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-border bg-card">
        <div class="border-b border-border px-4 py-3">
          <div class="text-sm font-semibold text-foreground">Movimentações da conta</div>
          <div class="text-xs text-muted-foreground">Lançamentos vinculados a esta conta financeira dentro dos filtros aplicados.</div>
        </div>

        <div v-if="loading" class="flex items-center justify-center px-4 py-10 text-sm text-muted-foreground">
          <Loader2 class="mr-2 h-4 w-4 animate-spin" /> Carregando movimentações...
        </div>

        <div v-else-if="!movimentacoes.length" class="px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhuma movimentação encontrada para os filtros informados.
        </div>

        <div v-else class="max-h-[50vh] overflow-auto">
          <table class="min-w-full text-sm">
            <thead class="sticky top-0 bg-card">
              <tr class="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th class="px-4 py-3">Lançamento</th>
                <th class="px-4 py-3">Categoria / Cliente</th>
                <th class="px-4 py-3">Vencimento</th>
                <th class="px-4 py-3">Pagamento</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in movimentacoes" :key="item.id" class="border-b border-border/70 align-top">
                <td class="px-4 py-3">
                  <div class="font-medium text-foreground">{{ item.lancamento.descricao }}</div>
                  <div class="text-xs text-muted-foreground">{{ item.lancamento.Uid || `#${item.lancamento.id}` }} • Parcela {{ item.numero }}</div>
                  <div class="mt-1 text-xs" :class="item.lancamento.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'">
                    {{ item.lancamento.tipo === 'RECEITA' ? 'Entrada' : 'Saída' }}
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-foreground">{{ item.lancamento.categoria.nome }}</div>
                  <div class="text-xs text-muted-foreground">{{ item.lancamento.cliente?.nome || 'Sem cliente/fornecedor' }}</div>
                  <div v-if="item.formaPagamento" class="mt-1 text-xs text-muted-foreground">{{ item.formaPagamento }}</div>
                </td>
                <td class="px-4 py-3 text-muted-foreground">{{ formatDateToPtBR(item.vencimento) }}</td>
                <td class="px-4 py-3 text-muted-foreground">
                  {{ item.dataPagamento ? formatDateToPtBR(item.dataPagamento) : '—' }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex rounded-full px-2 py-1 text-xs font-medium"
                    :class="
                      item.status === 'PAGO'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : item.status === 'ATRASADO'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    "
                  >
                    {{ item.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right font-medium text-foreground">
                  {{ formatCurrencyBR(item.pago && item.valorPago !== null ? item.valorPago : item.valor) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </ModalView>

  <ModalTransferenciaConta
    v-model:open="openTransferModal"
    :conta-origem="props.conta"
    :filtros="filtrosTransferencia"
    @completed="loadDetalhes"
  />
  <ModalAjusteSaldoConta
    v-model:open="openAjusteModal"
    :conta="props.conta"
    @completed="loadDetalhes"
  />
</template>
