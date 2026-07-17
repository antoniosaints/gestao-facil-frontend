<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useConfirm } from '@/composables/useConfirm'
import { type AcessoSuporteLog, ContaRepository } from '@/repositories/conta-repository'
import { useAcessosSuporte } from '../useAcessosSuporte'
import { Ban, Loader, Menu } from 'lucide-vue-next'

const { triggerRefresh } = useAcessosSuporte()
const confirm = useConfirm()
const toast = useToast()
const revogando = ref(false)

const props = defineProps<{
  data: AcessoSuporteLog
}>()

async function revogar() {
  const ok = await confirm.confirm({
    title: 'Revogar acesso',
    message: `Encerrar agora a sessão de ${props.data.superAdminNome} na conta "${props.data.contaNome}"? A sessão cai na próxima requisição.`,
    confirmText: 'Revogar',
    colorButton: 'danger',
  })
  if (!ok) return

  try {
    revogando.value = true
    const res = await ContaRepository.revogarAcessoSuporte(props.data.id)
    toast.success(res?.message || 'Sessão revogada')
    triggerRefresh()
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao revogar a sessão')
  } finally {
    revogando.value = false
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="default" class="h-8 w-8 p-0 text-white" :disabled="revogando">
        <span class="sr-only">Abrir ações</span>
        <Loader v-if="revogando" class="h-4 w-4 animate-spin" />
        <Menu v-else class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem v-if="data.ativa" class="text-red-600 focus:text-red-600" @click="revogar">
        <Ban class="h-4 w-4" />
        Revogar acesso
      </DropdownMenuItem>
      <DropdownMenuItem v-else disabled>Sessão já encerrada</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
