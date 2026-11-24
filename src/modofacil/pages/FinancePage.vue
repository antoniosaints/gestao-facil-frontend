<script setup lang="ts">
import EntityLink from '@/components/navigation/EntityLink.vue'
import DeleteRecord from '../components/DeleteRecord.vue'
import FormSelect from '../components/FormSelect.vue'
import ModalAction from '../components/ModalAction.vue'
import { Input } from '@/components/ui/input'

import {
  Plus,
  Eye,
  Search,
  X,
  ArrowUpRight,
  ListFilter,
  Pencil,
  RefreshCw,
  ShoppingCart,
  Wrench,
  Wallet,
  WalletCards,
  ArrowLeftRight,
  Receipt,
  BarChart3,
} from 'lucide-vue-next'
import RecordActions from '../components/RecordActions.vue'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import StatusBadge from '../components/StatusBadge.vue'
import RecordsTable from '../components/RecordsTable.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { usePage } from '../application/usePage'
import { LancamentosRepository } from '../adapters/domain'
import { money, dateLabel, errorMessage } from '../application/format'
import Feedback from '../components/Feedback.vue'
import PageControls from '../components/PageControls.vue'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
const ui = useUiStore()
const canFinance = computed(() => hasPermission(ui.usuarioLogged, 3))
const route = useRoute(),
  type = ref(String(route.query.tipo || '')),
  status = ref(String(route.query.status || '')),
  start = ref(String(route.query.inicio || '')),
  end = ref(String(route.query.fim || '')),
  summary = ref<any>(null),
  summaryLoading = ref(false),
  summaryError = ref('')
