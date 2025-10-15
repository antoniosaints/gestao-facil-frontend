<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue';
import { columnsUsuarios } from './columnDef';
import { useUsuarioStore } from '@/stores/usuarios/useUsuarios';
const store = useUsuarioStore()

</script>

<template>
    <DataTable :columns="columnsUsuarios" api="/usuarios" :filters="store.filters" />
</template>
