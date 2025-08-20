<script setup lang="ts">
import { ref } from 'vue';
import ModalVendas from './formulario/ModalVendas.vue';
import Tabela from './partials/tabela.vue';
import Mobile from './partials/Mobile.vue';

const modalOpen = ref(false)
</script>

<template>
    <div>
        <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
            <h2 class="text-2xl font-bold text-black dark:text-white"><i class="fa-solid fa-tags text-green-600"></i>
                Vendas
            </h2>
            <div class="justify-between gap-2 items-center hidden md:flex">
                <button onclick="openModalFiltroVendas()"
                    class="border-2 border-blue-500 hover:border-blue-700 text-blue-900 dark:text-blue-200 bg-blue-500/20 px-3 py-1.5 text-sm rounded-lg">
                    <i class="fa-solid fa-filter"></i>
                </button>
                <button @click="modalOpen = true" class="bg-primary text-white px-3 py-1.5 text-sm rounded-md">
                    <i class="fa-solid fa-circle-plus"></i> <span class="hidden md:inline">Novo Produto</span>
                </button>
                <RouterLink to="/vendas/pdv"
                    class="border-2 border-secondary hover:border-secondary-dark px-3 py-1.5 text-sm rounded-lg">
                    <i class="fa-solid fa-cart-arrow-down"></i> PDV
                </RouterLink>
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