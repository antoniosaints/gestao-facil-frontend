<script setup lang="ts">
import { Menu, PenLine, ReceiptText } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AssinaturaClienteListItem } from '@/repositories/assinatura-repository'
import { AssinaturaRepository } from '@/repositories/assinatura-repository'
import { useAssinaturasStore } from '@/stores/assinaturas/useAssinaturas'
import { useToast } from 'vue-toastification'

const store = useAssinaturasStore()
const toast = useToast()

const { data } = defineProps<{
  data: AssinaturaClienteListItem
}>()

async function gerarCiclo() {
  try {
    await AssinaturaRepository.gerarCiclo(data.id)
    toast.success('Ciclo gerado com sucesso.')
    store.refreshAssinaturas()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao gerar o ciclo da assinatura.')
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="default" class="h-8 w-8 p-0 text-white">
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
      <DropdownMenuItem @click="gerarCiclo">
        <ReceiptText class="mr-2 h-4 w-4" />
        Gerar ciclo
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
