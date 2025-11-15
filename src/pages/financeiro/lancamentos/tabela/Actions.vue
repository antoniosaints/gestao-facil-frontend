<script setup lang="ts">
import { ChevronsLeftRightEllipsis, CircleDollarSign, FileText, Menu, Nfc, Settings2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { LancamentoFinanceiro } from '@/types/schemas';
import { useToast } from 'vue-toastification';
import { ref } from 'vue';
import { LancamentosRepository } from '@/repositories/lancamento-repository';
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos';
import { useConfirm } from '@/composables/useConfirm';

const store = useLancamentosStore()
const toast = useToast()

const { data } = defineProps<{
    data: LancamentoFinanceiro,
}>()


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
                <RouterLink :to="`/financeiro/detalhes?id=${data.id}`">
                    <DropdownMenuItem>
                        <Settings2 class="w-4 h-4 mr-1" />
                        Gerenciar
                    </DropdownMenuItem>
                </RouterLink>
                <!-- <DropdownMenuItem disabled>
                    <ChevronsLeftRightEllipsis class="w-4 h-4 mr-1" />
                    Converter
                </DropdownMenuItem> -->
                <DropdownMenuItem class="text-danger" @click="deletar(data.id!)">
                    <i class="fa-regular fa-trash-can mr-1"></i>
                    Excluir
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</template>