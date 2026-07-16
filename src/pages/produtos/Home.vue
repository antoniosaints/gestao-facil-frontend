<script setup lang="ts">
import Tabela from '@/pages/produtos/partials/Tabela.vue'
import Mobile from '@/pages/produtos/partials/Mobile.vue'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import ModalProdutos from './formulario/ModalProdutos.vue'
import ModalCriarLote from './others/ModalCriarLote.vue'
import { BadgePlus, FileChartLine, FileUp, FolderTree, Funnel, Layers3, Package, RotateCw, Store } from 'lucide-vue-next'
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
                <button @click="openFilter = true"
                    class="border border-blue-500 hover:border-blue-700 text-blue-900 dark:text-blue-200 bg-blue-500/20 px-3 py-2 text-sm rounded-lg">
                    <Funnel class="w-4 h-4" />
                </button>
                <button @click="relatorioGeral()" class="bg-orange-600 text-white px-2 py-1.5 text-sm rounded-md">
                    <FileChartLine class="w-5 h-5" />
                </button>
                <button @click="store.openModalLote = true"
                    class="bg-green-600 text-white px-2 py-1.5 text-sm rounded-md">
                    <FileUp class="w-5 h-5" />
                </button>
                <button @click="router.push('/produtos/categorias')"
                    class="bg-background border border-border px-2 py-1.5 text-sm rounded-md">
                    <FolderTree class="w-5 h-5" />
                </button>
                <button @click="openCatalogo = true" title="Catálogo online"
                    class="bg-violet-600 text-white px-2 py-1.5 text-sm rounded-md">
                    <Store class="w-5 h-5" />
                </button>
                <button @click="store.openSaveVariante()" title="Nova variante de um produto existente"
                    class="bg-background border border-border px-2 py-1.5 text-sm rounded-md">
                    <Layers3 class="w-5 h-5" />
                </button>
                <button @click="store.openSaveProduto" class="bg-primary text-white px-2 py-1.5 text-sm rounded-md flex items-center gap-1">
                    <BadgePlus class="h-5 w-5 inline-flex" /> <span class="hidden md:inline">Novo Produto</span>
                </button>
                <button @click="store.updateTable"
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
