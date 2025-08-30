<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Vendas } from '@/types/schemas';
import { useToast } from 'vue-toastification';
import type { Table } from '@tanstack/vue-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ref } from 'vue';
import { useVendasStore } from '@/stores/vendas/useVenda';
import { VendaRepository } from '@/repositories/venda-repository';

const { data, table } = defineProps<{
    data: Vendas,
    table: Table<Vendas>
}>()

const toast = useToast()
const store = useVendasStore()
const openDelete = ref(false)
const id = ref<number | null>(null)

async function gerarCupom(id: number) {
    try {
        VendaRepository.getCupomPDF(id)
        toast.success('Cupom gerado com sucesso')
    } catch (error) {
        console.log(error)
        toast.error('Erro ao gerar o cupom')
    }
}

async function editarVenda(id: number) {
    try {
        await store.openUpdate(id);
    } catch (error) {
        console.log(error)
        toast.error('Erro ao buscar os dados da venda!')
    }
}

async function estornarVenda(id: number) {
    try {
        await VendaRepository.estornar(id)
        toast.success('Venda estornada com sucesso')
        store.updateTable()
    } catch (error) {
        console.log(error)
        toast.error('Erro ao estornar a venda')
    }
}

function openModalFaturar(id: number) {
    if (!id) return toast.error('ID nao informado!')
    store.idMutation = id
    store.openModalFaturar = true
}

async function openModalDelete(number: number) {
    id.value = number
    openDelete.value = true
}
async function deletar(id: number) {
    if (!id) return toast.error('ID nao informado!')
    try {
        await VendaRepository.remove(id)
        toast.success('Registro deletado com sucesso')
        openDelete.value = false
        store.updateTable()
    } catch (error) {
        console.log(error)
        toast.error('Erro ao deletar o registro')
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
            <DropdownMenuItem v-if="data.status !== 'FATURADO'" @click="editarVenda(data.id!)">
                <i class="fa-regular fa-pen-to-square mr-1"></i>
                Editar
            </DropdownMenuItem>
            <DropdownMenuItem @click="gerarCupom(data.id!)">
                <i class="fa-regular fa-file-pdf mr-1"></i>
                Cupom PDF
            </DropdownMenuItem>
            <DropdownMenuItem @click="openModalFaturar(data.id!)" v-if="data.status !== 'FATURADO'">
                <i class="fa-regular text-success fa-square-plus mr-1"></i>
                Faturar
            </DropdownMenuItem>
            <DropdownMenuItem @click="estornarVenda(data.id!)" v-if="data.status === 'FATURADO'">
                <i class="fa-regular text-warning fa-square-minus mr-1"></i>
                Estornar
            </DropdownMenuItem>
            <DropdownMenuSeparator v-if="data.status !== 'FATURADO'" />
            <DropdownMenuItem v-if="data.status !== 'FATURADO'" class="text-danger" @click="openModalDelete(data.id!)">
                <i class="fa-regular fa-trash-can mr-1"></i>
                Excluir
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>