<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import type { Table } from '@tanstack/vue-table';
import type { Vendas } from '@/types/schemas';
import { computed, onMounted, reactive, watch } from 'vue';
import { getColumnsVendas } from './columnDef';
import BulkActionsVendas from './BulkActionsVendas.vue';
import { useVendasStore } from '@/stores/vendas/useVenda';
import { useUiStore } from '@/stores/ui/uiStore';
import { hasPermission } from '@/hooks/authorize';
import { NotasFiscaisRepository } from '@/repositories/notas-fiscais-repository';
const store = useVendasStore()
const storeUi = useUiStore()
const fiscalAtivo = computed(() => storeUi.hasActiveModule('notas-fiscais'))
const fiscalTypes = reactive({ nfe: false, nfce: false })

async function carregarTiposFiscais() {
  Object.assign(fiscalTypes, { nfe: false, nfce: false })
  if (!fiscalAtivo.value || !hasPermission(storeUi.usuarioLogged, 4)) return
  try {
    const config = await NotasFiscaisRepository.getConfig()
    Object.assign(fiscalTypes, { nfe: config.nfeHabilitado, nfce: config.nfceHabilitado })
  } catch {
    Object.assign(fiscalTypes, { nfe: false, nfce: false })
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
