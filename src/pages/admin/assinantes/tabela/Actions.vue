<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useConfirm } from '@/composables/useConfirm'
import { ContaRepository, type ContaAssinanteAdmin } from '@/repositories/conta-repository'
import { useAssinantesAdmin } from '../useAssinantesAdmin'
import { Loader, LogIn, Menu, Trash2 } from 'lucide-vue-next'

const { openManage, openAcessar, triggerRefresh } = useAssinantesAdmin()
const confirm = useConfirm()
const toast = useToast()
const deleting = ref(false)

const props = defineProps<{
  data: ContaAssinanteAdmin
}>()

async function apagarAssinante() {
  const first = await confirm.confirm({
    title: 'Apagar assinante',
    message: `Deseja apagar a conta "${props.data.nome}"? TODOS os dados dela (usuários, vendas, financeiro, produtos, etc.) serão removidos.`,
    confirmText: 'Continuar',
    colorButton: 'danger',
  })
  if (!first) return

  const second = await confirm.confirm({
    title: 'Confirmação final',
    message: `Essa ação é IRREVERSÍVEL. Confirma a exclusão definitiva da conta "${props.data.nome}" (#${props.data.id})?`,
    confirmText: 'Sim, apagar definitivamente',
    colorButton: 'danger',
  })
  if (!second) return

  try {
    deleting.value = true
    const res = await ContaRepository.deletarAssinanteAdmin(props.data.id)
    toast.success(res?.message || 'Assinante apagado com sucesso')
    triggerRefresh()
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao apagar o assinante')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="default" class="h-8 w-8 p-0 text-white" :disabled="deleting">
        <span class="sr-only">Abrir ações</span>
        <Loader v-if="deleting" class="h-4 w-4 animate-spin" />
        <Menu v-else class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="openManage(data)">Gerenciar conta</DropdownMenuItem>
      <DropdownMenuItem @click="openAcessar(data)">
        <LogIn class="h-4 w-4" />
        Acessar conta (suporte)
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="text-red-600 focus:text-red-600" @click="apagarAssinante">
        <Trash2 class="h-4 w-4" />
        Apagar assinante
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
