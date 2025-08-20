<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Produto } from '@/types/schemas';
import { useToast } from 'vue-toastification';

defineProps<{
    data: Produto
}>()

const toast = useToast()

function copiar(id: string) {
    navigator.clipboard.writeText(id)
    toast.success('Copiado para a área de transferência')
}

function deletar(id: string) {

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
            <DropdownMenuItem @click="copiar(data.Uid)">
                <i class="fa-regular fa-copy mr-2"></i>
                Copiar ID
            </DropdownMenuItem>
            <DropdownMenuItem>
                <i class="fa-regular fa-file-pdf mr-2"></i>
                Cupom PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-red-500">
                <i class="fa-regular fa-trash-can mr-2"></i>
                Excluir
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>