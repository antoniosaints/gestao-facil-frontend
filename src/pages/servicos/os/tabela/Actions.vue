<script setup lang="ts">
import { FileArchive, Info, Menu } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { OrdensServico } from '@/types/schemas';
import { useToast } from 'vue-toastification';
import { useConfirm } from '@/composables/useConfirm';
import { OrdensServicoRepository } from '@/repositories/os-repository';
import { useOrdemServicoStore } from '@/stores/servicos/useOrdensServicos';

const store = useOrdemServicoStore()

const { data } = defineProps<{
    data: OrdensServico,
}>()

const toast = useToast()

async function deletar(id: number) {
    if (!id) return toast.error('ID não informado!')
    const confirm = await useConfirm().confirm({
        title: 'Excluir OS',
        message: 'Tem certeza que deseja excluir esta OS?',
        confirmText: 'Sim, excluir!',
    })
    if (!confirm) return
    try {
        await OrdensServicoRepository.remove(id)
        store.updateTable()
        toast.success('OS deletada com sucesso')
    } catch (error) {
        console.log(error)
        toast.error('Erro ao deletar a OS')
    }
}

async function getPDFOs(id: number, Uid: string) {
    try {
        await OrdensServicoRepository.getOsPdf(id, Uid)
        toast.success('PDF gerado com sucesso')
    } catch (error: any) {
        console.log(error)
        toast.error(error?.response?.data?.message || 'Erro ao gerar PDF')
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
            <DropdownMenuItem @click="store.openDetalhes(data.id!)">
                <Info />
                Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem @click="store.openUpdate(data.id!)">
                <i class="fa-regular fa-pen-to-square mr-1"></i>
                Editar
            </DropdownMenuItem>
            <DropdownMenuItem @click="getPDFOs(data.id!, data.Uid!)">
                <FileArchive class="mr-1" />
                PDF A4
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-danger" @click="deletar(data.id!)">
                <i class="fa-regular fa-trash-can mr-1"></i>
                Excluir
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>