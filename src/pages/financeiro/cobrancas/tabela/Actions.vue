<script setup lang="ts">
import { Ban, Eye, Menu, Undo2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { CobrancaFinanceira } from '@/types/schemas';
import { useToast } from 'vue-toastification';
import { useConfirm } from '@/composables/useConfirm';
import { useServicoStore } from '@/stores/servicos/useServicos';
import { ServicoRepository } from '@/repositories/servico-repository';
import { LancamentosRepository } from '@/repositories/lancamento-repository';

const store = useServicoStore()

const { data } = defineProps<{
    data: CobrancaFinanceira,
}>()

const toast = useToast()

async function deletar(id: number) {
    if (!id) return toast.error('ID não informado!')
    const confirm = await useConfirm().confirm({
        title: 'Excluir cobrança',
        message: 'Tem certeza que deseja excluir esta cobrança?',
        confirmText: 'Sim, excluir!',
    })
    if (!confirm) return
    try {
        store.updateTable()
        toast.success('Cobrança deletada com sucesso')
    } catch (error) {
        console.log(error)
        toast.error('Erro ao deletar a cobrança')
    }
}

function accessLink(link: string) {
    window.open(link, '_blank')
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
            <DropdownMenuItem v-if="data.externalLink" @click="accessLink(data.externalLink!)">
                <Eye />
                Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem v-if="data.status === 'PENDENTE'" @click="store.openUpdate(data.id!)">
                <Ban />
                Cancelar
            </DropdownMenuItem>
            <DropdownMenuItem v-if="data.status === 'EFETIVADO'" @click="store.openUpdate(data.id!)">
                <Undo2 />
                Estornar
            </DropdownMenuItem>
            <DropdownMenuItem :disabled="data.status !== 'CANCELADO'" class="text-danger" @click="deletar(data.id!)">
                <i class="fa-regular fa-trash-can mr-1"></i>
                Excluir
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>