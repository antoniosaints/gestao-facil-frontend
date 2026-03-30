<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { FaturaContaAdmin } from '@/repositories/conta-repository'
import { Menu } from 'lucide-vue-next'
import { useFaturasAdmin } from '../useFaturasAdmin'

const { openManage } = useFaturasAdmin()

defineProps<{
  data: FaturaContaAdmin
}>()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="default" class="h-8 w-8 p-0 text-white">
        <span class="sr-only">Abrir ações</span>
        <Menu class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="openManage(data)">Gerenciar fatura</DropdownMenuItem>
      <DropdownMenuItem v-if="data.urlPagamento" as-child>
        <a :href="data.urlPagamento" target="_blank" rel="noreferrer">Abrir cobrança</a>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
