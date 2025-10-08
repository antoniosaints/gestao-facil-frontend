<script setup lang="ts">
import Tabela from './tabela/Tabela.vue';
import Mobile from './tabela/Mobile.vue';
import { useUiStore } from '@/stores/ui/uiStore';
import LancamentoModal from './formulario/LancamentoModal.vue';
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos';
import { CirclePlus, FileText, Wallet } from 'lucide-vue-next';
import GerarDRE from './modais/GerarDRE.vue';
const store = useLancamentosStore();
const uiStore = useUiStore()

const openByTipo = (tipo: 'RECEITA' | 'DESPESA') => {
    store.form.tipo = tipo
    store.openSave()
}
</script>

<template>
    <div>
        <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Wallet class="h-6 w-6" :stroke-width="2.5" />
                    Lançamentos
                </h2>
                <p class="text-sm text-muted-foreground">Lançamentos financeiros do sistema</p>
            </div>
            <div class="justify-between gap-2 items-center hidden md:flex">
                <button @click="store.openModalDre = true"
                    class="bg-warning text-white px-3 py-1.5 text-sm rounded-md flex items-center gap-2">
                    <FileText class="h-5 w-5" /> <span class="hidden md:inline">DRE</span>
                </button>
                <button @click="openByTipo('RECEITA')"
                    class="bg-success text-white px-3 py-1.5 text-sm rounded-md flex items-center gap-2">
                    <CirclePlus class="h-5 w-5" /> <span class="hidden md:inline">Receita</span>
                </button>
                <button @click="openByTipo('DESPESA')"
                    class="bg-danger text-white px-3 py-1.5 text-sm rounded-md flex items-center gap-2">
                    <CirclePlus class="h-5 w-5" /> <span class="hidden md:inline">Despesa</span>
                </button>
                <button @click="store.updateTable"
                    class="bg-background border border-border px-3 py-1.5 text-sm rounded-md">
                    <i class="fa-solid fa-arrow-rotate-right"></i>
                </button>
            </div>
        </div>
        <div v-if="!uiStore.isMobile" class="overflow-x-auto rounded-lg">
            <Tabela />
        </div>
        <div v-else class="overflow-x-auto rounded-lg">
            <Mobile @openModalProduto="store.openSave" />
        </div>
        <LancamentoModal />
        <GerarDRE />
    </div>
</template>