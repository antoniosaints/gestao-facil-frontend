<script setup lang="ts">
import type { Row } from '../adapters/domain'
import { money, quantity } from '../application/format'
import RecordsTable from './RecordsTable.vue'
withDefaults(defineProps<{ items: Row[]; caption?: string; empty?: string }>(), {
  caption: 'Itens da operação',
  empty: 'Esta operação não possui itens.',
})
</script>
<template>
  <RecordsTable
    :rows="items"
    :caption="caption"
    :empty="empty"
    :columns="[
      { key: 'name', label: 'Item' },
      { key: 'quantity', label: 'Quantidade', right: true },
      { key: 'price', label: 'Valor unitário', right: true },
      { key: 'total', label: 'Subtotal', right: true },
    ]"
  >
    <template #name="{ row }"
      ><strong>{{
        row.itemName || row.produto?.nome || row.servico?.nome || row.nome || 'Item'
      }}</strong></template
    >
    <template #quantity="{ row }">{{ quantity(row.quantidade) }}</template>
    <template #price="{ row }">{{ money(row.valor) }}</template>
    <template #total="{ row }"
      ><strong>{{ money(Number(row.quantidade) * Number(row.valor)) }}</strong></template
    >
  </RecordsTable>
</template>
