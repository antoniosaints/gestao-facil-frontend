<template>
    <div
        class="flex flex-col gap-1 p-1 overflow-auto max-h-[calc(100vh-13rem)] md:max-h-full min-h-[calc(100vh-13rem)]">
        <div class="grid grid-cols-12 gap-2 mb-2">
            <input type="text" v-model="searchQuery"
                class="border bg-card dark:bg-card-dark col-span-12 md:col-span-6 border-border dark:border-border-dark rounded-lg px-4 py-1.5 w-full"
                placeholder="Digite a busca ..." @keyup.enter="renderMobile(1)" />
            <Calendarpicker class="col-span-6 md:col-span-3" v-model="filtroPeriodo" :range="true"
                @change="renderMobile(1)" />
            <Select v-model="statusFilter">
                <SelectTrigger class="col-span-6 md:col-span-3">
                    <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="ABERTA">
                            Abertas
                        </SelectItem>
                        <SelectItem value="FECHADA">
                            Fechadas
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
            <div v-if="data.length === 0"
                class="flex items-center col-span-3 rounded-md justify-center h-[calc(100vh-17rem)]">
                <div class="text-center">
                    <FileText class="h-10 w-10 inline-flex text-gray-500 dark:text-gray-300" :stroke-width="2.5" />
                    <p class="text-gray-500 dark:text-gray-300">Nenhuma comanda encontrada.</p>
                </div>
            </div>
            <div v-for="row in data" :key="row.id"
                class="rounded-2xl cursor-pointer border dark:border-border-dark bg-card dark:bg-card-dark p-4">
                <div class="flex justify-between">
                    <div class="text-sm font-semibold dark:text-white">
                        {{ row.clienteNome || row.Cliente?.nome || 'Sem cliente vinculado' }}
                    </div>
                    <div class="text-sm" :class="{
                        'text-yellow-600 dark:text-yellow-400': row.status === 'ABERTA',
                        'text-red-500 dark:text-red-400': row.status === 'CANCELADA',
                        'text-blue-500 dark:text-blue-400': row.status === 'FECHADA',
                    }">
                        {{ formatCurrencyBR(calculateValorComanda(row)) }}
                    </div>
                </div>
                <div class="flex justify-between">
                    <div class="text-xs" :class="{
                        'text-yellow-600 dark:text-yellow-400': row.status === 'ABERTA',
                        'text-red-500 dark:text-red-400': row.status === 'CANCELADA',
                        'text-blue-500 dark:text-blue-400': row.status === 'FECHADA',
                    }">
                        {{ row.status }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ format(row.abertura, 'dd/mm/yyyy') }}
                    </div>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ row.observacao || '-' }}</div>
                <div class="mt-2 flex justify-between gap-2">
                    <div class="flex gap-1">
                        <button @click="store.openDetalhes(row.id!)"
                            class="bg-blue-200 text-blue-900 dark:text-blue-100 dark:bg-blue-800 px-2 py-1 rounded-md text-sm">
                            <Eye class="w-5 h-5" />
                        </button>
                        <button v-if="row.status === 'ABERTA'" @click="openModalFaturarVenda(row.id!)"
                            class="bg-emerald-200 text-emerald-900 dark:text-emerald-100 dark:bg-emerald-800 px-2 py-1 rounded-md text-sm">
                            <BadgeCheck class="w-5 h-5" />
                        </button>
                        <button v-if="row.status === 'ABERTA'" @click="store.openSave"
                            class="bg-emerald-200 text-emerald-900 dark:text-emerald-100 dark:bg-emerald-800 px-2 py-1 rounded-md text-sm">
                            <Plus class="w-5 h-5" />
                        </button>
                        <button v-if="row.status === 'ABERTA'" @click="storeComanda.openUpdate(row.id!)"
                            class="bg-slate-200 text-slate-900 dark:text-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-sm">
                            <PenLine class="w-5 h-5" />
                        </button>
                    </div>
                    <button @click="deletarVenda(row.id!)"
                        class="bg-red-200 text-red-900 dark:text-red-100 dark:bg-red-800 px-2 py-1 rounded-md text-sm">
                        <Trash class="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    </div>

    <ModalView v-model:open="showDrawer" title="Comandas" description="Ações das comandas">
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
import { ref, onMounted, watch } from "vue";
import http from "@/utils/axios";
import type { ComandaVenda } from "@/types/schemas";
import { deletarVenda, openModalFaturarVenda } from "../../vendas/ActionsVendas";
import { useVendasStore } from "@/stores/vendas/useVenda";
import ModalView from "@/components/formulario/ModalView.vue";
import { Button } from "@/components/ui/button";
import { BadgeCheck, BadgePlus, Eye, FileText, PenLine, Plus, Tags, Trash } from "lucide-vue-next";
import Calendarpicker from "@/components/formulario/calendarpicker.vue";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyBR } from "@/utils/formatters";
import { format } from "date-fns";
import { useComandaStore } from "@/stores/arena/comandaStore";
const store = useVendasStore();
const storeComanda = useComandaStore()
const data = ref<ComandaVenda[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const loading = ref(false);
const searchQuery = ref("");
const filtroPeriodo = ref(null);
const showDrawer = ref(false);
const statusFilter = ref('PENDENTE');

function openSaveVenda() {
    // showDrawer.value = false;
    store.openSave();
}

function calculateValorComanda(comanda: ComandaVenda) {
    const valorTotal = comanda.vendas?.reduce((acc, venda) => acc + Number(venda.valor), 0) || 0;
    return valorTotal;
}
function renderMobile(page: number = 1) {
    loading.value = true;
    http.get(`/arenas/comandas/tabela`, {
        params: {
            status: statusFilter.value === 'null' ? undefined : statusFilter.value,
            search: searchQuery.value,
            limit: 10,
            page
        }
    }).then(response => {
        data.value = response.data.data;
        currentPage.value = response.data.pagination.page;
        totalPages.value = response.data.pagination.totalPages;
        loading.value = false;
    }).catch(err => {
        console.error("mobile_comandas:", err);
        data.value = [];
        loading.value = false;
    });
}

function previousPage() {
    if (currentPage.value > 1) renderMobile(currentPage.value - 1);
}

function nextPage() {
    if (currentPage.value < totalPages.value) renderMobile(currentPage.value + 1);
}

watch(() => store.filters.update, () => {
    renderMobile();
})
watch(() => statusFilter.value, () => {
    renderMobile(1);
})

onMounted(() => renderMobile());
</script>
