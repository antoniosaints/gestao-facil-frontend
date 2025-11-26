<template>
    <div
        class="flex flex-col gap-1 p-1 overflow-auto max-h-[calc(100vh-13rem)] md:max-h-full min-h-[calc(100vh-13rem)]">
        <div class="grid grid-cols-12 gap-2 mb-2">
            <input type="text" v-model="searchQuery"
                class="border bg-card dark:bg-card-dark col-span-12 md:col-span-4 border-border dark:border-border-dark rounded-lg px-4 py-1.5 w-full"
                placeholder="Digite a busca ..." @keyup.enter="renderMobile(1)" />
            <Select2Ajax class="col-span-12 md:col-span-3" @change="renderMobile(1)" :disabled="loading"
                v-model="arenaIdFilter" url="/arenas/quadras/select2" :allow-clear="true" />
            <Calendarpicker class="col-span-6 md:col-span-3" v-model="filtroPeriodo" :range="true"
                @change="renderMobile(1)" />
            <Select v-model="statusFilter" :disabled="loading">
                <SelectTrigger class="col-span-6 md:col-span-2">
                    <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="PENDENTE">
                            Pendentes
                        </SelectItem>
                        <SelectItem value="FINALIZADA">
                            Finalizadas
                        </SelectItem>
                        <SelectItem value="CONFIRMADA">
                            Confirmadas
                        </SelectItem>
                        <SelectItem value="CANCELADA">
                            Canceladas
                        </SelectItem>
                        <SelectItem value="null">
                            Todas
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
        <!-- Lista de Vendas -->
        <div v-if="loading" class="flex items-center justify-center h-[calc(100vh-17rem)]">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary dark:border-primary-dark"></div>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <div v-if="reservasFiltered.length === 0"
                class="flex items-center col-span-3 rounded-md justify-center h-[calc(100vh-17rem)]">
                <div class="text-center">
                    <Ticket class="h-10 w-10 inline-flex text-gray-500 dark:text-gray-300" :stroke-width="2.5" />
                    <p class="text-gray-500 dark:text-gray-300">Nenhuma reserva encontrada.</p>
                </div>
            </div>
            <div v-for="row in reservasFiltered" :key="row.id"
                class="rounded-xl cursor-pointer border dark:border-border-dark bg-card dark:bg-card-dark p-4">
                <div class="flex justify-between">
                    <div class="text-md font-semibold dark:text-white">
                        {{ row.Cliente?.nome || 'SEM CLIENTE VINCULADO' }}
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                            {{ isOverdue(row) ? ' (TERMINADO)' : '' }}
                        </span>
                        <span class="text-xs text-success">
                            {{ isVigente(row) ? ' (OCORRENDO)' : '' }}
                        </span>
                        <span class="text-xs text-primary">
                            {{ isNext(row) ? ' (PRÓXIMA)' : '' }}
                        </span>
                    </div>
                    <div class="text-sm text-green-500 dark:text-green-400">
                        {{ formatCurrencyBR(row.valor) }}
                    </div>
                </div>
                <div class="flex justify-between">
                    <div class="text-xs" :class="[
                        row.status === 'PENDENTE' ?
                            'text-warning' : row.status === 'CONFIRMADA' ?
                                'text-primary' : row.status === 'FINALIZADA' ?
                                    'text-success' : row.status === 'CANCELADA' ?
                                        'text-danger' : 'text-secondary']">
                        {{ row.status }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ new Date(row.startAt).toLocaleDateString('pt-BR') }}
                    </div>
                </div>
                <div class="text-md text-gray-500 dark:text-gray-400">
                    {{ format(row.startAt, 'HH:mm') }}
                    até {{ format(row.endAt, 'HH:mm') }}
                </div>
                <div class="mt-2 flex justify-between gap-2">
                    <div class="flex gap-1">
                        <button @click="store.openDetalhes(row.id!)"
                            class="bg-blue-200 text-blue-900 dark:text-blue-100 dark:bg-blue-800 px-2 py-1 rounded-md text-sm">
                            <Eye class="w-5 h-5" />
                        </button>
                        <button v-if="row.status === 'PENDENTE'" @click="openModalFaturarVenda(row.id!)"
                            class="bg-emerald-200 text-emerald-900 dark:text-emerald-100 dark:bg-emerald-800 px-2 py-1 rounded-md text-sm">
                            <BadgeCheck class="w-5 h-5" />
                        </button>
                        <button v-else @click="estornarVenda(row.id!)"
                            class="bg-yellow-200 text-yellow-900 dark:text-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded-md text-sm">
                            <Undo2 class="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <ModalView v-model:open="showDrawer" title="Reservas" description="Ações das reservas">
        <div class="grid grid-cols-3 gap-4 p-4 lg:grid-cols-4">
            <div @click="openSaveVenda"
                class="p-4 rounded-lg cursor-pointer border-2 bg-gray-50 hover:bg-gray-200 dark:hover:bg-gray-600 dark:bg-gray-700">
                <div
                    class="flex justify-center items-center p-1 mx-auto mb-2 rounded-full w-[30px] h-[30px] max-w-[30px] max-h-[30px]">
                    <BadgePlus class="w-10 h-10 text-gray-500 dark:text-gray-400" />
                </div>
                <div class="font-medium text-center text-gray-500 dark:text-gray-400">Cadastrar</div>
            </div>
        </div>
        <div class="flex px-4 w-full">
            <Button @click="showDrawer = false" variant="outline" class="w-full">
                Fechar
            </Button>
        </div>
    </ModalView>

    <!-- Navegação Mobile -->
    <nav
        class="fixed bottom-0 left-0 w-full bg-card dark:bg-card-dark border-t border-border dark:border-border-dark md:hidden flex justify-around pt-4 h-20 shadow-lg z-20">
        <button type="button" @click="previousPage" :disabled="currentPage <= 1"
            class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
            <i class="fa-solid fa-arrow-left text-lg"></i>
            <span class="text-xs">Anterior</span>
        </button>
        <button type="button" @click="showDrawer = !showDrawer"
            class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
            <i class="fa-solid fa-bars text-lg"></i>
            <span class="text-xs">Mais</span>
        </button>
        <button type="button" @click="nextPage" :disabled="currentPage >= totalPages"
            class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
            <i class="fa-solid fa-arrow-right text-lg"></i>
            <span class="text-xs">Próximo</span>
        </button>
    </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import type { ArenaAgendamentos } from "@/types/schemas";
