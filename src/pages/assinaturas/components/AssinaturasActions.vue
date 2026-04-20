<script setup lang="ts">
import { ref } from 'vue'
import { Menu, PenLine, ReceiptText, RefreshCcw, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AssinaturaClienteListItem } from '@/repositories/assinatura-repository'
import { AssinaturaRepository } from '@/repositories/assinatura-repository'
import { useAssinaturasStore } from '@/stores/assinaturas/useAssinaturas'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'

const store = useAssinaturasStore()
const toast = useToast()
const processing = ref<'ciclo' | 'excluir' | null>(null)

const { data } = defineProps<{
  data: AssinaturaClienteListItem
}>()

async function gerarCiclo() {
  const ok = await useConfirm().confirm({
    title: 'Gerar ciclo manual',
    message: 'Tem certeza que deseja gerar um novo ciclo para esta assinatura agora?',
    confirmText: 'Sim, gerar ciclo',
    cancelText: 'Cancelar',
    colorButton: 'primary',
  })
  if (!ok) return

  try {
    processing.value = 'ciclo'
    await AssinaturaRepository.gerarCiclo(data.id)
    toast.success('Ciclo gerado com sucesso.')
    store.refreshAssinaturas()
    store.refreshCobrancas()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao gerar o ciclo da assinatura.')
  } finally {
    processing.value = null
  }
}

async function excluir() {
  const ok = await useConfirm().confirm({
    title: 'Excluir assinatura',
    message: 'Tem certeza que deseja excluir esta assinatura? Essa ação remove o contrato e seus vínculos permitidos.',
    confirmText: 'Sim, excluir',
  })
  if (!ok) return

  try {
    processing.value = 'excluir'
    await AssinaturaRepository.deletarAssinatura(data.id)
    toast.success('Assinatura excluída com sucesso.')
    store.refreshAssinaturas()
    store.refreshCobrancas()
    store.refreshComodatos()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao excluir a assinatura.')
  } finally {
    processing.value = null
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="default" class="h-8 w-8 p-0 text-white" :disabled="processing !== null">
        <span class="sr-only">Abrir opções</span>
        <Menu class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <RouterLink :to="`/assinaturas/assinaturas/${data.id}`">
        <DropdownMenuItem>
          <ReceiptText class="mr-2 h-4 w-4" />
          Detalhes
        </DropdownMenuItem>
      </RouterLink>
      <DropdownMenuItem @click="store.openEditAssinatura(data.id)">
        <PenLine class="mr-2 h-4 w-4" />
        Editar
      </DropdownMenuItem>
      <DropdownMenuItem :disabled="processing !== null" @click="gerarCiclo">
        <RefreshCcw class="mr-2 h-4 w-4" :class="processing === 'ciclo' ? 'animate-spin' : ''" />
        Gerar ciclo
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="text-danger" :disabled="processing !== null" @click="excluir">
        <Trash2 class="mr-2 h-4 w-4" />
        Excluir assinatura
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
