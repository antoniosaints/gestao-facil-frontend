<template>
    <div
        class="flex flex-col gap-1 p-1 overflow-auto max-h-[calc(100vh-13rem)] md:max-h-full min-h-[calc(100vh-13rem)]">
        <div class="grid grid-cols-12 gap-2 mb-2">
            <input type="text" v-model="searchQuery"
                class="border bg-card dark:bg-card-dark col-span-12 md:col-span-4 border-border dark:border-border-dark rounded-lg px-4 py-1.5 w-full"
                placeholder="Digite a busca ..." @keyup.enter="renderMobile(1)" />
            <Select v-model="statusFilter" :disabled="loading">
                <SelectTrigger class="col-span-12 md:col-span-3">
                    <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="ATIVAS">
                            Ativas
                        </SelectItem>
                        <SelectItem value="INATIVAS">
                            Inativas
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
            <div v-if="quadrasFiltered.length === 0"
                class="flex items-center col-span-3 rounded-md justify-center h-[calc(100vh-17rem)]">
                <div class="text-center">
                    <MapPinned class="h-10 w-10 inline-flex text-gray-500 dark:text-gray-300" :stroke-width="2.5" />
                    <p class="text-gray-500 dark:text-gray-300">Nenhuma quadra encontrada.</p>
                </div>
            </div>
            <div v-for="row in quadrasFiltered" :key="row.id"
                class="rounded-xl cursor-pointer border dark:border-border-dark bg-card dark:bg-card-dark p-4">
                <div class="flex justify-between">
                    <div class="text-md font-semibold dark:text-white">
                        {{ row.name || 'SEM NOME' }}
                    </div>
                    <div class="text-sm text-green-600 dark:text-green-400">
                        {{ formatCurrencyBR(row.precoHora!) }}/hora
                    </div>
                </div>
                <div class="flex justify-between">
                    <div class="text-xs" :class="[
                        row.active ?
                            'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400']">
                        {{ row.active ? 'Ativo' : 'Inativo' }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ row.tempoReserva || '-' }} min
                    </div>
                </div>
                <div class="mt-2 flex justify-between gap-2">
                    <div class="flex gap-1">
                        <button @click="store.openUpdate(row.id!)"
                            class="bg-gray-200 text-gray-900 dark:text-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-sm">
                            <Pen class="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <ModalView v-model:open="showDrawer" title="Quadras" description="Ações das quadras">
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
import type { ArenaQuadras } from "@/types/schemas";
import ModalView from "@/components/formulario/ModalView.vue";
import { Button } from "@/components/ui/button";
import { BadgePlus, MapPinned, Pen } from "lucide-vue-next";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyBR } from "@/utils/formatters";
import { endOfMonth, startOfMonth } from "date-fns";
import { ArenaQuadrasRepository } from "@/repositories/quadras-repository";
import { useQuadraStore } from "@/stores/arena/quadraStore";
import SelectMultiple from "@/components/formulario/SelectMultiple.vue";
const store = useQuadraStore();
const arenaIdFilter = ref(undefined);
const quadras = ref<ArenaQuadras[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const loading = ref(false);
const searchQuery = ref("");
const filtroPeriodo = ref([startOfMonth(new Date()), endOfMonth(new Date())]);
const showDrawer = ref(false);
const statusFilter = ref('ATIVAS');

const quadrasFiltered = computed(() => {
    if (statusFilter.value !== 'null') {
        return quadras.value.filter(quadra => quadra.active === (statusFilter.value === 'ATIVAS' ? true : false));
    }
    return quadras.value;
})

function openSaveVenda() {
    // showDrawer.value = false;
    store.openSave();
}

async function renderMobile(page: number = 1) {
    try {
        loading.value = true;
        const resp = await ArenaQuadrasRepository.getTable(searchQuery.value, page, 10);
        quadras.value = resp.data;
        currentPage.value = resp.pagination.page;
        totalPages.value = resp.pagination.totalPages;
        loading.value = false;
    } catch (err) {
        console.error("tabela_quadras:", err);
        quadras.value = [];
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
