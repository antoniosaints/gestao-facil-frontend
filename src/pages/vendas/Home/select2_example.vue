<script setup lang="ts">
import { useProdutoStore } from '@/stores/produtos/useProduto';
import { ref } from 'vue';
const produtoStore = useProdutoStore()
const id = ref(0)
</script>

<template>
    <Select2 :fetch-items="produtoStore.getAllSelect2" :fetch-by-id="produtoStore.getOneSelect2" v-model="id" />
</template>