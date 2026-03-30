<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue'
import { columnsCategorias } from './columnDef'
import { useCategoriasFinanceirasStore } from '@/stores/lancamentos/useCategoriasFinanceiras'

const store = useCategoriasFinanceirasStore()
</script>

<template>
  <DataTable :columns="columnsCategorias" api="/lancamentos/categorias/getDataTable" :filters="store.filters" />
</template>
