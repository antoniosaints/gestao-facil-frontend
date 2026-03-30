<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useCategoriasFinanceirasStore } from '@/stores/lancamentos/useCategoriasFinanceiras'
import type { CategoriaFinanceiro } from '@/types/schemas'

const store = useCategoriasFinanceirasStore()
const toast = useToast()

defineProps<{
  data: CategoriaFinanceiro
}>()

async function deletar(id: number) {
  const confirm = await useConfirm().confirm({
    title: 'Excluir categoria',
    message: 'Tem certeza que deseja excluir esta categoria?',
    confirmText: 'Sim, excluir!',
  })

  if (!confirm) return

  try {
    await LancamentosRepository.deletarCategoria(id)
    store.updateTable()
    toast.success('Categoria excluída com sucesso')
  } catch (error) {
    console.log(error)
    toast.error('Erro ao excluir a categoria')
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
      <DropdownMenuItem @click="store.openUpdate(data)">
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
