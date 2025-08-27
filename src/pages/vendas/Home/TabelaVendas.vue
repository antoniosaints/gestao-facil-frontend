<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import { columnsVendas } from './columnDef';
import { useVendasStore } from '@/stores/vendas/useVenda';
const store = useVendasStore()
</script>
<template>
  <DataTable :columns="columnsVendas" :filters="store.filters" api="/vendas" />
</template>
