<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Edit, Trash2, Box, TrendingDown, TrendingUp, HandCoins, CircleDollarSign, Tag, Undo2, PencilLine } from "lucide-vue-next"
import BadgeCell from "@/components/tabela/BadgeCell.vue"
import { computed, onMounted, ref, watch } from "vue"
import { type Produto } from "@/@types/schemas"
import { useToast } from "vue-toastification"
import { ProdutoRepository } from "@/repositories/produto-repository"
import Separator from "@/components/ui/separator/Separator.vue"
import { useRoute } from "vue-router"
import { useProdutoStore } from "@/stores/produtos/useProduto"
import ModalProdutos from "../formulario/ModalProdutos.vue"
import GerarEtiquetas from "./GerarEtiquetas.vue"
import { useConfirm } from "@/composables/useConfirm"
import ModalRelatorio from "../formulario/ModalRelatorio.vue"
import router from "@/router"
import { formatCurrencyBR } from "@/utils/formatters"
import { goBack } from "@/hooks/links"
import { useUiStore } from "@/stores/ui/uiStore"

const route = useRoute()
const store = useProdutoStore()
const uiStore = useUiStore()

interface Resumoproduto {
    totalGasto: string,
    lucroLiquido: string,
    totalEntradas: number,
    totalSaidas: number,
    estoqueAtual: number,
    custoMedio: string,
    valorEstoque: string,
    margemLucro: string,
    ticketMedio: string
}

const toast = useToast()
const produto = ref<Produto>()
const resumo = ref<Resumoproduto>()

async function getProduto(id: number) {
    try {
        const [produtoResp, resumoResp] = await Promise.all([
            ProdutoRepository.get(Number(id)),
            ProdutoRepository.resumo(Number(id))
        ]);
        produto.value = produtoResp.data;
        resumo.value = resumoResp;
    } catch (error) {
        console.error(error);
        toast.error("Erro ao buscar o produto");
    }
}

async function gerarRelatorio() {
    store.idMutation = produto.value?.id!;
    store.openModalRelatorio = true
}
async function gerarEtiquetas() {
    store.idMutation = produto.value?.id!;
    store.openModalEtiquetas = true
}

function copiarId() {
    navigator.clipboard.writeText(produto.value?.Uid!.toString() || "");
    toast.success("ID copiado para o clipboard");
}

function loadProduto() {
    const id = Number(route.query.id);
    if (!id || isNaN(id)) {
        toast.error("ID de produto inválido");
        return;
    }
    getProduto(id);
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
        router.back()
    } catch (error) {
        console.log(error)
        toast.error('Erro ao deletar o produto')
    }
}

function atualizarDetalhes() {
    loadProduto();
}

onMounted(loadProduto)
watch(() => store.openModal, loadProduto)

const status = computed(() => {
    if (produto.value?.status === "ATIVO") {
        return {
            label: "Ativo",
            color: "green"
        }
    } else {
        return {
            label: "Inativo",
            color: "red"
        }
    }
})
</script>

