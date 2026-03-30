<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue'
import { columnsFaturasAdmin } from './columnDef'

defineProps<{
  filters: Record<string, any>
}>()
</script>

<template>
  <DataTable :columns="columnsFaturasAdmin" api="/admin/faturas" :filters="filters" />
</template>
