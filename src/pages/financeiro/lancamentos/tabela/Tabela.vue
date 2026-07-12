<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import type { Table } from '@tanstack/vue-table';
import { columnsLancamentos } from './columnDef';
import BulkActionsLancamentos from './BulkActionsLancamentos.vue';
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos';
const store = useLancamentosStore()

</script>

<template>
    <DataTable :columns="columnsLancamentos" api="/lancamentos/getDataTable" :filters="store.filters">
        <template #toolbar="{ table }">
            <BulkActionsLancamentos :table="(table as Table<any>)" />
        </template>
    </DataTable>
</template>
