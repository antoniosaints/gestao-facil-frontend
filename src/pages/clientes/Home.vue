<script setup lang="ts">
import Tabela from './tabela/Tabela.vue';
import Mobile from './tabela/Mobile.vue';
import { useClientesStore } from '@/stores/clientes/useClientes';
import ClientesModal from './modais/ClientesModal.vue';
import { useUiStore } from '@/stores/ui/uiStore';
import { UserStar } from 'lucide-vue-next';
const store = useClientesStore();
const uiStore = useUiStore()
</script>

<template>
    <div>
        <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
            <div>
                <h2 class="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
                    <UserStar class="h-6 w-6" :stroke-width="2.5" />
                    Clientes
                </h2>
                <p class="text-sm text-muted-foreground">Clientes cadastrados no sistema</p>
            </div>
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
        <div v-if="!uiStore.isMobile" class="overflow-x-auto hidden md:block rounded-lg">
            <Tabela />
        </div>
        <div v-else class="overflow-x-auto block md:hidden rounded-lg">
            <Mobile @openModalProduto="store.openSave" />
        </div>
        <ClientesModal />
    </div>
</template>