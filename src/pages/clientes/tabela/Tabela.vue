<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import { columnsClientes } from '@/pages/clientes/tabela/columnDef';
import { useClientesStore } from '@/stores/clientes/useClientes';
const store = useClientesStore()

</script>

<template>
    <DataTable :columns="columnsClientes" api="/clientes/getDataTable" :filters="store.filters" />
</template>
