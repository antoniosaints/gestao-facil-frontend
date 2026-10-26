<script setup lang="ts">
import { Input } from '@/components/ui/input'

import { ref, computed } from 'vue'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
import { api } from '../adapters/domain'
import { money, dateLabel, errorMessage } from '../application/format'
import Feedback from './Feedback.vue'
const props = defineProps<{ personId: number }>(),
  ui = useUiStore(),
  tab = ref('vendas'),
  search = ref(''),
  page = ref(1),
  loading = ref(false),
  error = ref(''),
  result = ref<any>(null)
const tabs = computed(() =>
  [
    { value: 'vendas', label: 'Vendas', level: 2 },
    { value: 'ordens', label: 'Ordens de serviço', level: 2 },
    { value: 'lancamentos', label: 'Lançamentos', level: 3 },
    { value: 'cobrancas', label: 'Cobranças', level: 3 },
  ].filter((t) => hasPermission(ui.usuarioLogged, t.level)),
)
async function load(reset = false) {
  if (reset) page.value = 1
  loading.value = true
  error.value = ''
  try {
    if (!tabs.value.some((t) => t.value === tab.value))
      throw new Error('Sem permissão para este histórico.')
    result.value = await api.read(`/modofacil/pessoas/${props.personId}/historico`, {
      tab: tab.value,
      page: page.value,
      limit: 10,
      search: search.value,
    })
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <section
    class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
  >
    <h2>Histórico desta pessoa</h2>
    <div class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2">
      <label
        >O que deseja consultar?<select v-model="tab" @change="result = null">
          <option v-for="t in tabs" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select></label
      ><label
        >Buscar no histórico<Input
          v-model="search"
          type="search"
          @keydown.enter.prevent="load(true)"
      /></label>
    </div>
    <button type="button" :disabled="loading" @click="load(true)">Consultar histórico</button
    ><Feedback :loading="loading" :error="error" @retry="load()" /><template v-if="result"
      ><ul class="mf-list m-0 grid list-none gap-3 p-0">
        <li
          v-for="row in result.items"
          :key="row.id"
          class="mf-row flex flex-wrap items-center justify-between gap-4 break-words rounded-[6px] border border-border p-4 [&>div]:min-w-0 min-w-0 bg-card"
        >
          <div>
            <RouterLink v-if="tab === 'vendas'" :to="`/modofacil/vendas/${row.id}`">{{
              row.Uid
            }}</RouterLink
            ><RouterLink
              v-else-if="tab === 'ordens'"
              :to="`/modofacil/servicos/ordens/${row.id}`"
              >{{ row.Uid }}</RouterLink
            ><RouterLink
              v-else-if="tab === 'lancamentos'"
              :to="`/modofacil/financeiro/lancamentos/${row.id}`"
              >{{ row.descricao || row.Uid }}</RouterLink
            ><strong v-else>{{ row.Uid }}</strong>
            <p>
              {{ row.status }} ·
              {{ dateLabel(row.data || row.dataLancamento || row.dataVencimento) }}
            </p>
          </div>
          <span>{{ money(row.valorTotal ?? row.valor) }}</span>
        </li>
      </ul>
      <p v-if="!result.items.length">Nenhum registro encontrado.</p>
      <nav
        class="mf-actions my-4 flex flex-wrap items-end gap-3"
        aria-label="Paginação do histórico"
      >
        <button
          type="button"
          :disabled="page <= 1 || loading"
          @click="
            () => {
              page--
              load()
            }
          "
        >
          Anterior</button
        ><span>{{ page }} / {{ result.meta.totalPages }} · {{ result.meta.total }} registros</span
        ><button
          type="button"
          :disabled="page >= result.meta.totalPages || loading"
          @click="
            () => {
              page++
              load()
            }
          "
        >
          Próxima
        </button>
      </nav></template
    >
  </section>
</template>
