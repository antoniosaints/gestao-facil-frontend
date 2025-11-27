<script setup lang="ts">
import { onMounted, provide, ref } from 'vue';
import { BadgePlus, Calendar } from 'lucide-vue-next';
import Calendario from './calendario/Calendario.vue';
import type { ArenaAgendamentos } from '@/types/schemas';
import { ArenaReservasRepository } from '@/repositories/reservas-repository';
import ModalReserva from './ModalReserva.vue';
import { useReservaStore } from '@/stores/arena/reservaStore';
const store = useReservaStore();
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
            <Calendario description="Calendário de reservas" title="Reservas do sistema" :eventos="reservas.filter((reserva) => reserva.status !== 'CANCELADA')" />
        </div>
        <ModalReserva />
    </div>
</template>