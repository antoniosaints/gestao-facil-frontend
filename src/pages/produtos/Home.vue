<script setup lang="ts">
import Tabela from '@/pages/produtos/partials/Tabela.vue'
import Mobile from '@/pages/produtos/partials/Mobile.vue'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import ModalProdutos from './formulario/ModalProdutos.vue'
import ModalCriarLote from './others/ModalCriarLote.vue'
import { BadgePlus, ChevronDown, FileChartLine, FileUp, FolderTree, Funnel, Layers3, Menu, Package, RotateCw, Store } from 'lucide-vue-next'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ModalReposicao from './formulario/ModalReposicao.vue'
import ModalDescarte from './formulario/ModalDescarte.vue'
import ModalRelatorio from './formulario/ModalRelatorio.vue'
import ModalVariante from './formulario/ModalVariante.vue'
import GerarEtiquetas from './others/GerarEtiquetas.vue'
import ModalTipoCadastroProduto from './others/ModalTipoCadastroProduto.vue'
import ModalFiltroProdutos from './formulario/ModalFiltroProdutos.vue'
import ModalCatalogoLink from './others/ModalCatalogoLink.vue'
import router from '@/router'
import { provide, ref } from 'vue'

const store = useProdutoStore()
const openFilter = ref(false)
const openCatalogo = ref(false)

provide('openModalFiltroProdutos', openFilter)

const relatorioGeral = async () => {
    store.openReportModal({ reportType: 'catalogo' })
}

</script>

<template>
    <div>
        <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
            <div>
                <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
                    <Package class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
                    Produtos
                </h2>
                <p class="text-sm text-muted-foreground">Listagem de produtos cadastrados</p>
            </div>
            <div class="justify-between gap-2 items-center hidden md:flex">
                <div class="flex items-center rounded-lg border border-border bg-card p-1">
                    <button
                        type="button"
                        @click="store.updateListingMode('base')"
                        :class="[
                            'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition',
                            store.filters.listingMode === 'base' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
                        ]"
                    >
                        <Package class="h-4 w-4" />
                        Produtos base
                    </button>
                    <button
                        type="button"
                        @click="store.updateListingMode('variante')"
                        :class="[
                            'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition',
                            store.filters.listingMode === 'variante' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
                        ]"
                    >
                        <Layers3 class="h-4 w-4" />
                        Variantes
                    </button>
                </div>
                <button @click="openFilter = true" title="Filtrar produtos"
                    class="border border-blue-500 hover:border-blue-700 text-blue-900 dark:text-blue-200 bg-blue-500/20 px-2 py-1.5 text-sm rounded-md">
                    <Funnel class="w-5 h-5" />
                </button>
                <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                        <button type="button" title="Mais ações"
                            class="bg-background border border-border px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5">
                            <Menu class="w-4 h-4" /> Ações
                            <ChevronDown class="w-4 h-4 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-56">
                        <DropdownMenuLabel>Cadastros</DropdownMenuLabel>
                        <DropdownMenuItem @click="store.openSaveVariante()">
                            <Layers3 class="mr-2 h-4 w-4" /> Nova variante
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="router.push('/produtos/categorias')">
                            <FolderTree class="mr-2 h-4 w-4" /> Categorias
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Dados</DropdownMenuLabel>
                        <DropdownMenuItem @click="store.openModalLote = true">
                            <FileUp class="mr-2 h-4 w-4" /> Importar CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="relatorioGeral()">
                            <FileChartLine class="mr-2 h-4 w-4" /> Relatório de produtos
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="openCatalogo = true">
                            <Store class="mr-2 h-4 w-4" /> Catálogo online
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <button data-tour="novo-produto" @click="store.openSaveProduto" class="bg-primary text-white px-2 py-1.5 text-sm rounded-md flex items-center gap-1">
                    <BadgePlus class="h-5 w-5 inline-flex" /> <span class="hidden md:inline">Novo Produto</span>
                </button>
                <button @click="store.updateTable" title="Atualizar listagem"
                    class="bg-background border border-border px-2 py-1.5 text-sm rounded-md">
                    <RotateCw class="w-5 h-5" />
                </button>
            </div>
        </div>
        <div class="overflow-x-auto hidden md:block rounded-lg">
            <Tabela />
        </div>
        <div class="overflow-x-auto block md:hidden rounded-lg">
            <Mobile />
        </div>
        <ModalProdutos />
        <ModalCriarLote />
        <ModalReposicao />
        <ModalDescarte />
        <ModalRelatorio />
        <ModalVariante />
        <ModalFiltroProdutos />
        <GerarEtiquetas />
        <ModalTipoCadastroProduto />
        <ModalCatalogoLink v-model:open="openCatalogo" />
    </div>
</template>
