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
import { BugRepository, type RelatoBug, type RelatoBugStatus } from '@/repositories/bug-repository'
import { useBugsAdmin } from '../useBugsAdmin'
import { CircleCheck, Eye, Loader, Menu, Search, Trash2 } from 'lucide-vue-next'

const { triggerRefresh, openDetalhe } = useBugsAdmin()
const confirm = useConfirm()
const toast = useToast()
const loading = ref(false)

const props = defineProps<{
  data: RelatoBug
}>()

async function mudarStatus(status: RelatoBugStatus) {
  loading.value = true
  try {
    await BugRepository.atualizarAdmin(props.data.id, {
      status,
      respostaAdmin: props.data.respostaAdmin ?? null,
    })
    toast.success('Relato atualizado.')
    triggerRefresh()
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao atualizar o relato.')
  } finally {
    loading.value = false
  }
}

async function remover() {
  const ok = await confirm.confirm({
    title: 'Remover relato',
    message: 'Remover este relato de bug permanentemente?',
    confirmText: 'Remover',
    colorButton: 'danger',
  })
  if (!ok) return

  loading.value = true
  try {
    await BugRepository.removerAdmin(props.data.id)
    toast.success('Relato removido.')
    triggerRefresh()
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao remover o relato.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="default" class="h-8 w-8 p-0 text-white" :disabled="loading">
        <span class="sr-only">Abrir ações</span>
        <Loader v-if="loading" class="h-4 w-4 animate-spin" />
        <Menu v-else class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="openDetalhe(data)">
        <Eye class="mr-2 h-4 w-4" /> Ver / responder
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem v-if="data.status !== 'EM_ANALISE'" @click="mudarStatus('EM_ANALISE')">
        <Search class="mr-2 h-4 w-4 text-blue-500" /> Marcar em análise
      </DropdownMenuItem>
      <DropdownMenuItem v-if="data.status !== 'RESOLVIDO'" @click="mudarStatus('RESOLVIDO')">
        <CircleCheck class="mr-2 h-4 w-4 text-emerald-500" /> Marcar resolvido
      </DropdownMenuItem>
      <DropdownMenuItem v-if="data.status !== 'DESCARTADO'" @click="mudarStatus('DESCARTADO')">
        <Trash2 class="mr-2 h-4 w-4 text-zinc-500" /> Descartar
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="text-red-600 focus:text-red-600" @click="remover">
        <Trash2 class="mr-2 h-4 w-4" /> Remover
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
