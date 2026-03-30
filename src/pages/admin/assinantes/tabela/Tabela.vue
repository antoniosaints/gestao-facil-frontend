<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue'
import { columnsAssinantesAdmin } from './columnDef'

defineProps<{
  filters: Record<string, any>
}>()
</script>

<template>
  <DataTable :columns="columnsAssinantesAdmin" api="/admin/assinantes" :filters="filters" />
</template>
