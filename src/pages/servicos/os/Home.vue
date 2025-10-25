<script setup lang="ts">
import { useUiStore } from '@/stores/ui/uiStore';
import { BadgePlus, CircleChevronDown, FileCheck, FileDigit, RotateCw, Trash } from 'lucide-vue-next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from 'vue-toastification';
import { useConfirm } from '@/composables/useConfirm';
import { ServicoRepository } from '@/repositories/servico-repository';
import Tabela from './tabela/Tabela.vue';
import Mobile from './tabela/Mobile.vue';
import OrdemServicoModal from '../modais/OrdemServicoModal.vue';
import { useOrdemServicoStore } from '@/stores/servicos/useOrdensServicos';
import ModalChecklist from '../modais/ModalChecklist.vue';
const store = useOrdemServicoStore();
const uiStore = useUiStore()
const toast = useToast()
async function excluirEmLote() {
    try {
        if (!store.selectedIds.length) return toast.error('Nenhum serviço selecionado')
        const confirm = await useConfirm().confirm({
            title: 'Excluir em lote',
            message: 'Tem certeza que deseja excluir esses serviços?'
        });
        if (!confirm) return
        await Promise.all(store.selectedIds.map(id => ServicoRepository.remove(id)))
        store.updateTable()
        toast.success('Serviços excluidos com sucesso')
    } catch (error) {
        console.log(error)
        toast.error('Erro ao excluir os serviços')
    }
}
</script>

<template>
    <div>
        <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FileDigit class="h-6 w-6" :stroke-width="2.5" />
                    Ordens de serviço
                </h2>
                <p class="text-sm text-muted-foreground">Ordens de serviços cadastrados no sistema</p>
            </div>
            <div class="justify-between gap-2 items-center hidden md:flex">
                <DropdownMenu v-if="store.selectedIds.length">
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
                <button @click="store.openSave"
                    class="bg-primary text-white px-3 py-1.5 text-sm rounded-md flex items-center gap-1">
                    <BadgePlus class="h-5 w-5 inline-flex" /> <span class="hidden md:inline">Nova OS</span>
                </button>
                <button @click="store.openModalChecklist = true"
                    class="bg-success text-white px-3 py-1.5 text-sm rounded-md flex items-center gap-1">
                    <FileCheck class="h-5 w-5 inline-flex" /> <span class="hidden md:inline">Novo checklist</span>
                </button>
                <button @click="store.updateTable"
                    class="bg-background border border-border px-2 py-1.5 text-sm rounded-md">
                    <RotateCw class="w-5 h-5" />
                </button>
            </div>
        </div>
        <div v-if="!uiStore.isMobile" class="overflow-x-auto rounded-lg">
            <Tabela />
        </div>
        <div v-else class="overflow-x-auto rounded-lg">
            <Mobile />
        </div>
        <OrdemServicoModal />
        <ModalChecklist />
    </div>
</template>