<template>
    <div>
        <div class="flex flex-col gap-2 mt-2 overflow-auto max-h-[calc(100vh-13rem)] md:max-h-full">
            <!-- Lista de Vendas -->
            <div v-if="loading" class="flex items-center justify-center h-[calc(100vh-13rem)]">
                <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary dark:border-primary-dark">
                </div>
            </div>
            <div v-else class="flex flex-col gap-2">
                <div v-if="dataMobile.length === 0"
                    class="flex items-center rounded-md bg-card dark:bg-card-dark justify-center h-[calc(100vh-13rem)]">
                    <div class="text-center">
                        <i class="fa-solid fa-box-open text-4xl text-gray-500 dark:text-gray-300 mb-4"></i>
                        <p class="text-gray-500 dark:text-gray-300">Nenhum ítem encontrado.</p>
                    </div>
                </div>
                <div v-for="row in dataMobile" :key="row.id"
                    class="rounded-2xl cursor-pointer border dark:border-border-dark bg-card dark:bg-card-dark p-4">
                    <div class="flex justify-between">
                        <div class="text-sm font-semibold dark:text-white">{{ row.nome }}</div>
                        <div class="text-sm text-green-500 dark:text-green-400">R$ {{
                            Number(row.preco).toFixed(2).replace('.', ',') }}</div>
                    </div>
                    <div class="flex justify-between">
                        <div class="text-xs"
                            :class="{ 'text-green-500': row.status === 'ATIVO', 'text-red-500': row.status === 'INATIVO' }">
                            {{ row.status }}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">{{
                            row.codigo || '-' }}</div>
                    </div>
                    <div class="flex justify-between">
                        <div class="text-xs">
                            {{ row.estoque }} {{ row.unidade }}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">{{
                            row.Uid || '-' }}</div>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ row.descricao || '-' }}</div>
                    <div class="mt-2 flex justify-between gap-2">
                        <div class="flex gap-2">
                            <RouterLink class="inline-flex" :to="`/produtos/detalhes?id=${row.id}`">
                                <button
                                    class="bg-blue-200 text-blue-900 dark:text-blue-100 dark:bg-blue-800 px-2 py-1 rounded-md text-sm">
                                    <Eye class="w-5 h-5" />
                                </button>
                            </RouterLink>
                            <button @click="openModalReposicao(row.id!)"
                                class="bg-blue-200 text-blue-900 dark:text-blue-100 dark:bg-blue-800 px-2 py-1 rounded-md text-sm">
                                <ArchiveRestore class="w-5 h-5" />
                            </button>
                            <button @click="gerarRelatorio(row.id!)"
                                class="bg-orange-200 text-orange-900 dark:text-orange-100 dark:bg-orange-800 px-2 py-1 rounded-md text-sm">
                                <FileChartLine class="w-5 h-5" />
                            </button>
                            <button @click="store.openUpdate(row.id!)"
                                class="bg-gray-200 text-gray-900 dark:text-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-sm">
                                <PenLineIcon class="w-5 h-5" />
                            </button>
                        </div>
                        <button @click="deletar(row.id!)"
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
                        @click="renderMobile(1)">
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
                    <div @click="openSave"
                        class="p-4 rounded-lg cursor-pointer border-2 bg-gray-50 hover:bg-gray-200 dark:hover:bg-gray-600 dark:bg-gray-700">
                        <div
                            class="flex justify-center items-center p-1 mx-auto mb-2 rounded-full w-[30px] h-[30px] max-w-[30px] max-h-[30px]">
                            <BadgePlus class="w-10 h-10 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div class="font-medium text-center text-gray-500 dark:text-gray-400">Cadastrar</div>
                    </div>
                    <div @click="store.openModalRelatorioGeral = true"
                        class="p-4 rounded-lg cursor-pointer border-2 bg-gray-50 hover:bg-gray-200 dark:hover:bg-gray-600 dark:bg-gray-700">
                        <div
                            class="flex justify-center items-center p-1 mx-auto mb-2 rounded-full w-[30px] h-[30px] max-w-[30px] max-h-[30px]">
                            <FileSpreadsheet class="w-10 h-10 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div class="font-medium text-center text-gray-500 dark:text-gray-400">Relatório</div>
                    </div>
                    <div @click="store.openModalLote = true"
                        class="p-4 rounded-lg cursor-pointer border-2 bg-gray-50 hover:bg-gray-200 dark:hover:bg-gray-600 dark:bg-gray-700">
                        <div
                            class="flex justify-center items-center p-1 mx-auto mb-2 rounded-full w-[30px] h-[30px] max-w-[30px] max-h-[30px]">
                            <FileUp class="w-10 h-10 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div class="font-medium text-center text-gray-500 dark:text-gray-400">Lote</div>
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
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import http from "@/utils/axios";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import type { Produto } from "@/@types/schemas";
import { ArchiveRestore, BadgePlus, Eye, FileChartLine, FileSpreadsheet, FileUp, PenLineIcon, Trash } from "lucide-vue-next";
import { useProdutoStore } from "@/stores/produtos/useProduto";
import { useToast } from "vue-toastification";
import { useConfirm } from "@/composables/useConfirm";
import { ProdutoRepository } from "@/repositories/produto-repository";
import { watch } from "vue";

const store = useProdutoStore();
const toast = useToast();
const dataMobile = ref<Produto[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const loading = ref(false);
const searchQuery = ref("");
const showModalBuscarVendas = ref(false);
const showDrawerFinanceiro = ref(false);

function renderMobile(page: number = 1) {
    loading.value = true;
    http.get(`/produtos/mobile/data`, {
        params: {
            search: searchQuery.value,
            limit: 10,
            page
        }
    }).then(response => {
        dataMobile.value = response.data.data;
        currentPage.value = response.data.pagination.page;
        totalPages.value = response.data.pagination.totalPages;
        showModalBuscarVendas.value = false;
    }).catch(err => {
        console.error("mobile_produtos:", err);
        dataMobile.value = [];
    }).finally(() => {
        loading.value = false;
    });
}

function openSave() {
    // showDrawer.value = false;
    store.openSave();
}


function previousPage() {
    if (currentPage.value > 1) renderMobile(currentPage.value - 1);
}

function nextPage() {
    if (currentPage.value < totalPages.value) renderMobile(currentPage.value + 1);
}

async function deletar(id: number) {
    if (!id) return toast.error('ID não informado!')
    const confirm = await useConfirm().confirm({
        title: 'Excluir produto',
        message: 'Tem certeza que deseja excluir este produto?',
        confirmText: 'Sim, excluir!',
    })
    if (!confirm) return
    try {
        await ProdutoRepository.remove(id)
        store.updateTable()
        toast.success('Produto deletado com sucesso')
    } catch (error) {
        console.log(error)
        toast.error('Erro ao deletar o produto')
    }
}

function openModalReposicao(number: number) {
    store.idMutation = number
    store.openModalReposicao = true
}

async function gerarRelatorio(id: number) {
    store.idMutation = id;
    store.openModalRelatorio = true
}

watch(() => store.filters.update, () => {
    renderMobile();
})

onMounted(() => renderMobile());
</script>