const filtersOpen = ref(false)
const summaryKeys = ['RECEBIDO', 'PAGO', 'A_RECEBER', 'A_PAGAR'] as const
type SummaryKey = (typeof summaryKeys)[number]
const selection = ref<SummaryKey | ''>(
  summaryKeys.includes(route.query.resumo as SummaryKey) ? (route.query.resumo as SummaryKey) : '',
)
const metrics = computed(() => [
  {
    key: 'RECEBIDO' as const,
    label: 'Recebido',
    value: summary.value?.cards.receitasRealizadas,
    basis: 'Pagamento',
    tipo: 'RECEITA',
    status: 'PAGO',
    tone: 'text-emerald-600 dark:text-emerald-300',
  },
  {
    key: 'PAGO' as const,
    label: 'Pago',
    value: summary.value?.cards.despesasRealizadas,
    basis: 'Pagamento',
    tipo: 'DESPESA',
    status: 'PAGO',
    tone: 'text-blue-600 dark:text-blue-300',
  },
  {
    key: 'A_RECEBER' as const,
    label: 'A receber',
    value: summary.value?.cards.aReceberPendente,
    basis: 'Vencimento',
    tipo: 'RECEITA',
    status: 'PENDENTE',
    tone: 'text-orange-600 dark:text-orange-300',
  },
  {
    key: 'A_PAGAR' as const,
    label: 'A pagar',
    value: summary.value?.cards.aPagarPendente,
    basis: 'Vencimento',
    tipo: 'DESPESA',
    status: 'PENDENTE',
    tone: 'text-violet-600 dark:text-violet-300',
  },
])
const activeMetric = computed(() => metrics.value.find((metric) => metric.key === selection.value))
function inputDate(value: string) {
  if (!value || /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const startInput = computed({
  get: () => inputDate(start.value),
  set: (value: string) => {
    start.value = value
    selection.value = ''
  },
})
const endInput = computed({
  get: () => inputDate(end.value),
  set: (value: string) => {
    end.value = value
    selection.value = ''
  },
})
const hasFilters = computed(
  () =>
    !!(selection.value || type.value || status.value || start.value || end.value || search.value),
)
if (activeMetric.value) {
  type.value = activeMetric.value.tipo
  status.value = activeMetric.value.status
}
const { rows, page, pages, total, search, loading, error, load, reloadAfterDelete } = usePage(
  () => '/modofacil/financeiro/lancamentos',
  () => ({
    tipo: type.value || undefined,
    status: status.value || undefined,
    inicio: start.value || undefined,
    fim: end.value || undefined,
    resumo: selection.value || undefined,
  }),
  loadSummary,
)
let summaryGeneration = 0
onBeforeUnmount(() => summaryGeneration++)
async function loadSummary() {
  const generation = ++summaryGeneration
  summaryLoading.value = true
  summaryError.value = ''
  try {
    const response = await LancamentosRepository.getDashboardVisaoGeral({
      inicio: start.value || undefined,
      fim: end.value || undefined,
    })
    if (generation !== summaryGeneration) return
    if (!response.data?.cards) throw new Error('Não foi possível carregar o resumo financeiro.')
    summary.value = response.data
  } catch (e) {
    if (generation === summaryGeneration) summaryError.value = errorMessage(e)
  } finally {
    if (generation === summaryGeneration) summaryLoading.value = false
  }
}
async function refresh() {
  if (startInput.value && endInput.value && startInput.value > endInput.value) {
    error.value = 'A data inicial deve ser anterior ou igual à data final.'
    return
  }
  await Promise.all([load(true), loadSummary()])
}
async function deleted() {
  await Promise.all([reloadAfterDelete(), loadSummary()])
}
function clearFilters() {
  selection.value = ''
  type.value = ''
  status.value = ''
  search.value = ''
  start.value = ''
  end.value = ''
  void refresh()
}
async function selectMetric(key: SummaryKey) {
  if (summaryLoading.value || summaryError.value || !summary.value?.periodo) return
  if (selection.value === key) {
    clearFilters()
    return
  }
  const metric = metrics.value.find((metric) => metric.key === key)!
  selection.value = key
  type.value = metric.tipo
  status.value = metric.status
  search.value = ''
  start.value = summary.value.periodo.inicio
  end.value = summary.value.periodo.fim
  await load(true)
}
onMounted(() => Promise.all([load(), loadSummary()]))
</script>
<template>
  <PageFrame class="!space-y-3"
    ><PageHeader
      title="Financeiro"
      description="Recebimentos, pagamentos e pendências do seu negócio."
      ><template #actions
        ><ModalAction class="mf-button" form="lancamento-novo" :query="{ tipo: 'RECEITA' }"
          ><Plus :size="16" />Registrar receita</ModalAction
        ><ModalAction
          class="mf-button !border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700"
          form="lancamento-novo"
          :query="{ tipo: 'DESPESA' }"
          ><Plus :size="16" />Registrar despesa</ModalAction
        ></template
      ></PageHeader
    >
    <div class="space-y-2" :aria-busy="summaryLoading">
      <div
        class="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground"
      >
        <span
          >Resumo financeiro ·
          {{
            summary?.periodo
              ? `${dateLabel(summary.periodo.inicio)} a ${dateLabel(summary.periodo.fim)}`
              : 'Mês atual'
          }}<span v-if="summaryLoading"> · Atualizando…</span></span
        >
        <span class="hidden sm:inline">Selecione um resumo para filtrar os lançamentos</span>
      </div>
      <Feedback :error="summaryError" @retry="loadSummary" />
      <div v-if="summary" class="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <button
          v-for="metric in metrics"
          :key="metric.key"
          type="button"
          class="mf-finance-summary group min-w-0 !justify-start !p-3 !text-left"
          :class="
            selection === metric.key
              ? '!border-primary !bg-primary/5 ring-1 ring-primary/20'
              : 'hover:!border-primary/50'
          "
          :aria-pressed="selection === metric.key"
          aria-controls="mf-finance-records"
          :aria-label="`${metric.label}: ${money(metric.value)}. Filtrar lançamentos por ${metric.basis.toLowerCase()} no período.`"
          :title="`Filtrar ${metric.label.toLowerCase()} no período`"
          :disabled="summaryLoading || !!summaryError || !summary?.periodo"
          @click="selectMetric(metric.key)"
        >
          <div class="min-w-0 flex-1">
            <span class="flex items-center gap-2 text-xs text-muted-foreground"
              >{{ metric.label
              }}<span class="hidden !text-[10px] opacity-75 sm:inline">{{
                metric.basis
              }}</span></span
            ><strong
              class="mt-1 block break-words text-xl font-semibold tracking-tight"
              :class="metric.tone"
              >{{ money(metric.value) }}</strong
            >
          </div>
          <ArrowUpRight
            :size="15"
            class="shrink-0 text-muted-foreground group-hover:text-primary"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
    <section class="min-w-0 space-y-3 rounded-lg border border-border bg-card p-3 sm:p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 class="!mb-0">Lançamentos</h2>
          <span class="text-xs text-muted-foreground"
            >{{ total }} registro(s) ·
            {{
              activeMetric
                ? `${activeMetric.label} por data de ${activeMetric.basis.toLowerCase()}`
                : start || end
                  ? 'Período por data de lançamento'
                  : 'Todas as datas'
            }}</span
          >
          <button
            v-if="activeMetric"
            type="button"
            class="!min-h-7 !border-primary/20 !bg-primary/5 !px-2 !py-0.5 !text-xs !text-primary"
            @click="clearFilters"
            :aria-label="`Remover filtro ${activeMetric.label}`"
          >
            {{ activeMetric.label }}<X :size="12" aria-hidden="true" />
          </button>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="!min-h-8 !px-2.5 !py-1 !text-xs md:!hidden"
            :aria-expanded="filtersOpen"
            aria-controls="mf-finance-filters"
            @click="filtersOpen = !filtersOpen"
          >
            <ListFilter :size="14" />Filtros</button
          ><RecordActions label="Outras operações financeiras">
            <DropdownMenuItem as-child
              ><RouterLink to="/modofacil/financeiro/cadastros"
                ><Wallet :size="15" />Contas e categorias</RouterLink
              ></DropdownMenuItem
            >
            <DropdownMenuItem as-child
              ><ModalAction form="financeiro-transferir"
                ><ArrowLeftRight :size="15" />Transferir entre contas</ModalAction
              ></DropdownMenuItem
            >
            <DropdownMenuItem as-child
              ><RouterLink to="/modofacil/financeiro/cobrancas"
                ><Receipt :size="15" />Cobranças</RouterLink
              ></DropdownMenuItem
            >
            <DropdownMenuItem as-child
              ><RouterLink to="/modofacil/financeiro/emprestimos"
                ><WalletCards :size="15" />Empréstimos</RouterLink
              ></DropdownMenuItem
            >
            <DropdownMenuItem as-child
              ><RouterLink to="/modofacil/relatorios"
                ><BarChart3 :size="15" />Relatórios</RouterLink
              ></DropdownMenuItem
            >
          </RecordActions>
        </div>
      </div>
      <form
        id="mf-finance-filters"
        class="hidden grid-cols-2 items-end gap-2 [&_label]:!text-[11px] [&_label>input]:!mt-1 [&_label>div]:!mt-1 md:grid md:grid-cols-3 xl:grid-cols-[minmax(160px,1fr)_130px_130px_155px_155px_auto]"
        :class="filtersOpen ? '!grid' : ''"
        @submit.prevent="refresh"
      >
        <label class="col-span-2 min-w-0 md:col-span-1"
          >Buscar
          <div class="relative">
            <Search
              :size="15"
              class="pointer-events-none absolute left-3 top-3 text-muted-foreground"
              aria-hidden="true"
            /><Input
              v-model="search"
              type="search"
              placeholder="Descrição ou código"
              class="!pl-9"
            /></div
        ></label>
        <label
          >Tipo<FormSelect
            v-model="type"
            @update:model-value="selection = ''"
            :options="[
              { value: '', label: 'Todos' },
              { value: 'RECEITA', label: 'Receitas' },
              { value: 'DESPESA', label: 'Despesas' },
            ]"
        /></label>
        <label
          >Situação<FormSelect
            v-model="status"
            @update:model-value="selection = ''"
            :options="[
              { value: '', label: 'Todas' },
              { value: 'PENDENTE', label: 'Pendente' },
              { value: 'PAGO', label: 'Pago' },
              { value: 'ATRASADO', label: 'Atrasado' },
              { value: 'PARCIAL', label: 'Parcial' },
            ]"
        /></label>
        <label>De<Input placeholder="dd/mm/aaaa" v-model="startInput" type="date" /></label>
        <label>Até<Input placeholder="dd/mm/aaaa" v-model="endInput" type="date" /></label>
        <div class="col-span-2 flex items-end justify-end gap-1 md:col-span-1">
          <button :disabled="loading" title="Aplicar filtros" class="!h-10 !min-h-10 !px-3">
            <Search :size="15" /><span class="md:sr-only">Aplicar filtros</span>
          </button>
          <button
            type="button"
            :disabled="loading || !hasFilters"
            title="Limpar filtros"
            class="!h-10 !min-h-10 !px-3"
            @click="clearFilters"
          >
            <X :size="15" /><span class="md:sr-only">Limpar filtros</span>
          </button>
        </div>
      </form>
      <Feedback :error="error" @retry="load()" />
      <RecordsTable
        id="mf-finance-records"
        class="[&_td]:!py-2 [&_td]:!px-3 [&_th]:!px-3 [&_td]:!leading-tight"
        :failed="!!error"
        :rows="rows"
        :loading="loading"
        :caption="
          activeMetric
            ? `Lançamentos: ${activeMetric.label.toLowerCase()} no período`
            : 'Lançamentos por data de lançamento'
        "
        empty="Nenhum lançamento encontrado."
        :columns="[
          { key: 'description', label: 'Descrição' },
          { key: 'type', label: 'Tipo' },
          { key: 'category', label: 'Categoria' },
          { key: 'status', label: 'Situação' },
          { key: 'value', label: activeMetric ? 'Valor no período' : 'Total', right: true },
          { key: 'actions', label: 'Ações', right: true },
        ]"
        ><template #description="{ row }"
          ><strong class="block max-w-44 truncate" :title="row.descricao">{{
            row.descricao
          }}</strong
          ><small v-if="row.vendaId || row.ordemServicoId" class="max-w-44 truncate">{{
            row.vendaId ? `Venda #${row.vendaId}` : `OS #${row.ordemServicoId}`
          }}</small></template
        ><template #type="{ row }"><StatusBadge :value="row.tipo" /></template
        ><template #category="{ row }"
          ><span class="block max-w-28 truncate" :title="row.categoria?.nome"><EntityLink kind="categoria" :record-id="row.categoriaId ?? row.categoria?.id" :label="row.categoria?.nome || '—'" /></span></template
        ><template #status="{ row }"><StatusBadge :value="row.status" /></template
        ><template #value="{ row }"
          ><strong class="whitespace-nowrap">{{
            money(activeMetric ? row.valorResumo : row.valorTotal)
          }}</strong
          ><small v-if="activeMetric">{{ row.parcelasResumo }} parcela(s)</small></template
        ><template #actions="{ row }"
          ><div
            class="flex flex-wrap items-center gap-1.5 md:flex-nowrap md:justify-end [&_button]:!min-h-8 [&_button]:!px-2.5 [&_button]:!py-1"
          >
            <RouterLink
              :to="`/modofacil/financeiro/lancamentos/${row.id}`"
              class="mf-button !min-h-8 !px-2.5 !py-1 !text-xs"
              :aria-label="`Ver lançamento ${row.descricao || row.id}`"
              title="Ver detalhes"
              ><Eye :size="14" /><span class="sr-only">Ver detalhes</span></RouterLink
            ><ModalAction
              v-if="canFinance"
              form="lancamento-editar"
              :params="{ id: row.id }"
              :disabled="loading"
              :aria-label="`Editar lançamento ${row.descricao || row.id}`"
              title="Editar lançamento"
              class="!min-h-8 !px-2.5 !py-1 !text-xs"
              ><Pencil :size="14" /><span class="sr-only">Editar</span></ModalAction
            >
            <DeleteRecord
              kind="finance"
              :record="row"
              :disabled="loading"
              icon-only
              @deleted="deleted"
            />
            <RecordActions
              v-if="canFinance || row.vendaId || row.ordemServicoId"
              :label="`Ações do lançamento ${row.descricao || row.id}`"
              :disabled="loading"
            >
              <DropdownMenuItem v-if="canFinance" as-child
                ><ModalAction form="financeiro-parcela" :params="{ id: row.id }"
                  ><Plus :size="15" />Adicionar parcela</ModalAction
                ></DropdownMenuItem
              >
              <DropdownMenuItem v-if="canFinance" as-child
                ><ModalAction form="financeiro-recorrencia" :params="{ id: row.id }"
                  ><RefreshCw :size="15" />Organizar recorrência</ModalAction
                ></DropdownMenuItem
              >
              <DropdownMenuItem v-if="row.vendaId" as-child
                ><RouterLink :to="`/modofacil/vendas/${row.vendaId}`"
                  ><ShoppingCart :size="15" />Ver venda vinculada</RouterLink
                ></DropdownMenuItem
              >
              <DropdownMenuItem v-if="row.ordemServicoId" as-child
                ><RouterLink :to="`/modofacil/servicos/ordens/${row.ordemServicoId}`"
                  ><Wrench :size="15" />Ver OS vinculada</RouterLink
                ></DropdownMenuItem
              >
            </RecordActions>
          </div></template
        ></RecordsTable
      >
      <PageControls
        :page="page"
        :pages="pages"
        :total="total"
        :loading="loading"
        @change="
          ($event) => {
            page = $event
            load()
          }
        "
      />
    </section>
    <details v-if="summary?.assinaturasPagar" class="!bg-card">
      <summary>
        Assinaturas a pagar previstas · {{ money(summary.assinaturasPagar.totalPrevistoPeriodo) }}
      </summary>
      <p class="text-muted-foreground">
        Estes compromissos são apresentados separadamente das parcelas.
      </p>
      <ul class="divide-y divide-border">
        <li
          v-for="item in summary.assinaturasPagar.proximas"
          :key="item.id"
          class="flex flex-wrap justify-between gap-3 py-3"
        >
          <span>{{ item.nomeServico }}</span
          ><strong>{{ money(item.valor) }}</strong>
        </li>
      </ul>
    </details>
  </PageFrame>
</template>
