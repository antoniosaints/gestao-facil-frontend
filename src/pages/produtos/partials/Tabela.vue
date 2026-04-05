<script setup lang="ts">
import { computed } from 'vue'
import DataTable from '@/components/tabela/DataTable.vue';
import { columnsProdutos, columnsVariantes } from './columnDef';
import { useProdutoStore } from '@/stores/produtos/useProduto';
const store = useProdutoStore()

const columns = computed(() => store.filters.listingMode === 'variante' ? columnsVariantes : columnsProdutos)

</script>

<template>
  <DataTable :key="store.filters.listingMode" :columns="columns" api="/produtos" :filters="store.filters" />
</template>
