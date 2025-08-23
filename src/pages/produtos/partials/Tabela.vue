<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import { columnsProdutos } from './columnDef';
import { useProdutoStore } from '@/stores/produtos/useProduto';
const store = useProdutoStore()

</script>

<template>
  <DataTable :columns="columnsProdutos" api="/produtos" :filters="store.filters" />
</template>
