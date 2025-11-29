<script setup lang="ts">
import { useVendasStore } from '@/stores/vendas/useVenda';
import { onMounted, onUnmounted, provide, ref } from 'vue';
import { BadgePlus, FileText, RotateCw } from 'lucide-vue-next';
import { getSocket } from '@/pluguins/socket';
import type { Socket } from 'socket.io-client';
import ModalFaturar from '@/pages/vendas/formulario/ModalFaturar.vue';
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue';
import TabelaComandas from './TabelaComandas.vue';
import ModalItemComanda from './ModalItemComanda.vue';
import ModalComanda from './ModalComanda.vue';
import { useComandaStore } from '@/stores/arena/comandaStore';
const store = useVendasStore();
const storeComanda = useComandaStore()
const openFilter = ref(false);

let socket: Socket;

onMounted(() => {
    socket = getSocket();
    socket.on("vendas:updatetable", (dados) => {
    });

    onUnmounted(() => {
        socket.off("vendas:updatetable");
    })
})

provide('openModalFiltroVendas', openFilter);
</script>

<template>
    <div>
        <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FileText class="h-6 w-6" :stroke-width="2.5" />
                    Comandas
                </h2>
                <p class="text-sm text-muted-foreground">Listagem de comandas cadastradas</p>
            </div>
            <div class="justify-between gap-2 items-center hidden md:flex">
                <button @click="storeComanda.openSave"
                    class="bg-teal-700 dark:bg-teal-900 text-white px-2 py-1.5 text-sm rounded-md flex items-center gap-1">
                    <BadgePlus class="h-5 w-5 inline-flex" /> <span class="hidden md:inline">Nova comanda</span>
                </button>
                <button @click="storeComanda.updateTable"
                    class="bg-background border border-border px-2 py-1.5 text-sm rounded-md">
                    <RotateCw class="w-5 h-5" />
                </button>
            </div>
        </div>
        <div class="overflow-x-auto rounded-lg">
            <TabelaComandas />
        </div>
        <ModalItemComanda />
        <ModalFaturar />
        <ClientesModal />
        <ModalComanda />
    </div>
</template>