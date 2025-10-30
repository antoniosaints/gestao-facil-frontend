<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import { columnsServicos } from './columnDef';
import { useOrdemServicoStore } from '@/stores/servicos/useOrdensServicos';
const store = useOrdemServicoStore()

</script>

<template>
    <DataTable :columns="columnsServicos" api="/servicos/lista/ordens/tabela" :filters="store.filters" />
</template>
