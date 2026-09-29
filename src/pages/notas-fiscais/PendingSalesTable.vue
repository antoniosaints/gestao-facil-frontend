<script setup lang="ts">
import { h } from 'vue'
import type { Column, ColumnDef, Table } from '@tanstack/vue-table'
import { ArrowUpDown, Send } from 'lucide-vue-next'
import DataTable from '@/components/tabela/DataTable.vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { formatCurrencyBR } from '@/utils/formatters'
import type { UninvoicedSale } from '@/repositories/notas-fiscais-repository'

const props = defineProps<{ tipo: 'NFE' | 'NFCE'; ready: boolean; emitting: boolean; refreshToken: number }>()
const emit = defineEmits<{ emitSales: [ids: number[]] }>()

function sortHeader(label: string, column: Column<UninvoicedSale>) {
  return h(Button, { variant: 'ghost', onClick: () => column.toggleSorting(column.getIsSorted() === 'asc') }, () => [label, h(ArrowUpDown, { class: 'ml-2 size-4' })])
}

const columns: ColumnDef<UninvoicedSale>[] = [
  {
    id: 'select',
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => h(Checkbox, {
      modelValue: table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? 'indeterminate' : false,
      'onUpdate:modelValue': (value: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!value),
      'aria-label': 'Selecionar todas as vendas desta página',
    }),
    cell: ({ row }) => h(Checkbox, {
      modelValue: row.getIsSelected(),
      'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
      'aria-label': `Selecionar venda ${row.original.uid}`,
    }),
  },
  { accessorKey: 'uid', header: ({ column }) => sortHeader('Venda', column), cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.uid) },
  {
    id: 'cliente',
    header: 'Cliente e documento',
    enableSorting: false,
    cell: ({ row }) => h('div', { class: 'min-w-44' }, [
      h('p', { class: 'font-medium' }, row.original.cliente?.nome || 'Consumidor final'),
      h('p', { class: row.original.cliente?.documentoValido ? 'text-xs text-emerald-700 dark:text-emerald-300' : 'text-xs text-amber-700 dark:text-amber-300' }, !row.original.cliente ? 'Sem cliente vinculado' : row.original.cliente.documentoValido ? 'CPF/CNPJ válido' : row.original.cliente.documento ? 'CPF/CNPJ inválido' : 'Sem CPF/CNPJ cadastrado'),
    ]),
  },
  { accessorKey: 'data', header: ({ column }) => sortHeader('Data', column), cell: ({ row }) => new Date(row.original.data).toLocaleDateString('pt-BR') },
  { accessorKey: 'valorTotal', header: ({ column }) => sortHeader('Valor', column), cell: ({ row }) => h('strong', { class: 'whitespace-nowrap' }, formatCurrencyBR(row.original.valorTotal)) },
  {
    id: 'acoes',
    header: 'Ações',
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => h(Button, {
      size: 'sm', variant: 'outline', disabled: !props.ready || props.emitting,
      onClick: () => emit('emitSales', [row.original.id]),
    }, () => 'Emitir'),
  },
]

function emitSelected(table: Table<UninvoicedSale>) {
  emit('emitSales', table.getSelectedRowModel().rows.map((row) => row.original.id))
}
</script>

<template>
  <DataTable
    :key="`${tipo}-${refreshToken}`"
    :columns="columns"
    api="/v1/notas-fiscais/vendas/sem-documento"
    :state-key="`notas-fiscais-pendentes-${tipo}`"
    empty-title="Nenhuma venda pendente"
    empty-description="Não há vendas faturadas aguardando emissão."
  >
    <template #toolbar="{ table, selectedCount }">
      <div class="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-xs text-muted-foreground">Marque as vendas desta página para emitir em lote. Use a busca para localizar código, cliente ou CPF/CNPJ.</p>
        <Button size="sm" :disabled="!ready || !selectedCount || emitting" @click="emitSelected(table as Table<UninvoicedSale>)"><Send :class="{ 'animate-pulse': emitting }" />Emitir selecionadas ({{ selectedCount }})</Button>
      </div>
    </template>
  </DataTable>
</template>
