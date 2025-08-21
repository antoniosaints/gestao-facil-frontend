<script setup lang="ts">
import { ref } from 'vue';
import Tabela from '@/pages/produtos/partials/Tabela.vue';
import Mobile from '@/pages/produtos/partials/Mobile.vue';
import { useProdutoStore } from '@/stores/produtos/useProduto';
import { useToast } from 'vue-toastification';

const modalOpen = ref(false)
const toast = useToast();
const store = useProdutoStore();

const downloadCSV = async () => {
    try {
        await store.csvDownload()
        toast.success('CSV gerado com sucesso')
    } catch (error) {
        toast.error('Erro ao gerar o CSV')
        console.log(error)
    }
}
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
                    <i class="fa-solid fa-file-pdf"></i> <span class="hidden md:inline"></span>
                </button>
                <button @click="downloadCSV()" class="bg-green-600 text-white px-3 py-1.5 text-sm rounded-md">
                    <i class="fa-solid fa-file-csv"></i> <span class="hidden md:inline"></span>
                </button>
                <button @click="modalOpen = true" class="bg-primary text-white px-3 py-1.5 text-sm rounded-md">
                    <i class="fa-solid fa-circle-plus"></i> <span class="hidden md:inline">Novo Produto</span>
                </button>
            </div>
        </div>
        <div
            class="overflow-x-auto hidden md:block shadow rounded-lg border bg-background dark:bg-background-dark border-gray-200 px-2 dark:border-gray-700">
            <Tabela />
        </div>
        <div class="overflow-x-auto block md:hidden rounded-lg">
            <Mobile />
        </div>
    </div>
</template>