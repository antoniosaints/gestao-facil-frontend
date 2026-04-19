<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import { ref } from 'vue'
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
import { useContasFinanceirasStore } from '@/stores/lancamentos/useContasFinanceiras'
import type { ContasFinanceiro } from '@/types/schemas'
import ModalAjusteSaldoConta from '../ModalAjusteSaldoConta.vue'
import ModalTransferenciaConta from '../ModalTransferenciaConta.vue'

const store = useContasFinanceirasStore()
const toast = useToast()
const openTransferModal = ref(false)
const openAjusteModal = ref(false)

const props = defineProps<{
  data: ContasFinanceiro
}>()

async function deletar(id: number) {
  const confirm = await useConfirm().confirm({
    title: 'Excluir conta',
    message: 'Tem certeza que deseja excluir esta conta?',
    confirmText: 'Sim, excluir!',
  })

  if (!confirm) return

  try {
    await LancamentosRepository.deletarConta(id)
    store.updateTable()
    toast.success('Conta excluída com sucesso')
  } catch (error) {
    console.log(error)
    toast.error('Erro ao excluir a conta')
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
      <DropdownMenuItem @click="store.openDetails(props.data)">
        <i class="fa-regular fa-eye mr-1"></i>
        Detalhes
      </DropdownMenuItem>
      <DropdownMenuItem @click="openTransferModal = true">
        <i class="fa-solid fa-right-left mr-1"></i>
        Transferir
      </DropdownMenuItem>
      <DropdownMenuItem @click="openAjusteModal = true">
        <i class="fa-solid fa-scale-balanced mr-1"></i>
        Ajustar saldo
      </DropdownMenuItem>
      <DropdownMenuItem @click="store.openUpdate(props.data)">
        <i class="fa-regular fa-pen-to-square mr-1"></i>
        Editar
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="text-danger" @click="deletar(props.data.id!)">
        <i class="fa-regular fa-trash-can mr-1"></i>
        Excluir
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <ModalTransferenciaConta v-model:open="openTransferModal" :conta-origem="props.data" />
  <ModalAjusteSaldoConta v-model:open="openAjusteModal" :conta="props.data" />
</template>
