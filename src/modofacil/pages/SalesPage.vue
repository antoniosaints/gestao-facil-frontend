<script setup lang="ts">
import DeleteRecord from '../components/DeleteRecord.vue'
import FormSelect from '../components/FormSelect.vue'
import ModalAction from '../components/ModalAction.vue'
import { Input } from '@/components/ui/input'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import RecordActions from '../components/RecordActions.vue'
import { VendaRepository, type Row } from '../adapters/domain'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'

import { Plus, Eye, Search, Pencil, Download, Receipt, FileText, Wallet } from 'lucide-vue-next'
import StatusBadge from '../components/StatusBadge.vue'
import RecordsTable from '../components/RecordsTable.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePage } from '../application/usePage'
import { money, dateLabel, errorMessage } from '../application/format'
import Feedback from '../components/Feedback.vue'
import PageControls from '../components/PageControls.vue'
const route = useRoute()
const ui = useUiStore()
const canEdit = computed(() => hasPermission(ui.usuarioLogged, 2))
const canFinance = computed(() => hasPermission(ui.usuarioLogged, 3))
const status = ref(String(route.query.status || ''))
const downloading = ref(false),
  downloadError = ref(''),
  receiptSale = ref<Row | null>(null)
const billed = (row: Row) => !!row.faturado || row.status === 'FATURADO'
const { rows, page, pages, total, search, loading, error, load, reloadAfterDelete } = usePage(
  () => '/modofacil/vendas',
  () => ({ status: status.value || undefined, inicio: route.query.inicio, fim: route.query.fim }),
)
onMounted(() => load())
async function receipt(row: Row) {
  if (downloading.value) return
  receiptSale.value = row
  downloading.value = true
  downloadError.value = ''
  try {
    await VendaRepository.getCupomPDF(row.id)
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
      <PageHeader title="Vendas" description="Acompanhe cada venda e seu pagamento."
        ><template #actions
          ><RecordActions label="Operações de vendas">
            <DropdownMenuItem as-child
              ><ModalAction form="venda-nova" :query="{ orcamento: '1' }"
                ><FileText :size="15" />Preparar orçamento</ModalAction
              ></DropdownMenuItem
            >
            <DropdownMenuItem as-child
              ><RouterLink to="/modofacil/caixa"
                ><Wallet :size="15" />Abrir, movimentar ou fechar caixa</RouterLink
              ></DropdownMenuItem
            > </RecordActions
          ><ModalAction
            class="mf-button !border-primary !bg-primary !text-primary-foreground"
            form="venda-nova"
            ><Plus :size="16" />Fazer uma venda</ModalAction
          ></template
        ></PageHeader
      >
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="load(true)">
        <label class="relative min-w-0 basis-full sm:flex-1 sm:basis-0"
          ><span class="sr-only">Buscar venda</span
          ><Search
            :size="16"
            class="pointer-events-none absolute left-3 top-3 text-muted-foreground"
            aria-hidden="true" /><Input
            v-model="search"
            type="search"
            class="!mt-0 !pl-9"
            placeholder="Buscar por cliente ou código da venda..." /></label
        ><label class="min-w-0 flex-1 sm:max-w-48"
          ><span class="sr-only">Situação</span
          ><FormSelect
            v-model="status"
            class="!mt-0"
            aria-label="Situação"
            :options="[
              { value: '', label: 'Todas as situações' },
              { value: 'PENDENTE', label: 'Pendente' },
              { value: 'ANDAMENTO', label: 'Em andamento' },
              { value: 'FINALIZADO', label: 'Finalizada' },
              { value: 'ORCAMENTO', label: 'Orçamento' },
              { value: 'FATURADO', label: 'Faturada' },
              { value: 'CANCELADA', label: 'Cancelada' },
            ]" /></label
        ><button :disabled="loading">Buscar</button>
      </form>
      <Feedback :error="error" @retry="load()" />
      <Feedback :error="downloadError" @retry="receiptSale && receipt(receiptSale)" />
      <p v-if="downloading" role="status" class="!mb-0 text-xs text-muted-foreground">
        Preparando comprovante da venda {{ receiptSale?.Uid || `#${receiptSale?.id}` }}…
      </p>
      <RecordsTable
        class="[&_td]:!py-2 [&_td]:!px-3 [&_th]:!px-3 [&_td]:!leading-tight"
        :failed="!!error"
        :rows="rows"
        :loading="loading"
        caption="Vendas cadastradas"
        empty="Nenhuma venda encontrada."
        :columns="[
          { key: 'code', label: 'Venda' },
          { key: 'client', label: 'Cliente' },
          { key: 'date', label: 'Data' },
          { key: 'status', label: 'Situação' },
          { key: 'value', label: 'Total', right: true },
          { key: 'actions', label: 'Ações', right: true },
        ]"
      >
        <template #code="{ row }"
          ><strong class="block max-w-36 truncate" :title="row.Uid || `Venda #${row.id}`">{{
            row.Uid || `Venda #${row.id}`
          }}</strong></template
        ><template #client="{ row }"
          ><strong class="block max-w-40 truncate" :title="row.cliente?.nome">{{
            row.cliente?.nome || 'Cliente não informado'
          }}</strong></template
        ><template #date="{ row }"
          ><span class="whitespace-nowrap">{{ dateLabel(row.data) }}</span></template
        ><template #status="{ row }"><StatusBadge :value="row.status" /></template
        ><template #value="{ row }"
          ><strong class="whitespace-nowrap">{{ money(row.valor) }}</strong></template
        ><template #actions="{ row }"
          ><div
            class="flex flex-wrap items-center gap-1.5 md:flex-nowrap md:justify-end [&_button]:!min-h-8 [&_button]:!px-2.5 [&_button]:!py-1"
          >
            <RouterLink
              :to="`/modofacil/vendas/${row.id}`"
              class="mf-button !min-h-8 !px-2.5 !py-1 !text-xs"
              :aria-label="`Ver venda ${row.Uid || row.id}`"
              title="Ver detalhes"
              ><Eye :size="14" /><span class="sr-only">Ver detalhes</span></RouterLink
            ><ModalAction
              v-if="canEdit && !billed(row)"
              form="venda-editar"
              :params="{ id: row.id }"
              :disabled="loading"
              :aria-label="`Editar venda ${row.Uid || row.id}`"
              title="Editar venda"
              class="!min-h-8 !px-2.5 !py-1 !text-xs"
              ><Pencil :size="14" /><span class="sr-only">Editar</span></ModalAction
            >
            <DeleteRecord
              kind="sale"
              :record="row"
              :disabled="loading"
              icon-only
              @deleted="reloadAfterDelete"
            />
            <RecordActions :label="`Ações da venda ${row.Uid || row.id}`" :disabled="loading">
              <DropdownMenuItem :disabled="downloading" @select="receipt(row)"
                ><Download :size="15" />Baixar comprovante</DropdownMenuItem
              >
              <DropdownMenuItem
                v-if="
                  canFinance && !billed(row) && !['CANCELADA', 'CANCELADO'].includes(row.status)
                "
                as-child
                ><ModalAction
                  form="financeiro-cobranca-nova"
                  :query="{ tipo: 'venda', origem: row.id }"
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
