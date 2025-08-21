<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import { columnsVendas } from './columnDef';
</script>

<template>
  <DataTable :columns="columnsVendas" :filters="{ status: 'FATURADO' }" api="/vendas" />
</template>
