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
import { Ban, CalendarClock, Loader, LogIn, Menu, MenuSquare, ShieldCheck, Trash2 } from 'lucide-vue-next'

const { openManage, openAcessar, triggerRefresh } = useAssinantesAdmin()
const confirm = useConfirm()
const toast = useToast()
const busy = ref(false)

const props = defineProps<{
  data: ContaAssinanteAdmin
}>()

type StatusAssinante = 'ATIVO' | 'INATIVO' | 'BLOQUEADO'

async function alterarStatus(status: StatusAssinante, titulo: string, mensagem: string, confirmText: string) {
  const ok = await confirm.confirm({
    title: titulo,
    message: mensagem,
    confirmText,
  })
  if (!ok) return

  try {
    busy.value = true
    const res = await ContaRepository.gerenciarAssinante(props.data.id, { status })
    toast.success(res?.message || 'Status atualizado com sucesso')
    triggerRefresh()
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao atualizar o status do assinante')
  } finally {
    busy.value = false
  }
}

function bloquear() {
  return alterarStatus(
    'BLOQUEADO',
    'Bloquear assinante',
    `Deseja bloquear a conta "${props.data.nome}"? O acesso ficará suspenso até ser liberado.`,
    'Bloquear',
  )
}

function liberar() {
  return alterarStatus(
    'ATIVO',
    'Liberar assinante',
    `Deseja liberar a conta "${props.data.nome}" e deixá-la ativa?`,
    'Liberar',
  )
}

function inativar() {
  return alterarStatus(
    'INATIVO',
    'Inativar assinante',
    `Deseja inativar a conta "${props.data.nome}"?`,
    'Inativar',
  )
}

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
    busy.value = true
    const res = await ContaRepository.deletarAssinanteAdmin(props.data.id)
    toast.success(res?.message || 'Assinante apagado com sucesso')
    triggerRefresh()
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao apagar o assinante')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="default" class="h-8 w-8 p-0 text-white" :disabled="busy">
        <span class="sr-only">Abrir ações</span>
        <Loader v-if="busy" class="h-4 w-4 animate-spin" />
        <Menu v-else class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="openManage(data)">
        <MenuSquare class="h-4 w-4" />
        Gerenciar conta
      </DropdownMenuItem>
      <DropdownMenuItem @click="openAcessar(data)">
        <LogIn class="h-4 w-4" />
        Acessar (suporte)
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem v-if="data.status !== 'ATIVO'" @click="liberar">
        <ShieldCheck class="h-4 w-4" />
        Liberar
      </DropdownMenuItem>
      <DropdownMenuItem v-if="data.status !== 'BLOQUEADO'" @click="bloquear">
        <Ban class="h-4 w-4" />
        Bloquear
      </DropdownMenuItem>
      <DropdownMenuItem v-if="data.status !== 'INATIVO'" @click="inativar">
        <CalendarClock class="h-4 w-4" />
        Inativar
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="text-red-600 focus:text-red-600" @click="apagarAssinante">
        <Trash2 class="h-4 w-4" />
        Apagar assinante
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
