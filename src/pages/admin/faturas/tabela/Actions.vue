<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ContaRepository, type FaturaContaAdmin } from '@/repositories/conta-repository'
import { useConfirm } from '@/composables/useConfirm'
import { Menu } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useFaturasAdmin } from '../useFaturasAdmin'

const { openManage, triggerRefresh } = useFaturasAdmin()
const toast = useToast()

const props = defineProps<{
  data: FaturaContaAdmin
}>()

async function excluirFatura() {
  const confirm = await useConfirm().confirm({
    title: 'Excluir fatura',
    message: `Excluir a fatura de ${props.data.conta?.nome || 'conta'} (${props.data.Uid})? Ela é removida do banco e do cache da assinatura.`,
    confirmText: 'Sim, excluir!',
  })
  if (!confirm) return
  try {
    const res = await ContaRepository.excluirFaturaAdmin(props.data.id)
    toast.success(res.message || 'Fatura excluída com sucesso')
    triggerRefresh()
  } catch (error: any) {
    console.log(error)
    toast.error(error?.response?.data?.message || 'Erro ao excluir a fatura')
  }
}
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
      <DropdownMenuSeparator />
      <DropdownMenuItem class="text-red-500" @click="excluirFatura">Excluir fatura</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
