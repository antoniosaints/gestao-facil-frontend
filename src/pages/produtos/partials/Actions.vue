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

function copiar(data: Produto) {
    const produtoString = `ID: ${data?.Uid}\nProduto: ${data?.nome}\nCodigo: ${data?.codigo}\nPreco: ${data?.preco}\nEstoque: ${data?.estoque}`;
    navigator.clipboard.writeText(produtoString);
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

async function editar(id: number) {
    try {
        const { data } = await store.get(id);
        store.form = {
            id: id,
            nome: data?.nome,
            codigo: data?.codigo,
            preco: data?.preco,
            precoCompra: data?.precoCompra,
            estoque: data?.estoque,
            minimo: data?.minimo,
            descricao: data?.descricao,
            entradas: data?.entradas,
            saidas: data?.saidas,
            unidade: data?.unidade
        }
        store.openModal = true
    } catch (error) {
        console.log(error)
        toast.error('Erro ao editar o produto')
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
            <DropdownMenuItem @click=" editar(data.id!)">
                <i class="fa-regular fa-pen-to-square mr-1"></i>
                Editar
            </DropdownMenuItem>
            <DropdownMenuItem @click=" copiar(data)">
                <i class="fa-regular fa-copy mr-1"></i>
                Copiar
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