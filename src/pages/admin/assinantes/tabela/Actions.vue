<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ContaAssinanteAdmin } from '@/repositories/conta-repository'
import { useAssinantesAdmin } from '../useAssinantesAdmin'
import { Menu } from 'lucide-vue-next'

const { openManage } = useAssinantesAdmin()

defineProps<{
  data: ContaAssinanteAdmin
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
      <DropdownMenuItem @click="openManage(data)">Gerenciar conta</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
