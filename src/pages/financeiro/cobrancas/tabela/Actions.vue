<script setup lang="ts">
import { Ban, Eye, Menu, Undo2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { CobrancaFinanceira } from '@/types/schemas';
import { useToast } from 'vue-toastification';
import { useConfirm } from '@/composables/useConfirm';
import { LancamentosRepository } from '@/repositories/lancamento-repository';
import { useCobrancasFinanceirasStore } from '@/stores/lancamentos/useCobrancas';

const store = useCobrancasFinanceirasStore()

const { data } = defineProps<{
    data: CobrancaFinanceira,
}>()

const toast = useToast()

async function cancelar(id: number) {
    if (!id) return toast.error('ID não informado!')
    const confirm = await useConfirm().confirm({
        title: 'Cancelar cobrança',
        message: 'Tem certeza que deseja cancelar esta cobrança?',
        confirmText: 'Sim, cancelar!',
    })
    if (!confirm) return
    try {
        await LancamentosRepository.cancelarCobranca(id)
        store.updateTable()
        toast.success('Cobrança cancelada com sucesso')
    } catch (error: any) {
        console.log(error)
        toast.error(error.message || 'Erro ao cancelar a cobrança')
    }
}
async function estornar(id: number) {
    if (!id) return toast.error('ID não informado!')
    const confirm = await useConfirm().confirm({
        title: 'Estornar cobrança',
        message: 'Tem certeza que deseja estornar esta cobrança?',
        confirmText: 'Sim, prosseguir!',
    })
    if (!confirm) return
    try {
        await LancamentosRepository.estornarCobranca(id)
        store.updateTable()
        toast.success('Cobrança estornada com sucesso')
    } catch (error: any) {
        console.log(error)
        toast.error(error.message || 'Erro ao estornar a cobrança')
    }
}
async function deletar(id: number) {
    if (!id) return toast.error('ID não informado!')
    const confirm = await useConfirm().confirm({
        title: 'Excluir cobrança',
        message: 'Tem certeza que deseja excluir esta cobrança?',
        confirmText: 'Sim, excluir!',
    })
    if (!confirm) return
    try {
        await LancamentosRepository.deletarCobranca(id)
        store.updateTable()
        toast.success('Cobrança deletada com sucesso')
    } catch (error: any) {
        console.log(error)
        toast.error(error.message || 'Erro ao deletar a cobrança')
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
            <DropdownMenuItem v-if="data.status === 'PENDENTE'" @click="cancelar(data.id!)">
                <Ban />
                Cancelar
            </DropdownMenuItem>
            <DropdownMenuItem v-if="data.status === 'EFETIVADO'" @click="estornar(data.id!)">
                <Undo2 />
                Estornar
            </DropdownMenuItem>
            <DropdownMenuItem :disabled="!['ESTORNADO', 'CANCELADO'].includes(data.status)" class="text-danger"
                @click="deletar(data.id!)">
                <i class="fa-regular fa-trash-can mr-1"></i>
                Excluir
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>