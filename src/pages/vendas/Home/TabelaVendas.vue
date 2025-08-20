<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import { columnsVendas } from './columnDef';
import http from '@/utils/axios';
import { ref } from 'vue';
import Select2 from '@/components/formulario/Select2.vue';

const id = ref(null)
async function getVendas() {
  const { data } = await http.get('/produtos')

  return data.data.map((row: any) => {
    return {
      id: row.id,
      label: row.nome,
    }
  })
}
async function getVenda(id: number) {
  const { data } = await http.get('/produtos/' + id)

  return {
    id: data.data.id,
    label: data.data.nome,
  }
}
</script>

<template>
  {{ id }}
  <input type="number" v-model="id">
  <Select2 :fetch-items="getVendas" v-model="id" />
  <DataTable :columns="columnsVendas" api="/vendas" />
</template>
