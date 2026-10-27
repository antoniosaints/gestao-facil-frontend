<script setup lang="ts">
import DeleteRecord from '../components/DeleteRecord.vue'
import RecordStatusAction from '../components/RecordStatusAction.vue'
import ModalAction from '../components/ModalAction.vue'
import FormSelect from '../components/FormSelect.vue'
import { Input } from '@/components/ui/input'
import { Plus, Search, Pencil, FileText } from 'lucide-vue-next'
import StatusBadge from '../components/StatusBadge.vue'
import RecordsTable from '../components/RecordsTable.vue'
import PageHeader from '../components/PageHeader.vue'
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
import { usePage } from '../application/usePage'
import { money } from '../application/format'
import Feedback from '../components/Feedback.vue'
import PageControls from '../components/PageControls.vue'
const ui = useUiStore(),
  route = useRoute(),
  status = ref(String(route.query.status || ''))
const canFiscal = computed(() => hasPermission(ui.usuarioLogged, 4))
const { rows, page, pages, total, search, loading, error, load, reloadAfterDelete } = usePage(
  () => '/modofacil/servicos',
  () => ({ status: status.value || undefined }),
)
onMounted(() => load())
</script>
<template>
  <section class="min-w-0 space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5">
    <PageHeader title="Serviços" description="Gerencie os serviços, valores e disponibilidade."
      ><template #actions
        ><RouterLink to="/modofacil/servicos/ordens" class="mf-button">Ordens de serviço</RouterLink
        ><ModalAction form="ordem-nova">Iniciar atendimento</ModalAction
        ><ModalAction
          class="mf-button !border-primary !bg-primary !text-primary-foreground"
          form="servico-novo"
          ><Plus :size="16" />Cadastrar serviço</ModalAction
        ></template
      ></PageHeader
    >
    <form class="flex flex-wrap items-end gap-3" @submit.prevent="load(true)">
      <label class="relative min-w-0 basis-full sm:flex-1 sm:basis-0"
        ><span class="sr-only">Buscar serviço</span
        ><Search
          :size="16"
          class="pointer-events-none absolute left-3 top-3 text-muted-foreground"
          aria-hidden="true" /><Input
          v-model="search"
          type="search"
          placeholder="Buscar por nome, código ou descrição..."
          class="!mt-0 !pl-9"
      /></label>
      <label class="min-w-0 flex-1 sm:max-w-44"
        ><span class="sr-only">Situação</span
        ><FormSelect
          v-model="status"
          class="!mt-0"
          aria-label="Situação"
          :options="[
            { value: '', label: 'Todas as situações' },
            { value: 'true', label: 'Ativo' },
            { value: 'false', label: 'Inativo' },
          ]"
      /></label>
      <button :disabled="loading">Buscar</button>
    </form>
    <Feedback :error="error" @retry="load()" />
    <RecordsTable
      class="[&_td]:!py-2 [&_td]:!leading-tight"
      :failed="!!error"
      :rows="rows"
      :loading="loading"
      caption="Serviços cadastrados"
      empty="Nenhum serviço encontrado."
      :columns="[
        { key: 'service', label: 'Serviço' },
        { key: 'price', label: 'Preço', right: true },
        { key: 'status', label: 'Situação' },
        { key: 'actions', label: 'Ações', right: true },
      ]"
    >
      <template #service="{ row }"
        ><strong class="block">{{ row.nome }}</strong
        ><small class="max-w-lg truncate" :title="row.descricao || undefined">{{
          row.descricao || row.Uid || `Serviço #${row.id}`
        }}</small></template
      >
      <template #price="{ row }"
        ><strong class="whitespace-nowrap">{{ money(row.preco) }}</strong></template
      >
      <template #status="{ row }"><StatusBadge :value="row.status" /></template>
      <template #actions="{ row }"
        ><div class="flex flex-wrap items-center gap-1.5 md:flex-nowrap md:justify-end">
          <ModalAction
            form="servico-editar"
            :params="{ id: row.id }"
            :disabled="loading"
            :aria-label="`Editar serviço ${row.nome}`"
            title="Editar serviço"
            ><Pencil :size="14" /><span class="md:sr-only">Editar</span></ModalAction
          >
          <RecordStatusAction
            kind="service"
            :record="row"
            :disabled="loading"
            icon-only
            @changed="reloadAfterDelete"
          />
          <ModalAction
            v-if="canFiscal"
            form="servico-avancado"
            :params="{ id: row.id }"
            :disabled="loading"
            :aria-label="`Dados fiscais de ${row.nome}`"
            title="Dados fiscais"
            ><FileText :size="14" /><span class="md:sr-only">Dados fiscais</span></ModalAction
          >
          <DeleteRecord
            kind="service"
            :record="row"
            :disabled="loading"
            icon-only
            @deleted="reloadAfterDelete"
          /></div
      ></template>
    </RecordsTable>
    <PageControls
      :page="page"
      :pages="pages"
      :total="total"
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
