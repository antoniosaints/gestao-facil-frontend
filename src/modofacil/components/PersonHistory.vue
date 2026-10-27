<script setup lang="ts">
import FormSelect from './FormSelect.vue'
import { Input } from '@/components/ui/input'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
import { api, type Row } from '../adapters/domain'
import { money, dateLabel, errorMessage } from '../application/format'
import Feedback from './Feedback.vue'
import RecordsTable from './RecordsTable.vue'
import StatusBadge from './StatusBadge.vue'
import PageControls from './PageControls.vue'
const props = defineProps<{ personId: number; initialTab?: string }>()
const ui = useUiStore(),
  tab = ref(props.initialTab || 'vendas'),
  search = ref(''),
  page = ref(1),
  loading = ref(false),
  error = ref(''),
  result = ref<Row | null>(null)
const tabs = computed(() =>
  [
    { value: 'vendas', label: 'Vendas', level: 2 },
    { value: 'ordens', label: 'Ordens de serviço', level: 2 },
    { value: 'lancamentos', label: 'Lançamentos', level: 3 },
    { value: 'cobrancas', label: 'Cobranças', level: 3 },
  ].filter((t) => hasPermission(ui.usuarioLogged, t.level)),
)
let generation = 0
async function load(reset = false) {
  if (reset) page.value = 1
  const request = ++generation
  loading.value = true
  error.value = ''
  result.value = null
  try {
    if (!tabs.value.some((t) => t.value === tab.value))
      throw new Error('Sem permissão para este histórico.')
    const data = await api.read(`/modofacil/pessoas/${props.personId}/historico`, {
      tab: tab.value,
      page: page.value,
      limit: 10,
      search: search.value,
    })
    if (!Array.isArray(data?.items) || !data?.meta)
      throw new Error('Não foi possível consultar o histórico.')
    if (request === generation) result.value = data
  } catch (e) {
    if (request === generation) error.value = errorMessage(e)
  } finally {
    if (request === generation) loading.value = false
  }
}
function target(row: Row) {
  return tab.value === 'vendas'
    ? `/modofacil/vendas/${row.id}`
    : tab.value === 'ordens'
      ? `/modofacil/servicos/ordens/${row.id}`
      : tab.value === 'lancamentos'
        ? `/modofacil/financeiro/lancamentos/${row.id}`
        : null
}
function amount(row: Row) {
  if (tab.value !== 'ordens') return row.valorTotal ?? row.valor
  if (!Array.isArray(row.ItensOrdensServico)) return null
  return (
    (row.ItensOrdensServico.reduce(
      (sum: number, item: Row) =>
        sum + Math.round(Number(item.valor) * Number(item.quantidade) * 100),
      0,
    ) -
      Math.round(Number(row.desconto || 0) * 100)) /
    100
  )
}
watch(tab, () => {
  search.value = ''
  void load(true)
})
onMounted(() => load())
onBeforeUnmount(() => generation++)
</script>
<template>
  <section
    class="min-w-0 space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5"
    aria-labelledby="person-history-title"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 id="person-history-title" class="!mb-0">Histórico desta pessoa</h2>
      <small>{{
        result ? `${result.meta.total} registro(s)` : 'Vendas, serviços e financeiro vinculados'
      }}</small>
    </div>
    <form class="flex flex-wrap items-end gap-3" @submit.prevent="load(true)">
      <label class="min-w-0 w-full sm:w-52"
        ><span class="sr-only">O que deseja consultar?</span
        ><FormSelect
          v-model="tab"
          aria-label="O que deseja consultar?"
          class="!mt-0"
          :options="tabs.map((t) => ({ value: t.value, label: t.label }))"
      /></label>
      <label class="min-w-0 flex-1 basis-full sm:basis-0"
        ><span class="sr-only">Buscar no histórico</span
        ><Input
          v-model="search"
          type="search"
          placeholder="Buscar por descrição ou código"
          class="!mt-0"
      /></label>
      <button :disabled="loading">Consultar histórico</button>
    </form>
    <Feedback :error="error" @retry="load()" />
    <RecordsTable
      :rows="result?.items || []"
      :loading="loading"
      :failed="!!error"
      caption="Histórico de operações desta pessoa"
      empty="Nenhum registro vinculado encontrado."
      :columns="[
        { key: 'code', label: 'Registro' },
        { key: 'date', label: 'Data' },
        { key: 'status', label: 'Situação' },
        { key: 'amount', label: 'Valor', right: true },
      ]"
    >
      <template #code="{ row }"
        ><RouterLink v-if="target(row)" :to="target(row)!" class="!inline !min-h-0 !p-0"
          ><strong>{{ row.descricao || row.Uid || `#${row.id}` }}</strong></RouterLink
        ><strong v-else>{{ row.Uid || `#${row.id}` }}</strong></template
      >
      <template #date="{ row }">{{
        dateLabel(row.data || row.dataLancamento || row.dataVencimento)
      }}</template>
      <template #status="{ row }"><StatusBadge :value="row.status" /></template>
      <template #amount="{ row }"
        ><strong>{{ money(amount(row)) }}</strong></template
      >
    </RecordsTable>
    <PageControls
      v-if="result"
      :page="page"
      :pages="result.meta.totalPages"
      :total="result.meta.total"
      :loading="loading"
      @change="
        (value) => {
          page = value
          load()
        }
      "
    />
  </section>
</template>
