<script setup lang="ts">
import ModalAction from '../components/ModalAction.vue'
import { Input } from '@/components/ui/input'

import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Plus, Eye, Pencil, Users } from 'lucide-vue-next'
import { usePage } from '../application/usePage'
import Feedback from '../components/Feedback.vue'
import RecordsTable from '../components/RecordsTable.vue'
import StatusBadge from '../components/StatusBadge.vue'
import PageControls from '../components/PageControls.vue'
const route = useRoute()
const status = ref(String(route.query.status || ''))
const { rows, page, pages, total, search, loading, error, load } = usePage(
  () => '/modofacil/pessoas',
  () => ({ status: status.value || undefined }),
)
onMounted(() => load())
</script>
<template>
  <section class="min-w-0 rounded-[8px] border border-border bg-card p-4 sm:p-5">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1>Pessoas</h1>
        <p class="!mb-0 text-muted-foreground">Gerencie seus clientes e fornecedores.</p>
      </div>
      <ModalAction
        class="mf-button !border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700"
        form="pessoa-nova"
        ><Plus :size="16" />Nova pessoa</ModalAction
      >
    </div>
    <form class="mb-4 flex flex-wrap items-end gap-3" @submit.prevent="load(true)">
      <label class="relative min-w-0 basis-full sm:flex-1 sm:basis-0"
        ><span class="sr-only">Buscar por nome ou código</span
        ><Search
          :size="16"
          class="pointer-events-none absolute left-3 top-3 text-muted-foreground"
          aria-hidden="true" /><Input
          v-model="search"
          type="search"
          placeholder="Buscar por nome ou código..."
          class="!mt-0 !pl-9"
      /></label>
      <label class="min-w-0 flex-1 sm:max-w-48"
        ><span class="sr-only">Status</span
        ><select v-model="status" class="!mt-0" aria-label="Status">
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativo</option>
          <option value="INATIVO">Inativo</option>
        </select></label
      >
      <button :disabled="loading">Buscar</button>
    </form>
    <Feedback :error="error" @retry="load()" />
    <RecordsTable
      :failed="!!error"
      :rows="rows"
      :loading="loading"
      caption="Clientes e fornecedores cadastrados"
      empty="Nenhuma pessoa encontrada."
      :columns="[
        { key: 'code', label: 'ID' },
        { key: 'name', label: 'Nome' },
        { key: 'email', label: 'E-mail' },
        { key: 'phone', label: 'Telefone' },
        { key: 'city', label: 'Cidade' },
        { key: 'status', label: 'Status' },
        { key: 'actions', label: 'Ações', right: true },
      ]"
    >
      <template #code="{ row }">{{ row.Uid || String(row.id).padStart(3, '0') }}</template>
      <template #name="{ row }"
        ><RouterLink
          :to="`/modofacil/pessoas/${row.id}`"
          class="!text-foreground hover:!text-blue-600 dark:hover:!text-blue-300"
          ><strong>{{ row.nome }}</strong></RouterLink
        ><small>{{ row.tipo === 'FORNECEDOR' ? 'Fornecedor' : 'Cliente' }}</small></template
      >
      <template #email="{ row }">{{ row.email || '—' }}</template
      ><template #phone="{ row }">{{ row.telefone || '—' }}</template
      ><template #city="{ row }">{{
        [row.cidade, row.estado].filter(Boolean).join(' - ') || '—'
      }}</template
      ><template #status="{ row }"><StatusBadge :value="row.status" /></template>
      <template #actions="{ row }"
        ><div class="flex flex-wrap gap-2 md:justify-end">
          <RouterLink
            :to="`/modofacil/pessoas/${row.id}`"
            class="inline-flex min-h-10 items-center justify-center gap-1 rounded-[5px] border border-border px-3 !text-muted-foreground hover:bg-blue-500/10"
            :aria-label="`Ver ${row.nome}`"
            ><Eye :size="15" /><span class="md:sr-only">Ver detalhes</span></RouterLink
          ><ModalAction
            form="pessoa-editar"
            :params="{ id: row.id }"
            class="inline-flex min-h-10 items-center justify-center gap-1 rounded-[5px] border border-border px-3 !text-muted-foreground hover:bg-blue-500/10"
            :aria-label="`Editar ${row.nome}`"
            ><Pencil :size="14" /><span class="md:sr-only">Editar</span></ModalAction
          >
        </div></template
      >
    </RecordsTable>
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
</template>
