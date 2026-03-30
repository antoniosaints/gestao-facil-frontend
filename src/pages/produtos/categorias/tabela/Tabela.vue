<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import { columnsCategoriasProduto } from './columnDef'

const store = useProdutoStore()
</script>

<template>
  <DataTable :columns="columnsCategoriasProduto" api="/produtos/categorias" :filters="store.filters" />
</template>
