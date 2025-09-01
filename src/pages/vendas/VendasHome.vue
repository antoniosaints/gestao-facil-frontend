<script setup lang="ts">
import MobileVendas from '@/pages/vendas/Home/MobileVendas.vue';
import TabelaVendas from './Home/TabelaVendas.vue';
import ModalVendas from './formulario/ModalVendas.vue';
import { useVendasStore } from '@/stores/vendas/useVenda';
import ModalProporValor from './formulario/ModalProporValor.vue';
import ModalFaturar from './formulario/ModalFaturar.vue';
import { useUiStore } from '@/stores/ui/uiStore';

const store = useVendasStore();
const storeUi = useUiStore();
</script>

<template>
    <div>
        <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
            <div>
                <h2 class="text-2xl font-bold text-black dark:text-white">
                    Vendas
                </h2>
                <p class="text-sm text-muted-foreground">Listagem de vendas cadastrados</p>
            </div>
            <div class="justify-between gap-2 items-center hidden md:flex">
                <button onclick="openModalFiltroVendas()"
                    class="border border-blue-500 hover:border-blue-700 text-blue-900 dark:text-blue-200 bg-blue-500/20 px-3 py-1.5 text-sm rounded-lg">
                    <i class="fa-solid fa-filter"></i>
                </button>
                <button @click="store.openSave" class="bg-primary text-white px-3 py-1.5 text-sm rounded-md">
                    <i class="fa-solid fa-circle-plus"></i> <span class="hidden md:inline">Nova Venda</span>
                </button>
                <RouterLink to="/vendas/pdv"
                    class="border border-body bg-secondary hover:border-secondary px-3 py-1.5 text-sm rounded-lg">
                    <i class="fa-solid fa-cart-arrow-down"></i> PDV
                </RouterLink>
            </div>
        </div>
        <div v-if="!storeUi.isMobile" class="overflow-x-auto hidden md:block rounded-lg">
            <TabelaVendas />
        </div>
        <div v-else class="overflow-x-auto block md:hidden rounded-lg">
            <MobileVendas />
        </div>
        <ModalVendas />
        <ModalProporValor />
        <ModalFaturar />
    </div>
</template>