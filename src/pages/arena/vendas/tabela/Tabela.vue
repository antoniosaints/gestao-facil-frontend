<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue'
import { columnsComandas } from './columnDef'
import { useComandaStore } from '@/stores/arena/comandaStore'

const store = useComandaStore()
</script>

<template>
  <DataTable :columns="columnsComandas" api="/vendas/comandas" :filters="store.filters" />
</template>
