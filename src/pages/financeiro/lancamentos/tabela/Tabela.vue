<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import { columnsLancamentos } from './columnDef';
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos';
const store = useLancamentosStore()

</script>

<template>
    <DataTable :columns="columnsLancamentos" api="/lancamentos/getDataTable" :filters="store.filters" />
</template>
