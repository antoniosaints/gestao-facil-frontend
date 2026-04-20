<script setup lang="ts">
import { ref } from 'vue'
import { Menu, Pencil, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { PlanoAssinaturaListItem } from '@/repositories/assinatura-repository'
import { AssinaturaRepository } from '@/repositories/assinatura-repository'
import { useAssinaturasStore } from '@/stores/assinaturas/useAssinaturas'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'

const store = useAssinaturasStore()
const toast = useToast()
const processing = ref(false)

const { data } = defineProps<{
  data: PlanoAssinaturaListItem
}>()

async function excluir() {
  const ok = await useConfirm().confirm({
    title: 'Excluir plano',
    message: 'Tem certeza que deseja excluir este plano de assinatura?',
    confirmText: 'Sim, excluir',
  })
  if (!ok) return

  try {
    processing.value = true
    await AssinaturaRepository.deletarPlano(data.id)
    toast.success('Plano excluído com sucesso.')
    store.refreshPlanos()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao excluir o plano.')
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="default" class="h-8 w-8 p-0 text-white" :disabled="processing">
        <span class="sr-only">Abrir opções</span>
        <Menu class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="store.openEditPlano(data)">
        <Pencil class="mr-2 h-4 w-4" />
        Editar plano
      </DropdownMenuItem>
      <DropdownMenuItem class="text-danger" :disabled="processing" @click="excluir">
        <Trash2 class="mr-2 h-4 w-4" />
        Excluir plano
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
