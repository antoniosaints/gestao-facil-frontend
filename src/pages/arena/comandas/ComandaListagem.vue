<script setup lang="ts">
import { useVendasStore } from '@/stores/vendas/useVenda';
import { onMounted, onUnmounted, provide, ref } from 'vue';
import { BadgePlus, Funnel, RotateCw, ShoppingCart, Tags } from 'lucide-vue-next';
import { getSocket } from '@/pluguins/socket';
import type { Socket } from 'socket.io-client';
import TabelaVendas from './TabelaVendas.vue';
import ModalVendas from '@/pages/vendas/formulario/ModalVendas.vue';
import ModalProporValor from '@/pages/vendas/formulario/ModalProporValor.vue';
import ModalFaturar from '@/pages/vendas/formulario/ModalFaturar.vue';
import ModalFiltro from '@/pages/vendas/formulario/ModalFiltro.vue';
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue';
import DetalhesVenda from '@/pages/vendas/modais/DetalhesVenda.vue';
import GerarCobranca from '@/pages/financeiro/lancamentos/modais/GerarCobranca.vue';
const store = useVendasStore();
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
                    <Tags class="h-6 w-6" :stroke-width="2.5" />
                    Vendas/Comandas
                </h2>
                <p class="text-sm text-muted-foreground">Listagem de vendas/comandas cadastrados</p>
            </div>
            <div class="justify-between gap-2 items-center hidden md:flex">
                <button @click="openFilter = true"
                    class="border border-blue-500 hover:border-blue-700 text-blue-900 dark:text-blue-200 bg-blue-500/20 px-3 py-1.5 text-sm rounded-lg">
                    <Funnel class="w-4 h-4 inline-flex" />
                </button>
                <button @click="store.openSave"
                    class="bg-primary text-white px-2 py-1.5 text-sm rounded-md flex items-center gap-1">
                    <BadgePlus class="h-5 w-5 inline-flex" /> <span class="hidden md:inline">Nova venda</span>
                </button>
                <RouterLink to="/vendas/pdv"
                    class="border border-body bg-secondary hover:border-secondary px-2 py-1.5 text-sm rounded-lg flex items-center gap-1">
                    <ShoppingCart class="w-5 h-5 inline-flex" /> PDV
                </RouterLink>
                <button @click="store.updateTable"
                    class="bg-background border border-border px-2 py-1.5 text-sm rounded-md">
                    <RotateCw class="w-5 h-5" />
                </button>
            </div>
        </div>
        <div class="overflow-x-auto rounded-lg">
            <TabelaVendas />
        </div>
        <ModalVendas />
        <ModalProporValor />
        <ModalFaturar />
        <ModalFiltro />
        <ClientesModal />
        <DetalhesVenda />
        <GerarCobranca />
    </div>
</template>