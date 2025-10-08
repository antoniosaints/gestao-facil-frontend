<script setup lang="ts">
import { BadgeCheck, FileText, Menu, Nfc } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { LancamentoFinanceiro } from '@/types/schemas';
import { useToast } from 'vue-toastification';
import { ref } from 'vue';
import { LancamentosRepository } from '@/repositories/lancamento-repository';
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos';
import ConfirmModal from '@/components/formulario/ConfirmModal.vue';

const store = useLancamentosStore()
const openDelete = ref(false)
const id = ref<number | null>(null)

const { data } = defineProps<{
    data: LancamentoFinanceiro,
}>()

const toast = useToast()

function openDeleteModal(number: number) {
    id.value = number
    openDelete.value = true
}

async function deletar(id: number) {
    if (!id) return toast.error('ID não informado!')
    try {
        await LancamentosRepository.remove(id)
        store.updateTable()
        toast.success('Lançamento deletado com sucesso')
        openDelete.value = false
    } catch (error) {
        console.log(error)
        toast.error('Erro ao deletar o lançamento')
        openDelete.value = false
    }
}
</script>

<template>
    <div>
        <ConfirmModal title="Excluir lançamento" description="Tem certeza que deseja excluir esse lançamento?"
            :open="openDelete" @confirm="deletar(id!)" @cancel="openDelete = false" />
        <DropdownMenu>
            <DropdownMenuTrigger as-child>
                <Button variant="default" class="w-8 h-8 p-0 text-white">
                    <span class="sr-only">Abrir opções</span>
                    <Menu class="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>
                    <Nfc />
                    Gerar PIX
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <FileText />
                    Gerar Boleto
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem class="text-danger" @click="openDeleteModal(data.id!)">
                    <i class="fa-regular fa-trash-can mr-1"></i>
                    Excluir
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</template>