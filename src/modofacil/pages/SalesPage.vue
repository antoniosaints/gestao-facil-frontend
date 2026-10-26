<script setup lang="ts">
import ModalAction from '../components/ModalAction.vue'
import { Input } from '@/components/ui/input'

import { Plus, Eye, Search } from 'lucide-vue-next'
import StatusBadge from '../components/StatusBadge.vue'
import RecordsTable from '../components/RecordsTable.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePage } from '../application/usePage'
import { money, dateLabel } from '../application/format'
import Feedback from '../components/Feedback.vue'
import PageControls from '../components/PageControls.vue'
const route = useRoute()
const status = ref(String(route.query.status || ''))
const { rows, page, pages, total, search, loading, error, load } = usePage(
  () => '/modofacil/vendas',
  () => ({ status: status.value || undefined, inicio: route.query.inicio, fim: route.query.fim }),
)
onMounted(() => load())
</script>
<template>
  <PageFrame
    ><section class="min-w-0 space-y-5 rounded-[8px] border border-border bg-card p-4 sm:p-5">
      <PageHeader title="Vendas" description="Acompanhe cada venda e seu pagamento."
        ><template #actions
          ><ModalAction
            class="mf-button !border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700"
            form="venda-nova"
            ><Plus :size="16" />Fazer uma venda</ModalAction
          ></template
        ></PageHeader
      >
      <nav class="flex flex-wrap gap-x-5 gap-y-2 text-xs" aria-label="Operações de vendas">
        <ModalAction form="venda-nova" :query="{ orcamento: '1' }">Preparar orçamento</ModalAction
        ><RouterLink to="/modofacil/caixa">Abrir, movimentar ou fechar caixa</RouterLink>
      </nav>
      <form
        class="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap [&>label]:min-w-0 lg:[&>label]:flex-1"
        @submit.prevent="load(true)"
      >
        <label class="lg:grow-[2]"
          >Buscar<Input
            v-model="search"
            type="search"
            placeholder="Nome ou código da venda" /></label
        ><label
          >Situação<select v-model="status">
            <option value="">Todas</option>
            <option value="PENDENTE">Pendente</option>
            <option value="ANDAMENTO">Em andamento</option>
            <option value="FINALIZADO">Finalizada</option>
            <option value="ORCAMENTO">Orçamento</option>
            <option value="FATURADO">Faturada</option>
            <option value="CANCELADA">Cancelada</option>
          </select></label
        ><button :disabled="loading"><Search :size="15" />Buscar</button>
      </form>
      <Feedback :error="error" @retry="load()" />
      <RecordsTable
        :failed="!!error"
        :rows="rows"
        :loading="loading"
        caption="Vendas cadastradas"
        empty="Nenhuma venda encontrada."
        :columns="[
          { key: 'code', label: 'Venda' },
          { key: 'client', label: 'Cliente' },
          { key: 'date', label: 'Data' },
          { key: 'status', label: 'Status' },
          { key: 'value', label: 'Total', right: true },
          { key: 'actions', label: 'Ações', right: true },
        ]"
      >
        <template #code="{ row }"
          ><strong>{{ row.Uid || `Venda #${row.id}` }}</strong></template
        ><template #client="{ row }">{{ row.cliente?.nome || 'Cliente não informado' }}</template
        ><template #date="{ row }">{{ dateLabel(row.data) }}</template
        ><template #status="{ row }"><StatusBadge :value="row.status" /></template
        ><template #value="{ row }"
          ><strong>{{ money(row.valor) }}</strong></template
        ><template #actions="{ row }"
          ><RouterLink
            :to="`/modofacil/vendas/${row.id}`"
            class="inline-flex min-h-10 items-center gap-1.5 text-xs"
            :aria-label="`Ver venda ${row.Uid || row.id}`"
            ><Eye :size="15" />Ver detalhes</RouterLink
          ></template
        ></RecordsTable
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
