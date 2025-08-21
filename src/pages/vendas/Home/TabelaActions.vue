<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Vendas } from '@/types/schemas';
import { useToast } from 'vue-toastification';
import type { Table } from '@tanstack/vue-table';
import { useVendaStore } from '@/stores/vendas/useVenda';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ref } from 'vue';

const { data, table } = defineProps<{
    data: Vendas,
    table: Table<Vendas>
}>()

const toast = useToast()
const store = useVendaStore()
const openDelete = ref(false)
const id = ref<number | null>(null)

function copiar(id: string) {
    navigator.clipboard.writeText(id)
    toast.success('Copiado para a área de transferência')
}

function openModalDelete(number: number) {
    id.value = number
    openDelete.value = true
}
async function deletar(id: number) {
    if (!id) return toast.error('ID nao informado!')
    try {
        await store.remove(id)
        toast.success('Registro deletado com sucesso')
        table.setPageIndex(table.getState().pagination.pageIndex - 1)
    } catch (error) {
        console.log(error)
        toast.error('Erro ao deletar o registro')
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
                <Button variant="ghost" class="w-full px-3">
                    <i class="fa-regular fa-file-pdf mr-1"></i>
                    Cupom PDF
                </Button>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem as-child>
                <Button variant="ghost" class="w-full px-3 text-danger" @click="openModalDelete(data.id!)">
                    <i class="fa-regular fa-trash-can mr-1"></i>
                    Excluir
                </Button>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>