<template>
    <div class="flex flex-col gap-2 mt-2 overflow-auto max-h-[calc(100vh-13rem)] md:max-h-full">
        <!-- Lista de Vendas -->
        <div v-if="loading" class="flex items-center justify-center h-[calc(100vh-13rem)]">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary dark:border-primary-dark"></div>
        </div>
        <div v-else class="flex flex-col gap-2">
            <div v-if="vendas.length === 0"
                class="flex items-center rounded-md bg-card dark:bg-card-dark justify-center h-[calc(100vh-13rem)]">
                <div class="text-center">
                    <i class="fa-solid fa-box-open text-4xl text-gray-500 dark:text-gray-300 mb-4"></i>
                    <p class="text-gray-500 dark:text-gray-300">Nenhum ítem encontrado.</p>
                </div>
            </div>
            <div v-for="venda in vendas" :key="venda.id"
                class="rounded-2xl cursor-pointer border dark:border-border-dark bg-card dark:bg-card-dark p-4">
                <div class="flex justify-between">
                    <div class="text-sm font-semibold dark:text-white">{{ venda.Uid }}</div>
                    <div class="text-sm text-green-500 dark:text-green-400">R$ {{
                        Number(venda.valor).toFixed(2).replace('.', ',') }}</div>
                </div>
                <div class="flex justify-between">
                    <div
                        :class="`text-xs text-${venda.status === 'FATURADO' ? 'green' : 'gray'}-500 dark:text-${venda.status === 'FATURADO' ? 'green' : 'gray'}-400`">
                        {{ venda.status }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ new
                        Date(venda.data).toLocaleDateString('pt-BR') }}</div>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ venda.observacoes || '-' }}</div>
                <div class="mt-2 flex justify-between gap-2">
                    <div class="flex gap-1">
                        <button @click="store.openDetalhes(venda.id!)"
                            class="bg-blue-200 text-blue-900 dark:text-blue-100 dark:bg-blue-800 px-2 py-1 rounded-md text-sm">
                            <Eye class="w-5 h-5" />
                        </button>
                        <button @click="gerarCupomVenda(venda.id!)"
                            class="bg-orange-200 text-orange-900 dark:text-orange-100 dark:bg-orange-800 px-2 py-1 rounded-md text-sm">
                            <FileChartLine class="w-5 h-5" />
                        </button>
                        <button v-if="!venda.faturado" @click="openModalFaturarVenda(venda.id!)"
                            class="bg-emerald-200 text-emerald-900 dark:text-emerald-100 dark:bg-emerald-800 px-2 py-1 rounded-md text-sm">
                            <BadgeCheck class="w-5 h-5" />
                        </button>
                        <button v-else @click="estornarVenda(venda.id!)"
                            class="bg-yellow-200 text-yellow-900 dark:text-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded-md text-sm">
                            <Undo2 class="w-5 h-5" />
                        </button>
                        <button v-if="!venda.faturado" @click="store.openUpdate(venda.id!)"
                            class="bg-slate-200 text-slate-900 dark:text-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-sm">
                            <PenLine class="w-5 h-5" />
                        </button>
                    </div>
                    <button @click="deletarVenda(venda.id!)"
                        class="bg-red-200 text-red-900 dark:text-red-100 dark:bg-red-800 px-2 py-1 rounded-md text-sm">
                        <Trash class="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Buscar Vendas -->
    <div v-if="showModalBuscarVendas"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div
            class="bg-card dark:bg-card-dark border-t border-border dark:border-border-dark p-6 rounded shadow-xl max-w-[95%] transform transition-all duration-300 scale-95 opacity-0 animate-fade-in">
            <h2 class="text-xl font-bold mb-4">Buscar registro</h2>
            <p class="mb-4">Digite o nome do ítem que deseja buscar.</p>
            <input type="text" v-model="searchQuery"
                class="border bg-card dark:bg-card-dark border-border dark:border-border-dark rounded px-4 py-2 w-full mb-4"
                placeholder="Digite o nome do ítem" />
            <div class="w-full flex justify-between items-center mb-4">
                <button
                    class="bg-secondary text-sm dark:bg-secondary-dark hover:opacity-90 text-white px-3 py-1.5 rounded-md"
                    @click="showModalBuscarVendas = false">
                    <i class="fa-regular fa-circle-xmark"></i> Fechar
                </button>
                <button type="button"
                    class="bg-primary text-sm dark:bg-primary-dark hover:opacity-90 text-white px-3 py-1.5 rounded-md"
                    @click="renderListaVendas(1)">
                    <i class="fa-solid fa-magnifying-glass"></i> Buscar
                </button>
            </div>
        </div>
    </div>

    <ModalView v-model:open="showDrawerVendas" title="Vendas" description="Ações das vendas">
        <div class="grid grid-cols-3 gap-4 p-4 lg:grid-cols-4">
            <router-link to="/vendas/pdv">
                <div
                    class="p-4 rounded-lg cursor-pointer border-2 bg-gray-50 hover:bg-gray-200 dark:hover:bg-gray-600 dark:bg-gray-700">
                    <div
                        class="flex justify-center items-center p-1 mx-auto mb-2 rounded-full w-[30px] h-[30px] max-w-[30px] max-h-[30px]">
                        <ShoppingBasket class="w-10 h-10 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div class="font-medium text-center text-gray-500 dark:text-gray-400">PDV</div>
                </div>
            </router-link>
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
            <Button @click="showDrawerVendas = false" variant="outline" class="w-full">
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
        <button type="button" @click="showModalBuscarVendas = true"
            class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
            <i class="fa-solid fa-search text-lg"></i>
            <span class="text-xs">Busca</span>
        </button>
        <button type="button" @click="showDrawerVendas = !showDrawerVendas"
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
import type { Vendas } from "@/types/schemas";
import { deletarVenda, estornarVenda, gerarCupomVenda, openModalFaturarVenda } from "../ActionsVendas";
import { useVendasStore } from "@/stores/vendas/useVenda";
import ModalView from "@/components/formulario/ModalView.vue";
import { Button } from "@/components/ui/button";
import { BadgeCheck, BadgePlus, Eye, FileChartLine, PenLine, ShoppingBasket, Trash, Undo2 } from "lucide-vue-next";
const store = useVendasStore();
const vendas = ref<Vendas[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const loading = ref(false);
const searchQuery = ref("");
const showModalBuscarVendas = ref(false);
const showDrawerVendas = ref(false);

function openSaveVenda() {
    // showDrawerVendas.value = false;
    store.openSave();
}
function renderListaVendas(page: number = 1) {
    loading.value = true;
    const token = localStorage.getItem("gestao_facil:token");
    http.get(`/vendas/mobile/data`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
            search: searchQuery.value,
            limit: 10,
            page
        }
    }).then(response => {
        vendas.value = response.data.data;
        currentPage.value = response.data.pagination.page;
        totalPages.value = response.data.pagination.totalPages;
        loading.value = false;
        showModalBuscarVendas.value = false;
    }).catch(err => {
        console.error("mobile_vendas:", err);
        vendas.value = [];
        loading.value = false;
    });
}

function previousPage() {
    if (currentPage.value > 1) renderListaVendas(currentPage.value - 1);
}

function nextPage() {
    if (currentPage.value < totalPages.value) renderListaVendas(currentPage.value + 1);
}

watch(() => store.filters.update, () => {
    renderListaVendas();
})

onMounted(() => renderListaVendas());
</script>
