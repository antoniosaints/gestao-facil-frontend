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
import { useComandaStore } from '@/stores/arena/comandaStore'
import type { ComandaVenda } from '@/types/schemas'
import { deletarComanda } from '../ActionsComandas'

defineProps<{
  data: ComandaVenda
}>()

const store = useComandaStore()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="default" class="h-8 w-8 p-0 text-white">
        <span class="sr-only">Abrir opcoes</span>
        <Menu class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="store.openDetalhes(data.id as number)">Detalhes</DropdownMenuItem>
      <DropdownMenuItem @click="store.openUpdate(data.id as number)">Editar</DropdownMenuItem>
      <DropdownMenuItem v-if="data.status === 'ABERTA'" @click="store.openAddItem(data.id as number)">
        Adicionar item
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="text-red-500" @click="deletarComanda(data.id as number)">Excluir</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
