<script setup lang="ts">
import Tabela from './tabela/Tabela.vue';
import Mobile from './tabela/Mobile.vue';
import { useClientesStore } from '@/stores/clientes/useClientes';
const store = useClientesStore();
</script>

<template>
    <div>
        <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
            <h2 class="text-2xl font-bold text-black dark:text-white"><i
                    class="fa-solid fa-user-tag text-purple-600"></i>
                Clientes
            </h2>
            <div class="justify-between gap-2 items-center hidden md:flex">
                <button @click="store.openSave" class="bg-primary text-white px-3 py-1.5 text-sm rounded-md">
                    <i class="fa-solid fa-user-tag"></i> <span class="hidden md:inline">Novo cliente</span>
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
    </div>
</template>