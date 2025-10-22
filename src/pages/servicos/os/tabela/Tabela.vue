<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import { columnsServicos } from './columnDef';
import { useServicoStore } from '@/stores/servicos/useServicos';
const store = useServicoStore()

</script>

<template>
    <DataTable :columns="columnsServicos" api="/servicos/lista/tabela" :filters="store.filters" />
</template>
