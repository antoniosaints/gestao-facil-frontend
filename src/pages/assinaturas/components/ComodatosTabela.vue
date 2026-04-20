<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue'
import { useAssinaturasStore } from '@/stores/assinaturas/useAssinaturas'
import { columnsComodatosAssinatura } from './comodatosColumns'

const store = useAssinaturasStore()
</script>

<template>
  <DataTable
    :columns="columnsComodatosAssinatura"
    api="/assinaturas/comodatos/tabela"
    :filters="store.comodatosFilters"
  />
</template>