import { estornarVenda, openModalFaturarVenda } from "../../vendas/ActionsVendas";
import { useVendasStore } from "@/stores/vendas/useVenda";
import ModalView from "@/components/formulario/ModalView.vue";
import { Button } from "@/components/ui/button";
import { BadgeCheck, BadgePlus, Eye, Ticket, Undo2 } from "lucide-vue-next";
import Calendarpicker from "@/components/formulario/calendarpicker.vue";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Select2Ajax from "@/components/formulario/Select2Ajax.vue";
import { ArenaReservasRepository } from "@/repositories/reservas-repository";
import { formatCurrencyBR } from "@/utils/formatters";
import { endOfDay, endOfMonth, endOfYear, format, isAfter, isBefore, startOfDay, startOfMonth, startOfYear } from "date-fns";
const store = useVendasStore();
const arenaIdFilter = ref(undefined);
const reservas = ref<ArenaAgendamentos[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const loading = ref(false);
const searchQuery = ref("");
const filtroPeriodo = ref([startOfMonth(new Date()), endOfMonth(new Date())]);
const showDrawer = ref(false);
const statusFilter = ref('null');

const reservasFiltered = computed(() => {
    if (statusFilter.value === 'null') return reservas.value;
    return reservas.value.filter(r => r.status === statusFilter.value);
})

function openSaveVenda() {
    // showDrawer.value = false;
    store.openSave();
}
async function renderMobile(page: number = 1) {
    loading.value = true;
    const inicio = filtroPeriodo.value === null ? startOfYear(new Date()) : startOfDay(filtroPeriodo.value[0]);
    const fim = filtroPeriodo.value === null ? endOfYear(new Date()) : endOfDay(filtroPeriodo.value[1]);
    const data = await ArenaReservasRepository.get(undefined, arenaIdFilter.value, inicio.toISOString(), fim.toISOString());
    reservas.value = data.data;
    currentPage.value = page;
    totalPages.value = 1;
    loading.value = false;
}

const isOverdue = (agendamento: ArenaAgendamentos) => {
    const dataAgendamento = new Date(agendamento.endAt);
    const dataAtual = new Date();
    return isBefore(dataAgendamento, dataAtual);
}
const isVigente = (agendamento: ArenaAgendamentos) => {
    const dataAgendamento = new Date(agendamento.endAt);
    const dataInicio = new Date(agendamento.startAt);
    const dataAtual = new Date();
    return isAfter(dataAgendamento, dataAtual) && isBefore(dataInicio, dataAtual);
}
const isNext = (agendamento: ArenaAgendamentos) => {
    const dataAgendamento = new Date(agendamento.startAt);
    const dataAtual = new Date();
    return isAfter(dataAgendamento, dataAtual);
}
function previousPage() {
    if (currentPage.value > 1) renderMobile(currentPage.value - 1);
}

function nextPage() {
    if (currentPage.value < totalPages.value) renderMobile(currentPage.value + 1);
}

watch(
    () => [store.filters.update, statusFilter.value, arenaIdFilter.value, filtroPeriodo.value],
    () => renderMobile(1)
);

onMounted(() => renderMobile());
</script>
