<script setup lang="ts">
import { useUiStore } from '@/stores/ui/uiStore'
import { BadgePlus, CircleChevronDown, FileDigit, RotateCw, Trash } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import Tabela from './tabela/Tabela.vue'
import Mobile from './tabela/Mobile.vue'
import OrdemServicoModal from '../modais/OrdemServicoModal.vue'
import { useOrdemServicoStore } from '@/stores/servicos/useOrdensServicos'
import ModalChecklist from '../modais/ModalChecklist.vue'
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue'
import { OrdensServicoRepository } from '@/repositories/os-repository'
import ModalDetalhesOrdem from './ModalDetalhesOrdem.vue'
import ModalFaturarOs from './ModalFaturarOs.vue'
import GerarCobranca from '@/pages/financeiro/lancamentos/modais/GerarCobranca.vue'

const store = useOrdemServicoStore()
const uiStore = useUiStore()
const toast = useToast()

async function excluirEmLote() {
  try {
    if (!store.selectedIds.length) return toast.error('Nenhuma ordem selecionada')
    const confirm = await useConfirm().confirm({
      title: 'Excluir em lote',
      message: 'Tem certeza que deseja excluir essas ordens?',
    })
    if (!confirm) return
    await Promise.all(store.selectedIds.map((id) => OrdensServicoRepository.remove(id)))
    store.updateTable()
    toast.success('OS excluída(s) com sucesso')
  } catch (error) {
    console.log(error)
    toast.error('Erro ao excluir as OS')
  }
}
</script>

<template>
  <div>
    <div class="mb-4 flex flex-col justify-between gap-2 md:flex-row">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <FileDigit class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Ordens de serviço
        </h2>
        <p class="text-sm text-muted-foreground">Ordens de serviço com faturamento e cobrança reaproveitando o fluxo financeiro.</p>
      </div>
      <div class="hidden items-center justify-between gap-2 md:flex">
        <DropdownMenu v-if="store.selectedIds.length">
          <DropdownMenuTrigger as-child>
            <Button variant="outline">
              <CircleChevronDown />
              Ações
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem class="cursor-pointer" @click="excluirEmLote">
                <Trash />
                <span>Excluir em lote</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          class="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-white"
          @click="store.openSave"
        >
          <BadgePlus class="inline-flex h-5 w-5" /> <span class="hidden md:inline">Nova OS</span>
        </button>
        <button
          class="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          @click="store.updateTable"
        >
          <RotateCw class="h-5 w-5" />
        </button>
      </div>
    </div>

    <div v-if="!uiStore.isMobile" class="overflow-x-auto rounded-lg">
      <Tabela />
    </div>
    <div v-else class="overflow-x-auto rounded-lg">
      <Mobile />
    </div>

    <OrdemServicoModal />
    <ModalChecklist />
    <ClientesModal />
    <ModalDetalhesOrdem />
    <ModalFaturarOs />
    <GerarCobranca />
  </div>
</template>
