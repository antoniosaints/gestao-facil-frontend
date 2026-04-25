<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AssinaturaPagarListItem } from '@/repositories/assinatura-pagar-repository'
import { AssinaturaPagarRepository } from '@/repositories/assinatura-pagar-repository'
import { useAssinaturasPagarStore } from '@/stores/lancamentos/useAssinaturasPagar'
import { useUiStore } from '@/stores/ui/uiStore'
import { Menu, Pencil, ReceiptText, Trash2 } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'

const props = defineProps<{
  data: AssinaturaPagarListItem
}>()

const store = useAssinaturasPagarStore()
const toast = useToast()
const uiStore = useUiStore()

async function excluir() {
  const confirmed = await useConfirm().confirm({
    title: 'Excluir assinatura a pagar',
    message: `Tem certeza que deseja excluir "${props.data.nomeServico}"?`,
  })

  if (!confirmed) return

  try {
    await AssinaturaPagarRepository.excluir(props.data.id)
    toast.success('Assinatura excluída com sucesso.')
    store.updateTable()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao excluir a assinatura.')
  }
}

async function gerarFinanceiro() {
  try {
    const response = await AssinaturaPagarRepository.gerarFinanceiro(props.data.id)
    toast.success(response?.message || 'Lançamento financeiro gerado.')
    store.updateTable()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao gerar o financeiro.')
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
      <DropdownMenuItem v-if="uiStore.permissoes.financeiro.editar" @click="store.openEdit(props.data)">
        <Pencil class="mr-2 h-4 w-4" />
        Editar
      </DropdownMenuItem>
      <DropdownMenuItem v-if="uiStore.permissoes.financeiro.editar" @click="gerarFinanceiro">
        <ReceiptText class="mr-2 h-4 w-4" />
        Gerar financeiro
      </DropdownMenuItem>
      <DropdownMenuSeparator v-if="uiStore.permissoes.financeiro.excluir" />
      <DropdownMenuItem v-if="uiStore.permissoes.financeiro.excluir" class="text-danger" @click="excluir">
        <Trash2 class="mr-2 h-4 w-4" />
        Excluir
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>