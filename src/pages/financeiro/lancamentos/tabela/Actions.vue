<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeftRight, EyeOff, Menu, Pencil, Settings2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { LancamentoFinanceiro } from '@/types/schemas';
import { useToast } from 'vue-toastification';
import { LancamentosRepository } from '@/repositories/lancamento-repository';
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos';
import { useConfirm } from '@/composables/useConfirm';

const store = useLancamentosStore()
const toast = useToast()
const converting = ref(false)
const convertDialogOpen = ref(false)

const { data } = defineProps<{
    data: LancamentoFinanceiro,
}>()

const tipoAtual = computed(() => data.tipo === 'RECEITA' ? 'receita' : 'despesa')
const tipoDestino = computed(() => data.tipo === 'RECEITA' ? 'despesa' : 'receita')

async function deletar(id: number) {
    if (!id) return toast.error('ID não informado!')
    const confirm = await useConfirm().confirm({
        title: 'Excluir lançamento',
        message: 'Tem certeza que deseja excluir este lançamento?',
        confirmText: 'Sim, excluir!',
    })
    if (!confirm) return
    try {
        await LancamentosRepository.remove(id)
        store.updateTable()
        toast.success('Lançamento deletado com sucesso')
    } catch (error) {
        console.log(error)
        toast.error('Erro ao deletar o lançamento')
    }
}

async function converterTipo() {
    if (!data.id) return toast.error('ID não informado!')
    try {
        converting.value = true
        await LancamentosRepository.converterTipo(data.id)
        convertDialogOpen.value = false
        store.updateTable()
        toast.success(`Lançamento convertido para ${tipoDestino.value} com sucesso.`)
    } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Erro ao converter o lançamento.')
    } finally {
        converting.value = false
    }
}

async function alternarIgnorado() {
    if (!data.id) return toast.error('ID não informado!')
    const ignorado = !data.ignorado
    const confirm = await useConfirm().confirm({
        title: ignorado ? 'Ignorar lançamento' : 'Reativar lançamento',
        message: ignorado
            ? 'O lançamento e suas parcelas deixarão de compor saldos, resumos e relatórios. As novas parcelas recorrentes também nascerão ignoradas.'
            : 'O lançamento e todas as suas parcelas voltarão a compor os cálculos.',
        confirmText: ignorado ? 'Sim, ignorar' : 'Sim, reativar',
    })
    if (!confirm) return
    try {
        await LancamentosRepository.atualizarIgnorado(data.id, ignorado)
        store.updateTable()
        toast.success(ignorado ? 'Lançamento ignorado nos cálculos.' : 'Lançamento reativado.')
    } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Não foi possível atualizar o lançamento.')
    }
}
</script>

<template>
    <div>
        <DropdownMenu>
            <DropdownMenuTrigger as-child>
                <Button variant="default" class="w-8 h-8 p-0 text-white">
                    <span class="sr-only">Abrir opções</span>
                    <Menu class="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem @click="store.openUpdate(data.id!)">
                    <Pencil class="w-4 h-4 mr-1" />
                    Editar dados
                </DropdownMenuItem>
                <RouterLink :to="`/financeiro/detalhes?id=${data.id}`">
                    <DropdownMenuItem>
                        <Settings2 class="w-4 h-4 mr-1" />
                        Gerenciar
                    </DropdownMenuItem>
                </RouterLink>
                <DropdownMenuItem @click="convertDialogOpen = true">
                    <ArrowLeftRight class="w-4 h-4 mr-1" />
                    Converter para {{ tipoDestino }}
                </DropdownMenuItem>
                <DropdownMenuItem @click="alternarIgnorado">
                    <EyeOff class="w-4 h-4 mr-1" />
                    {{ data.ignorado ? 'Reativar nos cálculos' : 'Ignorar nos cálculos' }}
                </DropdownMenuItem>
                <DropdownMenuItem class="text-danger" @click="deletar(data.id!)">
                    <i class="fa-regular fa-trash-can mr-1"></i>
                    Excluir
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialog :open="convertDialogOpen" @update:open="convertDialogOpen = $event">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Converter lançamento</AlertDialogTitle>
                    <AlertDialogDescription>
                        Este lançamento é uma {{ tipoAtual }} e será convertido em uma {{ tipoDestino }}. As parcelas existentes também passarão a ter essa nova natureza financeira.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel :disabled="converting">Cancelar</AlertDialogCancel>
                    <AlertDialogAction :disabled="converting" @click="converterTipo">
                        {{ converting ? 'Convertendo...' : `Converter para ${tipoDestino}` }}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
</template>
