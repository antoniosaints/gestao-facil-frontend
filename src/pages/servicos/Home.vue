<script setup lang="ts">
import Tabela from './tabela/Tabela.vue';
import Mobile from './tabela/Mobile.vue';
import { useUiStore } from '@/stores/ui/uiStore';
import { BadgePlus, FileBox, RotateCw } from 'lucide-vue-next';
import { useServicoStore } from '@/stores/servicos/useServicos';
import ModalServicos from './modais/ModalServicos.vue';
const store = useServicoStore();
const uiStore = useUiStore()
</script>

<template>
    <div>
        <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FileBox class="h-6 w-6" :stroke-width="2.5" />
                    Serviços
                </h2>
                <p class="text-sm text-muted-foreground">Serviços cadastrados no sistema</p>
            </div>
            <div class="justify-between gap-2 items-center hidden md:flex">
                <button @click="store.openSave"
                    class="bg-primary text-white px-2 py-1.5 text-sm rounded-md flex items-center gap-1">
                    <BadgePlus class="h-5 w-5 inline-flex" /> <span class="hidden md:inline">Novo serviço</span>
                </button>
                <button @click="store.updateTable"
                    class="bg-background border border-border px-2 py-1.5 text-sm rounded-md">
                    <RotateCw class="w-5 h-5" />
                </button>
            </div>
        </div>
        <div v-if="!uiStore.isMobile" class="overflow-x-auto rounded-lg">
            <Tabela />
        </div>
        <div v-else class="overflow-x-auto rounded-lg">
            <Mobile />
        </div>
        <ModalServicos />
    </div>
</template>