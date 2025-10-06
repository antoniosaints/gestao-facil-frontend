<script setup lang="ts">
import { provide, ref } from 'vue';
import Tabela from '@/pages/produtos/partials/Tabela.vue';
import Mobile from '@/pages/produtos/partials/Mobile.vue';
import { useProdutoStore } from '@/stores/produtos/useProduto';
import { useToast } from 'vue-toastification';
import ModalProdutos from './formulario/ModalProdutos.vue';
import ModalCriarLote from './others/ModalCriarLote.vue';
import { ProdutoRepository } from '@/repositories/produto-repository';
import { Boxes, Package } from 'lucide-vue-next';
import ModalReposicao from './formulario/ModalReposicao.vue';

const toast = useToast();
const store = useProdutoStore();

const modalCsv = ref(false);
provide('modalCsv', modalCsv)

const relatorioGeral = async () => {
    try {
        await ProdutoRepository.gerarRelatorioGeral()
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
            <div>
                <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Package class="h-6 w-6" :stroke-width="2.5" />
                    Produtos
                </h2>
                <p class="text-sm text-muted-foreground">Listagem de produtos cadastrados</p>
            </div>
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
        <div class="overflow-x-auto hidden md:block rounded-lg">
            <Tabela />
        </div>
        <div class="overflow-x-auto block md:hidden rounded-lg">
            <Mobile @openModalProduto="store.openSave" />
        </div>
        <ModalProdutos />
        <ModalCriarLote />
        <ModalReposicao />
    </div>
</template>