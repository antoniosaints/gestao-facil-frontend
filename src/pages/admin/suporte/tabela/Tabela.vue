<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue'
import { columnsAcessosSuporte } from './columnDef'

defineProps<{
  filters: Record<string, any>
}>()
</script>

<template>
  <DataTable :columns="columnsAcessosSuporte" api="/admin/suporte/acessos" :filters="filters" />
</template>
