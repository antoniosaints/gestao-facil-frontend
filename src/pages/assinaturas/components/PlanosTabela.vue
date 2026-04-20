<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue'
import { useAssinaturasStore } from '@/stores/assinaturas/useAssinaturas'
import { columnsPlanosAssinatura } from './planosColumns'

const store = useAssinaturasStore()
</script>

<template>
  <DataTable
    :columns="columnsPlanosAssinatura"
    api="/assinaturas/planos/tabela"
    :filters="store.planosFilters"
  />
</template>
