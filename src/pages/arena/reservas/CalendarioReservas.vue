<script setup lang="ts">
import { useVendasStore } from '@/stores/vendas/useVenda';
import { onMounted, onUnmounted, provide, ref } from 'vue';
import { BadgePlus, Calendar } from 'lucide-vue-next';
import { getSocket } from '@/pluguins/socket';
import type { Socket } from 'socket.io-client';
import ModalVendas from '@/pages/vendas/formulario/ModalVendas.vue';
import ModalFaturar from '@/pages/vendas/formulario/ModalFaturar.vue';
import ModalFiltro from '@/pages/vendas/formulario/ModalFiltro.vue';
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue';
import DetalhesVenda from '@/pages/vendas/modais/DetalhesVenda.vue';
import GerarCobranca from '@/pages/financeiro/lancamentos/modais/GerarCobranca.vue';
import Calendario from './calendario/Calendario.vue';
import type { ArenaAgendamentos } from '@/types/schemas';
import { ArenaReservasRepository } from '@/repositories/reservas-repository';
const store = useVendasStore();
const reservas = ref<ArenaAgendamentos[]>([]);
const openFilter = ref(false);

provide('openModalFiltroVendas', openFilter);

async function getReservasSistema() {
    try {
        const data = await ArenaReservasRepository.get();
        console.log(data);
        reservas.value = data.data
    } catch (error) {
        console.error(error)
    }
}

onMounted(() => {
    getReservasSistema()
})
</script>

<template>
    <div>
        <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calendar class="h-6 w-6" :stroke-width="2.5" />
                    Calendário de reservas
                </h2>
                <p class="text-sm text-muted-foreground">Análise de reservas cadastradas</p>
            </div>
            <div class="justify-between gap-2 items-center hidden md:flex">
                <button @click="store.openSave"
                    class="bg-teal-700 dark:bg-teal-900 text-white px-2 py-1.5 text-sm rounded-md flex items-center gap-1">
                    <BadgePlus class="h-5 w-5 inline-flex" /> <span class="hidden md:inline">Nova reserva</span>
                </button>
            </div>
        </div>
        <div class="overflow-x-auto rounded-lg">
            <Calendario description="Calendário de reservas" title="Reservas do sistema" :eventos="reservas" />
        </div>
        <ModalVendas />
        <ModalFaturar />
        <ModalFiltro />
        <ClientesModal />
        <DetalhesVenda />
        <GerarCobranca />
    </div>
</template>