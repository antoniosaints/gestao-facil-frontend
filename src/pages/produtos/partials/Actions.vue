<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Produto } from '@/types/schemas';
import { useToast } from 'vue-toastification';
import { useProdutoStore } from '@/stores/produtos/useProduto';
import type { Table } from '@tanstack/vue-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ref } from 'vue';

const store = useProdutoStore()
const openDelete = ref(false)
const id = ref<number | null>(null)

const { data, table } = defineProps<{
    data: Produto,
    table: Table<Produto>
}>()

const toast = useToast()

function copiar(id: string) {
    navigator.clipboard.writeText(id)
    toast.success('Copiado para a área de transferência')
}

async function gerarRelatorio(id: number, ordem: "asc" | "desc") {
    try {
        await store.gerarRelatorio(id, ordem)
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

function deletar(id: number) {
    if (!id) return toast.error('ID não informado!')
    try {
        store.remove(id)
        table.setPageIndex(0)
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
            <DropdownMenuItem as-child>
                <Button variant="ghost" class="w-full px-3" @click=" copiar(data.Uid)">
                    <i class="fa-regular fa-copy mr-1"></i>
                    Copiar ID
                </Button>
            </DropdownMenuItem>
            <DropdownMenuItem as-child>
                <Button variant="ghost" class="w-full px-3" @click="gerarRelatorio(data.id!, 'asc')">
                    <i class="fa-regular fa-file-pdf mr-1"></i>
                    Cupom PDF
                </Button>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem as-child>
                <Button variant="ghost" class="w-full px-3 text-danger" @click="openDeleteModal(data.id!)">
                    <i class="fa-regular fa-trash-can mr-1"></i>
                    Excluir
                </Button>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>