<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue'
import { useAssinaturasStore } from '@/stores/assinaturas/useAssinaturas'
import { columnsAssinaturas } from './assinaturasColumns'

const store = useAssinaturasStore()
</script>

<template>
  <DataTable
    :columns="columnsAssinaturas"
    api="/assinaturas/assinaturas/tabela"
    :filters="store.assinaturasFilters"
  />
</template>
