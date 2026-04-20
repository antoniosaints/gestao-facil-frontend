<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue'
import { useAssinaturasStore } from '@/stores/assinaturas/useAssinaturas'
import { columnsCobrancasAssinatura } from './cobrancasColumns'

const store = useAssinaturasStore()
</script>

<template>
  <DataTable
    :columns="columnsCobrancasAssinatura"
    api="/assinaturas/cobrancas/tabela"
    :filters="store.cobrancasFilters"
  />
</template>
