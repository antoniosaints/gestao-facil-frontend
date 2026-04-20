<script setup lang="ts">
import { Menu, Pencil } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { PlanoAssinaturaListItem } from '@/repositories/assinatura-repository'
import { useAssinaturasStore } from '@/stores/assinaturas/useAssinaturas'

const store = useAssinaturasStore()

const { data } = defineProps<{
  data: PlanoAssinaturaListItem
}>()
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
      <DropdownMenuItem @click="store.openEditPlano(data)">
        <Pencil class="mr-2 h-4 w-4" />
        Editar plano
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
