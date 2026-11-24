<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { linkedRecordId } from '@/components/navigation/linkedRecord'
import DataTable from '@/components/tabela/DataTable.vue'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import { columnsCategoriasProduto } from './columnDef'
import BulkActionsCategorias from './BulkActionsCategorias.vue'

const store = useProdutoStore()
const route = useRoute()
const router = useRouter()
const categoria = computed(() => linkedRecordId(route.query.categoria))
const filters = reactive({ ...store.filters, categoria: categoria.value ?? undefined })
watch([() => store.filters, categoria], ([next, id]) => {
  Object.assign(filters, next, { categoria: id ?? undefined })
}, { deep: true })
function mostrarTodas() {
  void router.replace({ query: { ...route.query, categoria: undefined } })
}
</script>

<template>
  <DataTable
    :key="categoria ?? 'todas'"
    :state-key="categoria ? `produtos-categorias:${categoria}` : undefined"
    :columns="columnsCategoriasProduto"
    api="/produtos/categorias"
    :filters="filters"
  >
    <template #toolbar>
      <Button v-if="categoria" variant="ghost" size="sm" @click="mostrarTodas">Mostrar todas</Button>
      <BulkActionsCategorias />
    </template>
  </DataTable>
</template>
