<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Produto } from '@/@types/schemas';
import { useToast } from 'vue-toastification';
import { useProdutoStore } from '@/stores/produtos/useProduto';
import type { Table } from '@tanstack/vue-table';
import { ref } from 'vue';
import { ProdutoRepository } from '@/repositories/produto-repository';
import { useConfirm } from '@/composables/useConfirm';

const store = useProdutoStore()

const { data } = defineProps<{
    data: Produto,
    table: Table<Produto>
}>()

const toast = useToast()

function openModalReposicao(number: number) {
    store.idMutation = number
    store.openModalReposicao = true
}

async function gerarRelatorio(id: number) {
    store.idMutation = id;
    store.openModalRelatorio = true
}

async function deletar(id: number) {
    if (!id) return toast.error('ID não informado!')
    const confirm = await useConfirm().confirm({
        title: 'Excluir produto',
        message: 'Tem certeza que deseja excluir este produto?',
        confirmText: 'Sim, excluir!',
    })
    if (!confirm) return
    try {
        await ProdutoRepository.remove(id)
        store.updateTable()
        toast.success('Produto deletado com sucesso')
    } catch (error) {
        console.log(error)
        toast.error('Erro ao deletar o produto')
    }
}
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="default" class="w-8 h-8 p-0 text-white">
                <span class="sr-only">Abrir opções</span>
                <Menu class="w-4 h-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem @click="store.openUpdate(data.id!)">
                <i class="fa-regular fa-pen-to-square mr-1"></i>
                Editar
            </DropdownMenuItem>
            <DropdownMenuItem @click="openModalReposicao(data.id!)">
                <i class="fa-solid fa-dolly"></i>
                Reposição
            </DropdownMenuItem>
            <DropdownMenuItem @click="gerarRelatorio(data.id!)">
                <i class="fa-regular fa-file-pdf mr-1"></i>
                Relatório
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-danger" @click="deletar(data.id!)">
                <i class="fa-regular fa-trash-can mr-1"></i>
                Excluir
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>