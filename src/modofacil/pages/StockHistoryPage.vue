<script setup lang="ts">
import EntityLink from '@/components/navigation/EntityLink.vue'
import FormSelect from '../components/FormSelect.vue'
import { Input } from '@/components/ui/input'

import { Search } from 'lucide-vue-next'
import StatusBadge from '../components/StatusBadge.vue'
import RecordsTable from '../components/RecordsTable.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePage } from '../application/usePage'
import { quantity, dateLabel } from '../application/format'
import Feedback from '../components/Feedback.vue'
import PageControls from '../components/PageControls.vue'
const route = useRoute(),
  type = ref(String(route.query.tipo || ''))
const { rows, page, pages, total, search, loading, error, load } = usePage(
  () => '/modofacil/estoque/movimentacoes',
  () => ({ produtoId: route.query.produtoId, tipo: type.value || undefined }),
)
onMounted(() => load())
</script>
<template>
  <PageFrame
    ><section class="min-w-0 space-y-5 rounded-[8px] border border-border bg-card p-4 sm:p-5">
      <PageHeader
        title="Histórico do estoque"
        description="Entradas e saídas registradas pelo sistema."
        back="/modofacil/produtos"
        back-label="Produtos"
      />
      <form
        class="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap [&>label]:min-w-0 lg:[&>label]:flex-1"
        @submit.prevent="load(true)"
      >
        <label
          >Buscar produto<Input
            v-model="search"
            type="search"
            placeholder="Nome ou código" /></label
        ><label
          >Operação<FormSelect
            v-model="type"
            :options="[
              { value: '', label: 'Todas' },
              { value: 'ENTRADA', label: 'Entrada' },
              { value: 'SAIDA', label: 'Saída' },
              { value: 'DESCARTE', label: 'Descarte' },
              { value: 'TRANSFERENCIA', label: 'Transferência' },
            ]" /></label
        ><button :disabled="loading"><Search :size="15" />Aplicar filtros</button>
      </form>
      <Feedback :error="error" @retry="load()" />
      <RecordsTable
        :failed="!!error"
        :rows="rows"
        :loading="loading"
        caption="Movimentações de estoque"
        empty="Não há movimentos para estes filtros."
        :columns="[
          { key: 'produtoNome', label: 'Produto' },
          { key: 'date', label: 'Data' },
          { key: 'operation', label: 'Operação' },
          { key: 'quantity', label: 'Quantidade', right: true },
          { key: 'origin', label: 'Origem / fornecedor' },
          { key: 'status', label: 'Status' },
        ]"
        ><template #produtoNome="{ row }"><EntityLink kind="produto" :record-id="row.produtoBaseId" :variant-id="row.produtoId" :label="row.produtoNome" /></template><template #date="{ row }">{{ dateLabel(row.data) }}</template
        ><template #operation="{ row }"><StatusBadge :value="row.tipo" /></template
        ><template #quantity="{ row }">{{ quantity(row.quantidade) }}</template
        ><template #origin="{ row }"
          ><EntityLink :kind="row.vendaId ? 'venda' : 'ordem'" :record-id="row.vendaId ?? row.ordemId" :label="row.origem" /><small><EntityLink kind="cliente" :record-id="row.fornecedorId" :label="row.fornecedor || 'Sem fornecedor'" /></small></template
        ><template #status="{ row }"><StatusBadge :value="row.status" /></template></RecordsTable
      ><PageControls
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
      /></section
  ></PageFrame>
</template>
