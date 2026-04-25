<script setup lang="ts">
import Tabela from '@/pages/produtos/partials/Tabela.vue'
import Mobile from '@/pages/produtos/partials/Mobile.vue'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import { useToast } from 'vue-toastification'
import ModalProdutos from './formulario/ModalProdutos.vue'
import ModalCriarLote from './others/ModalCriarLote.vue'
import { ProdutoRepository } from '@/repositories/produto-repository'
import { BadgePlus, CircleChevronDown, FileChartLine, FileUp, FolderTree, Funnel, Layers3, Package, RotateCw, Tags, Trash } from 'lucide-vue-next'
import ModalReposicao from './formulario/ModalReposicao.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/composables/useConfirm'
import ModalRelatorio from './formulario/ModalRelatorio.vue'
import ModalVariante from './formulario/ModalVariante.vue'
import GerarEtiquetas from './others/GerarEtiquetas.vue'
import ModalTipoCadastroProduto from './others/ModalTipoCadastroProduto.vue'
import ModalFiltroProdutos from './formulario/ModalFiltroProdutos.vue'
import router from '@/router'
import { provide, ref } from 'vue'

const toast = useToast()
const store = useProdutoStore()
const openFilter = ref(false)

provide('openModalFiltroProdutos', openFilter)

const relatorioGeral = async () => {
    store.openReportModal({ reportType: 'catalogo' })
}

async function excluirEmLote() {
    try {
        if (!store.selectedIds.length) return toast.error('Nenhum produto selecionado')
        const confirm = await useConfirm().confirm({
            title: 'Excluir em lote',
            message: 'Tem certeza que deseja excluir esses produtos?'
        });
        if (!confirm) return
        await Promise.all(store.selectedIds.map(id => ProdutoRepository.remove(id)))
        store.updateTable()
        toast.success('Produtos excluidos com sucesso')
    } catch (error) {
        toast.error('Erro ao excluir os produtos')
        console.log(error)
    }
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
                <DropdownMenu v-if="store.selectedIds.length && store.filters.listingMode === 'base'">
                    <DropdownMenuTrigger as-child>
                        <Button variant="outline">
                            <CircleChevronDown />
                            Ações
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuGroup>
                            <DropdownMenuItem @click="excluirEmLote" class="cursor-pointer">
                                <Trash />
                                <span>
                                    Excluir em lote
                                </span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
                <button @click="openFilter = true"
                    class="border border-blue-500 hover:border-blue-700 text-blue-900 dark:text-blue-200 bg-blue-500/20 px-3 py-1.5 text-sm rounded-lg">
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
                <button @click="store.openSave" class="bg-primary text-white px-2 py-1.5 text-sm rounded-md flex items-center gap-1">
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
        <ModalRelatorio />
        <ModalVariante />
        <ModalFiltroProdutos />
        <GerarEtiquetas />
        <ModalTipoCadastroProduto />
    </div>
</template>
