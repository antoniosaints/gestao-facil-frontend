<template>
    <div class="flex flex-col gap-2 mt-2 overflow-auto max-h-[calc(100vh-12rem)] md:max-h-full">
        <!-- Lista de Vendas -->
        <div v-if="loading" class="flex items-center justify-center h-[calc(100vh-12rem)]">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary dark:border-primary-dark"></div>
        </div>
        <div v-else class="flex flex-col gap-2">
            <div v-if="produtos.length === 0"
                class="flex items-center rounded-md bg-card dark:bg-card-dark justify-center h-[calc(100vh-13rem)]">
                <div class="text-center">
                    <i class="fa-solid fa-box-open text-4xl text-gray-500 dark:text-gray-300 mb-4"></i>
                    <p class="text-gray-500 dark:text-gray-300">Nenhum ítem encontrado.</p>
                </div>
            </div>
            <div v-for="venda in produtos" :key="venda.id"
                class="rounded-2xl cursor-pointer border dark:border-border-dark bg-card dark:bg-card-dark p-4">
                <div class="flex justify-between">
                    <div class="text-sm font-semibold dark:text-white">{{ venda.nome }}</div>
                    <div class="text-sm text-green-500 dark:text-green-400">R$ {{
                        Number(venda.preco).toFixed(2).replace('.', ',') }}</div>
                </div>
                <div class="flex justify-between">
                    <div class="text-xs"
                        :class="{ 'text-green-500': venda.status === 'ATIVO', 'text-red-500': venda.status === 'INATIVO' }">
                        {{ venda.status }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{
                        venda.codigo || '-' }}</div>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ venda.descricao || '-' }}</div>
                <div class="mt-2 flex justify-between gap-2">
                    <div class="flex gap-2">
                        <button @click="visualizarVenda(venda.id!)"
                            class="bg-secondary text-white px-3 py-1 rounded-md text-sm">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button @click="gerarCupomPorVendaId(venda.id!)"
                            class="bg-warning text-white px-3 py-1 rounded-md text-sm">
                            <i class="fa-solid fa-file-pdf"></i>
                        </button>
                    </div>
                    <button @click="excluirVenda(venda.id!)" class="bg-danger text-white px-3 py-1 rounded-md text-sm">
                        <i class="fa-solid fa-trash-can"></i>
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

    <Drawer v-model:open="showDrawerFinanceiro">
        <DrawerContent>
            <DrawerHeader class="text-left">
                <DrawerTitle>Produtos</DrawerTitle>
            </DrawerHeader>
            <div class="grid grid-cols-3 gap-4 p-4 lg:grid-cols-4">
                <div @click="emit('openModalProduto', true)"
                    class="p-4 rounded-lg cursor-pointer border-2 bg-gray-50 hover:bg-gray-200 dark:hover:bg-gray-600 dark:bg-gray-700">
                    <div
                        class="flex justify-center items-center p-2 mx-auto mb-2 rounded-full w-[30px] h-[30px] max-w-[30px] max-h-[30px]">
                        <i class="fa-solid fa-circle-plus text-2xl text-gray-500 dark:text-gray-400"></i>
                    </div>
                    <div class="font-medium text-center text-gray-500 dark:text-gray-400">Cadastrar</div>
                </div>
                <!-- Outros itens iguais -->
            </div>
            <DrawerFooter class="pt-2">
                <DrawerClose as-child>
                    <Button variant="outline">
                        Fechar
                    </Button>
                </DrawerClose>
            </DrawerFooter>
        </DrawerContent>
    </Drawer>

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
        <button type="button" @click="showDrawerFinanceiro = !showDrawerFinanceiro"
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
import { ref, onMounted } from "vue";
import http from "@/utils/axios";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import type { Produto } from "@/types/schemas";

const produtos = ref<Produto[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const loading = ref(false);
const searchQuery = ref("");
const showModalBuscarVendas = ref(false);
const showDrawerFinanceiro = ref(false);

const emit = defineEmits(["openModalProduto"]);

function renderListaVendas(page: number = 1) {
    loading.value = true;
    const token = localStorage.getItem("gestao_facil:token");
    http.get(`/produtos/mobile/data`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
            search: searchQuery.value,
            limit: 10,
            page
        }
    }).then(response => {
        produtos.value = response.data.data;
        currentPage.value = response.data.pagination.page;
        totalPages.value = response.data.pagination.totalPages;
        loading.value = false;
        showModalBuscarVendas.value = false;
    }).catch(err => {
        console.error("mobile_vendas:", err);
        produtos.value = [];
        loading.value = false;
    });
}

function previousPage() {
    if (currentPage.value > 1) renderListaVendas(currentPage.value - 1);
}

function nextPage() {
    if (currentPage.value < totalPages.value) renderListaVendas(currentPage.value + 1);
}

// Funções placeholder
function visualizarVenda(id: number) { console.log("Visualizar", id); }
function gerarCupomPorVendaId(id: number) { console.log("Gerar cupom", id); }
function excluirVenda(id: number) { console.log("Excluir", id); }

onMounted(() => renderListaVendas());
</script>
