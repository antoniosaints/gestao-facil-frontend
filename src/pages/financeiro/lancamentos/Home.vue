<script setup lang="ts">
import Tabela from './tabela/Tabela.vue'
import Mobile from './tabela/Mobile.vue'
import { useUiStore } from '@/stores/ui/uiStore'
import LancamentoModal from './formulario/LancamentoModal.vue'
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos'
import {
  BadgePlus,
  BookOpenText,
  CircleChevronDown,
  FileText,
  RotateCw,
  Tags,
  Trash,
  Wallet,
} from 'lucide-vue-next'
import GerarDRE from './modais/GerarDRE.vue'
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/composables/useConfirm'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useToast } from 'vue-toastification'
import router from '@/router'

const store = useLancamentosStore()
const uiStore = useUiStore()
const toast = useToast()

const openByTipo = (tipo: 'RECEITA' | 'DESPESA') => {
  store.form.tipo = tipo
  store.openSave()
}

async function excluirEmLote() {
  try {
    if (!store.selectedIds.length) return toast.error('Nenhum lançamento selecionado')
    const confirm = await useConfirm().confirm({
      title: 'Excluir em lote',
      message: 'Tem certeza que deseja excluir esses lançamentos?',
    })
    if (!confirm) return
    await Promise.all(store.selectedIds.map((id) => LancamentosRepository.remove(id)))
    store.updateTable()
    toast.success('Lançamentos excluídos com sucesso')
  } catch (error) {
    toast.error('Erro ao excluir os lançamentos')
    console.log(error)
  }
}

function goToCategorias() {
  router.push('/financeiro/categorias')
}

function goToContas() {
  router.push('/financeiro/contas')
}
</script>

<template>
  <div>
    <div class="mb-4 flex flex-col justify-between gap-2 md:flex-row">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-gray-700 dark:text-gray-300">
          <Wallet class="h-6 w-6" :stroke-width="2.5" />
          Lançamentos
        </h2>
        <p class="text-sm text-muted-foreground">Lançamentos financeiros do sistema</p>
      </div>
      <div class="hidden items-center justify-between gap-2 md:flex">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline">
              <CircleChevronDown />
              Ações
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem @click="goToCategorias" class="cursor-pointer">
                <Tags />
                <span>Categorias</span>
              </DropdownMenuItem>
              <DropdownMenuItem @click="goToContas" class="cursor-pointer">
                <BookOpenText />
                <span>Contas financeiras</span>
              </DropdownMenuItem>
              <DropdownMenuItem v-if="store.selectedIds.length" @click="excluirEmLote" class="cursor-pointer">
                <Trash />
                <span>Excluir em lote</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          @click="store.openModalDre = true"
          class="flex items-center gap-2 rounded-md bg-warning px-3 py-1.5 text-sm text-white"
        >
          <FileText class="h-5 w-5" /> <span class="hidden md:inline">DRE</span>
        </button>
        <button
          @click="openByTipo('RECEITA')"
          class="flex items-center gap-2 rounded-md bg-success px-3 py-1.5 text-sm text-white"
        >
          <BadgePlus class="inline-flex h-5 w-5" /> <span class="hidden md:inline">Receita</span>
        </button>
        <button
          @click="openByTipo('DESPESA')"
          class="flex items-center gap-2 rounded-md bg-danger px-3 py-1.5 text-sm text-white"
        >
          <BadgePlus class="inline-flex h-5 w-5" /> <span class="hidden md:inline">Despesa</span>
        </button>
        <button @click="store.updateTable" class="rounded-md border border-border bg-background px-2 py-1.5 text-sm">
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
    <LancamentoModal />
    <ClientesModal />
    <GerarDRE />
  </div>
</template>
