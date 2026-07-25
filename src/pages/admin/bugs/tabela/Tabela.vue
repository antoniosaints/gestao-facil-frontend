<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue'
import { columnsBugs } from './columnDef'

defineProps<{
  filters: Record<string, any>
}>()
</script>

<template>
  <DataTable :columns="columnsBugs" api="/admin/bugs" :filters="filters" />
</template>
