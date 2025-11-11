<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { ClientesFornecedores } from '@/@types/schemas';
import { useToast } from 'vue-toastification';
import { useClientesStore } from '@/stores/clientes/useClientes';
import { ClienteRepository } from '@/repositories/cliente-repository';
import { useConfirm } from '@/composables/useConfirm';

const store = useClientesStore()
const { data } = defineProps<{
    data: ClientesFornecedores,
}>()

const toast = useToast()

async function deletar(id: number) {
    if (!id) return toast.error('ID não informado!')
    const confirm = await useConfirm().confirm({
        title: 'Excluir cliente',
        message: 'Tem certeza que deseja excluir este cliente?',
        confirmText: 'Sim, excluir!',
    })
    if (!confirm) return
    try {
        await ClienteRepository.remove(id)
        store.updateTable()
        toast.success('Cliente deletado com sucesso')
    } catch (error) {
        console.log(error)
        toast.error('Erro ao deletar o cliente')
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
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-danger" @click="deletar(data.id!)">
                <i class="fa-regular fa-trash-can mr-1"></i>
                Excluir
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>