<script setup lang="ts">
import { inject, provide, ref } from 'vue';
import Tabela from '@/pages/produtos/partials/Tabela.vue';
import Mobile from '@/pages/produtos/partials/Mobile.vue';
import { useProdutoStore } from '@/stores/produtos/useProduto';
import { useToast } from 'vue-toastification';
import ModalProdutos from './formulario/ModalProdutos.vue';
import ModalCriarLote from './others/ModalCriarLote.vue';

const toast = useToast();
const store = useProdutoStore();

const modalCsv = ref(false);
provide('modalCsv', modalCsv)

const relatorioGeral = async () => {
    try {
        await store.gerarRelatorioGeral()
        toast.success('Relatório gerado com sucesso')
    } catch (error) {
        toast.error('Erro ao gerar o relatório')
        console.log(error)
    }
}

</script>

<template>
    <div>
        <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
            <h2 class="text-2xl font-bold text-black dark:text-white"><i class="fa-solid fa-box text-blue-600"></i>
                Produtos
            </h2>
            <div class="justify-between gap-2 items-center hidden md:flex">
                <button @click="relatorioGeral()" class="bg-orange-600 text-white px-3 py-1.5 text-sm rounded-md">
                    <i class="fa-regular fa-file-pdf"></i>
                </button>
                <button @click="modalCsv = true" class="bg-green-600 text-white px-3 py-1.5 text-sm rounded-md">
                    <i class="fa-solid fa-arrow-up-from-bracket"></i>
                </button>
                <button @click="store.openSave" class="bg-primary text-white px-3 py-1.5 text-sm rounded-md">
                    <i class="fa-solid fa-circle-plus"></i> <span class="hidden md:inline">Novo Produto</span>
                </button>
                <button @click="store.updateTable"
                    class="bg-background border border-border px-3 py-1.5 text-sm rounded-md">
                    <i class="fa-solid fa-arrow-rotate-right"></i>
                </button>
            </div>
        </div>
        <div
            class="overflow-x-auto hidden md:block shadow rounded-lg border bg-background dark:bg-background-dark border-gray-200 px-2 dark:border-gray-700">
            <Tabela />
        </div>
        <div class="overflow-x-auto block md:hidden rounded-lg">
            <Mobile @openModalProduto="store.openSave" />
        </div>
        <ModalProdutos />
        <ModalCriarLote />
    </div>
</template>