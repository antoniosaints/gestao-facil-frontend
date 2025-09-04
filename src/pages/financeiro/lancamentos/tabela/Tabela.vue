<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import { useClientesStore } from '@/stores/clientes/useClientes';
import { columnsLancamentos } from './columnDef';
const store = useClientesStore()

</script>

<template>
    <DataTable :columns="columnsLancamentos" api="/lancamentos/getDataTable" :filters="store.filters" />
</template>
