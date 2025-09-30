<script setup lang="ts">
import Tabela from './tabela/Tabela.vue';
import Mobile from './tabela/Mobile.vue';
import { useUiStore } from '@/stores/ui/uiStore';
import LancamentoModal from './formulario/LancamentoModal.vue';
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos';
const store = useLancamentosStore();
const uiStore = useUiStore()
</script>

<template>
    <div>
        <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300">
                    Lançamentos
                </h2>
                <p class="text-sm text-muted-foreground">Lançamentos financeiros do sistema</p>
            </div>
            <div class="justify-between gap-2 items-center hidden md:flex">
                <button @click="store.openSave" class="bg-primary text-white px-3 py-1.5 text-sm rounded-md">
                    <i class="fa-solid fa-circle-plus"></i> <span class="hidden md:inline">Novo lançamento</span>
                </button>
                <button @click="store.updateTable"
                    class="bg-background border border-border px-3 py-1.5 text-sm rounded-md">
                    <i class="fa-solid fa-arrow-rotate-right"></i>
                </button>
            </div>
        </div>
        <div v-if="!uiStore.isMobile" class="overflow-x-auto hidden md:block rounded-lg">
            <Tabela />
        </div>
        <div v-else class="overflow-x-auto block md:hidden rounded-lg">
            <Mobile @openModalProduto="store.openSave" />
        </div>

        <LancamentoModal />
    </div>
</template>