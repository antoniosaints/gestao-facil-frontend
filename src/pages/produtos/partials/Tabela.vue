<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import { columnsProdutos } from './columnDef';
</script>

<template>
  <DataTable :columns="columnsProdutos" api="/produtos" />
</template>
