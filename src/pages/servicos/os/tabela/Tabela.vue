<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import type { Table } from '@tanstack/vue-table';
import type { OrdensServico } from '@/types/schemas';
import { columnsServicos } from './columnDef';
import BulkActionsOs from './BulkActionsOs.vue';
import { useOrdemServicoStore } from '@/stores/servicos/useOrdensServicos';
const store = useOrdemServicoStore()

</script>

<template>
    <DataTable :columns="columnsServicos" api="/servicos/lista/ordens/tabela" :filters="store.filters">
        <template #toolbar="{ table }">
            <BulkActionsOs :table="(table as Table<OrdensServico>)" />
        </template>
    </DataTable>
</template>
