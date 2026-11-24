<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import type { Table } from '@tanstack/vue-table';
import type { Vendas } from '@/types/schemas';
import { computed, onMounted, reactive, watch } from 'vue';
import { getColumnsVendas } from './columnDef';
import BulkActionsVendas from './BulkActionsVendas.vue';
import { useVendasStore } from '@/stores/vendas/useVenda';
import { useUiStore } from '@/stores/ui/uiStore';
import { loadSaleFiscalConfig } from '../saleFiscalConfig';
const store = useVendasStore()
const storeUi = useUiStore()
const fiscalAtivo = computed(() => storeUi.hasActiveModule('notas-fiscais'))
const fiscalTypes = reactive({ nfe: false, nfce: false })

async function carregarTiposFiscais() {
  Object.assign(fiscalTypes, { nfe: false, nfce: false })
  const config = await loadSaleFiscalConfig()
  if (config && fiscalAtivo.value) {
    Object.assign(fiscalTypes, { nfe: config.nfeHabilitado, nfce: config.nfceHabilitado })
  }
}

onMounted(carregarTiposFiscais)
watch(fiscalAtivo, carregarTiposFiscais)

const columns = computed(() => getColumnsVendas(fiscalAtivo.value, fiscalTypes))
</script>
<template>
  <DataTable :columns="columns" :filters="store.filters" api="/vendas">
    <template #toolbar="{ table }">
      <BulkActionsVendas :table="(table as Table<Vendas>)" />
    </template>
  </DataTable>
</template>
