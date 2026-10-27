<script setup lang="ts">
import FormSelect from '../components/FormSelect.vue'
import ModalAction from '../components/ModalAction.vue'
import { Input } from '@/components/ui/input'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import RecordActions from '../components/RecordActions.vue'
import { OrdensServicoRepository, type Row } from '../adapters/domain'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'

import { Plus, Eye, Search, Pencil, Download, Receipt } from 'lucide-vue-next'
import StatusBadge from '../components/StatusBadge.vue'
import RecordsTable from '../components/RecordsTable.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePage } from '../application/usePage'
import { dateLabel, errorMessage, money } from '../application/format'
import { orderAmounts } from '../application/detailRecords'
import Feedback from '../components/Feedback.vue'
import PageControls from '../components/PageControls.vue'
const route = useRoute()
const ui = useUiStore()
const canEdit = computed(() => hasPermission(ui.usuarioLogged, 2))
const canFinance = computed(() => hasPermission(ui.usuarioLogged, 3))
const status = ref(String(route.query.status || ''))
const downloading = ref(false),
  downloadError = ref(''),
  pdfOrder = ref<Row | null>(null)
const { rows, page, pages, total, search, loading, error, load } = usePage(
  () => '/modofacil/servicos/ordens',
  () => ({ status: status.value || undefined }),
)
onMounted(() => load())
async function pdf(row: Row) {
  if (downloading.value) return
  pdfOrder.value = row
  downloading.value = true
  downloadError.value = ''
  try {
    await OrdensServicoRepository.getOsPdf(row.id, row.Uid || `OS-${row.id}`, false, true)
  } catch (e) {
    downloadError.value = errorMessage(e)
  } finally {
    downloading.value = false
  }
}
</script>
<template>
  <PageFrame
    ><section class="min-w-0 space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5">
      <PageHeader
        title="Ordens de serviço"
        description="Acompanhe os atendimentos e a situação de cada ordem."
        ><template #actions
          ><RouterLink to="/modofacil/servicos" class="mf-button">Catálogo de serviços</RouterLink
          ><ModalAction
            class="mf-button !border-primary !bg-primary !text-primary-foreground"
            form="ordem-nova"
            ><Plus :size="16" />Iniciar atendimento</ModalAction
          ></template
        ></PageHeader
      >
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="load(true)">
        <label class="relative min-w-0 basis-full sm:flex-1 sm:basis-0"
          ><span class="sr-only">Buscar ordem de serviço</span
          ><Search
            :size="16"
            class="pointer-events-none absolute left-3 top-3 text-muted-foreground"
            aria-hidden="true" /><Input
            v-model="search"
            type="search"
            class="!mt-0 !pl-9"
            placeholder="Buscar por código, cliente ou descrição..." /></label
        ><label class="min-w-0 flex-1 sm:max-w-48"
          ><span class="sr-only">Situação</span
          ><FormSelect
            v-model="status"
            class="!mt-0"
            aria-label="Situação"
            :options="[
              { value: '', label: 'Todas as situações' },
              ...[
                ['ABERTA', 'Aberta'],
                ['ORCAMENTO', 'Orçamento'],
                ['APROVADA', 'Aprovada'],
                ['ANDAMENTO', 'Em andamento'],
                ['FATURADA', 'Faturada'],
                ['CANCELADA', 'Cancelada'],
              ].map(([value, label]) => ({ value: value, label: label })),
            ]" /></label
        ><button :disabled="loading">Buscar</button>
      </form>
      <Feedback :error="error" @retry="load()" />
      <Feedback :error="downloadError" @retry="pdfOrder && pdf(pdfOrder)" />
      <p v-if="downloading" role="status" class="!mb-0 text-xs text-muted-foreground">
        Preparando PDF da ordem {{ pdfOrder?.Uid || `OS #${pdfOrder?.id}` }}…
      </p>
      <RecordsTable
        class="[&_td]:!py-2 [&_td]:!px-3 [&_th]:!px-3 [&_td]:!leading-tight"
        :failed="!!error"
        :rows="rows"
        :loading="loading"
        caption="Ordens de serviço"
        empty="Nenhuma ordem encontrada."
        :columns="[
          { key: 'code', label: 'Ordem' },
          { key: 'client', label: 'Cliente / descrição' },
          { key: 'date', label: 'Data' },
          { key: 'status', label: 'Situação' },
          { key: 'value', label: 'Total', right: true },
          { key: 'actions', label: 'Ações', right: true },
        ]"
        ><template #code="{ row }"
          ><strong class="whitespace-nowrap">{{ row.Uid || `OS #${row.id}` }}</strong></template
        ><template #client="{ row }"
          ><strong class="block max-w-48 truncate" :title="row.Cliente?.nome">{{
            row.Cliente?.nome || 'Cliente não informado'
          }}</strong
          ><small v-if="row.descricao" class="max-w-48 truncate" :title="row.descricao">{{
            row.descricao
          }}</small></template
        ><template #date="{ row }"
          ><span class="whitespace-nowrap">{{ dateLabel(row.data) }}</span></template
        ><template #status="{ row }"><StatusBadge :value="row.status" /></template
        ><template #value="{ row }"
          ><strong class="whitespace-nowrap">{{ money(orderAmounts(row).total) }}</strong></template
        ><template #actions="{ row }"
          ><div class="flex flex-wrap items-center gap-1.5 md:flex-nowrap md:justify-end">
            <RouterLink
              :to="`/modofacil/servicos/ordens/${row.id}`"
              class="mf-button !min-h-8 !px-2.5 !py-1 !text-xs"
              :aria-label="`Ver ordem ${row.Uid || row.id}`"
              title="Ver detalhes"
              ><Eye :size="14" /><span class="sr-only">Ver detalhes</span></RouterLink
            ><ModalAction
              v-if="canEdit && row.status !== 'FATURADA'"
              form="ordem-editar"
              :params="{ id: row.id }"
              :disabled="loading"
              :aria-label="`Editar ordem ${row.Uid || row.id}`"
              title="Editar ordem"
              class="!min-h-8 !px-2.5 !py-1 !text-xs"
              ><Pencil :size="14" /><span class="sr-only">Editar</span></ModalAction
            >
            <RecordActions :label="`Ações da ordem ${row.Uid || row.id}`" :disabled="loading">
              <DropdownMenuItem :disabled="downloading" @select="pdf(row)"
                ><Download :size="15" />Baixar ordem em PDF</DropdownMenuItem
              >
              <DropdownMenuItem
                v-if="canFinance && !['FATURADA', 'CANCELADA'].includes(row.status)"
                as-child
                ><ModalAction
                  form="financeiro-cobranca-nova"
                  :query="{ tipo: 'os', origem: row.id }"
                  ><Receipt :size="15" />Criar cobrança vinculada</ModalAction
                ></DropdownMenuItem
              >
            </RecordActions>
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
