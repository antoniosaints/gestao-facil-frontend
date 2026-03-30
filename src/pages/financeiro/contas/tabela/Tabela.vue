<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue'
import { columnsContasFinanceiras } from './columnDef'
import { useContasFinanceirasStore } from '@/stores/lancamentos/useContasFinanceiras'

const store = useContasFinanceirasStore()
</script>

<template>
  <DataTable :columns="columnsContasFinanceiras" api="/lancamentos/contas/getDataTable" :filters="store.filters" />
</template>
