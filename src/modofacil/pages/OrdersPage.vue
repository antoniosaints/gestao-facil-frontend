<script setup lang="ts">
import ModalAction from '../components/ModalAction.vue'
import { Input } from '@/components/ui/input'

import { Plus, Eye, Search } from 'lucide-vue-next'
import StatusBadge from '../components/StatusBadge.vue'
import RecordsTable from '../components/RecordsTable.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usePage } from '../application/usePage'
import { dateLabel } from '../application/format'
import Feedback from '../components/Feedback.vue'
import PageControls from '../components/PageControls.vue'
const route = useRoute()
const status = ref(String(route.query.status || ''))
const { rows, page, pages, total, search, loading, error, load } = usePage(
  () => '/modofacil/servicos/ordens',
  () => ({ status: status.value || undefined }),
)
onMounted(() => load())
</script>
<template>
  <PageFrame
    ><section class="min-w-0 space-y-5 rounded-[8px] border border-border bg-card p-4 sm:p-5">
      <PageHeader
        title="Ordens de serviço"
        description="Saiba o que está aberto e o próximo atendimento."
        ><template #actions
          ><ModalAction
            class="mf-button !border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700"
            form="ordem-nova"
            ><Plus :size="16" />Iniciar atendimento</ModalAction
          ></template
        ></PageHeader
      >
      <form
        class="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap [&>label]:min-w-0 lg:[&>label]:flex-1"
        @submit.prevent="load(true)"
      >
        <label
          >Buscar<Input
            v-model="search"
            type="search"
            placeholder="Código, cliente ou descrição" /></label
        ><label
          >Situação<select v-model="status">
            <option value="">Todas</option>
            <option
              v-for="[value, label] in [
                ['ABERTA', 'Aberta'],
                ['ORCAMENTO', 'Orçamento'],
                ['APROVADA', 'Aprovada'],
                ['ANDAMENTO', 'Em andamento'],
                ['FATURADA', 'Faturada'],
                ['CANCELADA', 'Cancelada'],
              ]"
              :key="value"
              :value="value"
            >
              {{ label }}
            </option>
          </select></label
        ><button :disabled="loading"><Search :size="15" />Buscar</button>
      </form>
      <Feedback :error="error" @retry="load()" />
      <RecordsTable
        :failed="!!error"
        :rows="rows"
        :loading="loading"
        caption="Ordens de serviço"
        empty="Nenhuma ordem encontrada."
        :columns="[
          { key: 'code', label: 'Ordem' },
          { key: 'client', label: 'Cliente / descrição' },
          { key: 'date', label: 'Data' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: 'Ações', right: true },
        ]"
        ><template #code="{ row }"
          ><strong>{{ row.Uid || `OS #${row.id}` }}</strong></template
        ><template #client="{ row }"
          >{{ row.Cliente?.nome || 'Cliente não informado'
          }}<small>{{ row.descricao }}</small></template
        ><template #date="{ row }">{{ dateLabel(row.data) }}</template
        ><template #status="{ row }"><StatusBadge :value="row.status" /></template
        ><template #actions="{ row }"
          ><RouterLink
            :to="`/modofacil/servicos/ordens/${row.id}`"
            class="inline-flex min-h-10 items-center gap-1.5 text-xs"
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
