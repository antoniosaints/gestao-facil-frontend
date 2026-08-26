<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import { columnsCategoriasProduto } from './columnDef'
import BulkActionsCategorias from './BulkActionsCategorias.vue'

const store = useProdutoStore()
</script>

<template>
  <DataTable :columns="columnsCategoriasProduto" api="/produtos/categorias" :filters="store.filters">
    <template #toolbar><BulkActionsCategorias /></template>
  </DataTable>
</template>
