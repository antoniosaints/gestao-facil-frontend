<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue'
import { useAssinaturasPagarStore } from '@/stores/lancamentos/useAssinaturasPagar'
import { columnsAssinaturasPagar } from './assinaturasPagarColumns'

const store = useAssinaturasPagarStore()
</script>

<template>
  <DataTable :columns="columnsAssinaturasPagar" api="/lancamentos/assinaturas-pagar/tabela" :filters="store.filters" />
</template>
