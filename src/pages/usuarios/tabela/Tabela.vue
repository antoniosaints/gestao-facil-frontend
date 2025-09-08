<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import { useClientesStore } from '@/stores/clientes/useClientes';
import { columnsUsuarios } from './columnDef';
const store = useClientesStore()

</script>

<template>
    <DataTable :columns="columnsUsuarios" api="/usuarios" :filters="store.filters" />
</template>
