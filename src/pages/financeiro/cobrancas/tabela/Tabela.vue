<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import { columnsCobrancas } from './columnDef';
import { useCobrancasFinanceirasStore } from '@/stores/lancamentos/useCobrancas';
const store = useCobrancasFinanceirasStore()

</script>

<template>
    <DataTable :columns="columnsCobrancas" api="/lancamentos/cobrancas/lista/table" :filters="store.filters" />
</template>
