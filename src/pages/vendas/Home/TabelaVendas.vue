<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import type { Table } from '@tanstack/vue-table';
import type { Vendas } from '@/types/schemas';
import { columnsVendas } from './columnDef';
import BulkActionsVendas from './BulkActionsVendas.vue';
import { useVendasStore } from '@/stores/vendas/useVenda';
const store = useVendasStore()
</script>
<template>
  <DataTable :columns="columnsVendas" :filters="store.filters" api="/vendas">
    <template #toolbar="{ table }">
      <BulkActionsVendas :table="(table as Table<Vendas>)" />
    </template>
  </DataTable>
</template>
