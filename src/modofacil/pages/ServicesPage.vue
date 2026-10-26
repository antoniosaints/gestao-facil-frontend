<script setup lang="ts">
import ModalAction from '../components/ModalAction.vue'
import { Input } from '@/components/ui/input'

import { Plus, Search, Pencil } from 'lucide-vue-next'
import StatusBadge from '../components/StatusBadge.vue'
import RecordsTable from '../components/RecordsTable.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { onMounted } from 'vue'
import { usePage } from '../application/usePage'
import { money } from '../application/format'
import Feedback from '../components/Feedback.vue'
import PageControls from '../components/PageControls.vue'
const { rows, page, pages, total, search, loading, error, load } = usePage(
  () => '/modofacil/servicos',
)
onMounted(() => load())
</script>
<template>
  <PageFrame
    ><section class="min-w-0 space-y-5 rounded-[8px] border border-border bg-card p-4 sm:p-5">
      <PageHeader title="Serviços" description="O que você faz e quanto cobra."
        ><template #actions
          ><ModalAction
            class="mf-button !border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700"
            form="servico-novo"
            ><Plus :size="16" />Cadastrar serviço</ModalAction
          ></template
        ></PageHeader
      >
      <nav class="flex flex-wrap gap-x-5 gap-y-2 text-xs" aria-label="Atendimentos">
        <RouterLink to="/modofacil/servicos/ordens">Ordens de serviço</RouterLink
        ><ModalAction form="ordem-nova">Iniciar atendimento</ModalAction>
      </nav>
      <form
        class="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap [&>label]:min-w-0 lg:[&>label]:flex-1"
        @submit.prevent="load(true)"
      >
        <label
          >Buscar serviço<Input
            v-model="search"
            type="search"
            placeholder="Nome ou descrição" /></label
        ><button :disabled="loading"><Search :size="15" />Buscar</button>
      </form>
      <Feedback :error="error" @retry="load()" />
      <RecordsTable
        :failed="!!error"
        :rows="rows"
        :loading="loading"
        caption="Serviços cadastrados"
        empty="Nenhum serviço encontrado."
        :columns="[
          { key: 'service', label: 'Serviço' },
          { key: 'price', label: 'Preço', right: true },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: 'Ações', right: true },
        ]"
        ><template #service="{ row }"
          ><strong>{{ row.nome }}</strong
          ><small>{{ row.descricao || 'Sem descrição' }}</small></template
        ><template #price="{ row }"
          ><strong>{{ money(row.preco) }}</strong></template
        ><template #status="{ row }"><StatusBadge :value="row.status" /></template
        ><template #actions="{ row }"
          ><div class="flex flex-wrap items-center gap-3 md:justify-end">
            <ModalAction
              form="servico-editar"
              :params="{ id: row.id }"
              class="inline-flex min-h-10 items-center gap-1 text-xs"
              ><Pencil :size="14" />Editar serviço</ModalAction
            ><ModalAction
              form="servico-avancado"
              :params="{ id: row.id }"
              class="inline-flex min-h-10 items-center text-xs"
              >Situação e informações fiscais</ModalAction
            >
          </div></template
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
