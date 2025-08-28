<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Edit, Trash2 } from "lucide-vue-next"
import BadgeCell from "@/components/tabela/BadgeCell.vue"

const produto = {
    nome: "BATERIA FOXCONN IPHONE 11 PRO MAX (3969mAh) - CAIXA PRETA",
    codigo: "124",
    preco: 120.0,
    estoque: 2,
    unidade: "UND",
    minimo: 1,
    descricao: "N/A",
    compras: 0,
    vendas: 0,
    valorGasto: 0,
    lucroLiquido: 0,
    custoMedio: 95.0,
    valorEstoque: 240.0,
    margem: "26%",
    ultimaCompra: "05/08/2025",
    ultimaVenda: "10/08/2025",
    fornecedor: "Apple Distribuidora"
}
</script>

<template>
    <div class="space-y-6">
        <!-- Cabeçalho -->
        <div class="flex items-center justify-between flex-col md:flex-row">
            <h1 class="text-md md:text-xl flex items-center gap-2">
                <FileText class="w-6 h-6 text-blue-600" />
                {{ produto.nome }}
            </h1>
            <div class="hidden md:flex gap-2">
                <RouterLink to="/produtos" as-child>
                    <Button variant="outline">
                        <ArrowLeft class="w-4 h-4 mr-1" /> Voltar
                    </Button>
                </RouterLink>
                <Button variant="secondary">
                    <FileText class="w-4 h-4 mr-1" /> Relatório
                </Button>
                <Button variant="default" class="text-white">
                    <Edit class="w-4 h-4 mr-1" /> Editar
                </Button>
                <Button variant="destructive">
                    <Trash2 class="w-4 h-4 mr-1" /> Excluir
                </Button>
            </div>
        </div>

        <!-- Indicadores -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <span
                class="rounded-lg inline-flex items-center px-4 py-4 border border-red-800 dark:border-red-600 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200">
                <i class="fa-solid fa-turn-down w-7 h-7"></i>
                <div class="text-left rtl:text-right">
                    <div class="mb-1 text-sm">Compras/Reposições</div>
                    <div class="-mt-1 font-sans text-lg font-semibold">100</div>
                </div>
            </span>
            <span
                class="rounded-lg inline-flex items-center px-4 py-4 border border-green-800 dark:border-green-600 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                <i class="fa-solid fa-turn-up w-7 h-7"></i>
                <div class="text-left rtl:text-right">
                    <div class="mb-1 text-sm">Vendas</div>
                    <div class="-mt-1 font-sans text-lg font-semibold">100</div>
                </div>
            </span>
            <span
                class="rounded-lg inline-flex items-center px-4 py-4 border border-yellow-800 dark:border-yellow-600 bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                <i class="fa-solid fa-dollar-sign w-7 h-7"></i>
                <div class="text-left rtl:text-right">
                    <div class="mb-1 text-sm">Valor gasto</div>
                    <div class="-mt-1 font-sans text-lg font-semibold">R$ 2000</div>
                </div>
            </span>
            <span
                class="rounded-lg inline-flex items-center px-4 py-4 border border-blue-800 dark:border-blue-600 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                <i class="fa-solid fa-money-bills w-7 h-7 mr-2"></i>
                <div class="text-left rtl:text-right">
                    <div class="mb-1 text-sm">Lucro líquido</div>
                    <div class="-mt-1 font-sans text-lg font-semibold">R$ 500</div>
                </div>
            </span>
        </div>

        <!-- Informações principais -->
        <Card>
            <CardHeader>
                <CardTitle>Informações do Produto</CardTitle>
            </CardHeader>
            <CardContent class="grid grid-cols-2 gap-2">
                <div><span>Código:</span>
                    <BadgeCell color="gray" :label="produto.codigo" class="ml-2 text-sm" />
                </div>
                <div><span>Preço:</span> R$ {{ produto.preco.toFixed(2) }}</div>
                <div><span>Estoque:</span> {{ produto.estoque }} {{ produto.unidade }}</div>
                <div><span>Estoque Mínimo:</span> {{ produto.minimo }} {{ produto.unidade }}</div>
                <div class="col-span-2"><span>Descrição:</span> {{ produto.descricao }}</div>
            </CardContent>
        </Card>


        <!-- Financeiro extra -->
        <Card>
            <CardHeader>
                <CardTitle>Financeiro</CardTitle>
            </CardHeader>
            <CardContent class="grid grid-cols-3 gap-2">
                <div><span>Custo médio:</span>
                    <BadgeCell color="yellow" :label="`R$ ${produto.custoMedio.toFixed(2).replace('.', ',')}`"
                        class="ml-2 text-sm" />
                </div>
                <div><span>Valor em estoque:</span>
                    <BadgeCell color="green" :label="`R$ ${produto.valorEstoque.toFixed(2).replace('.', ',')}`"
                        class="ml-2 text-sm" />
                </div>
                <div><span>Margem de lucro:</span>
                    <BadgeCell color="blue" :label="produto.margem" class="ml-2 text-sm" />
                </div>
            </CardContent>
        </Card>

        <!-- Histórico -->
        <Card>
            <CardHeader>
                <CardTitle>Histórico</CardTitle>
            </CardHeader>
            <CardContent class="grid grid-cols-3 gap-2">
                <div><span>Última compra:</span> {{ produto.ultimaCompra }}</div>
                <div><span>Última venda:</span> {{ produto.ultimaVenda }}</div>
                <div><span>Fornecedor:</span> {{ produto.fornecedor }}</div>
            </CardContent>
        </Card>
    </div>
</template>
