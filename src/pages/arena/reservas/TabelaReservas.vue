<template>
    <div
        class="flex flex-col gap-1 p-1 overflow-auto max-h-[calc(100vh-13rem)] md:max-h-full min-h-[calc(100vh-13rem)]">
        <div class="grid grid-cols-12 gap-2 mb-2">
            <input type="text" v-model="searchQuery"
                class="border bg-card dark:bg-card-dark col-span-12 md:col-span-5 border-border dark:border-border-dark rounded-lg px-4 py-1.5 w-full"
                placeholder="Digite a busca ..." @keyup.enter="renderMobile(1)" />
            <Select2Ajax class="col-span-12 md:col-span-2" @change="renderMobile(1)" :disabled="loading"
                v-model="arenaIdFilter" url="/arenas/quadras/select2" :allow-clear="true" />
            <Calendarpicker class="col-span-6 md:col-span-3" v-model="filtroPeriodo" :range="true"
                @change="renderMobile(1)" />
            <Select v-model="statusFilter" :disabled="loading">
                <SelectTrigger class="col-span-6 md:col-span-2">
                    <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="null">
                            Todas
                        </SelectItem>
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
                class="rounded-xl border dark:border-border-dark flex flex-col justify-between bg-card dark:bg-card-dark p-4">
                <div>
                    <div class="flex justify-between">
                        <div class="text-md font-semibold dark:text-white flex items-center gap-1">
                            <span class="truncate">
                                <BadgeCheck v-if="row.status === 'FINALIZADA'"
                                    class="h-5 w-5 text-primary dark:text-blue-400 inline-flex" />
                                <Clock v-if="row.status === 'PENDENTE'"
                                    class="h-5 w-5 text-warning dark:text-yellow-400 inline-flex" />
                                <SquareCheckBig v-if="row.status === 'CONFIRMADA'"
                                    class="h-5 w-5 text-success dark:text-green-400 inline-flex" />
                                <ShieldX v-if="row.status === 'BLOQUEADO'"
                                    class="h-5 w-5 text-secondary dark:text-gray-400 inline-flex" />
                                <ShieldX v-if="row.status === 'CANCELADA'"
                                    class="h-5 w-5 text-danger dark:text-red-400 inline-flex" />
                                {{ row.Cliente?.nome || row.nomeCliente || 'SEM CLIENTE VINCULADO' }}
                            </span>
                        </div>
                        <div class="text-sm text-green-500 dark:text-green-400">
                            {{ formatCurrencyBR(row.valor!) }}
                        </div>
                    </div>
                    <div class="flex justify-between">
                        <div class="flex justify-between gap-2">
                            <div class="text-xs"
                                :class="[
                                    row.status === 'PENDENTE' ?
                                        'text-warning dark:text-yellow-400' : row.status === 'CONFIRMADA' ?
                                            'text-success dark:text-green-400' : row.status === 'FINALIZADA' ?
                                                'text-primary dark:text-blue-400' : row.status === 'CANCELADA' ?
                                                    'text-danger dark:text-red-400' : 'text-secondary dark:text-gray-400']">
                                {{ row.status }}</div>
                            <span class="text-xs font-thin text-white bg-teal-500 dark:bg-teal-900 px-1 rounded-md">
                                {{ row.Quadra?.name || 'SEM QUADRA VINCULADA' }}
                            </span>
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                            {{ new Date(row.startAt).toLocaleDateString('pt-BR') }}
                        </div>
                    </div>
                    <div class="flex justify-between gap-2 mt-2">
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                            {{ format(row.startAt, 'HH:mm') }}
                            até {{ format(new Date(row.endAt), "HH:mm") }}
                        </div>
                        <a v-if="row.cobrancasOnAgendamentos && row.cobrancasOnAgendamentos.length > 0"
                            class="text-blue-500 text-sm" target="_blank"
                            :href="(row.cobrancasOnAgendamentos[0].cobranca.externalLink as string)">
                            Acessar
                        </a>
                    </div>

                    <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ row.observacoes || 'Nenhuma observação.' }}
                    </div>
                </div>
                <div class="mt-2 flex justify-between gap-2">
                    <button v-if="['FINALIZADA'].includes(row.status)"
                        class="bg-teal-200 text-teal-900 dark:text-teal-100 dark:bg-teal-800 px-2 py-1 rounded-md text-sm flex items-center gap-2">
                        <CalendarCheck2 class="w-4 h-4 inline-flex" />
                        Reserva concluída
                    </button>
                    <button v-if="['CANCELADA'].includes(row.status)"
                        class="bg-red-200 text-red-900 dark:text-red-100 dark:bg-red-800 px-2 py-1 rounded-md text-sm flex items-center gap-2">
                        <CalendarX2 class="w-4 h-4 inline-flex" />
                        Reserva cancelada
                    </button>
                    <div v-else class="flex gap-1">
                        <button v-if="['PENDENTE'].includes(row.status)" @click="confirmarReserva(row.id!)"
                            class="bg-green-200 text-green-900 dark:text-green-100 dark:bg-green-800 px-2 py-1 rounded-md text-sm">
                            <SquareCheckBig class="w-5 h-5" />
                        </button>
                        <button v-if="['CONFIRMADA'].includes(row.status)" @click="finalizarReserva(row.id!)"
                            class="bg-blue-200 text-blue-900 dark:text-blue-100 dark:bg-blue-800 px-2 py-1 rounded-md text-sm">
                            <BadgeCheck class="w-5 h-5" />
                        </button>
                        <button v-if="['PENDENTE', 'CONFIRMADA'].includes(row.status)" @click="cancelarReserva(row.id!)"
                            class="bg-red-200 text-red-900 dark:text-red-100 dark:bg-red-800 px-2 py-1 rounded-md text-sm">
                            <OctagonX class="w-5 h-5" />
                        </button>
                        <button v-if="!['FINALIZADA', 'BLOQUEADA', 'CANCELADA', 'CONFIRMADA'].includes(row.status)"
                            @click="store.openUpdate(row.id!)"
                            class="bg-gray-200 text-gray-900 dark:text-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-sm">
                            <Pen class="w-5 h-5" />
                        </button>
                    </div>
                    <div class="flex gap-1">
                        <button @click="deleteReserva(row.id!)"
                            v-if="['PENDENTE', 'BLOQUEADA', 'CANCELADA'].includes(row.status) && uiStore.permissoes.admin && !hasCobrancaPending(row)"
                            class="bg-red-200 text-red-900 dark:text-red-100 dark:bg-red-800 px-2 py-1 rounded-md text-sm">
                            <Trash class="w-5 h-5" />
                        </button>
                        <button v-if="['FINALIZADA'].includes(row.status)" @click="estornarReserva(row.id!)"
                            class="bg-orange-200 text-orange-900 dark:text-orange-100 dark:bg-orange-800 px-2 py-1 rounded-md text-sm flex items-center gap-2">
                            <Undo2 class="w-5 h-5 inline-flex" />
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
import ModalView from "@/components/formulario/ModalView.vue";
import { Button } from "@/components/ui/button";
import { BadgeCheck, BadgePlus, CalendarCheck2, CalendarX2, Clock, OctagonX, Pen, ShieldX, SquareCheckBig, Ticket, Trash, Undo, Undo2 } from "lucide-vue-next";
import Calendarpicker from "@/components/formulario/calendarpicker.vue";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Select2Ajax from "@/components/formulario/Select2Ajax.vue";
import { ArenaReservasRepository } from "@/repositories/reservas-repository";
import { formatCurrencyBR } from "@/utils/formatters";
import { endOfDay, endOfYear, format, isAfter, isBefore, startOfDay, startOfYear, subMinutes } from "date-fns";
import { useReservaStore } from "@/stores/arena/reservaStore";
import { useToast } from "vue-toastification";
import { useConfirm } from "@/composables/useConfirm";
import { useUiStore } from "@/stores/ui/uiStore";
const store = useReservaStore();
const uiStore = useUiStore();
const toast = useToast();
const arenaIdFilter = ref(undefined);
const reservas = ref<ArenaAgendamentos[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const loading = ref(false);
const searchQuery = ref("");
const filtroPeriodo = ref([startOfDay(new Date()), endOfDay(new Date())]);
const showDrawer = ref(false);
const statusFilter = ref('null');

const reservasFiltered = computed(() => {
    if (statusFilter.value === 'null') return reservas.value;
    return reservas.value.filter(r => r.status === statusFilter.value);
})

const hasCobrancaPending = (reserva: ArenaAgendamentos) => {
    return reserva.cobrancasOnAgendamentos && reserva.cobrancasOnAgendamentos.filter(c => c.cobranca.status === 'PENDENTE').length > 0;
}

function openSaveVenda() {
    // showDrawer.value = false;
    store.openSave();
}

async function deleteReserva(id: number) {
    try {
        const y = await useConfirm().confirm({
            title: 'Excluir reserva',
            message: 'Tem certeza que deseja excluir esta reserva?',
            confirmText: 'Sim, excluir!',
            cancelText: 'Cancelar',
        });
        if (!y) return;
        await ArenaReservasRepository.delete(id);
        toast.success('Reserva deletada com sucesso!');
        store.updateTable();
    } catch (error: any) {
        console.log(error);
        toast.error(error?.response?.data?.message ?? 'Erro ao deletar a reserva!');
    }
}
async function cancelarReserva(id: number) {
    try {
        const y = await useConfirm().confirm({
            title: 'Cancelar reserva',
            message: 'Tem certeza que deseja cancelar esta reserva?',
            confirmText: 'Sim, cancelar!',
            cancelText: 'Fechar',
            colorButton: 'danger'
        });
        if (!y) return;
        await ArenaReservasRepository.cancelar(id);
        toast.success('Reserva cancelada com sucesso!');
        store.updateTable();
    } catch (error: any) {
        console.log(error);
        toast.error(error?.response?.data?.message ?? 'Erro ao cancelar a reserva!');
    }
}
async function confirmarReserva(id: number) {
    try {
        const y = await useConfirm().confirm({
            title: 'Confirmar reserva',
            message: 'Tem certeza que deseja confirmar esta reserva?',
            confirmText: 'Sim, confirmar!',
            cancelText: 'Fechar',
            colorButton: 'success'
        });
        if (!y) return;
        await ArenaReservasRepository.confirmar(id);
        toast.success('Reserva confirmada com sucesso!');
        store.updateTable();
    } catch (error: any) {
        console.log(error);
        toast.error(error?.response?.data?.message ?? 'Erro ao confirmar a reserva!');
    }
}
async function finalizarReserva(id: number) {
    try {
        const y = await useConfirm().confirm({
            title: 'Finalizar reserva',
            message: 'Tem certeza que deseja finalizar esta reserva?',
            confirmText: 'Sim, finalizar!',
            cancelText: 'Fechar',
            colorButton: 'primary'
        });
        if (!y) return;
        await ArenaReservasRepository.finalizar(id);
        toast.success('Reserva finalizada com sucesso!');
        store.updateTable();
    } catch (error: any) {
        console.log(error);
        toast.error(error?.response?.data?.message ?? 'Erro ao finalizar a reserva!');
    }
}
async function estornarReserva(id: number) {
    try {
        const y = await useConfirm().confirm({
            title: 'Estornar reserva',
            message: 'Tem certeza que deseja estornar esta reserva?',
            confirmText: 'Sim, continuar!',
            cancelText: 'Fechar',
            colorButton: 'warning'
        });
        if (!y) return;
        await ArenaReservasRepository.estornar(id);
        toast.success('Reserva estornada com sucesso!');
        store.updateTable();
    } catch (error: any) {
        console.log(error);
        toast.error(error?.response?.data?.message ?? 'Erro ao estornar a reserva!');
    }
}

async function renderMobile(page: number = 1) {
    try {
        loading.value = true;
        const inicio = filtroPeriodo.value === null ? startOfYear(new Date()) : startOfDay(filtroPeriodo.value[0]);
        const fim = filtroPeriodo.value === null ? endOfYear(new Date()) : endOfDay(filtroPeriodo.value[1]);
        const resp = await ArenaReservasRepository.getTable(searchQuery.value, page, 10, arenaIdFilter.value, inicio.toISOString(), fim.toISOString());
        reservas.value = resp.data;
        currentPage.value = resp.pagination.page;
        totalPages.value = resp.pagination.totalPages;
        loading.value = false;
    } catch (err) {
        console.error("tabela_quadras:", err);
        reservas.value = [];
    } finally {
        loading.value = false;
    }
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
