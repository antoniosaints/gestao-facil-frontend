<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import { columnsClientes } from '@/pages/clientes/tabela/columnDef';
import { useClientesStore } from '@/stores/clientes/useClientes';
const store = useClientesStore()

</script>

<template>
    <DataTable :columns="columnsClientes" api="/clientes/getDataTable" :filters="store.filters"
      search-placeholder="Buscar clientes e fornecedores…"
      :column-labels="{ Uid: 'Código', documento: 'CPF/CNPJ', nome: 'Nome', telefone: 'Telefone', tipo: 'Tipo', status: 'Status', actions: 'Ações' }"
      empty-title="Nenhum cadastro encontrado"
      empty-description="Não há clientes ou fornecedores para os filtros atuais. Revise os filtros ou use Novo cliente para cadastrar." />
</template>
