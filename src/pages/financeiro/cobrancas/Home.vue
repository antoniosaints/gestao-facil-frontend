<script setup lang="ts">
import Tabela from './tabela/Tabela.vue';
import Mobile from './tabela/Mobile.vue';
import { useUiStore } from '@/stores/ui/uiStore';
import { BadgePlus, HandCoins, RotateCw } from 'lucide-vue-next';
import { useCobrancasFinanceirasStore } from '@/stores/lancamentos/useCobrancas';
import GerarCobranca from '../lancamentos/modais/GerarCobranca.vue';
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos';
const store = useCobrancasFinanceirasStore();
const storeFinanceiro = useLancamentosStore()
const uiStore = useUiStore()
</script>

<template>
    <div>
        <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <HandCoins class="h-6 w-6" :stroke-width="2.5" />
                    Cobranças
                </h2>
                <p class="text-sm text-muted-foreground">Cobranças cadastrados no sistema</p>
            </div>
            <div class="justify-between gap-2 items-center hidden md:flex">
                <button @click="storeFinanceiro.openModalCobranca = true"
                    class="bg-primary text-white px-2 py-1.5 text-sm rounded-md flex items-center gap-1">
                    <BadgePlus class="h-5 w-5 inline-flex" /> <span class="hidden md:inline">Nova cobrança</span>
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
        <GerarCobranca />
    </div>
</template>