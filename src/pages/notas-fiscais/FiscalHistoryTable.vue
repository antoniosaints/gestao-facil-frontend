<script setup lang="ts">
import { h, reactive, ref, watch } from 'vue'
import type { Column, ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, Eye, FileText, RefreshCw } from 'lucide-vue-next'
import DataTable from '@/components/tabela/DataTable.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrencyBR } from '@/utils/formatters'
import type { FiscalDocument } from '@/repositories/notas-fiscais-repository'
import FiscalDocumentDetails from './FiscalDocumentDetails.vue'
import FiscalStatusBadge from './FiscalStatusBadge.vue'
import { formatFiscalDate, hasFiscalDocumentsInProgress, typeLabels } from './fiscalPresentation'

const props = withDefaults(
  defineProps<{
    tipo: FiscalDocument['tipo']
    refreshToken: number
    showHeader?: boolean
    emitting?: boolean
  }>(),
  { showHeader: true },
)
const emit = defineEmits<{ changed: [] }>()
const filters = reactive({ tipo: props.tipo })
const tableVersion = ref(0)
const detailOpen = ref(false)
const detailId = ref<number | null>(null)
const detailView = ref<'acompanhamento' | 'nota'>('acompanhamento')
const autoRefresh = {
  intervalMs: 5000,
  when: (documents: FiscalDocument[]) =>
    Boolean(props.emitting) || hasFiscalDocumentsInProgress(documents),
}
watch(
  () => props.tipo,
  (tipo) => {
    filters.tipo = tipo
    detailOpen.value = false
  },
)

function openDetail(document: FiscalDocument, view: 'acompanhamento' | 'nota' = 'acompanhamento') {
  detailId.value = document.id
  detailView.value = view
  detailOpen.value = true
}
function documentChanged() {
  tableVersion.value++
  emit('changed')
}
function sortHeader(label: string, column: Column<FiscalDocument>) {
  return h(
    Button,
    { variant: 'ghost', onClick: () => column.toggleSorting(column.getIsSorted() === 'asc') },
    () => [label, h(ArrowUpDown, { class: 'ml-2 size-4' })],
  )
}
const columns: ColumnDef<FiscalDocument>[] = [
  {
    accessorKey: 'numero',
    header: ({ column }) => sortHeader('Nota fiscal', column),
    cell: ({ row }) =>
      h(
        Button,
        {
          variant: 'link',
          class: 'h-auto p-0 font-semibold',
          onClick: () => openDetail(row.original, 'nota'),
        },
        () =>
          row.original.numero
            ? `${typeLabels[row.original.tipo]} #${row.original.numero}`
            : row.original.rpsNumero
              ? `RPS ${row.original.rpsNumero}`
              : `${typeLabels[row.original.tipo]} #${row.original.id}`,
      ),
  },
  {
    id: 'venda',
    header: 'Venda',
    enableSorting: false,
    cell: ({ row }) =>
      row.original.vendaUid || (row.original.vendaId ? `#${row.original.vendaId}` : 'Avulsa'),
  },
  {
    id: 'cliente',
    header: 'Cliente / tomador',
    enableSorting: false,
    cell: ({ row }) =>
      h('div', { class: 'min-w-36' }, [
        h('p', { class: 'font-medium' }, row.original.cliente?.nome || 'Consumidor final'),
        h(
          'p',
          { class: 'text-xs text-muted-foreground' },
          row.original.cliente?.documento || 'Sem documento',
        ),
      ]),
  },
  {
    accessorKey: 'valorTotal',
    header: ({ column }) => sortHeader('Valor', column),
    cell: ({ row }) =>
      h(
        'strong',
        { class: 'whitespace-nowrap text-emerald-700 dark:text-emerald-300' },
        formatCurrencyBR(row.original.valorTotal),
      ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => sortHeader('Status', column),
    cell: ({ row }) =>
      h(FiscalStatusBadge, { status: row.original.status, error: row.original.erroMensagem }),
  },
  {
    accessorKey: 'criadoEm',
    header: ({ column }) => sortHeader('Data', column),
    cell: ({ row }) => h('span', { class: 'text-xs' }, formatFiscalDate(row.original.criadoEm)),
  },
  {
    id: 'ambiente',
    header: 'Ambiente',
    enableSorting: false,
    cell: ({ row }) =>
      h(Badge, { variant: 'outline' }, () =>
        row.original.ambiente === 'HOMOLOGACAO'
          ? 'Homologação'
          : row.original.ambiente === 'PRODUCAO'
            ? 'Produção'
            : '—',
      ),
  },
  {
    id: 'acoes',
    header: 'Ações',
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-1.5' }, [
        h(
          Button,
          { variant: 'outline', size: 'sm', onClick: () => openDetail(row.original) },
          () => [h(Eye, { class: 'size-4' }), 'Acompanhar'],
        ),
        h(
          Button,
          {
            variant: 'outline',
            size: 'icon',
            class: 'size-8',
            'aria-label': `Visualizar ${typeLabels[row.original.tipo]} ${row.original.numero || row.original.rpsNumero || row.original.id}`,
            onClick: () => openDetail(row.original, 'nota'),
          },
          () => h(FileText, { class: 'size-4' }),
        ),
      ]),
  },
]
</script>

<template>
  <div class="space-y-3">
    <div v-if="showHeader" class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold">Histórico de {{ typeLabels[tipo] }}</h2>
        <p class="text-sm text-muted-foreground">
          Consulte as emissões e acompanhe os detalhes e arquivos das notas.
        </p>
      </div>
      <Button size="sm" variant="outline" @click="tableVersion++"><RefreshCw />Atualizar</Button>
    </div>
    <DataTable
      :key="`${tipo}-${refreshToken}-${tableVersion}`"
      :columns="columns"
      api="/v1/notas-fiscais/documentos"
      :filters="filters"
      :auto-refresh="autoRefresh"
      :state-key="`historico-notas-fiscais-${tipo}`"
      empty-title="Nenhuma nota emitida ainda"
      empty-description="As notas desta conta aparecerão aqui após a emissão."
    />
  </div>
  <FiscalDocumentDetails
    v-model:open="detailOpen"
    :document-id="detailId"
    :initial-view="detailView"
    @changed="documentChanged"
  />
</template>
