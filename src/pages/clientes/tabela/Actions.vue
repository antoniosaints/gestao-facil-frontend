<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { ClientesFornecedores } from '@/types/schemas';
import { useToast } from 'vue-toastification';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ref } from 'vue';
import { ProdutoRepository } from '@/repositories/produto-repository';
import { useClientesStore } from '@/stores/clientes/useClientes';

const store = useClientesStore()
const openDelete = ref(false)
const id = ref<number | null>(null)

const { data } = defineProps<{
    data: ClientesFornecedores,
}>()

const toast = useToast()

function copiar(data: ClientesFornecedores) {
    const produtoString = `ID: ${data?.Uid}`;
    navigator.clipboard.writeText(produtoString);
    toast.success('Copiado para a área de transferência')
}

async function gerarRelatorio(id: number, ordem: "asc" | "desc") {
    try {
        await ProdutoRepository.gerarRelatorio(id, ordem)
        toast.success('Relatorio gerado com sucesso')
    } catch (error) {
        console.log(error)
        toast.error('Erro ao gerar o relatorio')
    }
}

function openDeleteModal(number: number) {
    id.value = number
    openDelete.value = true
}

async function deletar(id: number) {
    if (!id) return toast.error('ID não informado!')
    try {
        await ProdutoRepository.remove(id)
        store.updateTable()
        toast.success('Produto deletado com sucesso')
        openDelete.value = false
    } catch (error) {
        console.log(error)
        toast.error('Erro ao deletar o produto')
        openDelete.value = false
    }
}
</script>

<template>

    <AlertDialog :open="openDelete">
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Deseja deletar o registro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Essa ação não poderá ser desfeita, o registro sera deletado permanentemente
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel @click="openDelete = false">Cancelar</AlertDialogCancel>
                <AlertDialogAction class="text-white bg-danger hover:bg-danger/40" @click="deletar(id!)">
                    Sim, deletar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="default" class="w-8 h-8 p-0 text-white">
                <span class="sr-only">Abrir opções</span>
                <Menu class="w-4 h-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem>
                <i class="fa-regular fa-pen-to-square mr-1"></i>
                Editar
            </DropdownMenuItem>
            <DropdownMenuItem>
                <i class="fa-solid fa-dolly text-success"></i>
                Reposição
            </DropdownMenuItem>
            <DropdownMenuItem @click="gerarRelatorio(data.id!, 'asc')">
                <i class="fa-regular fa-file-pdf mr-1"></i>
                Relatório
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-danger" @click="openDeleteModal(data.id!)">
                <i class="fa-regular fa-trash-can mr-1"></i>
                Excluir
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>