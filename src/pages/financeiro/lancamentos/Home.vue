<script setup lang="ts">
import Tabela from './tabela/Tabela.vue';
import Mobile from './tabela/Mobile.vue';
import { useUiStore } from '@/stores/ui/uiStore';
import LancamentoModal from './formulario/LancamentoModal.vue';
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos';
import { CircleChevronDown, CirclePlus, FileText, Trash, Wallet } from 'lucide-vue-next';
import GerarDRE from './modais/GerarDRE.vue';
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/composables/useConfirm';
import { LancamentosRepository } from '@/repositories/lancamento-repository';
import { useToast } from 'vue-toastification';
import { onMounted } from 'vue';
import { entrarNaConta, socket } from '@/pluguins/socket';
const store = useLancamentosStore();
const uiStore = useUiStore()
const toast = useToast()
const openByTipo = (tipo: 'RECEITA' | 'DESPESA') => {
    store.form.tipo = tipo
    store.openSave()
}

async function excluirEmLote() {
    try {
        if (!store.selectedIds.length) return toast.error('Nenhum lançamento selecionado')
        const confirm = await useConfirm().confirm({
            title: 'Excluir em lote',
            message: 'Tem certeza que deseja excluir esses lançamentos?'
        });
        if (!confirm) return
        await Promise.all(store.selectedIds.map(id => LancamentosRepository.remove(id)))
        store.updateTable()
        toast.success('Lançamentos excluidos com sucesso')
    } catch (error) {
        toast.error('Erro ao excluir os lançamentos')
        console.log(error)
    }
}

onMounted(() => {
    if (!uiStore.usuarioLogged.contaId) return
    entrarNaConta(uiStore.usuarioLogged.contaId)

    // socket.on("socket:cobranca:conectado", (dados) => {
    //     toast.success('Cobranca conectada')
    // });
})
</script>

<template>
    <div>
        <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Wallet class="h-6 w-6" :stroke-width="2.5" />
                    Lançamentos
                </h2>
                <p class="text-sm text-muted-foreground">Lançamentos financeiros do sistema</p>
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
                <button @click="store.openModalDre = true"
                    class="bg-warning text-white px-3 py-1.5 text-sm rounded-md flex items-center gap-2">
                    <FileText class="h-5 w-5" /> <span class="hidden md:inline">DRE</span>
                </button>
                <button @click="openByTipo('RECEITA')"
                    class="bg-success text-white px-3 py-1.5 text-sm rounded-md flex items-center gap-2">
                    <CirclePlus class="h-5 w-5" /> <span class="hidden md:inline">Receita</span>
                </button>
                <button @click="openByTipo('DESPESA')"
                    class="bg-danger text-white px-3 py-1.5 text-sm rounded-md flex items-center gap-2">
                    <CirclePlus class="h-5 w-5" /> <span class="hidden md:inline">Despesa</span>
                </button>
                <button @click="store.updateTable"
                    class="bg-background border border-border px-3 py-1.5 text-sm rounded-md">
                    <i class="fa-solid fa-arrow-rotate-right"></i>
                </button>
            </div>
        </div>
        <div v-if="!uiStore.isMobile" class="overflow-x-auto rounded-lg">
            <Tabela />
        </div>
        <div v-else class="overflow-x-auto rounded-lg">
            <Mobile @openModalProduto="store.openSave" />
        </div>
        <LancamentoModal />
        <ClientesModal />
        <GerarDRE />
    </div>
</template>