<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between flex-col md:flex-row bg-card shadow-md border rounded-md p-4">
            <h1 class="text-md md:text-lg flex items-center gap-2">
                <Box class="w-6 h-6 text-blue-600" />
                <BadgeCell class="text-sm" :color="(status.color as any)" :label="status.label" />
                {{ produto?.nome }}
            </h1>
            <div class="hidden md:flex gap-2">
                <RouterLink to="/produtos" as-child>
                    <Button class="rounded-lg" variant="outline">
                        <ArrowLeft class="w-4 h-4 mr-1" /> Voltar
                    </Button>
                </RouterLink>
                <Button class="bg-success text-white hover:bg-success/80 rounded-lg" @click="gerarEtiquetas">
                    <Tag class="w-4 h-4 mr-1" /> Etiquetas
                </Button>
                <Button class="bg-warning text-white hover:bg-warning/80 rounded-lg" @click="gerarRelatorio">
                    <FileText class="w-4 h-4" />
                </Button>
                <Button @click="store.openUpdate(produto?.id!)" variant="default" class="text-white rounded-lg">
                    <Edit class="w-4 h-4" />
                </Button>
                <Button @click="deletar(produto?.id!)" class="text-white rounded-lg" variant="destructive">
                    <Trash2 class="w-4 h-4" />
                </Button>
                <Button @click="atualizarDetalhes" class="rounded-lg" variant="outline">
                    <i class="fa-solid fa-sync "></i>
                </Button>
            </div>
        </div>

        <!-- Indicadores -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <span
                class="rounded-lg inline-flex items-center px-4 py-4 border border-red-800 dark:border-red-600 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200">
                <TrendingDown class="w-7 h-7 mr-2" />
                <div class="text-left rtl:text-right">
                    <div class="mb-1 text-sm">Compras / Reposições</div>
                    <div class="-mt-1 font-sans text-lg font-semibold">{{ resumo?.totalEntradas }}</div>
                </div>
            </span>
            <span
                class="rounded-lg inline-flex items-center px-4 py-4 border border-green-800 dark:border-green-600 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                <TrendingUp class="w-7 h-7 mr-2" />
                <div class="text-left rtl:text-right">
                    <div class="mb-1 text-sm">Vendas</div>
                    <div class="-mt-1 font-sans text-lg font-semibold">{{ resumo?.totalSaidas }}</div>
                </div>
            </span>
            <span
                class="rounded-lg inline-flex items-center px-4 py-4 border border-yellow-800 dark:border-yellow-600 bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                <HandCoins class="w-7 h-7 mr-2" />
                <div class="text-left rtl:text-right">
                    <div class="mb-1 text-sm">Valor gasto</div>
                    <div class="-mt-1 font-sans text-lg font-semibold">{{ formatCurrencyBR((Number(resumo?.totalGasto
                        || 0))) }}
                    </div>
                </div>
            </span>
            <span
                class="rounded-lg inline-flex items-center px-4 py-4 border border-blue-800 dark:border-blue-600 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                <CircleDollarSign class="w-7 h-7 mr-2" />
                <div class="text-left rtl:text-right">
                    <div class="mb-1 text-sm">Lucro líquido</div>
                    <div class="-mt-1 font-sans text-lg font-semibold">
                        {{ formatCurrencyBR((Number(resumo?.lucroLiquido || 0))) }}
                    </div>
                </div>
            </span>
        </div>

        <!-- Informações principais -->
        <Card class="rounded-md">
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    <Box class="w-5 h-5" /> Informações do Produto
                </CardTitle>
            </CardHeader>
            <CardContent class="flex flex-col md:grid md:grid-cols-2 gap-2">
                <div class="flex items-center gap-2"><span>Código:</span>
                    <div class="flex items-center gap-2">
                        <BadgeCell color="gray" :label="produto?.Uid || 'N/A'" class="text-sm" :capitalize="false" />
                        <Button @click="copiarId" variant="outline" size="xs"><i
                                class="fa-solid fa-copy fa-xs"></i></Button>
                    </div>
                </div>
                <div><span>Código:</span>
                    <BadgeCell color="gray" :label="produto?.codigo || 'N/A'" class="ml-2 text-sm"
                        :capitalize="false" />
                </div>
                <div><span>Preço:</span>
                    <BadgeCell color="green" :label="`R$ ${(Number(produto?.preco).toFixed(2).replace('.', ','))}`"
                        class="ml-2 text-sm" />
                </div>
                <div><span>Preço de compra:</span> {{ Number(produto?.precoCompra).toFixed(2).replace('.', ',') || 'N/A'
                }}</div>
                <div><span>Estoque:</span> {{ produto?.estoque }} {{ produto?.unidade }}</div>
                <div><span>Mínimo:</span> {{ produto?.minimo }} {{ produto?.unidade }}</div>
                <div><span>Permite entradas:</span>
                    <BadgeCell :color="produto?.entradas ? 'green' : 'red'" :label="produto?.entradas ? 'Sim' : 'Nao'"
                        class="ml-2 text-sm" />
                </div>
                <div><span>Permite saídas:</span>
                    <BadgeCell :color="produto?.saidas ? 'green' : 'red'" :label="produto?.saidas ? 'Sim' : 'Nao'"
                        class="ml-2 text-sm" />
                </div>
                <Separator class="col-span-2" />
                <div class="col-span-2"><span>Descrição:</span> {{ produto?.descricao || 'N/A' }}</div>
            </CardContent>
        </Card>


        <!-- Financeiro extra -->
        <Card class="rounded-md">
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    <CircleDollarSign class="w-5 h-5" /> Financeiro
                </CardTitle>
            </CardHeader>
            <CardContent class="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div><span>Custo médio:</span>
                    <BadgeCell color="yellow" :label="`${formatCurrencyBR((Number(resumo?.custoMedio || 0)))}`"
                        class="ml-2 text-sm" />
                </div>
                <div><span>Tícket médio:</span>
                    <BadgeCell color="emerald" :label="`${formatCurrencyBR((Number(resumo?.ticketMedio || 0)))}`"
                        class="ml-2 text-sm" />
                </div>
                <div><span>Valor em estoque:</span>
                    <BadgeCell color="gray" :label="`${formatCurrencyBR((Number(resumo?.valorEstoque || 0)))}`"
                        class="ml-2 text-sm" />
                </div>
                <div><span>Margem de lucro:</span>
                    <BadgeCell color="blue" :label="`${resumo?.margemLucro}`" class="ml-2 text-sm" />
                </div>
            </CardContent>
        </Card>

        <!-- Vendas -->
        <Card class="rounded-md hidden">
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    <Tag class="w-5 h-5" /> Vendas
                </CardTitle>
            </CardHeader>
            <CardContent class="grid grid-cols-4 gap-2">
                <div class="col-span-4">Em breve...</div>
            </CardContent>
        </Card>
        <nav v-if="uiStore.isMobile"
            class="fixed bottom-0 left-0 w-full bg-card dark:bg-card-dark border-t border-border dark:border-border-dark flex justify-around pt-4 h-20 shadow-lg z-20">
            <button type="button" @click="store.openUpdate(produto?.id!)"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <PencilLine />
                <span class="text-xs">Editar</span>
            </button>
            <button type="button" @click="gerarEtiquetas"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <Tag />
                <span class="text-xs">Etiquetas</span>
            </button>
            <button type="button" @click="gerarRelatorio"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <FileText />
                <span class="text-xs">Relatório</span>
            </button>
            <button type="button" @click="goBack"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <Undo2 />
                <span class="text-xs">Voltar</span>
            </button>
        </nav>
        <ModalProdutos />
        <GerarEtiquetas />
        <ModalRelatorio />
    </div>
</template>
