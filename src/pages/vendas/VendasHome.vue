<script setup lang="ts">
import MobileVendas from '@/pages/vendas/Home/MobileVendas.vue';
import TabelaVendas from './Home/TabelaVendas.vue';
import ModalVendas from './formulario/ModalVendas.vue';
import { useVendasStore } from '@/stores/vendas/useVenda';
import ModalProporValor from './formulario/ModalProporValor.vue';
import ModalFaturar from './formulario/ModalFaturar.vue';
import { useUiStore } from '@/stores/ui/uiStore';
import ModalFiltro from './formulario/ModalFiltro.vue';
import { onMounted, onUnmounted, provide, ref } from 'vue';
import ClientesModal from '../clientes/modais/ClientesModal.vue';
import { Tags } from 'lucide-vue-next';
import DetalhesVenda from './modais/DetalhesVenda.vue';
import { getSocket } from '@/pluguins/socket';
import type { Socket } from 'socket.io-client';
const store = useVendasStore();
const storeUi = useUiStore();
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
                    Vendas
                </h2>
                <p class="text-sm text-muted-foreground">Listagem de vendas cadastrados</p>
            </div>
            <div class="justify-between gap-2 items-center hidden md:flex">
                <button @click="openFilter = true"
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
                <button @click="store.updateTable" class="bg-background border px-3 py-1.5 text-sm rounded-md">
                    <i class="fa-solid fa-arrow-rotate-right"></i> <span class="hidden md:inline"></span>
                </button>
            </div>
        </div>
        <div class="overflow-x-auto rounded-lg">
            <TabelaVendas v-if="!storeUi.isMobile" />
            <MobileVendas v-else />
        </div>
        <ModalVendas />
        <ModalProporValor />
        <ModalFaturar />
        <ModalFiltro />
        <ClientesModal />
        <DetalhesVenda />
    </div>
</template>